---
name: auditoria-cto-imi-2026-06
description: Auditoria CTO IMI jun/2026 — validação, correções Tier 1 e roadmap Tiers 2-5
metadata:
  type: project
---

**Fato:** Auditoria CTO executada em 2026-06-05 para 3 páginas de produto (Alto Bellevue, Miguel Marques, Jazz Boulevard). Tier 1 entregue no PR #222.

**Descoberta arquitetural crítica:** Cada produto tem DOIS URLs — `/pt/projetos/[nome]` (página premium customizada, usa SubdivisionLotMap/MasterplanSection) e `/pt/imoveis/[slug]` (página genérica, usa DevelopmentUnits.tsx + InteractiveLotMap). A auditoria testou os genéricos. Decisão tomada: manter ambos coexistindo; `/projetos/` é a referência de qualidade.

**Tier 1 (PR #222) — corrigido:**
- Footer.tsx: `href: 'consultorias'` → `href: 'consultoria'` (404 no nav)
- DevelopmentUnits.tsx: timeout 10s + try/catch + cleanup (loading infinito)
- jazzUnits.ts: SEED_STATUSES separados por torre A/B (disponibilidade idêntica), buildUnitPrice com posBonus R$2.500/posição (preços idênticos), paths /jazz/ → /jazz-boulevard/

**Items auditoria NÃO confirmados (já corrigidos ou não reproduzíveis):**
- "382 vs 383": page.tsx já diz 383 desde commit anterior
- "Painel corretor vaza": strings não encontradas no website code
- "Drawer fantasma Jazz": handleTowerChange já chama setSelectedUnit(null)
- "Typo disponívels": não encontrado no código atual

**IMI Score**: computado LOCALMENTE via calcDetailedScores() em /features/properties/services/score.service.ts — NÃO depende do endpoint /api/intelligence/neighborhood. O endpoint (404) só afeta NeighborhoodIntel que já tem graceful fallback (return null).

**Tiers pendentes:**
- Tier 2: metadata OG Miguel Marques
- Tier 3: Miguel Marques migrar para Supabase sync
- Tier 4: Jazz dados reais por torre
- Tier 5: Alto Bellevue campos cartográficos

**Why:** Produto movimenta VGV significativo; inconsistências geram erosão de confiança da marca.
**How to apply:** Em futuras sessões, saber que cada produto tem rota /projetos/ E /imoveis/; fixes de produto devem verificar ambas.
