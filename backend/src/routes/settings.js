const { Router } = require('express')
const bcrypt = require('bcrypt')
const pool = require('../config/database')

const router = Router()

// ── Locations ──────────────────────────────────────────────────────────────────

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
  } catch (err) { next(err) }
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
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [orgId, name.trim(), locType, (address || '').trim() || null]
    )
    res.status(201).json(location)
  } catch (err) { next(err) }
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
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Cannot delete location — it still has stock or orders linked to it.' })
    }
    next(err)
  }
})

// ── Products ───────────────────────────────────────────────────────────────────

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
  } catch (err) { next(err) }
})

// POST /api/settings/products
router.post('/products', async (req, res, next) => {
  const orgId = req.user.organisationId
  const { name, sku, unit, reorder_point, initial_quantity, location_id } = req.body
  if (!name || !sku) return res.status(400).json({ error: 'name and sku are required.' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: [product] } = await client.query(
      `INSERT INTO products (organisation_id, sku, name, unit, unit_cost)
       VALUES ($1, $2, $3, $4, 0) RETURNING *`,
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
          [orgId, product.id, location_id, Number(initial_quantity) || 0, Number(reorder_point) || 0]
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
  } finally { client.release() }
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

// ── Profile ────────────────────────────────────────────────────────────────────

// GET /api/settings/profile
router.get('/profile', async (req, res, next) => {
  const userId = req.user.sub
  const orgId  = req.user.organisationId
  try {
    const { rows: [user] } = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.created_at,
              u.organisation_id,
              o.name AS organisation_name,
              o.business_type,
              o.subscription_plan
       FROM users u
       JOIN organisations o ON o.id = u.organisation_id
       WHERE u.id = $1 AND u.organisation_id = $2`,
      [userId, orgId]
    )
    if (!user) return res.status(404).json({ error: 'User not found.' })
    res.json(user)
  } catch (err) { next(err) }
})

// PUT /api/settings/profile
router.put('/profile', async (req, res, next) => {
  const userId = req.user.sub
  const orgId  = req.user.organisationId
  const { name, email } = req.body
  if (!email) return res.status(400).json({ error: 'email is required.' })

  try {
    // Check email not taken by another user
    const { rows: existing } = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [email.toLowerCase().trim(), userId]
    )
    if (existing.length > 0) {
      return res.status(409).json({ error: 'That email is already in use.' })
    }

    const { rows: [updated] } = await pool.query(
      `UPDATE users
       SET name = $1, email = $2
       WHERE id = $3 AND organisation_id = $4
       RETURNING id, email, name, role`,
      [name?.trim() || null, email.toLowerCase().trim(), userId, orgId]
    )
    if (!updated) return res.status(404).json({ error: 'User not found.' })
    res.json(updated)
  } catch (err) { next(err) }
})

// PUT /api/settings/password
router.put('/password', async (req, res, next) => {
  const userId = req.user.sub
  const orgId  = req.user.organisationId
  const { current_password, new_password } = req.body

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password and new_password are required.' })
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }

  try {
    const { rows: [user] } = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1 AND organisation_id = $2`,
      [userId, orgId]
    )
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const valid = await bcrypt.compare(current_password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' })

    const newHash = await bcrypt.hash(new_password, 10)
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [newHash, userId]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ── Organisation ───────────────────────────────────────────────────────────────

// GET /api/settings/organisation
router.get('/organisation', async (req, res, next) => {
  const orgId = req.user.organisationId
  try {
    const { rows: [org] } = await pool.query(
      `SELECT id, name, business_type, subscription_plan, email, created_at
       FROM organisations WHERE id = $1`,
      [orgId]
    )
    if (!org) return res.status(404).json({ error: 'Organisation not found.' })
    res.json(org)
  } catch (err) { next(err) }
})

// PUT /api/settings/organisation
router.put('/organisation', async (req, res, next) => {
  const orgId = req.user.organisationId
  const { name, business_type } = req.body
  if (!name) return res.status(400).json({ error: 'name is required.' })

  const validTypes = ['retail', 'restaurant', 'distribution']
  if (business_type && !validTypes.includes(business_type)) {
    return res.status(400).json({ error: 'Invalid business_type.' })
  }

  try {
    const { rows: [org] } = await pool.query(
      `UPDATE organisations
       SET name = $1, business_type = COALESCE($2, business_type)
       WHERE id = $3
       RETURNING id, name, business_type, subscription_plan, email, created_at`,
      [name.trim(), business_type || null, orgId]
    )
    if (!org) return res.status(404).json({ error: 'Organisation not found.' })
    res.json(org)
  } catch (err) { next(err) }
})

// ── Team ───────────────────────────────────────────────────────────────────────

// GET /api/settings/team
router.get('/team', async (req, res, next) => {
  const orgId = req.user.organisationId
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE organisation_id = $1
       ORDER BY created_at ASC`,
      [orgId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// ── Notifications ──────────────────────────────────────────────────────────────

// GET /api/settings/notifications
router.get('/notifications', async (req, res, next) => {
  const orgId = req.user.organisationId
  const userId = req.user.sub
  try {
    const { rows: [prefs] } = await pool.query(
      `SELECT low_stock_alerts, weekly_summary, new_user_joined
       FROM notification_preferences
       WHERE user_id = $1 AND organisation_id = $2`,
      [userId, orgId]
    )
    // Return defaults if no row yet — first visit before any save
    res.json(prefs ?? { low_stock_alerts: true, weekly_summary: true, new_user_joined: true })
  } catch (err) { next(err) }
})

// PUT /api/settings/notifications
router.put('/notifications', async (req, res, next) => {
  const orgId = req.user.organisationId
  const userId = req.user.sub
  const { low_stock_alerts, weekly_summary, new_user_joined } = req.body

  try {
    const { rows: [prefs] } = await pool.query(
      `INSERT INTO notification_preferences (user_id, organisation_id, low_stock_alerts, weekly_summary, new_user_joined)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
         SET low_stock_alerts = EXCLUDED.low_stock_alerts,
             weekly_summary   = EXCLUDED.weekly_summary,
             new_user_joined  = EXCLUDED.new_user_joined,
             updated_at       = NOW()
       RETURNING low_stock_alerts, weekly_summary, new_user_joined`,
      [userId, orgId, !!low_stock_alerts, !!weekly_summary, !!new_user_joined]
    )
    res.json(prefs)
  } catch (err) { next(err) }
})

module.exports = router
