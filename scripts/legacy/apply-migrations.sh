#!/bin/bash

# Script para aplicar migrations do Sistema Comercial IA Atlantis
# Usa o cliente Node.js para conectar diretamente ao banco

echo "🚀 Aplicando Migrations via Node.js Client"
echo "=========================================="
echo ""

node scripts/apply-migrations.js

if [ $? -eq 0 ]; then
    echo ""
    echo "📋 Status: Verifique o log acima para confirmar se todas as tabelas foram criadas."
    echo "   Se houver erros de 'already exists', significa que a tabela já estava lá."
else
    echo "❌ Ocorreu um erro ao executar o script de migrations."
fi
