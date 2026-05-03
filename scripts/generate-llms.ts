// Generate public/llms.txt and public/llms-full.txt.
//
// llms.txt: short markdown index — what the site is, where to find content
//   (https://llmstxt.org/).
// llms-full.txt: same intro plus every recipe rendered as markdown so an
//   agent can ingest the whole catalogue from a single URL.
//
// Runs in `prebuild` alongside generate-sitemap so the files always match
// the recipes shipped in the build.

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { recipes } from '../src/data/recipes'
import type { Recipe } from '../src/data/types'

const SITE_URL =
  (process.env.VITE_SITE_URL ?? 'https://itzshoaib.github.io/pantry2plate').replace(/\/$/, '')

function dietaryLabels(r: Recipe): string {
  const parts: string[] = []
  if (r.dietary.isVegan) parts.push('Vegan')
  else if (r.dietary.isVegetarian) parts.push('Vegetarian')
  if (r.dietary.isNonVeg) parts.push('Non-Veg')
  if (r.dietary.isEgg) parts.push('Contains egg')
  if (r.dietary.isGlutenFree) parts.push('Gluten-free')
  if (r.dietary.isDairyFree) parts.push('Dairy-free')
  return parts.join(' · ')
}

function recipeMarkdown(r: Recipe): string {
  const lines: string[] = []
  lines.push(`## ${r.name}${r.nameLocal ? ` (${r.nameLocal})` : ''}`)
  lines.push('')
  lines.push(`URL: ${SITE_URL}/recipes/${r.id}/`)
  lines.push('')
  lines.push(r.description)
  lines.push('')
  lines.push(
    `**Cuisine:** ${r.cuisine}${r.region ? ` (${r.region})` : ''} · **Style:** ${r.style} · **Protein:** ${r.proteinBase}`,
  )
  lines.push(
    `**Time:** ${r.totalTimeMinutes} min total (${r.prepTimeMinutes} prep + ${r.cookTimeMinutes} cook) · **Difficulty:** ${r.difficulty} · **Servings:** ${r.servings} · **Spice:** ${r.spiceLevel}/5`,
  )
  lines.push(`**Meal:** ${r.mealTypes.join(', ')} · **Dietary:** ${dietaryLabels(r)}`)
  lines.push('')
  lines.push('**Ingredients:**')
  for (const ing of r.ingredients) lines.push(`- ${ing}`)
  lines.push('')
  lines.push('**Steps:**')
  r.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`))
  if (r.tips && r.tips.length > 0) {
    lines.push('')
    lines.push('**Tips:**')
    for (const tip of r.tips) lines.push(`- ${tip}`)
  }
  lines.push('')
  return lines.join('\n')
}

const intro = `# Pantry2Plate

> A playful meal picker for couples and families. Spin three reels — cuisine,
> style, and protein — or filter by time and dietary needs to get curated
> recipe suggestions. The catalogue covers Bengali, Indian, Chinese, Asian,
> Continental, Mexican and Mediterranean cuisines.

This file follows the [llms.txt](https://llmstxt.org/) convention: a
machine-readable index of the site's primary content for LLMs and AI agents.

- Site: ${SITE_URL}/
- Browse: ${SITE_URL}/recipes/
- Sitemap: ${SITE_URL}/sitemap.xml
- Full content (all recipes inlined as markdown): ${SITE_URL}/llms-full.txt

## How recipes are organised

Each recipe has: name (often plus a localised name), description, cuisine,
style (curry, stir-fry, grill, …), protein base, meal types (breakfast,
lunch, dinner, snacks), prep + cook times, difficulty, servings, spice
level (1–5), dietary flags (vegetarian, vegan, non-veg, egg, gluten-free,
dairy-free), ingredients with quantities, numbered steps, and optional tips.

## Recipes
`

// llms.txt — index only (recipe links, no body)
const indexBody = recipes
  .map((r) => `- [${r.name}${r.nameLocal ? ` (${r.nameLocal})` : ''}](${SITE_URL}/recipes/${r.id}) — ${r.cuisine} ${r.style.toLowerCase()}, ${r.totalTimeMinutes} min, ${r.difficulty}`)
  .join('\n')

const llmsTxt = `${intro}\n${indexBody}\n`

// llms-full.txt — same intro plus every recipe inlined
const fullBody = recipes.map(recipeMarkdown).join('\n---\n\n')
const llmsFullTxt = `${intro.replace('## Recipes\n', '')}\n${fullBody}`

const root = resolve(import.meta.dirname, '..')
writeFileSync(resolve(root, 'public/llms.txt'), llmsTxt)
writeFileSync(resolve(root, 'public/llms-full.txt'), llmsFullTxt)

console.log(
  `Wrote public/llms.txt (${llmsTxt.length.toLocaleString()} chars, ${recipes.length} recipes indexed)`,
)
console.log(
  `Wrote public/llms-full.txt (${llmsFullTxt.length.toLocaleString()} chars, all recipes inlined)`,
)
