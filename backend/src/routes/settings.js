const { Router } = require('express')
const pool = require('../config/database')

const router = Router()

// ── Locations ────────────────────────────────────────────────────────────────

// GET /api/settings/locations
router.get('/locations', async (req, res, next) => {
  const orgId = req.user.organisationId
  try {
    const { rows } = await pool.query(
      `SELECT l.id, l.name, l.business_type, l.address, l.created_at,
              COUNT(DISTINCT sl.product_id) AS product_count
       FROM locations l
       LEFT JOIN stock_levels sl ON sl.location_id = l.id AND sl.organisation_id = l.organisation_id
       WHERE l.organisation_id = $1
       GROUP BY l.id
       ORDER BY l.created_at`,
      [orgId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// POST /api/settings/locations
router.post('/locations', async (req, res, next) => {
  const orgId = req.user.organisationId
  const { name, business_type, address } = req.body

  if (!name) return res.status(400).json({ error: 'name is required.' })

  const locType = business_type || req.user.businessType

  try {
    const { rows: [location] } = await pool.query(
      `INSERT INTO locations (organisation_id, name, business_type, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [orgId, name.trim(), locType, (address || '').trim() || null]
    )
    res.status(201).json(location)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/settings/locations/:id
router.delete('/locations/:id', async (req, res, next) => {
  const orgId = req.user.organisationId
  const locId = parseInt(req.params.id, 10)

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM locations WHERE id = $1 AND organisation_id = $2`,
      [locId, orgId]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Location not found.' })
    res.json({ success: true })
  } catch (err) {
    // FK violation — location has dependent data
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Cannot delete location — it still has stock or orders linked to it.' })
    }
    next(err)
  }
})

// ── Products ─────────────────────────────────────────────────────────────────

// GET /api/settings/products
router.get('/products', async (req, res, next) => {
  const orgId = req.user.organisationId
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.sku, p.name, p.unit, p.unit_cost, p.created_at,
              COALESCE(MIN(sl.reorder_point), 0) AS reorder_point
       FROM products p
       LEFT JOIN stock_levels sl ON sl.product_id = p.id AND sl.organisation_id = p.organisation_id
       WHERE p.organisation_id = $1
       GROUP BY p.id
       ORDER BY p.name`,
      [orgId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// POST /api/settings/products  (mirrors onboarding/products)
router.post('/products', async (req, res, next) => {
  const orgId = req.user.organisationId
  const { name, sku, unit, reorder_point, initial_quantity, location_id } = req.body

  if (!name || !sku) return res.status(400).json({ error: 'name and sku are required.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [product] } = await client.query(
      `INSERT INTO products (organisation_id, sku, name, unit, unit_cost)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING *`,
      [orgId, sku.trim().toUpperCase(), name.trim(), unit || 'unit']
    )

    if (location_id) {
      const { rows: locCheck } = await client.query(
        'SELECT id FROM locations WHERE id = $1 AND organisation_id = $2',
        [location_id, orgId]
      )
      if (locCheck.length > 0) {
        await client.query(
          `INSERT INTO stock_levels (organisation_id, product_id, location_id, quantity, reorder_point)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (product_id, location_id) DO NOTHING`,
          [orgId, product.id, location_id,
           Number(initial_quantity) || 0,
           Number(reorder_point) || 0]
        )

        if (Number(initial_quantity) > 0) {
          await client.query(
            `INSERT INTO stock_movements (organisation_id, product_id, location_id, quantity_change, reason)
             VALUES ($1, $2, $3, $4, 'Initial stock')`,
            [orgId, product.id, location_id, Number(initial_quantity)]
          )
        }
      }
    }

    await client.query('COMMIT')
    res.status(201).json(product)
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      return res.status(409).json({ error: `SKU "${sku}" already exists in your account.` })
    }
    next(err)
  } finally {
    client.release()
  }
})

// DELETE /api/settings/products/:id
router.delete('/products/:id', async (req, res, next) => {
  const orgId = req.user.organisationId
  const productId = parseInt(req.params.id, 10)

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM products WHERE id = $1 AND organisation_id = $2`,
      [productId, orgId]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Product not found.' })
    res.json({ success: true })
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Cannot delete product — it is referenced by stock levels or orders.' })
    }
    next(err)
  }
})

module.exports = router
