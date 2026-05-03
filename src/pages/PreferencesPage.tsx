import { Moon, Sun, History, Flame } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'
import { toggleTheme, isDarkMode } from '../lib/theme'
import { useUserStore } from '../stores/userStore'
import { useRecipeStore } from '../stores/recipeStore'
import { useSeo } from '../lib/useSeo'
import type { SpiceLevel } from '../data/types'

const dietaryOptions = [
  { key: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
  { key: 'vegan', label: 'Vegan', emoji: '🌱' },
  { key: 'non-veg', label: 'Non-Veg', emoji: '🍗' },
  { key: 'egg', label: 'Egg', emoji: '🥚' },
  { key: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
  { key: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
]

export function PreferencesPage() {
  useSeo({
    title: 'Preferences — Pantry2Plate',
    description: 'Set your dietary preferences, spice level, and theme.',
    path: '/preferences',
    noIndex: true,
  })

  const [dark, setDark] = useState(isDarkMode())
  const {
    dietaryFilters, toggleDietaryFilter,
    cuisinePreferences, toggleCuisinePreference,
    spiceLevel, setSpiceLevel,
    cookedHistory,
  } = useUserStore()

  const recipes = useRecipeStore((s) => s.recipes)
  const cuisines = [...new Set(recipes.map((r) => r.cuisine))].sort()

  const recentlyCooked = cookedHistory.slice(0, 10).map((h) => {
    const recipe = recipes.find((r) => r.id === h.recipeId)
    return { ...h, recipe }
  })

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-8">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary">
        Settings
      </h1>

      {/* Theme */}
      <section>
        <h2 className="font-heading text-lg font-bold text-text-primary mb-3">Appearance</h2>
        <button
          onClick={() => setDark(toggleTheme())}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-secondary border border-border hover:border-turmeric/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            {dark ? <Moon className="w-5 h-5 text-turmeric" /> : <Sun className="w-5 h-5 text-turmeric" />}
            <span className="text-sm font-medium text-text-primary">Theme</span>
          </div>
          <span className="text-sm text-text-muted">{dark ? 'Dark' : 'Light'}</span>
        </button>
      </section>

      {/* Spice level */}
      <section>
        <h2 className="font-heading text-lg font-bold text-text-primary mb-3">Spice Preference</h2>
        <div className="flex items-center gap-2 p-4 rounded-xl bg-surface-secondary border border-border">
          {([1, 2, 3, 4, 5] as SpiceLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setSpiceLevel(level)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all',
                spiceLevel === level
                  ? 'bg-chili/10 border border-chili/30'
                  : 'hover:bg-surface-tertiary',
              )}
            >
              <Flame
                className={cn(
                  'w-5 h-5',
                  level <= spiceLevel ? 'text-chili fill-chili' : 'text-border',
                )}
              />
              <span className="text-[10px] text-text-muted">{level}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Dietary */}
      <section>
        <h2 className="font-heading text-lg font-bold text-text-primary mb-3">Dietary Preferences</h2>
        <div className="grid grid-cols-2 gap-2">
          {dietaryOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => toggleDietaryFilter(opt.key)}
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all',
                dietaryFilters.includes(opt.key)
                  ? 'bg-coriander/10 text-coriander border border-coriander/30'
                  : 'bg-surface-secondary text-text-secondary border border-border hover:border-turmeric/30',
              )}
            >
              <span>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Cuisine preferences */}
      <section>
        <h2 className="font-heading text-lg font-bold text-text-primary mb-3">Favorite Cuisines</h2>
        <div className="flex flex-wrap gap-2">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => toggleCuisinePreference(cuisine)}
              className={cn(
                'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                cuisinePreferences.includes(cuisine)
                  ? 'bg-turmeric/10 text-turmeric border border-turmeric/30'
                  : 'bg-surface-secondary text-text-secondary border border-border hover:border-turmeric/30',
              )}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </section>

      {/* Cooked history */}
      <section>
        <h2 className="font-heading text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
          <History className="w-5 h-5" />
          Recently Cooked
        </h2>
        {recentlyCooked.length > 0 ? (
          <div className="space-y-2">
            {recentlyCooked.map((entry, i) => (
              <div
                key={`${entry.recipeId}-${i}`}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border"
              >
                <span className="text-sm text-text-primary">
                  {entry.recipe?.name || entry.recipeId}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted p-4 rounded-xl bg-surface-secondary border border-border text-center">
            No cooking history yet
          </p>
        )}
      </section>
    </div>
  )
}
