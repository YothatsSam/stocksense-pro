const pool = require('../config/database')

// GET /api/restaurant/recipes
async function getRecipes(req, res, next) {
  try {
    const { rows: recipes } = await pool.query(`
      SELECT r.id, r.name, r.location_id, l.name AS location_name
      FROM recipes r
      JOIN locations l ON l.id = r.location_id
      ORDER BY r.created_at DESC
    `)

    // Attach ingredients + low-stock flag + food cost to each recipe
    const result = await Promise.all(recipes.map(async (recipe) => {
      const { rows: ingredients } = await pool.query(`
        SELECT
          ri.id,
          ri.product_id,
          p.name        AS product_name,
          p.sku,
          p.unit,
          p.unit_cost,
          ri.quantity_required,
          sl.quantity    AS stock_quantity,
          sl.reorder_point,
          (sl.quantity < sl.reorder_point) AS is_low
        FROM recipe_ingredients ri
        JOIN products    p  ON p.id  = ri.product_id
        LEFT JOIN stock_levels sl ON sl.product_id = ri.product_id
                                 AND sl.location_id = $2
        WHERE ri.recipe_id = $1
      `, [recipe.id, recipe.location_id])

      const foodCost = ingredients.reduce(
        (sum, i) => sum + Number(i.quantity_required) * Number(i.unit_cost),
        0
      )

      return { ...recipe, ingredients, food_cost: foodCost }
    }))

    res.json(result)
  } catch (err) {
    next(err)
  }
}

// POST /api/restaurant/recipes
async function createRecipe(req, res, next) {
  const { name, location_id, ingredients } = req.body

  if (!name || !location_id || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({
      error: 'name, location_id, and at least one ingredient are required.',
    })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      'INSERT INTO recipes (name, location_id) VALUES ($1, $2) RETURNING *',
      [name, location_id]
    )
    const recipe = rows[0]

    for (const ing of ingredients) {
      await client.query(
        `INSERT INTO recipe_ingredients (recipe_id, product_id, quantity_required)
         VALUES ($1, $2, $3)`,
        [recipe.id, ing.product_id, ing.quantity_required]
      )
    }

    await client.query('COMMIT')
    res.status(201).json(recipe)
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

// POST /api/restaurant/recipes/:id/serve
async function serveRecipe(req, res, next) {
  const recipeId = Number(req.params.id)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Get recipe + ingredients with current stock at the recipe's location
    const { rows: recipe } = await client.query(
      'SELECT * FROM recipes WHERE id = $1',
      [recipeId]
    )
    if (recipe.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Recipe not found.' })
    }
    const locationId = recipe[0].location_id

    const { rows: ingredients } = await client.query(`
      SELECT ri.product_id, ri.quantity_required, sl.quantity, p.name AS product_name
      FROM recipe_ingredients ri
      JOIN stock_levels sl ON sl.product_id = ri.product_id AND sl.location_id = $2
      JOIN products p ON p.id = ri.product_id
      WHERE ri.recipe_id = $1
    `, [recipeId, locationId])

    // Check all ingredients have sufficient stock
    const insufficient = ingredients.filter(
      (i) => Number(i.quantity) < Number(i.quantity_required)
    )
    if (insufficient.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({
        error: 'Insufficient stock for one or more ingredients.',
        items: insufficient.map((i) => ({
          product_name: i.product_name,
          required: i.quantity_required,
          available: i.quantity,
        })),
      })
    }

    // Deduct each ingredient
    for (const ing of ingredients) {
      await client.query(
        `UPDATE stock_levels
            SET quantity   = quantity - $1,
                updated_at = NOW()
          WHERE product_id = $2 AND location_id = $3`,
        [ing.quantity_required, ing.product_id, locationId]
      )
      await client.query(
        `INSERT INTO stock_movements (product_id, location_id, quantity_change, reason)
         VALUES ($1, $2, $3, 'served')`,
        [ing.product_id, locationId, -Number(ing.quantity_required)]
      )
    }

    await client.query('COMMIT')
    res.json({ success: true, recipe_id: recipeId, ingredients_deducted: ingredients.length })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

// GET /api/restaurant/products  (products with unit_cost for recipe builder)
async function getProducts(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, sku, name, unit, unit_cost FROM products ORDER BY name'
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

module.exports = { getRecipes, createRecipe, serveRecipe, getProducts }
