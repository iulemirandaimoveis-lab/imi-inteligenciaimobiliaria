# Architecture Map

**File locations and project structure**

---

## Directory Structure

```
imi-inteligenciaimobiliaria/
├── src/
│   ├── app/              # Next.js App Router (pages e layouts)
│   ├── components/       # Componentes UI reutilizáveis
│   ├── features/         # Módulos por domínio
│   │   ├── admin/        # Backoffice/admin
│   │   ├── avaliacoes/   # Avaliações de imóveis
│   │   ├── connect/      # Conectividade/integrações
│   │   └── properties/   # Gestão de propriedades
│   ├── lib/              # Bibliotecas e utilitários core
│   │   ├── ai/           # Integrações IA (Anthropic, Google AI)
│   │   ├── supabase/     # Cliente Supabase
│   │   ├── intelligence/ # Lógica de inteligência imobiliária
│   │   ├── valuation/    # Avaliação de imóveis
│   │   ├── geo/          # Geolocalização
│   │   ├── invest/       # Análise de investimentos
│   │   ├── whatsapp/     # Integração WhatsApp
│   │   ├── email/        # Integração email
│   │   └── social/       # Redes sociais
│   ├── hooks/            # React hooks customizados
│   ├── services/         # Serviços externos
│   ├── types/            # TypeScript types/interfaces
│   ├── utils/            # Funções utilitárias
│   ├── config/           # Configurações
│   └── modules/          # Módulos adicionais
├── supabase/             # Migrations e configuração Supabase
├── docs/                 # Documentação do projeto
├── e2e/                  # Testes Playwright
├── public/               # Assets estáticos
├── worker/               # Cloudflare Workers
└── design-system/        # Sistema de design
```

## Key File Locations

- **Configuração Next.js**: `next.config.js`
- **Variáveis de ambiente**: `.env.local` (não commitado)
- **Supabase client**: `src/lib/supabase/`
- **Tipos TypeScript**: `src/types/`
- **Middleware**: `src/middleware.ts`
- **Testes unitários**: `src/__tests__/`
- **Testes E2E**: `e2e/`

## Stack Principal

- **Framework**: Next.js (App Router)
- **Banco de dados**: Supabase (PostgreSQL)
- **Estilo**: Tailwind CSS
- **IA**: Anthropic SDK + Google Generative AI
- **Vídeo**: Remotion
- **Animação**: GSAP
- **Forms**: React Hook Form + Zod
- **Deploy**: Vercel

---

**Last Updated**: 2026-05-10
