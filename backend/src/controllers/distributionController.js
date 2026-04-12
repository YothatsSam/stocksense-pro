const pool = require('../config/database')

// ── Purchase Orders ──────────────────────────────────────────────────────────

async function getOrders(req, res, next) {
  const orgId = req.user.organisationId
  try {
    const { rows } = await pool.query(
      `SELECT
         po.id,
         po.supplier_id,
         s.name            AS supplier_name,
         po.location_id,
         l.name            AS location_name,
         po.status,
         po.total_items,
         po.expected_delivery,
         po.notes,
         po.created_at,
         COALESCE(
           json_agg(
             json_build_object(
               'id',                poi.id,
               'product_id',        poi.product_id,
               'product_name',      p.name,
               'sku',               p.sku,
               'unit',              p.unit,
               'quantity_ordered',  poi.quantity_ordered,
               'quantity_received', poi.quantity_received,
               'unit_price',        poi.unit_price
             ) ORDER BY poi.id
           ) FILTER (WHERE poi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM purchase_orders po
       JOIN suppliers  s ON s.id = po.supplier_id
       LEFT JOIN locations l ON l.id = po.location_id
       LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
       LEFT JOIN products p ON p.id = poi.product_id
       WHERE po.organisation_id = $1
       GROUP BY po.id, s.name, l.name
       ORDER BY po.created_at DESC`,
      [orgId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

async function createOrder(req, res, next) {
  const orgId = req.user.organisationId
  const { supplier_id, location_id, expected_delivery, notes, items } = req.body

  if (!supplier_id) return res.status(400).json({ error: 'supplier_id is required.' })
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'At least one item is required.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [order] } = await client.query(
      `INSERT INTO purchase_orders
         (organisation_id, supplier_id, location_id, status, total_items, expected_delivery, notes)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6)
       RETURNING *`,
      [orgId, supplier_id, location_id || null, items.length,
       expected_delivery || null, (notes || '').trim() || null]
    )

    for (const item of items) {
      await client.query(
        `INSERT INTO purchase_order_items
           (purchase_order_id, product_id, quantity_ordered, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, Number(item.quantity_ordered) || 0,
         Number(item.unit_price) || 0]
      )
    }

    await client.query('COMMIT')

    // Return with items joined
    const { rows: [full] } = await pool.query(
      `SELECT po.*,
              s.name AS supplier_name,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id',               poi.id,
                    'product_id',       poi.product_id,
                    'product_name',     p.name,
                    'sku',              p.sku,
                    'unit',             p.unit,
                    'quantity_ordered', poi.quantity_ordered,
                    'quantity_received',poi.quantity_received,
                    'unit_price',       poi.unit_price
                  ) ORDER BY poi.id
                ) FILTER (WHERE poi.id IS NOT NULL), '[]'
              ) AS items
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
       LEFT JOIN products p ON p.id = poi.product_id
       WHERE po.id = $1
       GROUP BY po.id, s.name`,
      [order.id]
    )
    res.status(201).json(full)
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

async function receiveOrder(req, res, next) {
  const orgId = req.user.organisationId
  const orderId = parseInt(req.params.id, 10)
  const { items } = req.body // [{ purchase_order_item_id, quantity_received }]

  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'items array is required.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Verify order belongs to this org
    const { rows: [order] } = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1 AND organisation_id = $2`,
      [orderId, orgId]
    )
    if (!order) return res.status(404).json({ error: 'Order not found.' })
    if (order.status === 'received')
      return res.status(400).json({ error: 'Order already received.' })

    for (const item of items) {
      const qty = Number(item.quantity_received) || 0
      if (qty <= 0) continue

      // Get the order item to find product + location
      const { rows: [poi] } = await client.query(
        `SELECT poi.*, po.location_id
         FROM purchase_order_items poi
         JOIN purchase_orders po ON po.id = poi.purchase_order_id
         WHERE poi.id = $1 AND po.id = $2`,
        [item.purchase_order_item_id, orderId]
      )
      if (!poi) continue

      // Update quantity_received on the item
      await client.query(
        `UPDATE purchase_order_items SET quantity_received = $1 WHERE id = $2`,
        [qty, poi.id]
      )

      if (poi.location_id) {
        // Upsert stock level
        await client.query(
          `INSERT INTO stock_levels (organisation_id, product_id, location_id, quantity, reorder_point)
           VALUES ($1, $2, $3, $4, 0)
           ON CONFLICT (product_id, location_id)
           DO UPDATE SET quantity = stock_levels.quantity + $4, updated_at = NOW()`,
          [orgId, poi.product_id, poi.location_id, qty]
        )
        // Write movement record
        await client.query(
          `INSERT INTO stock_movements (organisation_id, product_id, location_id, quantity_change, reason)
           VALUES ($1, $2, $3, $4, $5)`,
          [orgId, poi.product_id, poi.location_id, qty, `PO #${orderId} received`]
        )
      }
    }

    // Mark order as received
    await client.query(
      `UPDATE purchase_orders SET status = 'received', updated_at = NOW() WHERE id = $1`,
      [orderId]
    )

    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

// ── Shipments ────────────────────────────────────────────────────────────────

async function getShipments(req, res, next) {
  const orgId = req.user.organisationId
  try {
    const { rows } = await pool.query(
      `SELECT sh.*, l.name AS location_name
       FROM shipments sh
       LEFT JOIN locations l ON l.id = sh.location_id
       WHERE sh.organisation_id = $1
       ORDER BY sh.created_at DESC`,
      [orgId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

async function createShipment(req, res, next) {
  const orgId = req.user.organisationId
  const { reference, type, status, location_id, notes } = req.body

  if (!reference) return res.status(400).json({ error: 'reference is required.' })

  try {
    const { rows: [shipment] } = await pool.query(
      `INSERT INTO shipments (organisation_id, reference, type, status, location_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, reference.trim(), type || 'inbound', status || 'pending',
       location_id || null, (notes || '').trim() || null]
    )
    res.status(201).json(shipment)
  } catch (err) {
    next(err)
  }
}

// ── Suppliers ────────────────────────────────────────────────────────────────

async function getSuppliers(req, res, next) {
  const orgId = req.user.organisationId
  try {
    const { rows } = await pool.query(
      `SELECT s.*,
              COUNT(DISTINCT poi.product_id) AS products_supplied
       FROM suppliers s
       LEFT JOIN purchase_orders po
              ON po.supplier_id = s.id AND po.organisation_id = s.organisation_id
       LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
       WHERE s.organisation_id = $1
       GROUP BY s.id
       ORDER BY s.name`,
      [orgId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

async function createSupplier(req, res, next) {
  const orgId = req.user.organisationId
  const { name, contact_person, contact_email, contact_phone, notes } = req.body

  if (!name) return res.status(400).json({ error: 'name is required.' })

  try {
    const { rows: [supplier] } = await pool.query(
      `INSERT INTO suppliers (organisation_id, name, contact_person, contact_email, contact_phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, name.trim(), (contact_person || '').trim() || null,
       (contact_email || '').trim() || null, (contact_phone || '').trim() || null,
       (notes || '').trim() || null]
    )
    res.status(201).json(supplier)
  } catch (err) {
    next(err)
  }
}

// ── Products list (for order item picker) ────────────────────────────────────

async function getProducts(req, res, next) {
  const orgId = req.user.organisationId
  try {
    const { rows } = await pool.query(
      `SELECT id, sku, name, unit, unit_cost FROM products
       WHERE organisation_id = $1 ORDER BY name`,
      [orgId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getOrders, createOrder, receiveOrder,
  getShipments, createShipment,
  getSuppliers, createSupplier,
  getProducts,
}
