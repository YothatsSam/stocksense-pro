import { useCallback, useEffect, useState } from 'react'
import {
  createRecipe,
  getLocations,
  getRecipes,
  getRestaurantProducts,
  serveRecipe,
} from '../api/client'
import type { Location, Product, Recipe } from '../types'

export default function Restaurant() {
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
    <div className="min-h-full px-6 py-8 lg:px-8">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant</h1>
          <p className="mt-1 text-sm text-gray-500">Manage recipes and serve dishes with automatic stock deduction</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all duration-150 ${
            showForm
              ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              : 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md'
          }`}
        >
          {showForm ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Recipe
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="mb-8">
          <RecipeForm
            products={products}
            locations={locations}
            onSaved={async () => { setShowForm(false); await fetchAll() }}
          />
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v6m0 0c-2 0-4 1.5-4 4v10h8V12c0-2.5-2-4-4-4zm-6 0v4a2 2 0 004 0V2M18 2v18" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No recipes yet</p>
          <p className="mt-1 text-sm text-gray-400">Create your first recipe using the button above.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onServe={() => handleServe(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Recipe Card ─────────────────────────────────────────────────────────────

function RecipeCard({ recipe, onServe }: { recipe: Recipe; onServe: () => Promise<void> }) {
  const [serving, setServing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serveError, setServeError] = useState<string | null>(null)

  const hasLowIngredient = recipe.ingredients.some((i) => i.is_low)
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
    <div className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow duration-150 hover:shadow-md ${
      hasLowIngredient ? 'border-orange-200' : 'border-gray-200'
    }`}>
      {/* Card header */}
      <div className={`border-b px-5 py-4 ${hasLowIngredient ? 'bg-orange-50' : 'bg-gray-50'}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{recipe.location_name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Food cost</p>
            <p className="text-sm font-bold text-gray-900">£{recipe.food_cost.toFixed(2)}</p>
          </div>
        </div>
        {hasLowIngredient && (
          <div className="mt-2 flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs font-medium text-orange-600">One or more ingredients running low</p>
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="flex-1 px-5 py-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="pb-2 font-medium text-gray-400">Ingredient</th>
              <th className="pb-2 text-right font-medium text-gray-400">Required</th>
              <th className="pb-2 text-right font-medium text-gray-400">In stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recipe.ingredients.map((ing) => (
              <tr key={ing.id} className={ing.is_low ? 'text-orange-600' : 'text-gray-700'}>
                <td className="py-1.5">{ing.product_name}</td>
                <td className="py-1.5 text-right">
                  {Number(ing.quantity_required).toFixed(2)} {ing.unit}
                </td>
                <td className={`py-1.5 text-right font-medium ${ing.is_low ? 'text-orange-600' : ''}`}>
                  {ing.stock_quantity !== null
                    ? `${Number(ing.stock_quantity).toFixed(0)} ${ing.unit}`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 px-5 py-4 space-y-2">
        {success && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-emerald-700">Dish served — stock updated</p>
          </div>
        )}
        {serveError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700">
            {serveError}
          </p>
        )}
        <button
          onClick={handleClick}
          disabled={serving || hasInsufficientStock}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          title={hasInsufficientStock ? 'Insufficient stock to serve this dish' : undefined}
        >
          {serving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Serving...
            </span>
          ) : 'Serve dish'}
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

  const inputClass = 'block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-base font-semibold text-gray-900">New Recipe</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Dish name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
              placeholder="e.g. Chicken Risotto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(Number(e.target.value))}
              className={`mt-1.5 ${inputClass}`}
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
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add ingredient
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save recipe'}
          </button>
        </div>
      </form>
    </div>
  )
}
