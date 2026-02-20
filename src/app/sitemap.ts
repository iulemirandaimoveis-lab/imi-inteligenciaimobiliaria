// src/app/sitemap.ts
import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'
const LANGS = ['pt', 'en', 'es']

function urls(path: string, priority: number, freq: MetadataRoute.Sitemap[0]['changeFrequency']) {
  return LANGS.map(lang => ({
    url: `${BASE_URL}/${lang}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Homepage
    ...urls('', 1.0, 'weekly'),

    // Serviços principais — alta prioridade para SEO
    ...urls('/avaliacoes', 0.95, 'weekly'),
    ...urls('/credito', 0.90, 'monthly'),
    ...urls('/consultoria', 0.90, 'monthly'),

    // Portfólio
    ...urls('/imoveis', 0.85, 'daily'),
    ...urls('/projetos', 0.85, 'weekly'),

    // Conteúdo institucional
    ...urls('/sobre', 0.75, 'monthly'),
    ...urls('/contato', 0.80, 'monthly'),
    ...urls('/inteligencia', 0.70, 'weekly'),
    ...urls('/construtoras', 0.65, 'monthly'),

    // Legal
    ...urls('/privacidade', 0.30, 'yearly'),
    ...urls('/termos', 0.30, 'yearly'),
  ]
}
