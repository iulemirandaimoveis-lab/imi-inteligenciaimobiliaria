#!/bin/bash
# deploy.sh — Deploy para produção e atualiza os domínios automaticamente
# Uso: ./deploy.sh

set -e

TEAM="team_ffkeAKopLLbEJTI8tZqY9Mi6"
DOMAINS=("www.iulemirandaimoveis.com.br" "iulemirandaimoveis.com.br")

echo "🚀 Iniciando deploy de produção..."

# Deploy e captura a URL do novo deployment
DEPLOY_URL=$(npx vercel deploy --prod --scope "$TEAM" --yes 2>&1 | grep "Production:" | awk '{print $2}')

if [ -z "$DEPLOY_URL" ]; then
  echo "❌ Erro: não foi possível obter a URL do deployment"
  exit 1
fi

echo "✅ Deploy concluído: $DEPLOY_URL"

# Atualiza os aliases dos domínios para apontar para o novo deployment
for DOMAIN in "${DOMAINS[@]}"; do
  echo "🔗 Atualizando $DOMAIN → $DEPLOY_URL"
  npx vercel alias set "$DEPLOY_URL" "$DOMAIN" --scope "$TEAM"
done

echo "✅ Domínios atualizados. Produção no ar em https://www.iulemirandaimoveis.com.br"
