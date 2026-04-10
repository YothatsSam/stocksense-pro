const { Router } = require('express')
const pool = require('../config/database')

const router = Router()

// POST /api/onboarding/locations
router.post('/locations', async (req, res, next) => {
  const { name, address, business_type } = req.body
  const orgId = req.user.organisationId

  if (!name) {
    return res.status(400).json({ error: 'name is required.' })
  }

  // Default to the org's business_type if not specified
  const locType = business_type || req.user.businessType

  try {
    const { rows } = await pool.query(
      `INSERT INTO locations (organisation_id, name, business_type, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [orgId, name.trim(), locType, (address || '').trim() || null]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
})

// POST /api/onboarding/products
router.post('/products', async (req, res, next) => {
  const { name, sku, unit, reorder_point, location_id } = req.body
  const orgId = req.user.organisationId

  if (!name || !sku) {
    return res.status(400).json({ error: 'name and sku are required.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [product] } = await client.query(
      `INSERT INTO products (organisation_id, sku, name, unit, unit_cost)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING *`,
      [orgId, sku.trim().toUpperCase(), name.trim(), unit || 'unit']
    )

    // If a location was provided, create a stock_levels row too
    if (location_id) {
      const { rows: locCheck } = await client.query(
        'SELECT id FROM locations WHERE id = $1 AND organisation_id = $2',
        [location_id, orgId]
      )
      if (locCheck.length > 0) {
        await client.query(
          `INSERT INTO stock_levels (organisation_id, product_id, location_id, quantity, reorder_point)
           VALUES ($1, $2, $3, 0, $4)
           ON CONFLICT (product_id, location_id) DO NOTHING`,
          [orgId, product.id, location_id, Number(reorder_point) || 0]
        )
      }
    }

    await client.query('COMMIT')
    res.status(201).json(product)
  } catch (err) {
    await client.query('ROLLBACK')
    // Unique constraint violation on SKU
    if (err.code === '23505') {
      return res.status(409).json({ error: `SKU "${sku}" already exists in your account.` })
    }
    next(err)
  } finally {
    client.release()
  }
})

// GET /api/onboarding/locations  (for onboarding step 2 location picker)
router.get('/locations', async (req, res, next) => {
  const orgId = req.user.organisationId
  try {
    const { rows } = await pool.query(
      'SELECT id, name, business_type, address FROM locations WHERE organisation_id = $1 ORDER BY created_at',
      [orgId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

module.exports = router
