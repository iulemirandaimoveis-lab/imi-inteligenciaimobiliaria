# Prevenção de Crashes em Páginas de Loteamento

> "É inadmissível um imóvel ficar fora, é como esconder um SKU da prateleira de um supermercado."

## O Que Aconteceu (Incidente de Maio 2026)

**Sintoma:** Ambas as páginas de loteamento (`/pt/imoveis/alto-bellevue` e `/pt/imoveis/loteamento-miguel-marques`) pararam de carregar mostrando "Algo deu errado" (error boundary).

**Causa raiz:** `import { ..., Map } from 'lucide-react'` no `SubdivisionLotMap.tsx` **sombreou o construtor global `Map`** do JavaScript. Todo código `new Map<string, Lot[]>()` no mesmo arquivo tentava construir o componente React icon em vez de um Map nativo — gerando `TypeError: x.Z is not a constructor` no bundle de produção.

**Por que passou despercebido:** `next.config.ts` tem `typescript: { ignoreBuildErrors: true }` para evitar OOM na Vercel. Erros de tipo não bloqueiam o build.

---

## Regras Obrigatórias

### 1. Nunca importe identificadores que sombreiem globais do JS

❌ **PROIBIDO:**
```typescript
import { Map, Set, Error, Event, URL } from 'alguma-biblioteca';
```

✅ **CORRETO — use alias:**
```typescript
import { Map as MapIcon, Set as SetIcon } from 'lucide-react';
```

**Globais JS que são comuns em bibliotecas de ícones/UI:**
- `Map`, `Set`, `Error`, `Event`, `URL`, `Image`, `Form`, `Link`, `List`, `Table`, `Input`, `Select`, `Filter`, `Search`

### 2. Todo componente de mapa/listagem complexo precisa de Error Boundary

```tsx
// page.tsx
<SubdivisionErrorBoundary developmentName={development.name}>
    <SubdivisionLotMap ... />
</SubdivisionErrorBoundary>
```

A `SubdivisionErrorBoundary` exibe uma mensagem amigável e um botão "Tentar novamente" em vez de derrubar a página inteira.

### 3. Dados numéricos do Supabase devem ser coercidos explicitamente

O Supabase retorna colunas `numeric`/`decimal` como **strings** em certas queries. Coerção explícita evita erros silenciosos em operações matemáticas:

```typescript
// ❌ Pode causar comportamento inesperado
setLots(data as Lot[]);

// ✅ Coerce explicitamente na camada de dados
setLots(data.map(l => ({ ...l, area_m2: Number(l.area_m2) || 0 })) as Lot[]);
```

### 4. Tratamento de erro no fetch do Supabase (client-side)

```typescript
supabase
  .from('subdivision_lots')
  .select('*')
  .then(({ data, error }) => {
    if (error) console.error('[ComponentName] fetch error:', error.message);
    if (data) setLots(...);
    setLoading(false);
  })
  .catch(err => {
    console.error('[ComponentName] unexpected error:', err);
    setLoading(false); // sempre libera o loading, mesmo em erro
  });
```

---

## Checklist de Deploy para Páginas de Imóveis

Antes de fazer push de mudanças nos componentes de loteamento:

- [ ] Nenhum import de biblioteca usa o mesmo nome de um construtor/global JS (`Map`, `Set`, etc.)
- [ ] Componentes complexos de UI têm Error Boundary pai
- [ ] Dados numéricos vindos do DB são coercidos com `Number()`
- [ ] Fetch client-side tem `.catch()` e libera o estado `loading`
- [ ] `viewMode` padrão é `'plan'` para empreendimentos com imagem da planta
- [ ] Testar em `/pt/imoveis/[slug]` localmente antes de push

---

## Anatomia da Defesa em Camadas

```
página Next.js (Server Component)
└── SubdivisionErrorBoundary (React class, client)
    └── SubdivisionLotMap (client)
        ├── try/catch no fetch Supabase
        ├── if (loading) → spinner (nunca null)
        ├── if (lots.length === 0) → null (silencioso, não erro)
        └── SubdivisionPlanView (client)
            └── if (!config) return null (guarda contra ID sem config)
```

Se uma camada falha, a camada exterior mostra um fallback ao invés de derrubar a página.

---

## Propriedades com Configuração de Planta

Ao adicionar um novo loteamento, você **deve** adicionar uma entrada em `SubdivisionPlanView.tsx`:

```typescript
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  'UUID-DO-DESENVOLVIMENTO': {
    imageUrl: '/images/maps/nome-do-loteamento-plant.jpg',
    imageAspect: largura / altura,
    quadraPositions: {
      A: { x: 10, y: 20 }, // % da largura e altura da imagem
      // ...
    },
  },
};
```

A imagem deve ser colocada em `/public/images/maps/` e ter resolução mínima de 2000px de largura.

---

## Monitoramento

Os logs de erro de runtime ficam em:
- Vercel Dashboard → Projeto "youthful-fermi" → Logs → filtrar por `level=error`
- O projeto "youthful-fermi" (`prj_4JmLGspnIZAwGUfgIecjPr0wk8mQ`) é o que serve `www.iulemirandaimoveis.com.br`

**Nota:** O projeto "imi-inteligenciaimobiliaria" na Vercel NÃO serve a produção — é apenas preview.
