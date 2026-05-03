import { AnimatePresence } from 'motion/react'
import { Heart } from 'lucide-react'
import { useRecipeStore } from '../stores/recipeStore'
import { useUserStore } from '../stores/userStore'
import { RecipeCard } from '../components/recipe/RecipeCard'
import { useSeo } from '../lib/useSeo'

export function FavoritesPage() {
  useSeo({
    title: 'Favorites — Pantry2Plate',
    description: 'Your saved recipes. Favorites are stored locally on this device.',
    path: '/favorites',
    noIndex: true, // personal state, not worth indexing
  })

  const recipes = useRecipeStore((s) => s.recipes)
  const favorites = useUserStore((s) => s.favorites)

  const favoriteRecipes = recipes.filter((r) => favorites.includes(r.id))

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary mb-6">
        Favorites
      </h1>

      {favoriteRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {favoriteRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="w-16 h-16 text-border mb-4" />
          <p className="text-text-muted text-lg mb-1">No favorites yet</p>
          <p className="text-text-muted text-sm">
            Tap the heart on any recipe to save it here
          </p>
        </div>
      )}
    </div>
  )
}
