# Quick Start Commands

**Essential commands for this project**

---

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test
npm run test:watch

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## Database (Supabase)

```bash
# Apply migrations locally
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts

# Open Supabase Studio
supabase studio
```

## E2E Tests

```bash
# Run Playwright tests
npx playwright test

# Run with UI
npx playwright test --ui
```

## Deploy

```bash
bash deploy.sh
```

## Common Workflows

1. **Starting work**: `npm run dev` → abre localhost:3000
2. **Após mudança de schema**: regenerar tipos com `supabase gen types typescript`
3. **Antes de commit**: `npm run type-check && npm run lint`
4. **Deploying**: `bash deploy.sh` ou via Vercel dashboard

---

**Last Updated**: 2026-05-10
