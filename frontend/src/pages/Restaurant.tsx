import { useCallback, useEffect, useState } from 'react'
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
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
  const [editing, setEditing] = useState<Recipe | null>(null)

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

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this recipe? This cannot be undone.')) return
    await deleteRecipe(id)
    await fetchAll()
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-900 px-8 py-8">

      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Restaurant</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Recipes and dish serving with automatic stock deduction</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null) }}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
            showForm
              ? 'border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              : 'bg-brand-500 text-white shadow-card hover:bg-brand-600 hover:shadow-card-hover'
          }`}
        >
          {showForm ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Recipe
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3">
          <span className="text-sm">⚠️</span>
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {(showForm || editing) && (
        <div className="mb-8">
          <RecipeForm
            products={products}
            locations={locations}
            existing={editing ?? undefined}
            onSaved={async () => { setShowForm(false); setEditing(null); await fetchAll() }}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-16 text-center">
          <span className="mb-3 text-3xl">🍽️</span>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No recipes yet</p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Create your first recipe using the button above.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onServe={() => handleServe(recipe.id)}
              onEdit={() => { setEditing(recipe); setShowForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              onDelete={() => handleDelete(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Recipe Card ─────────────────────────────────────────────────────────────

function RecipeCard({ recipe, onServe, onEdit, onDelete }: {
  recipe: Recipe
  onServe: () => Promise<void>
  onEdit: () => void
  onDelete: () => void
}) {
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
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white dark:bg-zinc-800 shadow-card transition-all duration-150 hover:shadow-card-hover hover:scale-[1.01] ${
        hasLowIngredient ? 'border-orange-200 dark:border-orange-800' : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      {/* Header */}
      <div className={`relative border-b px-5 py-4 ${hasLowIngredient ? 'border-orange-100 dark:border-orange-800 bg-orange-50/60 dark:bg-orange-900/20' : 'border-zinc-100 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-700/30'}`}>
        {hasLowIngredient && (
          <div className="absolute inset-y-0 left-0 w-0.5 rounded-r bg-orange-400" />
        )}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{recipe.name}</h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{recipe.location_name}</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-right mr-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400 dark:text-zinc-500">Food cost</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">£{recipe.food_cost.toFixed(2)}</p>
            </div>
            <button
              onClick={onEdit}
              title="Edit recipe"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              title="Delete recipe"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
        {hasLowIngredient && (
          <p className="mt-2 text-xs font-medium text-orange-600">⚠ One or more ingredients running low</p>
        )}
      </div>

      {/* Ingredients */}
      <div className="flex-1 px-5 py-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-700">
              <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400 dark:text-zinc-500">Ingredient</th>
              <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400 dark:text-zinc-500">Required</th>
              <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400 dark:text-zinc-500">In stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700">
            {recipe.ingredients.map((ing) => (
              <tr key={ing.id} className={ing.is_low ? 'text-orange-600' : 'text-zinc-700 dark:text-zinc-300'}>
                <td className="py-1.5 text-xs">{ing.product_name}</td>
                <td className="py-1.5 text-right text-xs">
                  {Number(ing.quantity_required).toFixed(2)} {ing.unit}
                </td>
                <td className={`py-1.5 text-right text-xs font-semibold ${ing.is_low ? 'text-orange-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {ing.stock_quantity !== null
                    ? `${Number(ing.stock_quantity).toFixed(0)} ${ing.unit}`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action */}
      <div className="border-t border-zinc-100 dark:border-zinc-700 px-5 py-4 space-y-2">
        {success && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 px-3 py-2">
            <svg className="h-3.5 w-3.5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs font-semibold text-green-700">Dish served — stock updated</p>
          </div>
        )}
        {serveError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700">{serveError}</p>
        )}
        <button
          onClick={handleClick}
          disabled={serving || hasInsufficientStock}
          title={hasInsufficientStock ? 'Insufficient stock to serve this dish' : undefined}
          className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {serving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Serving…
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
  existing,
  onSaved,
  onCancel,
}: {
  products: Product[]
  locations: Location[]
  existing?: Recipe
  onSaved: () => void
  onCancel: () => void
}) {
  const isEdit = !!existing
  const [name, setName] = useState(existing?.name ?? '')
  const [locationId, setLocationId] = useState<number | ''>(
    existing?.location_id ?? (locations.length > 0 ? locations[0].id : '')
  )
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    existing?.ingredients?.length
      ? existing.ingredients.map(i => ({ product_id: i.product_id, quantity_required: String(i.quantity_required) }))
      : [{ product_id: '', quantity_required: '' }]
  )
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
    const payload = {
      name,
      location_id: locationId as number,
      ingredients: ingredients.map((ing) => ({
        product_id: ing.product_id as number,
        quantity_required: Number(ing.quantity_required),
      })),
    }
    try {
      if (isEdit && existing) {
        await updateRecipe(existing.id, payload)
      } else {
        await createRecipe(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'block w-full rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{isEdit ? 'Edit Recipe' : 'New Recipe'}</h3>
        <button type="button" onClick={onCancel} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-400 dark:text-zinc-500 mb-1.5">Dish name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Chicken Risotto"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-400 dark:text-zinc-500 mb-1.5">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(Number(e.target.value))}
              className={inputClass}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-400 mb-2">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={ing.product_id}
                  onChange={(e) => updateIngredient(i, 'product_id', Number(e.target.value))}
                  className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Select product…</option>
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
                  className="w-24 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-500 transition-colors duration-150 hover:text-brand-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add ingredient
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5">
            <svg className="h-3.5 w-3.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Save recipe'}
          </button>
        </div>
      </form>
    </div>
  )
}
