import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MealType, SpiceLevel } from '../data/types'

interface UserState {
  // Favorites
  favorites: string[]
  toggleFavorite: (recipeId: string) => void
  isFavorite: (recipeId: string) => boolean

  // Cooked history
  cookedHistory: { recipeId: string; date: string }[]
  markCooked: (recipeId: string) => void

  // Preferences
  dietaryFilters: string[]
  toggleDietaryFilter: (filter: string) => void
  cuisinePreferences: string[]
  toggleCuisinePreference: (cuisine: string) => void
  spiceLevel: SpiceLevel
  setSpiceLevel: (level: SpiceLevel) => void
  preferredMealType: MealType
  setPreferredMealType: (type: MealType) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (recipeId) =>
        set((state) => ({
          favorites: state.favorites.includes(recipeId)
            ? state.favorites.filter((id) => id !== recipeId)
            : [...state.favorites, recipeId],
        })),
      isFavorite: (recipeId) => get().favorites.includes(recipeId),

      cookedHistory: [],
      markCooked: (recipeId) =>
        set((state) => ({
          cookedHistory: [
            { recipeId, date: new Date().toISOString() },
            ...state.cookedHistory,
          ],
        })),

      dietaryFilters: [],
      toggleDietaryFilter: (filter) =>
        set((state) => ({
          dietaryFilters: state.dietaryFilters.includes(filter)
            ? state.dietaryFilters.filter((f) => f !== filter)
            : [...state.dietaryFilters, filter],
        })),

      cuisinePreferences: [],
      toggleCuisinePreference: (cuisine) =>
        set((state) => ({
          cuisinePreferences: state.cuisinePreferences.includes(cuisine)
            ? state.cuisinePreferences.filter((c) => c !== cuisine)
            : [...state.cuisinePreferences, cuisine],
        })),

      spiceLevel: 3,
      setSpiceLevel: (level) => set({ spiceLevel: level }),

      preferredMealType: 'dinner',
      setPreferredMealType: (type) => set({ preferredMealType: type }),
    }),
    {
      name: 'pantry2plate-user',
    },
  ),
)
