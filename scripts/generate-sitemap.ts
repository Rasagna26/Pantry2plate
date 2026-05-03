// Generate public/sitemap.xml from the recipe dataset.
// Runs in `prebuild` so the published sitemap always matches the recipes
// shipped in the same build.
//
// Note: writes to public/ (Vite's static asset dir) so the file is copied
// into dist/ at the correct path during `vite build`.

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { recipes } from '../src/data/recipes'

const SITE_URL =
  (process.env.VITE_SITE_URL ?? 'https://itzshoaib.github.io/pantry2plate').replace(/\/$/, '')

interface Entry {
  loc: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

const today = new Date().toISOString().slice(0, 10)

// Trailing slashes match GitHub Pages' canonical form. Each recipe page
// is a directory (`recipes/<id>/index.html`), and GH Pages 301-redirects
// the slashless variant to the slashed one. Listing the slashless URLs
// makes the sitemap a chain of redirects, which Google can flag.
const staticEntries: Entry[] = [
  { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: 1.0 },
  { loc: `${SITE_URL}/recipes/`, changefreq: 'weekly', priority: 0.9 },
]

const recipeEntries: Entry[] = recipes.map((r) => ({
  loc: `${SITE_URL}/recipes/${r.id}/`,
  changefreq: 'monthly',
  priority: 0.7,
}))

const all = [...staticEntries, ...recipeEntries]

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...all.map(
    (e) =>
      `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority.toFixed(1)}</priority>\n  </url>`,
  ),
  '</urlset>',
  '',
].join('\n')

const out = resolve(import.meta.dirname, '../public/sitemap.xml')
writeFileSync(out, xml)
console.log(`Wrote ${out} with ${all.length} URLs (${recipes.length} recipes)`)
