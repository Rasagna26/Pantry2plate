# Pantry2Plate

A playful meal picker for couples and families. Spin three reels — **cuisine / style / protein** — or set your own filters (time, dietary), and the app hands back recipe suggestions with cook time, difficulty, and ingredient lists.

🔗 **Live:** https://ITZSHOAIB.github.io/pantry2plate/

---

## Why it exists

Most meal-decision apps either dump a wall of recipes on you or give you one pure-random suggestion. Pantry2Plate sits in between: you constrain the *kind* of meal you want (time, dietary, meal type), then randomness picks *within* those constraints — and you can reroll any single dimension if the combo isn't quite right.

## Features

- **Three-reel spinner** — tap or drag each reel to set it manually, or hit spin for a full random
- **Constraint filters** — time (any / <20 / <45 / <90 min) and dietary (Veg / Non-veg / Egg-ok / GF / DF)
- **Targeted rerolls** — "different cuisine / style / protein" buttons in the result card
- **Similarity recommendations** — each recipe page shows related dishes ranked by shared tags, key ingredients, time and spice level (not just same-cuisine)
- **Offline-ready** — PWA with service worker; install to homescreen on iOS/Android
- **Modern fonts** — Fraunces (display) + Plus Jakarta Sans (UI)
- **Dark mode** — detects system preference, toggle in Preferences

## Quick start

```bash
git clone https://github.com/YOUR-USERNAME/pantry2plate.git
cd pantry2plate
yarn install
yarn dev
```

Open http://localhost:5173 and start spinning.

## Deploy to GitHub Pages

1. Copy `.env.example` → `.env`, set `VITE_SITE_URL` to your live URL
2. In your GitHub repo Settings → Pages, set Source to **GitHub Actions**
3. Add a repo variable `VITE_SITE_URL` (Settings → Variables → Actions) with the same value
4. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and publishes

(Or manually: `yarn deploy`)

## Contributing

**The best thing you can add is a recipe you actually cook.** See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the recipe schema, valid values, and canonical tags.

Two paths:

- **Non-developer**: open an ["Add a recipe" issue](../../issues/new?template=add-recipe.yml) — fill a form, maintainer turns it into a PR
- **Developer**: edit a file in `src/data/`, run `yarn validate-recipes`, open PR

## How recommendations work

**Matcher** (`src/stores/recipeStore.ts → getMatchingRecipes`)
1. Filter the full recipe pool by meal type + time limit + dietary flags
2. Look for **exact** cuisine + style + protein match in that pool
3. If none: **partial** match (2 of 3 reel dimensions)
4. If none: **cuisine-only** match
5. Within each tier, rank by `spinAlignment` (how many dimensions line up) then shorter cook time
6. If no tier has results, return `[]` — UI shows a clear empty state with the active filters and a Clear-filters button

**Similarity** (`src/lib/similarity.ts → similarityScore`)

Weighted 0..1 score between two recipes:

| Factor | Weight | Why |
|---|---|---|
| Same cuisine | 22% | Strongest single signal |
| **Tag Jaccard** | **25%** | Mood/technique/taste overlap — highest weight after vocabulary cleanup |
| Shared key ingredients | 12% | Real overlap, not just labels |
| Same style | 15% | Format alignment |
| Same protein | 10% | Dietary alignment |
| Time similarity | 10% | 60-min horizon decay |
| Spice similarity | 6% | Tiebreaker for mood |

Used on recipe-detail "You might also like" — surfaces cross-cuisine dishes when score ≥ 0.35.

## Tech stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS 4** (with a small custom theme in `src/index.css`)
- **Zustand** for state (persists favorites / preferences / cooked history to localStorage)
- **React Router 7** + `BrowserRouter` + SPA 404 redirect for GH Pages deep links
- **Motion** (Framer Motion) for reel spinning + banner transitions
- **vite-plugin-pwa** for service worker + manifest
- **tsx** for the recipe validator script

## Project structure

```
src/
  components/
    layout/          Header, BottomNav, Layout
    spinner/         Reel, SpinnerHousing, SpinButton, SpinResultBanner,
                     TimeFilterChips, DietaryFilterChips
    recipe/          RecipeCard, RecipeDetail, RecommendationCarousel
  data/
    types.ts         Recipe, MealType, SpinResult, ReelOption
    recipes*.ts      The dataset (inline TS arrays)
    reelOptions.ts   Canonical cuisine/style/protein values per mealType
    tagVocab.ts      46 canonical tags grouped by facet
    tagMigration.ts  Legacy → canonical tag map
  lib/
    similarity.ts    similarityScore, rankBySimilarity, spinAlignment
    recipeLinks.ts   YouTube / article search URL fallbacks
    useSeo.ts        Per-page title / meta / OG / JSON-LD
    theme.ts         Dark mode toggle
  pages/             HomePage, BrowsePage, FavoritesPage, PreferencesPage
  stores/            spinnerStore, recipeStore, userStore
scripts/
  validate-recipes.ts  Runs locally (`yarn validate-recipes`) + in CI on PRs
public/
  404.html           SPA fallback for GitHub Pages deep links
  robots.txt
  sitemap.xml
  favicon.svg
```

## License

[MIT](LICENSE) — see the license file for terms. By contributing, you agree to license your contribution under the same terms.
