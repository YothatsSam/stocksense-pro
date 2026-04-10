const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // Reject tokens issued before multi-tenancy (no organisationId)
    if (!payload.organisationId) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' })
    }

    // req.user shape: { sub, email, role, organisationId, businessType }
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

module.exports = requireAuth
