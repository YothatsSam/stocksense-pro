require('dotenv').config()
const express = require('express')
const cors = require('cors')
const stockRoutes = require('./routes/stock')
const alertsRoutes = require('./routes/alerts')
const authRoutes = require('./routes/auth')
const restaurantRoutes = require('./routes/restaurant')
const onboardingRoutes = require('./routes/onboarding')
const distributionRoutes = require('./routes/distribution')
const settingsRoutes = require('./routes/settings')
const requireAuth = require('./middleware/auth')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Public routes
app.use('/api/auth', authRoutes)

// Protected routes
app.use('/api/stock',        requireAuth, stockRoutes)
app.use('/api/alerts',       requireAuth, alertsRoutes)
app.use('/api/restaurant',   requireAuth, restaurantRoutes)
app.use('/api/onboarding',   requireAuth, onboardingRoutes)
app.use('/api/distribution', requireAuth, distributionRoutes)
app.use('/api/settings',     requireAuth, settingsRoutes)

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Central error handler (must be last)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`StockSense Pro API running on http://localhost:${PORT}`)
})
