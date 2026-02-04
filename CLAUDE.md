# CLAUDE.md - AI Assistant Guide for IMI Atlantis

This document provides comprehensive guidance for AI assistants working with the IMI (Inteligencia Imobiliaria) codebase - a premium real estate intelligence platform built in Brazil.

## Project Overview

**IMI Atlantis** is a full-stack Next.js 14 web application combining:
- **Public Website**: Institutional pages, property listings, and lead capture forms
- **Admin Backoffice**: CRM, property management, consultations, and analytics
- **API Layer**: RESTful endpoints with server actions for CRUD operations

**Tech Stack**: Next.js 14 (App Router) | TypeScript | TailwindCSS | Prisma | Supabase (PostgreSQL) | Framer Motion

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production (runs prisma generate first)
npm start                # Run production server

# Code Quality
npm run lint             # ESLint check
npm run type-check       # TypeScript validation

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:studio    # Visual database editor (localhost:5555)
npm run prisma:migrate   # Run database migrations

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Watch mode
```

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (website)/               # Public pages (grouped layout)
│   │   ├── page.tsx             # Home
│   │   ├── avaliacoes/          # Property appraisals
│   │   ├── consultoria/         # Investment consulting
│   │   ├── contato/             # Contact
│   │   ├── imoveis/             # Property listings
│   │   ├── sobre/               # About
│   │   └── layout.tsx           # Shared layout (Header, Footer)
│   ├── backoffice/              # Admin dashboard (protected)
│   │   ├── dashboard/           # KPIs and overview
│   │   ├── leads/               # Lead management
│   │   ├── properties/          # Property CRUD
│   │   ├── consultations/       # Scheduling
│   │   ├── coupons/             # Discount management
│   │   ├── reports/             # Analytics
│   │   └── whatsapp/            # Messaging center
│   └── api/                     # API routes
│       ├── auth/                # Login/logout
│       ├── leads/               # Lead endpoints
│       ├── properties/          # Property endpoints
│       └── ...                  # Other endpoints
├── components/
│   ├── ui/                      # Base components (Button, Input, Card...)
│   ├── layout/                  # Header, Footer
│   ├── forms/                   # Form components
│   ├── consultoria/             # Investment calculators
│   └── backoffice/              # Admin components
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── supabase.ts             # Supabase client
│   ├── actions.ts              # Server actions
│   ├── utils.ts                # Utilities (cn, formatCurrency, etc.)
│   └── animations.ts           # Framer Motion variants
├── types/                       # TypeScript interfaces
└── services/                    # Business logic
```

## Code Conventions

### Component Pattern

```typescript
'use client'  // Required for client components

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ComponentProps {
  variant?: 'primary' | 'secondary'
  className?: string
}

export default function ComponentName({ variant = 'primary', className }: ComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('base-styles', className)}
    >
      {/* Content */}
    </motion.div>
  )
}
```

### Server Actions Pattern

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createEntity(data: any) {
  try {
    const result = await prisma.entity.create({ data })
    revalidatePath('/backoffice/entities')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating entity:', error)
    return { success: false, error: 'Failed to create entity' }
  }
}
```

### API Route Pattern

```typescript
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    // Validate with Zod
    // Process data
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### Styling with Tailwind

- Use `cn()` utility for conditional classes: `cn('base', condition && 'conditional')`
- Custom colors: `navy-600/700/800/900`, `gold-500/600`, `offwhite`
- Typography: `font-sans` (Inter) for body, `font-display` (Playfair) for headings
- Custom shadows: `shadow-soft`, `shadow-soft-lg`
- Responsive: Mobile-first with `sm:`, `md:`, `lg:`, `xl:` breakpoints

### Animations

Use predefined Framer Motion variants from `@/lib/animations.ts`:
- `fadeIn` - Simple opacity fade
- `slideUp` / `slideDown` - Vertical slides with opacity
- `staggerContainer` - For animating children sequentially
- `scaleOnHover` - Subtle hover effect

## Database Schema

Key Prisma models (see `prisma/schema.prisma`):

| Model | Purpose |
|-------|---------|
| User | Authentication & roles (CUSTOMER, CONSULTANT, ADMIN, SUPER_ADMIN) |
| Lead | CRM leads with qualification scoring |
| Consultation | Scheduled meetings with clients |
| Property | Real estate inventory |
| Coupon | Discount codes |
| WhatsAppMessage | Messaging history |
| ActivityLog | Audit trail |

