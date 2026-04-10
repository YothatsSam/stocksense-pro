const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../config/database')

function makeToken(user, org) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      organisationId: org.id,
      businessType: org.business_type,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
}

async function login(req, res, next) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' })
  }

  try {
    const { rows } = await pool.query(
      `SELECT u.*, o.business_type, o.name AS org_name, o.subscription_plan
       FROM users u
       JOIN organisations o ON o.id = u.organisation_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    )

    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' })

    const org = { id: user.organisation_id, business_type: user.business_type }
    const token = makeToken(user, org)

    res.json({
      token,
      email: user.email,
      name: user.name,
      role: user.role,
      organisationId: user.organisation_id,
      businessType: user.business_type,
      organisationName: user.org_name,
      subscriptionPlan: user.subscription_plan,
    })
  } catch (err) {
    next(err)
  }
}

async function register(req, res, next) {
  const { business_name, business_type, email, password, name } = req.body

  if (!business_name || !business_type || !email || !password) {
    return res.status(400).json({ error: 'business_name, business_type, email and password are required.' })
  }

  const validTypes = ['retail', 'restaurant', 'distribution']
  if (!validTypes.includes(business_type)) {
    return res.status(400).json({ error: 'business_type must be retail, restaurant or distribution.' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Check email not already in use (users table)
    const { rows: existing } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )
    if (existing.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    // Create organisation
    const { rows: [org] } = await client.query(
      `INSERT INTO organisations (name, business_type, email, subscription_plan)
       VALUES ($1, $2, $3, 'starter')
       RETURNING *`,
      [business_name.trim(), business_type, email.toLowerCase().trim()]
    )

    // Create admin user linked to organisation
    const passwordHash = await bcrypt.hash(password, 10)
    const { rows: [user] } = await client.query(
      `INSERT INTO users (organisation_id, email, name, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING *`,
      [org.id, email.toLowerCase().trim(), (name || '').trim() || null, passwordHash]
    )

    await client.query('COMMIT')

    const token = makeToken(user, org)
    res.status(201).json({
      token,
      email: user.email,
      name: user.name,
      role: user.role,
      organisationId: org.id,
      businessType: org.business_type,
      organisationName: org.name,
      subscriptionPlan: org.subscription_plan,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

module.exports = { login, register }
