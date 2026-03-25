// src/app/robots.ts
import { MetadataRoute } from 'next'

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
          '/signup',
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
    // Hardcoded canonical domain — NEVER use process.env here
    sitemap: 'https://www.iulemirandaimoveis.com.br/sitemap.xml',
  }
}
