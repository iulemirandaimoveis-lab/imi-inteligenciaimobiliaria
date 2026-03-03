#!/bin/bash
# ============================================
# BLOCO 1 - SCRIPT 1: MOVER ESTRUTURA DE PASTAS
# ⚠️ EXECUTAR EXATAMENTE - NÃO MODIFICAR
# ============================================

# OBJETIVO: Criar segmento /backoffice/ na URL
# ANTES: src/app/(backoffice)/dashboard/ => URL /dashboard ❌
# DEPOIS: src/app/(backoffice)/backoffice/dashboard/ => URL /backoffice/dashboard ✅

echo "🚀 Iniciando reorganização da estrutura de pastas..."

# Navegar para o diretório raiz do projeto
cd /Users/lailamiranda/dev-imi

# Verificar se estamos no diretório correto
if [ ! -d "src/app/(backoffice)" ]; then
  echo "❌ ERRO: Diretório src/app/(backoffice) não encontrado!"
  echo "Execute este script da raiz do projeto IMI Atlantis"
  exit 1
fi

# Criar diretório backoffice dentro do route group
echo "📁 Criando src/app/(backoffice)/backoffice/..."
mkdir -p "src/app/(backoffice)/backoffice"

# Lista de diretórios a mover (58 pastas)
DIRS_TO_MOVE=(
  "agenda"
  "automacoes"
  "avaliacoes"
  "campanhas"
  "construtoras"
  "consultoria"
  "consultorias"
  "conteudo"
  "conteudos"
  "credito"
  "dashboard"
  "equipe"
  "imoveis"
  "integracoes"
  "leads"
  "notificacoes"
  "playbooks"
  "relatorios"
  "settings"
  "tracking"
  "whatsapp"
)

# Mover cada diretório
for dir in "${DIRS_TO_MOVE[@]}"; do
  if [ -d "src/app/(backoffice)/$dir" ]; then
    echo "📦 Movendo $dir..."
    mv "src/app/(backoffice)/$dir" "src/app/(backoffice)/backoffice/$dir"
  else
    echo "⚠️  $dir não encontrado, pulando..."
  fi
done

# Mover page.tsx (redirect root) para dentro do backoffice
if [ -f "src/app/(backoffice)/page.tsx" ]; then
  echo "📄 Movendo page.tsx (redirect)..."
  mv "src/app/(backoffice)/page.tsx" "src/app/(backoffice)/backoffice/page.tsx"
fi

# Verificação final
echo ""
echo "✅ Estrutura reorganizada!"
echo ""
echo "📊 Verificando resultados..."
echo "Diretórios em src/app/(backoffice)/:"
ls -la "src/app/(backoffice)/"
echo ""
echo "Diretórios em src/app/(backoffice)/backoffice/:"
ls -la "src/app/(backoffice)/backoffice/"
echo ""
echo "✅ SCRIPT 1 COMPLETO"
echo ""
echo "📝 PRÓXIMO PASSO: Executar SCRIPT 2 (corrigir DesktopSidebar.tsx)"
