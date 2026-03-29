/**
 * Generate all PWA/favicon PNG icons from the IMI brand design
 * Uses @napi-rs/canvas (already in deps via pdf-parse)
 */
import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')
const ICONS_DIR = join(PUBLIC, 'icons')

mkdirSync(ICONS_DIR, { recursive: true })

// IMI Brand tokens
const NAVY_TOP = '#0F1B2D'
const NAVY_BOT = '#0B1120'
const GOLD = '#C49D5B'
const WHITE = '#FFFFFF'

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const r = size * 0.22 // corner radius ratio

  // Background gradient (top to bottom)
  const grad = ctx.createLinearGradient(0, 0, 0, size)
  grad.addColorStop(0, NAVY_TOP)
  grad.addColorStop(1, NAVY_BOT)

  // Rounded rect background
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // Gold bar at top
  const barH = Math.max(size * 0.08, 2)
  const barR = barH / 2
  ctx.beginPath()
  ctx.moveTo(barR, 0)
  ctx.lineTo(size - barR, 0)
  ctx.quadraticCurveTo(size, 0, size, barR)
  ctx.lineTo(size, barH)
  ctx.lineTo(0, barH)
  ctx.lineTo(0, barR)
  ctx.quadraticCurveTo(0, 0, barR, 0)
  ctx.closePath()
  ctx.fillStyle = GOLD
  ctx.fill()

  // IMI text
  const fontSize = size * 0.38
  ctx.fillStyle = WHITE
  ctx.font = `700 ${fontSize}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('IMI', size / 2, size * 0.56)

  return canvas
}

// Generate all sizes
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512]

for (const s of sizes) {
  const canvas = drawIcon(s)
  const buf = canvas.toBuffer('image/png')
  const path = join(ICONS_DIR, `icon-${s}.png`)
  writeFileSync(path, buf)
  console.log(`✓ ${path} (${buf.length} bytes)`)
}

// Also generate apple-touch-icon (180x180)
const apple = drawIcon(180)
const appleBuf = apple.toBuffer('image/png')
writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), appleBuf)
console.log(`✓ apple-touch-icon.png (${appleBuf.length} bytes)`)

// Generate favicon-32 and favicon-16 at root
writeFileSync(join(PUBLIC, 'favicon-32x32.png'), drawIcon(32).toBuffer('image/png'))
writeFileSync(join(PUBLIC, 'favicon-16x16.png'), drawIcon(16).toBuffer('image/png'))
console.log('✓ favicon-32x32.png, favicon-16x16.png')

// Generate favicon.ico (use 32x32 PNG — browsers accept PNG-in-ICO)
// For simplicity, we'll create a proper ICO with 16+32 sizes
const ico16 = drawIcon(16).toBuffer('image/png')
const ico32 = drawIcon(32).toBuffer('image/png')

function createICO(pngBuffers) {
  // ICO format: header + directory entries + image data
  const count = pngBuffers.length
  const headerSize = 6
  const dirEntrySize = 16
  const dirSize = dirEntrySize * count
  let offset = headerSize + dirSize

  const sizes_ico = [16, 32]
  const parts = []

  // Header: reserved(2) + type(2) + count(2)
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: 1 = ICO
  header.writeUInt16LE(count, 4)
  parts.push(header)

  // Directory entries
  for (let i = 0; i < count; i++) {
    const entry = Buffer.alloc(16)
    const s = sizes_ico[i]
    entry.writeUInt8(s === 256 ? 0 : s, 0) // width
    entry.writeUInt8(s === 256 ? 0 : s, 1) // height
    entry.writeUInt8(0, 2) // color palette
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(pngBuffers[i].length, 8) // image size
    entry.writeUInt32LE(offset, 12) // image offset
    offset += pngBuffers[i].length
    parts.push(entry)
  }

  // Image data
  for (const buf of pngBuffers) {
    parts.push(buf)
  }

  return Buffer.concat(parts)
}

const icoBuffer = createICO([ico16, ico32])
writeFileSync(join(PUBLIC, 'favicon.ico'), icoBuffer)
console.log(`✓ favicon.ico (${icoBuffer.length} bytes)`)

console.log('\n✅ All icons generated!')
