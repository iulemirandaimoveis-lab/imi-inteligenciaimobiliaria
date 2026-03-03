#!/bin/bash
# ============================================
# BLOCO 1 - SCRIPT 4: BUSCA E SUBSTITUIÇÃO GLOBAL
# ⚠️ EXECUTAR EXATAMENTE - NÃO MODIFICAR
# ============================================

# OBJETIVO: Corrigir todos os links internos nas páginas
# SUBSTITUIR: /backoffice/backoffice/ => /backoffice/

echo "🔍 Iniciando busca e substituição de links..."

# Navegar para o diretório do backoffice
cd "/Users/lailamiranda/dev-imi/src/app/(backoffice)/backoffice"

# Verificar se estamos no diretório correto
if [ ! -d "dashboard" ]; then
  echo "❌ ERRO: Estrutura de backoffice não encontrada!"
  echo "Certifique-se de ter executado o SCRIPT 1 primeiro"
  exit 1
fi

# Contador de arquivos modificados
count=0

# Buscar e substituir em todos os arquivos .tsx e .ts
echo "📝 Buscando arquivos com /backoffice/backoffice/..."

# Find e replace usando sed
# Note: On macOS, sed -i requires an extension argument, like sed -i ''
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "/backoffice/backoffice/" {} \; | while read file; do
  echo "   Corrigindo: $file"
  
  # Substituir todas as ocorrências
  # Using -i '' for macOS compatibility
  sed -i '' 's|/backoffice/backoffice/|/backoffice/|g' "$file"
  
  count=$((count + 1))
done

echo ""
echo "✅ Substituição concluída em $count arquivo(s)"
echo ""

# Verificar se ainda existem ocorrências
echo "🔍 Verificando se ainda restam links duplicados..."
remaining=$(find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "/backoffice/backoffice/" {} \; | wc -l)

if [ "$remaining" -eq 0 ]; then
  echo "✅ Perfeito! Nenhum link duplicado encontrado."
else
  echo "⚠️  Ainda existem $remaining arquivo(s) with links duplicados:"
  find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "/backoffice/backoffice/" {} \;
fi

echo ""
echo "✅ SCRIPT 4 COMPLETO"
echo ""
echo "📝 LINKS CORRIGIDOS CONHECIDOS:"
echo "   /backoffice/backoffice/consultoria/nova     => /backoffice/consultoria/nova"
echo "   /backoffice/backoffice/conteudos/ia         => /backoffice/conteudos/ia"
echo "   /backoffice/backoffice/conteudos/novo       => /backoffice/conteudos/novo"
echo "   /backoffice/backoffice/credito              => /backoffice/credito"
echo ""
echo "🎉 BLOCO 1 COMPLETO!"
