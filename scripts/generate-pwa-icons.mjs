#!/usr/bin/env node
/**
 * generate-pwa-icons.mjs
 *
 * Generates PNG icons for the IMI PWA manifest.
 *
 * Usage:
 *   node scripts/generate-pwa-icons.mjs
 *
 * Requires:
 *   npm install --save-dev sharp
 *
 * If sharp is not available, the script falls back to copying the SVG icon
 * for browsers that support SVG in Web App Manifests (Chrome 80+, Firefox 89+).
 * The manifest.json already references SVG as the primary icon in that case.
 */

import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = join(__dirname, '..')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const SOURCE_SVG = join(root, 'public', 'icons', 'icon.svg')
const OUT_DIR = join(root, 'public', 'icons')

mkdirSync(OUT_DIR, { recursive: true })

async function generateWithSharp() {
  const sharp = (await import('sharp')).default

  for (const size of SIZES) {
    const outPath = join(OUT_DIR, `icon-${size}.png`)
    await sharp(SOURCE_SVG)
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`✓ Generated ${outPath}`)
  }

  // Also generate apple-touch-icon (180x180)
  const appleOut = join(root, 'public', 'apple-touch-icon.png')
  await sharp(SOURCE_SVG).resize(180, 180).png().toFile(appleOut)
  console.log(`✓ Generated ${appleOut}`)

  console.log('\n✅ All PWA icons generated successfully.')
}

async function fallbackWithSVGCopy() {
  console.log('⚠️  sharp not available — copying SVG as fallback icons.')
  console.log('   Install sharp for proper PNG generation: npm i -D sharp\n')

  for (const size of SIZES) {
    const dest = join(OUT_DIR, `icon-${size}.png`)
    // Copy the SVG as a fallback (rename trick; won't actually be PNG bytes
    // but the manifest now has an SVG entry that takes priority in modern browsers)
    copyFileSync(SOURCE_SVG, dest.replace('.png', '.svg'))
    console.log(`  → Copied SVG fallback for ${size}x${size}`)
  }

  console.log('\n  NOTE: Update manifest.json to reference .svg icons,')
  console.log('        or install sharp and re-run this script for real PNGs.\n')
}

try {
  await generateWithSharp()
} catch {
  await fallbackWithSVGCopy()
}
