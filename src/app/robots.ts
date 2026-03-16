// src/app/robots.ts
import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/backoffice/',
          '/api/',
          '/login',
          '/_next/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/llms.txt', '/llms-full.txt'],
        disallow: ['/backoffice/', '/api/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/llms.txt', '/llms-full.txt'],
        disallow: ['/backoffice/', '/api/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/llms.txt', '/llms-full.txt'],
        disallow: ['/backoffice/', '/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/llms.txt', '/llms-full.txt'],
        disallow: ['/backoffice/', '/api/'],
      },
      {
        userAgent: 'Amazonbot',
        allow: '/',
        disallow: ['/backoffice/', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
