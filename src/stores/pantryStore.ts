import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PantryState {
  /** Canonical ingredient ids the user has on hand. */
  pantryIds: string[]
  /** Default-staple ids the user has explicitly toggled OFF. */
  excludedStapleIds: string[]

  addIngredient: (id: string) => void
  removeIngredient: (id: string) => void
  toggleIngredient: (id: string) => void
  hasIngredient: (id: string) => boolean
  clear: () => void
  toggleStaple: (id: string) => void
  isStapleExcluded: (id: string) => boolean
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set, get) => ({
      pantryIds: [],
      excludedStapleIds: [],

      addIngredient: (id) =>
        set((state) =>
          state.pantryIds.includes(id) ? state : { pantryIds: [...state.pantryIds, id] },
        ),

      removeIngredient: (id) =>
        set((state) => ({ pantryIds: state.pantryIds.filter((x) => x !== id) })),

      toggleIngredient: (id) =>
        set((state) => ({
          pantryIds: state.pantryIds.includes(id)
            ? state.pantryIds.filter((x) => x !== id)
            : [...state.pantryIds, id],
        })),

      hasIngredient: (id) => get().pantryIds.includes(id),

      clear: () => set({ pantryIds: [] }),

      toggleStaple: (id) =>
        set((state) => ({
          excludedStapleIds: state.excludedStapleIds.includes(id)
            ? state.excludedStapleIds.filter((x) => x !== id)
            : [...state.excludedStapleIds, id],
        })),

      isStapleExcluded: (id) => get().excludedStapleIds.includes(id),
    }),
    {
      name: 'pantry2plate-pantry',
      version: 1,
    },
  ),
)
