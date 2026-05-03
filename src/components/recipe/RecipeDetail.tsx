import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, Flame, Heart, ChefHat,
  Users, Check, Play, BookOpen, Search, ChevronRight,
  Sparkles, ExternalLink, ShoppingCart, Share2, Copy,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { useRecipeStore } from '../../stores/recipeStore'
import { useUserStore } from '../../stores/userStore'
import { resourcesFor } from '../../lib/recipeLinks'
import { rankBySimilarity, similarityScore } from '../../lib/similarity'
import { scaleIngredient } from '../../lib/scaleQuantity'
import { useSeo } from '../../lib/useSeo'
import { CookMode } from './CookMode'
import { IngredientChip } from './IngredientChip'
import { QUICK_COMMERCE_PLATFORMS } from '../../lib/shoppingLinks'
import { shareIngredients, canNativeShare } from '../../lib/shareIngredients'
import type { Recipe } from '../../data/types'

// Minutes → ISO-8601 duration (PT20M, PT1H30M) for schema.org Recipe.
function isoDuration(mins: number): string {
  if (mins <= 0) return 'PT0M'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}`
}

function recipeSchema(r: Recipe) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.name,
    description: r.description,
    recipeCuisine: r.cuisine,
    recipeCategory: r.mealTypes.join(', '),
    keywords: r.tags.join(', '),
    prepTime: isoDuration(r.prepTimeMinutes),
    cookTime: isoDuration(r.cookTimeMinutes),
    totalTime: isoDuration(r.totalTimeMinutes),
    recipeYield: `${r.servings} servings`,
    recipeIngredient: r.ingredients,
    recipeInstructions: r.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: step,
    })),
    suitableForDiet: [
      r.dietary.isVegetarian ? 'https://schema.org/VegetarianDiet' : null,
      r.dietary.isVegan ? 'https://schema.org/VeganDiet' : null,
      r.dietary.isGlutenFree ? 'https://schema.org/GlutenFreeDiet' : null,
    ].filter(Boolean),
  }
}

const spiceDots = (level: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <Flame
      key={i}
      className={cn('w-4 h-4', i < level ? 'text-chili fill-chili' : 'text-border')}
    />
  ))

function dietaryBadges(recipe: Recipe) {
  const badges: { label: string; color: string }[] = []
  if (recipe.dietary.isVegan) badges.push({ label: 'Vegan', color: 'bg-coriander/10 text-coriander border-coriander/20' })
  if (recipe.dietary.isVegetarian) badges.push({ label: 'Vegetarian', color: 'bg-coriander/10 text-coriander border-coriander/20' })
  if (recipe.dietary.isNonVeg) badges.push({ label: 'Non-Veg', color: 'bg-chili/10 text-chili border-chili/20' })
  if (recipe.dietary.isEgg) badges.push({ label: 'Egg', color: 'bg-turmeric-light/10 text-turmeric border-turmeric/20' })
  if (recipe.dietary.isGlutenFree) badges.push({ label: 'Gluten-Free', color: 'bg-surface-tertiary text-text-secondary border-border' })
  if (recipe.dietary.isDairyFree) badges.push({ label: 'Dairy-Free', color: 'bg-surface-tertiary text-text-secondary border-border' })
  return badges
}

const SCALE_OPTIONS = [0.5, 1, 2, 4] as const

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // Select the recipe directly. Selecting `getRecipeById` returns a stable
  // function ref, which means Zustand never re-renders when `recipes` changes.
  const recipe = useRecipeStore((s) => s.recipes.find((r) => r.id === id))
  const allRecipes = useRecipeStore((s) => s.recipes)
  const { isFavorite, toggleFavorite, markCooked, cookedHistory } = useUserStore()

  const [scale, setScale] = useState<number>(1)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(() => new Set())
  const [cookModeOpen, setCookModeOpen] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'success'>('idle')
  const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detected once — whether to label the button "Share" (mobile native share
  // sheet) or "Copy" (desktop clipboard fallback).
  const nativeShare = useMemo(() => canNativeShare(), [])

  useEffect(
    () => () => {
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current)
    },
    [],
  )

  const scaledIngredients = useMemo(
    () => (recipe ? recipe.ingredients.map((l) => scaleIngredient(l, scale)) : []),
    [recipe, scale],
  )

  // Per-page SEO. Called unconditionally with fallback values so hook order
  // stays stable even on the "not found" branch.
  useSeo({
    title: recipe
      ? `${recipe.name} — ${recipe.cuisine} ${recipe.mealTypes[0]} recipe`
      : 'Recipe not found — Pantry2Plate',
    description: recipe
      ? `${recipe.description} Ready in ${recipe.totalTimeMinutes} minutes · ${recipe.difficulty} · serves ${recipe.servings}.`
      : 'The recipe you’re looking for could not be found.',
    path: recipe ? `/recipes/${recipe.id}/` : undefined,
    type: recipe ? 'article' : 'website',
    noIndex: !recipe,
    jsonLd: recipe ? recipeSchema(recipe) : null,
  })

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-text-muted">Recipe not found</p>
        <button
          onClick={() => navigate('/')}
          className="text-turmeric hover:underline"
        >
          Back to spinner
        </button>
      </div>
    )
  }

  const fav = isFavorite(recipe.id)
  const wasCooked = cookedHistory.some((h) => h.recipeId === recipe.id)
  const badges = dietaryBadges(recipe)
  const resources = resourcesFor(recipe)

  const scaledServings = Math.max(1, Math.round(recipe.servings * scale))

  const toggleInSet = (set: Set<number>, idx: number): Set<number> => {
    const next = new Set(set)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    return next
  }

  // Ingredients to share = scaled, with any the user has already ticked off
  // excluded. Matches the shopping-list semantic of the checkboxes.
  const uncheckedIngredients = scaledIngredients.filter((_, i) => !checkedIngredients.has(i))
  const canShare = uncheckedIngredients.length > 0

  const handleShareIngredients = async () => {
    if (!canShare) return
    const result = await shareIngredients({
      recipeName: recipe.name,
      servings: scaledServings,
      ingredients: uncheckedIngredients,
    })
    if (result === 'shared' || result === 'copied') {
      setShareState('success')
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current)
      shareTimeoutRef.current = setTimeout(() => setShareState('idle'), 2000)
    }
  }

  // Similar dishes: rank everything by similarity to this recipe. Prefer
  // same-cuisine matches, but surface a cross-cuisine dish when the score is
  // genuinely high (shared tags, similar time/spice). Threshold 0.35 keeps
  // out obvious mismatches.
  const sameCuisine = allRecipes.filter((r) => r.cuisine === recipe.cuisine)
  const crossCuisine = allRecipes
    .filter((r) => r.cuisine !== recipe.cuisine && similarityScore(recipe, r) >= 0.35)
  const similar = rankBySimilarity(recipe, [...sameCuisine, ...crossCuisine], 4)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-surface-secondary transition-colors text-text-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display-italic text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05] text-text-primary truncate">
            {recipe.name}
          </h1>
          {recipe.nameLocal && (
            <p className="text-sm text-text-muted mt-1">{recipe.nameLocal}</p>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-2">
        <div className="flex flex-col items-center p-3 rounded-xl bg-surface-secondary">
          <Clock className="w-4 h-4 text-turmeric mb-1" />
          <span className="text-sm font-medium text-text-primary">{recipe.totalTimeMinutes}m</span>
          <span className="text-[10px] text-text-muted">Total</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-surface-secondary">
          <ChefHat className="w-4 h-4 text-turmeric mb-1" />
          <span className="text-sm font-medium text-text-primary capitalize">{recipe.difficulty}</span>
          <span className="text-[10px] text-text-muted">Difficulty</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-surface-secondary">
          <Users className="w-4 h-4 text-turmeric mb-1" />
          <span className="text-sm font-medium text-text-primary">
            {scaledServings}
            {scale !== 1 && (
              <span className="text-text-muted"> / {recipe.servings}</span>
            )}
          </span>
          <span className="text-[10px] text-text-muted">Servings</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-surface-secondary">
          <div className="flex gap-0.5 mb-1">{spiceDots(recipe.spiceLevel)}</div>
          <span className="text-[10px] text-text-muted">Spice</span>
        </div>
      </div>
      <p className="text-[11px] text-text-muted mb-6 text-center">
        {recipe.prepTimeMinutes} min prep · {recipe.cookTimeMinutes} min cook
      </p>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {badges.map((b) => (
          <span key={b.label} className={cn('text-xs font-medium px-3 py-1 rounded-full border', b.color)}>
            {b.label}
          </span>
        ))}
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-surface-tertiary text-text-secondary border border-border">
          {recipe.cuisine}
        </span>
        {recipe.region && (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-surface-tertiary text-text-secondary border border-border">
            {recipe.region}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-text-secondary mb-6 leading-relaxed">{recipe.description}</p>

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => toggleFavorite(recipe.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
            fav
              ? 'bg-chili/10 text-chili border border-chili/30'
              : 'bg-surface-secondary text-text-secondary border border-border hover:border-chili/30',
          )}
        >
          <Heart className={cn('w-5 h-5', fav && 'fill-chili')} />
          {fav ? 'Favorited' : 'Favorite'}
        </button>
        <button
          onClick={() => markCooked(recipe.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
            wasCooked
              ? 'bg-coriander/10 text-coriander border border-coriander/30'
              : 'bg-surface-secondary text-text-secondary border border-border hover:border-coriander/30',
          )}
        >
          <Check className="w-5 h-5" />
          {wasCooked ? 'Cooked!' : 'Cooked It'}
        </button>
      </div>

      {/* Key ingredients */}
      <section className="mb-6">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-3">Key Ingredients</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {recipe.keyIngredients.map((ing) => (
            <IngredientChip key={ing} name={ing} />
          ))}
        </div>
        {recipe.keyIngredients.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <ShoppingCart className="w-3.5 h-3.5" />
              Shop on
            </span>
            {QUICK_COMMERCE_PLATFORMS.map((p) => (
              <a
                key={p.id}
                href={p.buildUrl(recipe.keyIngredients.join(' '))}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-3 py-1 rounded-full border border-border bg-surface-secondary text-text-secondary hover:border-turmeric/40 hover:text-turmeric transition-colors no-underline"
              >
                {p.label}
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Ingredients */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="font-heading text-lg font-bold text-text-primary">Ingredients</h2>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-surface-secondary p-1">
              {SCALE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setScale(opt)}
                  className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-md transition-colors',
                    scale === opt
                      ? 'bg-turmeric text-white'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {opt === 0.5 ? '½×' : `${opt}×`}
                </button>
              ))}
            </div>
            <button
              onClick={handleShareIngredients}
              disabled={!canShare}
              aria-label={
                !canShare
                  ? 'Nothing to share — all items checked'
                  : nativeShare
                    ? 'Share ingredients'
                    : 'Copy ingredients to clipboard'
              }
              title={!canShare ? 'Nothing to share — all items checked' : undefined}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
                !canShare
                  ? 'border-border-subtle text-text-muted cursor-not-allowed opacity-50'
                  : shareState === 'success'
                    ? 'border-coriander/40 bg-coriander/10 text-coriander'
                    : 'border-border bg-surface-secondary text-text-secondary hover:border-turmeric/40 hover:text-turmeric',
              )}
            >
              {shareState === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  {nativeShare ? 'Shared!' : 'Copied!'}
                </>
              ) : (
                <>
                  {nativeShare ? (
                    <Share2 className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {nativeShare ? 'Share' : 'Copy'}
                </>
              )}
            </button>
          </div>
        </div>
        <ul className="space-y-1">
          {scaledIngredients.map((ing, i) => {
            const checked = checkedIngredients.has(i)
            return (
              <li key={i}>
                <button
                  onClick={() => setCheckedIngredients((s) => toggleInSet(s, i))}
                  className={cn(
                    'w-full flex items-start gap-3 text-sm text-left px-2 py-1.5 rounded-md transition-colors',
                    checked
                      ? 'text-text-muted line-through'
                      : 'text-text-secondary hover:bg-surface-secondary',
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                      checked
                        ? 'bg-coriander border-coriander text-white'
                        : 'border-border',
                    )}
                  >
                    {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{highlightKey(ing, recipe.keyIngredients)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Steps */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="font-heading text-lg font-bold text-text-primary">Steps</h2>
          <button
            onClick={() => setCookModeOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-turmeric text-white text-xs font-semibold hover:bg-turmeric/90 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Cooking
          </button>
        </div>
        <ol className="space-y-4">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-turmeric/10 text-turmeric text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-text-secondary pt-1 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
        <section className="mb-6 p-4 rounded-xl bg-turmeric/5 border border-turmeric/20">
          <h2 className="font-heading text-lg font-bold text-turmeric mb-2">Tips</h2>
          <ul className="space-y-1">
            {recipe.tips.map((tip, i) => (
              <li key={i} className="text-sm text-text-secondary">• {tip}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Resources */}
      <section className="mb-8">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-3">Resources</h2>
        <ul className="rounded-xl bg-surface-secondary border border-border divide-y divide-border-subtle overflow-hidden">
          <ResourceRow
            href={resources.youtube.url}
            iconBg="bg-red-500/10"
            iconColor="text-red-500"
            icon={<Play className="w-4 h-4" />}
            title={resources.youtube.curated ? 'Watch the tutorial' : 'Video tutorials on YouTube'}
            subtitle={resources.youtube.curated ? 'Curated walkthrough' : 'YouTube search for this dish'}
            hostLabel="youtube.com"
            external
          />
          <ResourceRow
            href={resources.article.url}
            iconBg="bg-turmeric/10"
            iconColor="text-turmeric"
            icon={<BookOpen className="w-4 h-4" />}
            title={resources.article.curated ? 'Read the full recipe' : 'Written recipe articles'}
            subtitle={resources.article.curated ? 'Curated article' : 'Google search for written recipes'}
            hostLabel={resources.article.curated ? hostOf(resources.article.url) : 'google.com'}
            external
          />
          <ResourceRow
            href={resources.moreVariations.url}
            iconBg="bg-coriander/10"
            iconColor="text-coriander"
            icon={<Search className="w-4 h-4" />}
            title="Explore variations"
            subtitle={`Regional twists on ${recipe.name}`}
            hostLabel="google.com"
            external
          />
        </ul>
      </section>

      {/* Similar dishes */}
      {similar.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-turmeric" />
            <h2 className="font-heading text-lg font-bold text-text-primary">You might also like</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {similar.map((r) => {
              const sameCuisine = r.cuisine === recipe.cuisine
              return (
                <Link
                  key={r.id}
                  to={`/recipes/${r.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border hover:border-turmeric/30 transition-colors no-underline group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{r.name}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {sameCuisine ? r.style : r.cuisine} · {r.totalTimeMinutes} min · {r.difficulty}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-turmeric group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 pb-8">
        {recipe.tags.map((tag) => (
          <span key={tag} className="text-[10px] text-text-muted px-2 py-0.5 rounded bg-surface-secondary">
            #{tag}
          </span>
        ))}
      </div>

      {cookModeOpen && (
        <CookMode
          recipeName={recipe.name}
          steps={recipe.steps}
          onClose={() => setCookModeOpen(false)}
        />
      )}
    </div>
  )
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Bold the first occurrence of any keyIngredient phrase inside an ingredient
// line. Picks the longest match so "Mustard oil" beats "Mustard" on a line
// containing both.
function highlightKey(line: string, keys: string[]): React.ReactNode {
  const lower = line.toLowerCase()
  let best: { start: number; end: number } | null = null
  for (const k of keys) {
    const idx = lower.indexOf(k.toLowerCase())
    if (idx < 0) continue
    const cand = { start: idx, end: idx + k.length }
    if (!best || cand.end - cand.start > best.end - best.start) best = cand
  }
  if (!best) return line
  return (
    <>
      {line.slice(0, best.start)}
      <strong className="text-text-primary font-semibold">
        {line.slice(best.start, best.end)}
      </strong>
      {line.slice(best.end)}
    </>
  )
}

interface ResourceRowProps {
  href: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  hostLabel?: string
  external?: boolean
}

function ResourceRow({ href, icon, iconBg, iconColor, title, subtitle, hostLabel, external }: ResourceRowProps) {
  return (
    <li>
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="flex items-center gap-3 px-3 py-3 hover:bg-surface-tertiary transition-colors no-underline group"
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            iconBg,
            iconColor,
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary leading-tight truncate">{title}</p>
          <p className="text-[11px] text-text-muted mt-0.5 leading-tight flex items-center gap-1">
            <span className="truncate">{subtitle}</span>
            {hostLabel && (
              <>
                <span className="text-border">·</span>
                <span className="truncate">{hostLabel}</span>
              </>
            )}
          </p>
        </div>
        {external ? (
          <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0" />
        )}
      </a>
    </li>
  )
}