### Key Enums
- `LeadStage`: NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, CONVERTED, LOST
- `PropertyStatus`: AVAILABLE, RESERVED, SOLD, OFF_MARKET
- `Location`: US_MIAMI, US_ORLANDO, US_NYC, US_TAMPA, UAE_DUBAI

## Environment Variables

Required in `.env.local` (see `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Auth
JWT_SECRET="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Architecture Decisions

### Authentication
- JWT-based with 7-day expiration
- HTTP-only secure cookies
- Middleware protection for `/backoffice/*` routes
- Supabase Auth helpers for session management

### Data Fetching
- Server Actions for mutations (create, update, delete)
- SWR for client-side data fetching
- `revalidatePath()` for cache invalidation

### File Uploads
- Supabase Storage for images/documents
- React Dropzone for drag-and-drop UI
- 2MB body size limit for server actions

### Build Configuration
- TypeScript and ESLint errors are **ignored during builds** (see `next.config.js`)
- This ensures deployment even with warnings - fix issues proactively

## Important Files

| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Singleton Prisma client |
| `src/lib/utils.ts` | Utility functions (cn, formatCurrency, formatPhone, slugify) |
| `src/lib/actions.ts` | Server actions for CRUD operations |
| `prisma/schema.prisma` | Database schema definition |
| `tailwind.config.js` | Design tokens and custom theme |
| `next.config.js` | Next.js configuration |

## Development Guidelines

### Do's
- Use TypeScript strictly - define interfaces for all props and data
- Use `cn()` for className composition
- Use server actions for mutations, not direct Prisma calls in components
- Use `@/` path alias for imports (maps to `src/`)
- Follow existing animation patterns from `lib/animations.ts`
- Use Zod for API input validation
- Log errors with `console.error` for debugging
- Use `revalidatePath()` after mutations

### Don'ts
- Don't create API routes when server actions suffice
- Don't use `any` type - define proper interfaces
- Don't bypass TypeScript with `// @ts-ignore`
- Don't hardcode URLs - use environment variables
- Don't commit `.env.local` or sensitive credentials
- Don't add excessive comments - code should be self-documenting

### Form Handling
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
})
```

## Testing

- Framework: Jest with React Testing Library
- Test files in `/tests` directory
- Run: `npm test` or `npm run test:watch`
- Focus on API routes and server actions

## Deployment

- **Platform**: Vercel (recommended)
- **Region**: gru1 (Sao Paulo, Brazil)
- **Build**: `npm run build` (runs prisma generate + next build)
- **Environment**: Set all env vars in Vercel dashboard

## Common Tasks

### Adding a New Page
1. Create directory in `src/app/(website)/page-name/`
2. Add `page.tsx` with metadata export
3. Update navigation in `src/components/layout/Header.tsx`

### Adding a New API Endpoint
1. Create `src/app/api/endpoint/route.ts`
2. Export async functions: GET, POST, PUT, DELETE
3. Use try-catch with proper error responses

### Adding a New Database Model
1. Update `prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Run `npm run prisma:generate`
4. Create server actions in `src/lib/actions.ts`

### Adding a New Backoffice Feature
1. Create directory in `src/app/backoffice/feature/`
2. Add `page.tsx` for the main view
3. Create components in `src/components/backoffice/`
4. Add API routes or server actions as needed
5. Update sidebar navigation

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.1.0 | React framework |
| react | 18.2.0 | UI library |
| typescript | 5.3.3 | Type safety |
| tailwindcss | 3.4.19 | Styling |
| framer-motion | 11.18.2 | Animations |
| @prisma/client | 5.8.0 | Database ORM |
| @supabase/supabase-js | 2.94.1 | Backend services |
| zod | 3.25.76 | Schema validation |
| react-hook-form | 7.71.1 | Form management |
| lucide-react | 0.563.0 | Icons |

## Troubleshooting

### Prisma Client Issues
```bash
npm run prisma:generate  # Regenerate client
```

### Database Connection
- Check `DATABASE_URL` in `.env.local`
- Ensure Supabase project is active
- Verify network access to database

### Build Failures
- TypeScript/ESLint errors are ignored in build
- Check for runtime errors in server components
- Verify all env vars are set

### Authentication Issues
- Clear cookies in browser
- Check `JWT_SECRET` is set
- Verify Supabase keys are correct

## Contact & Resources

- **Business**: IMI - Inteligencia Imobiliaria
- **CRECI**: 17933
- **CNAI**: 53290
- **Docs**: [Next.js](https://nextjs.org/docs) | [TailwindCSS](https://tailwindcss.com) | [Prisma](https://www.prisma.io/docs)
