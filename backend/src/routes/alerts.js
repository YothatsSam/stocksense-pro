const { Router } = require('express')
const { getAlerts } = require('../controllers/alertsController')

const router = Router()

router.get('/', getAlerts)

module.exports = router
