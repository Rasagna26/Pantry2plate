// Post-build prerender. Runs after `vite build` and writes static HTML for
// every route into dist/, with route-specific meta tags + semantic content
// inside <div id="root"> so crawlers and LLMs can read the page without
// executing JavaScript.
//
// React mounts via createRoot() (see src/main.tsx), which REPLACES the
// content of #root on hydration. So the fallback HTML we inject here is
// safe — users get the full SPA, crawlers get rich content.
//
// Why route-by-route HTML files instead of relying on the GH Pages 404.html
// SPA redirect: search engines and most LLM crawlers don't execute JS, so
// they'd see the SPA shell with no page-specific content. Static per-route
// HTML solves that without needing a real SSR runtime.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { recipes } from '../src/data/recipes'
import type { Recipe } from '../src/data/types'

const root = resolve(import.meta.dirname, '..')
const distDir = resolve(root, 'dist')
const baseTemplate = readFileSync(resolve(distDir, 'index.html'), 'utf8')

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://itzshoaib.github.io/pantry2plate').replace(/\/$/, '')
const BASE_PATH = '/pantry2plate'

interface RouteMeta {
  routePath: string // app-relative path, e.g. "/recipes" or "/recipes/macher-jhol"
  outFile: string // dist-relative file, e.g. "recipes/index.html"
  title: string
  description: string
  type: 'website' | 'article'
  noIndex?: boolean
  jsonLd?: object | object[]
  bodyHtml: string // semantic content injected into #root
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isoDuration(mins: number): string {
  if (mins <= 0) return 'PT0M'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}`
}

function recipeJsonLd(r: Recipe): object {
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
    url: `${SITE_URL}/recipes/${r.id}/`,
  }
}

function recipeBodyHtml(r: Recipe): string {
  const ingredients = r.ingredients.map((i) => `<li>${escapeHtml(i)}</li>`).join('\n        ')
  const steps = r.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('\n        ')
  return `
    <article>
      <h1>${escapeHtml(r.name)}${r.nameLocal ? ` <span lang="bn">(${escapeHtml(r.nameLocal)})</span>` : ''}</h1>
      <p>${escapeHtml(r.description)}</p>
      <p>
        <strong>Cuisine:</strong> ${escapeHtml(r.cuisine)}${r.region ? ` (${escapeHtml(r.region)})` : ''} ·
        <strong>Style:</strong> ${escapeHtml(r.style)} ·
        <strong>Protein:</strong> ${escapeHtml(r.proteinBase)} ·
        <strong>Total time:</strong> <time datetime="${isoDuration(r.totalTimeMinutes)}">${r.totalTimeMinutes} minutes</time> ·
        <strong>Difficulty:</strong> ${escapeHtml(r.difficulty)} ·
        <strong>Servings:</strong> ${r.servings} ·
        <strong>Spice:</strong> ${r.spiceLevel}/5
      </p>
      <h2>Ingredients</h2>
      <ul>
        ${ingredients}
      </ul>
      <h2>Steps</h2>
      <ol>
        ${steps}
      </ol>
      <p><a href="${BASE_PATH}/">← Back to Pantry2Plate</a></p>
    </article>
  `.trim()
}

function homeBodyHtml(): string {
  return `
    <main>
      <h1>Pantry2Plate — Decide what to cook tonight</h1>
      <p>A playful meal picker for couples and families. Spin three reels — cuisine, style, and protein — or filter by time and dietary needs to get curated recipe suggestions.</p>
      <p>Browse the <a href="${BASE_PATH}/recipes">full recipe collection</a> (${recipes.length}+ Bengali, Indian, Chinese, Asian, Continental, Mexican and Mediterranean dishes).</p>
    </main>
  `.trim()
}

function browseBodyHtml(): string {
  const items = recipes
    .map((r) => `      <li><a href="${BASE_PATH}/recipes/${r.id}">${escapeHtml(r.name)}</a> — ${escapeHtml(r.cuisine)}, ${r.totalTimeMinutes} min, ${escapeHtml(r.difficulty)}</li>`)
    .join('\n')
  return `
    <main>
      <h1>Browse Recipes</h1>
      <p>${recipes.length} recipes across Bengali, Indian, Chinese, Asian, Continental, Mexican and Mediterranean cuisines. Filter by dietary needs, cuisine, and meal type.</p>
      <ul>
${items}
      </ul>
    </main>
  `.trim()
}

const routes: RouteMeta[] = [
  {
    routePath: '/',
    outFile: 'index.html',
    title: 'Pantry2Plate — Decide what to cook tonight',
    description:
      'A playful meal picker for couples and families. Spin three reels — cuisine, style, protein — or set your own filters for time and dietary needs. Get curated recipe suggestions with cook time and ingredients.',
    type: 'website',
    bodyHtml: homeBodyHtml(),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Pantry2Plate',
      description:
        'A playful meal picker for couples and families. Spin reels for cuisine, style, and protein or filter by time and dietary needs to get curated recipe suggestions.',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      url: `${SITE_URL}/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },
  {
    // Trailing slash matches what GH Pages serves (recipes/index.html
    // → /recipes/). Keeps canonical aligned with the actual served URL
    // and with what's in the sitemap.
    routePath: '/recipes/',
    outFile: 'recipes/index.html',
    title: 'Browse Recipes — Pantry2Plate',
    description: `Browse ${recipes.length}+ recipes across Bengali, Indian, Chinese, Asian, Continental, Mexican and Mediterranean cuisines. Filter by dietary needs, cuisine, and meal type.`,
    type: 'website',
    bodyHtml: browseBodyHtml(),
  },
  ...recipes.map((r): RouteMeta => ({
    routePath: `/recipes/${r.id}/`,
    outFile: `recipes/${r.id}/index.html`,
    title: `${r.name} — ${r.cuisine} ${r.mealTypes[0]} recipe`,
    description: `${r.description} Ready in ${r.totalTimeMinutes} minutes · ${r.difficulty} · serves ${r.servings}.`,
    type: 'article',
    bodyHtml: recipeBodyHtml(r),
    jsonLd: recipeJsonLd(r),
  })),
]

