require('dotenv').config()
const express = require('express')
const cors = require('cors')
const stockRoutes = require('./routes/stock')
const alertsRoutes = require('./routes/alerts')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/stock',  stockRoutes)
app.use('/api/alerts', alertsRoutes)

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Central error handler (must be last)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`StockSense Pro API running on http://localhost:${PORT}`)
})
