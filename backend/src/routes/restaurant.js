const { Router } = require('express')
const { getRecipes, createRecipe, serveRecipe, getProducts } = require('../controllers/restaurantController')

const router = Router()

router.get('/recipes',          getRecipes)
router.post('/recipes',         createRecipe)
router.post('/recipes/:id/serve', serveRecipe)
router.get('/products',         getProducts)

module.exports = router
