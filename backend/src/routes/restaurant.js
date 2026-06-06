const { Router } = require('express')
const { getRecipes, createRecipe, updateRecipe, deleteRecipe, serveRecipe, getProducts } = require('../controllers/restaurantController')

const router = Router()

router.get('/recipes',              getRecipes)
router.post('/recipes',             createRecipe)
router.put('/recipes/:id',          updateRecipe)
router.delete('/recipes/:id',       deleteRecipe)
router.post('/recipes/:id/serve',   serveRecipe)
router.get('/products',             getProducts)

module.exports = router
