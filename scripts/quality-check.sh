#!/bin/bash
set -e
echo "=== IMI QUALITY CHECK ==="
PASS=0; FAIL=0
check() { if eval "$2" >/dev/null 2>&1; then echo "✅ $1"; ((PASS++)); else echo "❌ $1"; ((FAIL++)); fi }
check "TypeScript" "npx tsc --noEmit"
check "ESLint" "npx next lint --max-warnings 0"
check "Build" "npm run build"
check "Tests" "npm test -- --bail --ci"
check "No hardcoded stats" "! grep -q '500.*Laudos' src/components/home/Hero.tsx"
check "No auth-helpers" "! grep -q 'auth-helpers' package.json"
FONTS=$(grep -c 'font/google\|localFont' src/app/layout.tsx 2>/dev/null || echo 99)
[ "$FONTS" -le 4 ] && { echo "✅ Fonts: $FONTS"; ((PASS++)); } || { echo "❌ Fonts: $FONTS"; ((FAIL++)); }
echo "=== RESULT: $PASS pass, $FAIL fail ==="
[ "$FAIL" -eq 0 ] && echo "🟢 ALL CLEAR" || echo "🔴 BLOCKED"
exit $FAIL
