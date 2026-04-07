const pool = require('../config/database')

// GET /api/stock
// Returns all stock levels joined with product and location data.
async function getStock(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        sl.id,
        p.id           AS product_id,
        p.sku,
        p.name         AS product_name,
        p.unit,
        l.id           AS location_id,
        l.name         AS location_name,
        l.business_type,
        sl.quantity,
        sl.reorder_point,
        sl.updated_at
      FROM stock_levels sl
      JOIN products  p ON p.id = sl.product_id
      JOIN locations l ON l.id = sl.location_id
      ORDER BY l.name, p.name
    `)
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

// POST /api/stock/adjust
// Body: { product_id, location_id, quantity_change, reason }
// Adjusts quantity and writes a stock_movement record atomically.
async function adjustStock(req, res, next) {
  const { product_id, location_id, quantity_change, reason } = req.body

  if (
    product_id == null ||
    location_id == null ||
    quantity_change == null ||
    isNaN(Number(quantity_change))
  ) {
    return res.status(400).json({
      error: 'product_id, location_id, and quantity_change are required.',
    })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `UPDATE stock_levels
          SET quantity   = quantity + $1,
              updated_at = NOW()
        WHERE product_id = $2 AND location_id = $3
        RETURNING *`,
      [quantity_change, product_id, location_id]
    )

    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({
        error: 'No stock_level record found for that product + location.',
      })
    }

    await client.query(
      `INSERT INTO stock_movements (product_id, location_id, quantity_change, reason)
       VALUES ($1, $2, $3, $4)`,
      [product_id, location_id, quantity_change, reason || 'manual adjustment']
    )

    await client.query('COMMIT')
    res.json(rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

module.exports = { getStock, adjustStock }
