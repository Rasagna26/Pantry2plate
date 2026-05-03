import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ChefHat, Sparkles, Settings2, Trash2 } from 'lucide-react'
import { useRecipeStore } from '../stores/recipeStore'
import { usePantryStore } from '../stores/pantryStore'
import { bucketMatches } from '../lib/pantryMatch'
import {
  canonicalIngredients,
  ingredientById,
  quickAddIds,
} from '../data/ingredients'
import { IngredientInput } from '../components/pantry/IngredientInput'
import { StaplesPanel } from '../components/pantry/StaplesPanel'
import { PantryResultsSection, PantryRecipeCard } from '../components/pantry/PantryResults'
import { useSeo } from '../lib/useSeo'
import { cn } from '../lib/cn'

export function PantryPage() {
  useSeo({
    title: 'Pantry — Cook from what you have · Pantry2Plate',
    description:
      'Add the ingredients in your kitchen and discover which recipes you can cook tonight — or how close you are to making them.',
    path: '/pantry',
    noIndex: true, // user-state page, not for crawlers
  })

  const recipes = useRecipeStore((s) => s.recipes)
  const dietaryFilters = useRecipeStore((s) => s.activeDietaryFilters)

  const pantryIds = usePantryStore((s) => s.pantryIds)
  const excludedStapleIds = usePantryStore((s) => s.excludedStapleIds)
  const addIngredient = usePantryStore((s) => s.addIngredient)
  const removeIngredient = usePantryStore((s) => s.removeIngredient)
  const clearPantry = usePantryStore((s) => s.clear)

  const [staplesOpen, setStaplesOpen] = useState(false)

  // Apply dietary filters before scoring so the buckets only contain relevant recipes.
  const candidateRecipes = useMemo(() => {
    if (dietaryFilters.length === 0) return recipes
    return recipes.filter((r) =>
      dietaryFilters.every((f) => {
        switch (f) {
          case 'vegetarian': return r.dietary.isVegetarian
          case 'vegan': return r.dietary.isVegan
          case 'non-veg': return r.dietary.isNonVeg
          case 'egg': return r.dietary.isEgg
          case 'gluten-free': return r.dietary.isGlutenFree
          case 'dairy-free': return r.dietary.isDairyFree
          default: return true
        }
      }),
    )
  }, [recipes, dietaryFilters])

  const buckets = useMemo(
    () => bucketMatches(candidateRecipes, pantryIds, { excludedStapleIds }),
    [candidateRecipes, pantryIds, excludedStapleIds],
  )

  const hasPantry = pantryIds.length > 0
  const hasResults =
    buckets.cookable.length + buckets.oneAway.length + buckets.twoAway.length > 0
  const totalShown =
    buckets.cookable.length +
    buckets.oneAway.length +
    buckets.twoAway.length +
    buckets.threePlus.length

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      {/* Hero header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-xs font-medium text-turmeric uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Pantry mode
        </div>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold text-text-primary leading-tight tracking-tight">
          What's in your{' '}
          <span className="font-display-italic text-gradient-warm">kitchen?</span>
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-2 max-w-xl">
          Add what you have. We'll find recipes you can make right now — and ones you're
          just an ingredient or two away from.
        </p>
      </div>

      {/* Editor */}
      <div className="space-y-3 mb-6 sm:mb-8">
        <IngredientInput pantryIds={pantryIds} onAdd={addIngredient} />

        {/* Pantry chips row */}
        <AnimatePresence>
          {hasPantry && (
            <motion.div
              key="chips"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Your pantry · {pantryIds.length}
                </span>
                <button
                  type="button"
                  onClick={clearPantry}
                  className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-chili transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {pantryIds.map((id) => {
                    const ing = ingredientById.get(id)
                    if (!ing) return null
                    return (
                      <motion.button
                        key={id}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => removeIngredient(id)}
                        className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-full bg-turmeric/10 border border-turmeric/30 text-turmeric text-xs font-medium hover:bg-turmeric/20 transition-colors"
                      >
                        {ing.emoji && <span className="text-sm leading-none">{ing.emoji}</span>}
                        <span>{ing.label}</span>
                        <span className="w-4 h-4 rounded-full bg-turmeric/20 flex items-center justify-center">
                          <X className="w-2.5 h-2.5" />
                        </span>
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action row: staples + tally */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setStaplesOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Staples
            {excludedStapleIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-chili/10 text-chili text-[10px] font-medium">
                −{excludedStapleIds.length}
              </span>
            )}
          </button>
          {hasPantry && (
            <span className="text-xs text-text-muted">
              {totalShown} recipes within reach
            </span>
          )}
        </div>
      </div>

      {/* Empty state — quick add */}
      {!hasPantry && <QuickAddGrid />}

      {/* Results */}
      {hasPantry && (
        <>
          <PantryResultsSection
            title="You can make this"
            subtitle="All key ingredients on hand"
            matches={buckets.cookable}
            accent="green"
          />
          <PantryResultsSection
            title="One ingredient away"
            subtitle="Add one thing and you're cooking"
            matches={buckets.oneAway}
            accent="amber"
          />
          <PantryResultsSection
            title="Two ingredients away"
            matches={buckets.twoAway}
            accent="muted"
            defaultCollapsed
          />
          <PantryResultsSection
            title="Three away"
            matches={buckets.threePlus}
            accent="muted"
            defaultCollapsed
          />

          {/* Closest fallback when nothing in primary buckets */}
          {!hasResults && buckets.closest.length > 0 && (
            <div className="mt-2">
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary">
                  Closest to your pantry
                </h2>
                <span className="text-sm text-text-muted">
                  Add a couple more ingredients to unlock more
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {buckets.closest.map((m) => (
                  <PantryRecipeCard key={m.recipe.id} match={m} />
                ))}
              </div>
            </div>
          )}

          {/* True empty fallback */}
          {!hasResults && buckets.closest.length === 0 && buckets.threePlus.length === 0 && (
            <EmptyResults />
          )}
        </>
      )}

      <StaplesPanel open={staplesOpen} onClose={() => setStaplesOpen(false)} />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────── */

function QuickAddGrid() {
  const pantryIds = usePantryStore((s) => s.pantryIds)
  const toggleIngredient = usePantryStore((s) => s.toggleIngredient)
  const inPantry = new Set(pantryIds)

  const tiles = quickAddIds
    .map((id) => ingredientById.get(id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ChefHat className="w-4 h-4 text-turmeric" />
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
            Quick add
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {tiles.map((ing) => {
            const active = inPantry.has(ing.id)
            return (
              <motion.button
                key={ing.id}
                layout
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleIngredient(ing.id)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-4 rounded-2xl border transition-all',
                  active
                    ? 'bg-turmeric/10 border-turmeric/40 shadow-sm'
                    : 'bg-surface-secondary border-border hover:border-turmeric/30 hover:shadow-sm',
                )}
              >
                <span className="text-3xl sm:text-4xl leading-none" aria-hidden>
                  {ing.emoji ?? '•'}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    active ? 'text-turmeric' : 'text-text-primary',
                  )}
                >
                  {ing.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <BrowseByCategory />
    </div>
  )
}

function BrowseByCategory() {
  const pantryIds = usePantryStore((s) => s.pantryIds)
  const toggleIngredient = usePantryStore((s) => s.toggleIngredient)
  const inPantry = new Set(pantryIds)
  const [expanded, setExpanded] = useState(false)

  const categories: { id: string; label: string }[] = [
    { id: 'protein', label: 'Proteins' },
    { id: 'vegetable', label: 'Vegetables' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'legume', label: 'Legumes' },
    { id: 'grain', label: 'Grains' },
    { id: 'nut-seed', label: 'Nuts & seeds' },
    { id: 'herb', label: 'Herbs' },
  ]

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors mb-3"
      >
        {expanded ? '− Hide all ingredients' : '+ Browse all ingredients'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-5"
          >
            {categories.map((cat) => {
              const items = canonicalIngredients.filter(
                (i) => i.category === cat.id,
              )
              if (items.length === 0) return null
              return (
                <div key={cat.id}>
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                    {cat.label}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((ing) => {
                      const active = inPantry.has(ing.id)
                      return (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => toggleIngredient(ing.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-colors',
                            active
                              ? 'bg-turmeric/10 border-turmeric/40 text-turmeric'
                              : 'bg-surface-secondary border-border text-text-secondary hover:border-turmeric/30',
                          )}
                        >
                          {ing.emoji && <span className="text-sm leading-none">{ing.emoji}</span>}
                          <span>{ing.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyResults() {
  return (
    <div className="text-center py-16">
      <p className="font-heading text-xl font-bold text-text-primary mb-1">
        Hmm, nothing close yet.
      </p>
      <p className="text-sm text-text-muted max-w-sm mx-auto">
        Try adding a protein or grain — those tend to unlock the most matches.
      </p>
    </div>
  )
}
