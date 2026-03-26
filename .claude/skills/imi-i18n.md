---
name: imi-i18n
description: |
  Internacionalização do site IMI. 3 idiomas: PT-BR, EN, AR (RTL).
  Next.js App Router locale routing, hreflang, JSON translations.
  Use quando mencionar: i18n, tradução, internacionalização, RTL,
  idiomas, árabe, inglês, hreflang, locale.
---

# Internationalization — IMI

## Idiomas Suportados
| Código | Idioma | Direção | Mercado |
|--------|--------|---------|---------|
| pt-br | Português (Brasil) | LTR | Recife, Brasil |
| en | English | LTR | USA (Miami, Orlando, NYC) |
| ar | العربية | **RTL** | Dubai, UAE |

## Arquitetura Next.js App Router
- URL Strategy: subdirectory (/pt-br/, /en/, /ar/)
- Middleware: detecta Accept-Language → cookie → default pt-br
- hreflang tags obrigatórios em todas as páginas
- RTL: usar CSS logical properties (margin-inline-start, padding-inline-end)

## Regras de Tradução
1. PT-BR → EN: tradução profissional, não literal
2. PT-BR → AR: tradução + adaptação cultural (Dubai market)
3. Termos técnicos mantidos em inglês (cap rate, NOI, IRR)
4. Moedas localizadas: BRL, USD, AED
5. Datas: DD/MM/YYYY (BR), MM/DD/YYYY (US), DD/MM/YYYY (AR)
