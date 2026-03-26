#!/bin/bash
set -e
HEALTH="https://www.iulemirandaimoveis.com.br/api/health"
echo "🔍 Pre-flight checks..."
bash scripts/quality-check.sh || { echo "❌ Quality check failed. Deploy aborted."; exit 1; }
echo "🚀 Deploying..."
npx vercel deploy --prod --yes
sleep 45
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH")
if [ "$STATUS" != "200" ] && [ "$STATUS" != "207" ]; then
  echo "❌ Health check failed ($STATUS). Rolling back..."
  npx vercel rollback
  exit 1
fi
echo "✅ Deploy verified. Health: $STATUS"
