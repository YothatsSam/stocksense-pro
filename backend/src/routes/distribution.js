const { Router } = require('express')
const {
  getOrders, createOrder, receiveOrder,
  getShipments, createShipment,
  getSuppliers, createSupplier,
  getProducts,
} = require('../controllers/distributionController')

const router = Router()

// Purchase orders
router.get('/orders',               getOrders)
router.post('/orders',              createOrder)
router.put('/orders/:id/receive',   receiveOrder)

// Shipments
router.get('/shipments',            getShipments)
router.post('/shipments',           createShipment)

// Suppliers
router.get('/suppliers',            getSuppliers)
router.post('/suppliers',           createSupplier)

// Products (for item picker in new order modal)
router.get('/products',             getProducts)

module.exports = router
