#!/bin/bash
# CORREÇÃO DE IMPORTAÇÕES RELATIVAS

cd /Users/lailamiranda/dev-imi/src/app/\(backoffice\)/backoffice

echo "🔧 Corrigindo importações relativas..."

# Corrigir ../components para ../../components
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' "s|from '../components|from '../../components|g" {} \;
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|from "../components|from "../../components|g' {} \;

# Corrigir import '../components para import '../../components
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' "s|import '../components|import '../../components|g" {} \;
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|import "../components|import "../../components|g' {} \;

echo "✅ Importações corrigidas!"
echo ""
echo "Executando build novamente..."
cd /Users/lailamiranda/dev-imi
npm run build
