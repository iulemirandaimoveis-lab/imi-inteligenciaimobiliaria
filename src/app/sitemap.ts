// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import * as fs from 'fs'
import * as path from 'path'

// Hardcoded canonical domain — NEVER use process.env here (Vercel deploys resolve to *.vercel.app)
const BASE_URL = 'https://www.iulemirandaimoveis.com.br'
const LANGS = ['pt', 'en']

function urls(path: string, priority: number, freq: MetadataRoute.Sitemap[0]['changeFrequency']) {
  return LANGS.map(lang => ({
    url: `${BASE_URL}/${lang}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Dynamic: Property pages from Supabase ──────────────────────────────────
  let propertyUrls: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabaseAdmin
      .from('developments')
      .select('slug, updated_at')
      .eq('status_commercial', 'published')
      .not('slug', 'is', null)

    if (data) {
      propertyUrls = data.flatMap((p: { slug: string; updated_at: string | null }) =>
        LANGS.map(lang => ({
          url: `${BASE_URL}/${lang}/imoveis/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.80,
        }))
      )
    }
  } catch {
    // Graceful degradation
  }

  // ── Dynamic: Book/ebook pages from /public/books/index.json ────────────────
  let bookUrls: MetadataRoute.Sitemap = []
  try {
    const indexPath = path.join(process.cwd(), 'public', 'books', 'index.json')
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as Array<{ slug: string }>
    bookUrls = indexData.flatMap(book =>
      LANGS.map(lang => ({
        url: `${BASE_URL}/${lang}/biblioteca/${book.slug}`,
        lastModified: new Date('2026-03-22'),
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      }))
    )
  } catch {
    // Books index not available
  }

  return [
    // Homepage — highest priority
    ...urls('', 1.0, 'weekly'),

    // Serviços principais — alta prioridade para SEO
    ...urls('/avaliacoes', 0.95, 'weekly'),
    ...urls('/credito', 0.90, 'monthly'),
    ...urls('/consultoria', 0.90, 'monthly'),

    // Portfólio
    ...urls('/imoveis', 0.85, 'daily'),
    ...urls('/projetos', 0.85, 'weekly'),

    // Biblioteca — hub de conteúdo SEO
    ...urls('/biblioteca', 0.90, 'weekly'),

    // Conteúdo institucional
    ...urls('/sobre', 0.75, 'monthly'),
    ...urls('/contato', 0.80, 'monthly'),
    ...urls('/inteligencia', 0.70, 'weekly'),

    // Legal
    ...urls('/privacidade', 0.30, 'yearly'),
    ...urls('/termos', 0.30, 'yearly'),

    // Dynamic pages
    ...propertyUrls,
    ...bookUrls,
  ]
}