function buildHtml(template: string, route: RouteMeta): string {
  const canonical = `${SITE_URL}${route.routePath === '/' ? '/' : route.routePath}`
  let html = template

  // Title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`)

  // description (name=)
  html = html.replace(
    /<meta[\s\n]+name="description"[^>]*\/>/,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
  )

  // robots — flip to noindex if requested
  if (route.noIndex) {
    html = html.replace(
      /<meta[\s\n]+name="robots"[^>]*\/>/,
      `<meta name="robots" content="noindex, nofollow" />`,
    )
  }

  // canonical
  html = html.replace(
    /<link[\s\n]+rel="canonical"[^>]*\/>/,
    `<link rel="canonical" href="${canonical}" />`,
  )

  // OG title / description / url / type
  html = html.replace(
    /<meta[\s\n]+property="og:title"[^>]*\/>/,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
  )
  html = html.replace(
    /<meta[\s\n]+property="og:description"[^>]*\/>/,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
  )
  html = html.replace(
    /<meta[\s\n]+property="og:url"[^>]*\/>/,
    `<meta property="og:url" content="${canonical}" />`,
  )
  html = html.replace(
    /<meta[\s\n]+property="og:type"[^>]*\/>/,
    `<meta property="og:type" content="${route.type}" />`,
  )

  // Twitter title / description
  html = html.replace(
    /<meta[\s\n]+name="twitter:title"[^>]*\/>/,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
  )
  html = html.replace(
    /<meta[\s\n]+name="twitter:description"[^>]*\/>/,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
  )

  // Replace the existing JSON-LD block (the WebApplication one) with a
  // route-specific schema. There may be only one default block in the template.
  const newJsonLd = route.jsonLd
    ? `<script type="application/ld+json">\n${JSON.stringify(route.jsonLd, null, 2)}\n    </script>`
    : ''
  html = html.replace(
    /<script[\s\n]+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/,
    newJsonLd,
  )

  // Inject semantic body content inside <div id="root">. React's createRoot()
  // wipes this on mount, so it's a crawler-only payload. We re-inject the
  // <noscript> JS-required notice after the per-route content.
  const noscriptFallback = `
      <noscript>
        <p style="padding:1rem;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:8px;">
          JavaScript is required for the interactive spinner. The static content
          below is a search-engine fallback.
        </p>
      </noscript>`
  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>\s*<\/body>/,
    `<div id="root">${noscriptFallback}\n${route.bodyHtml}\n    </div>\n  </body>`,
  )

  return html
}

let count = 0
for (const route of routes) {
  const out = resolve(distDir, route.outFile)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, buildHtml(baseTemplate, route))
  count++
}

// Ensure 404.html stays in place (Vite already copied it from public/)
const fourOhFour = resolve(distDir, '404.html')
try {
  readFileSync(fourOhFour)
} catch {
  copyFileSync(resolve(root, 'public/404.html'), fourOhFour)
}

console.log(`Prerendered ${count} routes (1 home + 1 browse + ${recipes.length} recipes)`)
