#!/bin/bash
# CORREÇÃO DE IMPORTAÇÕES RELATIVAS - FASE 2 (Subpastas Exclusas)

cd /Users/lailamiranda/dev-imi/src/app/\(backoffice\)/backoffice

echo "🔧 Corrigindo importações em subpastas de 2º nível (ex: avaliacoes/analytics)..."

# Lista de pastas que estão no 2º nível em relação a (backoffice)/components
SUBDIRS=(
  "avaliacoes/analytics"
  "avaliacoes/ia"
  "avaliacoes/nova"
  "credito/novo"
  "credito/simulador"
  "tracking/links"
  "avaliacoes/[id]"
  "credito/[id]"
)

for dir in "${SUBDIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "   Processando $dir..."
    # Se o arquivo importava de ../components, agora precisa ser ../../../components
    # Nota: Antes do Script 1, estava em (backoffice)/dir/sub/page.tsx e importava de ../../components
    # Agora está em (backoffice)/backoffice/dir/sub/page.tsx e precisa de ../../../components
    
    find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' "s|from '../../components|from '../../../components|g" {} \;
    find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|from "../../components|from "../../../components|g' {} \;
    find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' "s|import '../../components|import '../../../components|g" {} \;
    find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|import "../../components|import "../../../components|g' {} \;
  fi
done

echo "✅ Fase 2 concluída!"
echo ""
echo "Executando build novamente..."
cd /Users/lailamiranda/dev-imi
npm run build
