const { Router } = require('express')
const { getStock, adjustStock } = require('../controllers/stockController')

const router = Router()

router.get('/',       getStock)
router.post('/adjust', adjustStock)

module.exports = router
