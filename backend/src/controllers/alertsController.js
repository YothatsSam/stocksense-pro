const pool = require('../config/database')

// GET /api/alerts
async function getAlerts(req, res, next) {
  const orgId = req.user.organisationId
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
      WHERE sl.organisation_id = $1
        AND sl.quantity < sl.reorder_point
      ORDER BY deficit DESC, l.name, p.name
    `, [orgId])
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

module.exports = { getAlerts }
