const pool = require('../config/database')

// GET /api/alerts
// Returns all stock_level rows where quantity is below reorder_point.
async function getAlerts(req, res, next) {
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
        (sl.reorder_point - sl.quantity) AS deficit
      FROM stock_levels sl
      JOIN products  p ON p.id = sl.product_id
      JOIN locations l ON l.id = sl.location_id
      WHERE sl.quantity < sl.reorder_point
      ORDER BY deficit DESC, l.name, p.name
    `)
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

module.exports = { getAlerts }
