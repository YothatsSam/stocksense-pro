import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createRecipe,
  getLocations,
  getRecipes,
  getRestaurantProducts,
  serveRecipe,
} from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Location, Product, Recipe } from '../types'

export default function Restaurant() {
  const { userEmail, signOut } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [r, p, l] = await Promise.all([getRecipes(), getRestaurantProducts(), getLocations()])
      setRecipes(r)
      setProducts(p)
      setLocations(l)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleServe(id: number) {
    await serveRecipe(id)
    await fetchAll()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">StockSense Pro</h1>
              <p className="text-xs text-gray-400">Inventory optimisation platform</p>
            </div>
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Dashboard
              </Link>
              <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800">
                Restaurant
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{userEmail}</span>
            <button
              onClick={signOut}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recipes</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showForm ? 'Cancel' : '+ New Recipe'}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <RecipeForm
            products={products}
            locations={locations}
            onSaved={async () => { setShowForm(false); await fetchAll() }}
          />
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Loading recipes...</p>
        ) : recipes.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No recipes yet. Create one above.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onServe={() => handleServe(recipe.id)}
              />

            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Recipe Card ────────────────────────────────────────────────────────────

function RecipeCard({ recipe, onServe }: { recipe: Recipe; onServe: () => Promise<void> }) {
  const [serving, setServing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serveError, setServeError] = useState<string | null>(null)

  const hasLowIngredient = recipe.ingredients.some((i) => i.is_low)

  // Insufficient = explicitly not enough stock. Unknown (null) is allowed through to
  // the backend, which will return a 409 with a clear message if stock is missing.
  const hasInsufficientStock = recipe.ingredients.some(
    (i) => i.stock_quantity !== null && Number(i.stock_quantity) < Number(i.quantity_required)
  )

  async function handleClick() {
    setServeError(null)
    setSuccess(false)
    setServing(true)
    try {
      await onServe()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setServeError(err instanceof Error ? err.message : 'Failed to serve dish.')
    } finally {
      setServing(false)
    }
  }

  return (
    <div className={`overflow-hidden rounded-xl border bg-white shadow-sm ${hasLowIngredient ? 'border-orange-200' : 'border-gray-200'}`}>
      <div className={`border-b px-5 py-3 ${hasLowIngredient ? 'bg-orange-50' : 'bg-gray-50'}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
            <p className="text-xs text-gray-500">{recipe.location_name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Food cost</p>
            <p className="font-semibold text-gray-900">£{recipe.food_cost.toFixed(2)}</p>
          </div>
        </div>
        {hasLowIngredient && (
          <p className="mt-1.5 text-xs font-medium text-orange-600">
            One or more ingredients running low
          </p>
        )}
      </div>

      <div className="px-5 py-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pb-1.5 font-medium">Ingredient</th>
              <th className="pb-1.5 text-right font-medium">Required</th>
              <th className="pb-1.5 text-right font-medium">In stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recipe.ingredients.map((ing) => (
              <tr key={ing.id} className={ing.is_low ? 'text-orange-600' : 'text-gray-700'}>
                <td className="py-1">{ing.product_name}</td>
                <td className="py-1 text-right">
                  {Number(ing.quantity_required).toFixed(2)} {ing.unit}
                </td>
                <td className={`py-1 text-right font-medium ${ing.is_low ? 'text-orange-600' : ''}`}>
                  {ing.stock_quantity !== null
                    ? `${Number(ing.stock_quantity).toFixed(0)} ${ing.unit}`
                    : '—'}
                  {ing.is_low && ' ⚠'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t px-5 py-3 space-y-2">
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-700">
            Dish served — stock updated
          </p>
        )}
        {serveError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {serveError}
          </p>
        )}
        <button
          onClick={handleClick}
          disabled={serving || hasInsufficientStock}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          title={hasInsufficientStock ? 'Insufficient stock to serve this dish' : undefined}
        >
          {serving ? 'Serving...' : 'Serve dish'}
        </button>
      </div>
    </div>
  )
}

// ─── Recipe Form ─────────────────────────────────────────────────────────────

interface IngredientRow {
  product_id: number | ''
  quantity_required: string
}

function RecipeForm({
  products,
  locations,
  onSaved,
}: {
  products: Product[]
  locations: Location[]
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [locationId, setLocationId] = useState<number | ''>(
    locations.length > 0 ? locations[0].id : ''
  )
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { product_id: '', quantity_required: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addIngredient() {
    setIngredients([...ingredients, { product_id: '', quantity_required: '' }])
  }

  function removeIngredient(i: number) {
    setIngredients(ingredients.filter((_, idx) => idx !== i))
  }

  function updateIngredient(i: number, field: keyof IngredientRow, value: string | number) {
    setIngredients(
      ingredients.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const valid = ingredients.every(
      (ing) => ing.product_id !== '' && ing.quantity_required !== '' && Number(ing.quantity_required) > 0
    )
    if (!valid) {
      setError('All ingredient rows must have a product and a quantity greater than 0.')
      return
    }
    if (locationId === '') {
      setError('Please select a location.')
      return
    }

    setLoading(true)
    try {
      await createRecipe({
        name,
        location_id: locationId as number,
        ingredients: ingredients.map((ing) => ({
          product_id: ing.product_id as number,
          quantity_required: Number(ing.quantity_required),
        })),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">New Recipe</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Dish name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="e.g. Chicken Risotto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ingredients</label>
          <div className="mt-2 space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={ing.product_id}
                  onChange={(e) => updateIngredient(i, 'product_id', Number(e.target.value))}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={ing.quantity_required}
                  onChange={(e) => updateIngredient(i, 'quantity_required', e.target.value)}
                  placeholder="Qty"
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="text-gray-400 hover:text-red-500"
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            + Add ingredient
          </button>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save recipe'}
          </button>
        </div>
      </form>
    </div>
  )
}
