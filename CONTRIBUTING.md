# Contributing to Pantry2Plate

Thanks for wanting to contribute. The most valuable thing you can add is a **recipe you actually cook**.

There are two contribution paths — pick the one that matches how much of a developer you are.

---

## Path 1 · Submit a recipe via Issue (no code required)

1. [Open a new "Add a recipe" issue](../../issues/new?template=add-recipe.yml).
2. Fill every field in the form.
3. A maintainer converts it into a pull request within a week.

That's it. The form is structured so your recipe has everything the app needs, and you don't need to touch TypeScript.

---

## Path 2 · Open a pull request directly

If you know TypeScript and want to wire the recipe yourself:

```bash
git clone https://github.com/YOUR-USERNAME/pantry2plate.git
cd pantry2plate
yarn install
yarn dev
```

Add your recipe to one of the files in `src/data/` that matches its cuisine:

- `recipes-bengali-extra.ts` — Bengali dishes
- `recipes-indian.ts` — North Indian, South Indian
- `recipes-international.ts` — Chinese, Asian, Continental, Mexican, Mediterranean
- `recipes.ts` — the catch-all; large file, ok to add here

Run the validator locally before pushing:

```bash
yarn validate-recipes
```

Then open a PR. CI will run the validator again on your branch.

---

## The `Recipe` schema — every field explained

```ts
{
  id: 'kosha-mangsho-1',              // URL-safe, unique across ALL recipes
  name: 'Kosha Mangsho',               // Display name
  nameLocal: 'কষা মাংস',              // Optional: local-script name
  description: 'Slow-braised Bengali mutton...',  // 1–3 sentences

  cuisine: 'Bengali',                  // MUST match a reelOption value — see list below
  style: 'Curry',                      // MUST match a reelOption value for at least one of your mealTypes
  proteinBase: 'Mutton',               // MUST match a reelOption value
  mealTypes: ['lunch', 'dinner'],      // One or more of: 'breakfast' | 'lunch' | 'dinner' | 'snacks'

  dietary: {
    isVegetarian: false,
    isVegan: false,
    isNonVeg: true,
    isEgg: false,
    isGlutenFree: true,
    isDairyFree: true,
  },

  prepTimeMinutes: 20,                 // Realistic — think "how long does the knife work take"
  cookTimeMinutes: 90,
  totalTimeMinutes: 110,               // Should equal prep + cook (or larger if marinating)
  difficulty: 'hard',                  // 'easy' | 'medium' | 'hard'
  servings: 4,
  spiceLevel: 4,                       // 1 (none) to 5 (very spicy)

  ingredients: [                       // Full pantry list, with amounts
    '1 kg mutton, cut into chunks',
    '2 large onions, sliced',
    // ...
  ],
  keyIngredients: ['mutton', 'onion', 'yogurt', 'mustard oil'],  // 3–5 headline items — drives search & similarity

  steps: [                             // Numbered, one per array item
    'Marinate the mutton with yogurt, ginger-garlic, and spices for 30 min.',
    'Fry sliced onions till deep brown...',
    // ...
  ],
  tips: [                              // Optional; practical advice only
    'Use shoulder cut for best texture.',
  ],

  youtubeUrl: 'https://www.youtube.com/watch?v=...',  // Optional but very helpful
  articleUrl: 'https://...',                           // Optional

  tags: ['slow-cooked', 'celebration', 'spicy'],       // ONLY use canonical tags (list below)

  region: 'West Bengal',               // Optional, freeform
}
```

### Valid `cuisine` values

`Bengali` · `North Indian` · `South Indian` · `Continental` · `Chinese` · `Asian` · `Mediterranean` · `Mexican`

### Valid `style` values — depends on `mealTypes`

A recipe must use a style valid for **at least one** of its declared `mealTypes`. Otherwise the spinner can never land on it.

| mealType | Valid styles |
|---|---|
| breakfast | Light, Hearty, Sweet, Savory |
| lunch | Curry, Dry, Rice Bowl, Bread Meal, One Pot, Light |
| dinner | Curry, Dry, Rice Bowl, Bread Meal, One Pot, Grilled, Soup |
| snacks | Fried, Baked, Chaat, Sweet, Light |

### Valid `proteinBase` values — depends on `mealTypes`

| mealType | Valid proteins |
|---|---|
| breakfast | Egg, Paneer, Lentils, Veggies |
| lunch/dinner | Chicken, Fish, Mutton, Egg, Paneer, Lentils, Veggies, Prawn |
| snacks | Chicken, Egg, Paneer, Veggies, Lentils |

### Canonical tags

Pick 2–5 tags from this fixed list. Anything outside will be dropped silently.

**Occasion**: `weeknight` · `weekend` · `festive` · `party` · `everyday` · `celebration` · `special-occasion`
**Mood**: `comfort-food` · `kid-friendly` · `crowd-pleaser` · `indulgent` · `elegant` · `fun`
**Taste**: `spicy` · `mild` · `tangy` · `rich` · `smoky` · `aromatic` · `sweet` · `buttery`
**Technique**: `grilled` · `baked` · `fried` · `steamed` · `fermented` · `slow-cooked` · `no-cook` · `one-pot`
**Context**: `street-food` · `restaurant-style` · `home-style` · `traditional` · `fusion` · `classic` · `iconic`
**Health**: `healthy` · `high-protein` · `hearty` · `light` · `meal-prep`
**Seasonal**: `monsoon` · `winter` · `summer`
**Texture**: `crispy` · `creamy`

### Dietary flag rules

These are checked by CI:

- `isVegan` → must also have `isVegetarian: true`, `isDairyFree: true`, and `isEgg: false`
- `isVegetarian` and `isNonVeg` cannot both be `true`
- If `proteinBase` is Chicken, Fish, Mutton, or Prawn → `isNonVeg: true`
- If `proteinBase` is Paneer, Lentils, or Veggies → `isVegetarian: true`, `isNonVeg: false`

---

## Other contributions welcome

- **Bug fixes** — open an issue first if non-trivial
- **Feature ideas** — start a [Discussion](../../discussions) before coding
- **UI polish** — screenshots in the PR, please

## Running the dev loop

```bash
yarn dev              # Start vite dev server
yarn build            # Production build
yarn validate-recipes # Check data integrity (same check CI runs)
yarn lint             # ESLint
```

## PR expectations

- One recipe per PR (or one logical change per PR)
- `yarn validate-recipes` passes locally
- `yarn build` succeeds
- Be kind in reviews. This is a tiny side project.

By submitting a contribution you agree to license it under this project's MIT license.
