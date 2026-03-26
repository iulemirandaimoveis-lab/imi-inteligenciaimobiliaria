#!/bin/bash
echo "╔══════════════════════════════════════════════════╗"
echo "║   IMI MAESTRIA CHECK — TODOS OS 18 MDs          ║"
echo "╚══════════════════════════════════════════════════╝"
P=0; F=0; W=0
pass() { echo "  ✅ $1"; ((P++)); }
fail() { echo "  ❌ $1"; ((F++)); }
warn() { echo "  ⚠️  $1"; ((W++)); }

echo ""; echo "── BUILD ──"
npx tsc --noEmit 2>/dev/null && pass "TypeScript: 0 erros" || fail "TypeScript: erros encontrados"
grep -q "ignoreBuildErrors: false" next.config.js 2>/dev/null && pass "TS check ativo no build" || fail "TS check DESABILITADO"
grep -q "ignoreDuringBuilds: false" next.config.js 2>/dev/null && pass "ESLint ativo no build" || fail "ESLint DESABILITADO"

echo ""; echo "── SEGURANÇA ──"
grep -q "auth-helpers" package.json && fail "auth-helpers deprecated presente" || pass "auth-helpers removido"
! grep -q "500.*Laudos" src/components/home/Hero.tsx 2>/dev/null && pass "Stats verificados (sem 500+ Laudos)" || fail "Stats hardcoded no Hero"

echo ""; echo "── PERFORMANCE ──"
! grep -q "^export const dynamic" src/app/layout.tsx && pass "force-dynamic removido" || fail "force-dynamic ATIVO"
FONTS=$(grep -c "font/google\|localFont" src/app/layout.tsx 2>/dev/null || echo 99)
[ "$FONTS" -le 4 ] && pass "Fontes: $FONTS (≤4)" || fail "Fontes: $FONTS (>4)"
SW=$(wc -c < public/sw.js 2>/dev/null || echo 999999)
[ "$SW" -lt 50000 ] && pass "SW: ${SW}B (<50KB)" || warn "SW: ${SW}B (≥50KB)"

echo ""; echo "── MARCA ──"
[ -f src/components/brand/IMILogo.tsx ] && pass "IMILogo criado" || fail "IMILogo NÃO criado"
[ -f src/components/brand/GoldLine.tsx ] && pass "GoldLine criado" || fail "GoldLine NÃO criado"
grep -q "C8A44A" src/components/website/Footer.tsx 2>/dev/null && pass "Footer com gold accent" || fail "Footer sem gold"

echo ""; echo "── TESTES ──"
[ -f src/__tests__/invest/calculator.test.ts ] && pass "Testes invest criados" || fail "Testes invest NÃO criados"
[ -f src/__tests__/lib/commission.test.ts ] && pass "Testes commission criados" || fail "Testes commission NÃO criados"
npm test -- --bail --ci 2>/dev/null && pass "Testes passam" || fail "Testes FALHAM"

echo ""; echo "── IA ──"
[ -f src/lib/ai/cost-guard.ts ] && pass "Cost guard criado" || fail "Cost guard NÃO criado"

echo ""; echo "── SCRIPTS ──"
[ -f scripts/quality-check.sh ] && pass "quality-check.sh existe" || fail "quality-check.sh NÃO existe"
[ -f scripts/safe-deploy.sh ] && pass "safe-deploy.sh existe" || fail "safe-deploy.sh NÃO existe"
[ -f lighthouse-budget.json ] && pass "Lighthouse budget existe" || fail "Lighthouse budget NÃO existe"

echo ""
echo "╔══════════════════════════════════════════════════╗"
printf "║  RESULTADO: %d pass · %d fail · %d warnings     ║\n" $P $F $W
if [ "$F" -eq 0 ]; then
echo "║  🟢 MAESTRIA ATINGIDA                           ║"
else
printf "║  🔴 %d ITENS PENDENTES                           ║\n" $F
fi
echo "╚══════════════════════════════════════════════════╝"
exit $F
