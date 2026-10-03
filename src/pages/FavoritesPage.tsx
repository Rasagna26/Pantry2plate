import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { Heart, Search, SlidersHorizontal, X } from 'lucide-react'
import { useRecipeStore } from '../stores/recipeStore'
import { useUserStore } from '../stores/userStore'
import { RecipeCard } from '../components/recipe/RecipeCard'
import { useSeo } from '../lib/useSeo'

type FavoriteSort = 'recent' | 'name' | 'quickest'

export function FavoritesPage() {
  useSeo({
    title: 'Favorites — Pantry2Plate',
    description: 'Your saved recipes. Search, filter, and organize your favorites.',
    path: '/favorites',
    noIndex: true,
  })

  const recipes = useRecipeStore((s) => s.recipes)
  const favorites = useUserStore((s) => s.favorites)
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('all')
  const [sort, setSort] = useState<FavoriteSort>('recent')

  const favoriteRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = recipes.filter((recipe) => {
      if (!favorites.includes(recipe.id)) return false
      if (cuisine !== 'all' && recipe.cuisine !== cuisine) return false
      if (!normalizedQuery) return true
      return [recipe.name, recipe.nameLocal ?? '', recipe.cuisine, ...recipe.keyIngredients]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    })

    return filtered.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'quickest') return a.totalTimeMinutes - b.totalTimeMinutes
      // Preserve the user's saved order for the default view.
      return favorites.indexOf(a.id) - favorites.indexOf(b.id)
    })
  }, [recipes, favorites, query, cuisine, sort])

  const cuisines = useMemo(
    () => [...new Set(recipes.filter((r) => favorites.includes(r.id)).map((r) => r.cuisine))].sort(),
    [recipes, favorites],
  )

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <section className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-chili/5 via-surface-secondary to-turmeric/10 p-5 sm:p-7">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-chili/10">
            <Heart className="h-5 w-5 fill-chili text-chili" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Your collection</p>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary">Favorite recipes</h1>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          Keep your go-to meals close and find something delicious to cook next.
        </p>
        <p className="mt-3 text-sm font-medium text-text-primary">
          {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'}
        </p>
      </section>

      {favorites.length > 0 && (
        <section className="mb-6 space-y-3" aria-label="Filter favorite recipes">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search saved recipes or ingredients..."
                aria-label="Search saved recipes"
                className="w-full rounded-xl border border-border bg-surface-secondary py-3 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted outline-none transition focus:border-turmeric focus:ring-2 focus:ring-turmeric/15"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:bg-surface-tertiary">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-3 text-sm text-text-secondary">
              <SlidersHorizontal className="h-4 w-4 text-text-muted" />
              <span className="sr-only">Sort favorites</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as FavoriteSort)} className="min-w-0 bg-transparent py-3 text-text-primary outline-none">
                <option value="recent">Saved order</option>
                <option value="name">Name: A–Z</option>
                <option value="quickest">Quickest first</option>
              </select>
            </label>
          </div>

          {cuisines.length > 1 && (
            <div className="flex flex-wrap gap-2" aria-label="Filter by cuisine">
              <button onClick={() => setCuisine('all')} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${cuisine === 'all' ? 'bg-turmeric text-white' : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'}`}>
                All cuisines
              </button>
              {cuisines.map((item) => (
                <button key={item} onClick={() => setCuisine(item)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${cuisine === item ? 'bg-turmeric text-white' : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'}`}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {favoriteRecipes.length > 0 ? (
        <>
          <p className="mb-3 text-xs text-text-muted" aria-live="polite">
            Showing {favoriteRecipes.length} of {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {favoriteRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
            </AnimatePresence>
          </div>
        </>
      ) : favorites.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
          <Search className="mx-auto mb-3 h-9 w-9 text-text-muted" />
          <p className="mb-1 font-medium text-text-primary">No matching favorites</p>
          <p className="mb-4 text-sm text-text-muted">Try another search or cuisine filter.</p>
          <button onClick={() => { setQuery(''); setCuisine('all'); setSort('recent') }} className="rounded-lg bg-surface-tertiary px-4 py-2 text-sm font-medium text-text-primary hover:bg-border">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Heart className="mb-4 h-14 w-14 text-border" />
          <p className="mb-1 text-lg font-medium text-text-primary">No favorites yet</p>
          <p className="mb-4 max-w-sm text-sm text-text-muted">Tap the heart on any recipe to save it here. Your personal recipe collection will appear in this space.</p>
          <Link to="/recipes" className="rounded-lg bg-turmeric px-4 py-2 text-sm font-semibold text-white no-underline transition hover:brightness-95">
            Explore recipes
          </Link>
        </div>
      )}
    </main>
  )
}
