# Relatórios Executivos com IA 📊

Implementei a feature completa de **Relatórios Executivos com IA (Claude)** no Backoffice.

## O que foi construído:
1.  **Frontend**: Página `/backoffice/reports` completa com listagem, dashboard de métricas e botão para gerar novos relatórios.
2.  **Backend API**: Endpoint `/api/reports` para processar as requisições.
3.  **Motor de Inteligência**: `src/lib/reports/generator.ts` que coleta dados REAIS de leads, anúncios e conteúdo, envia para a Anthropic (Claude) e gera insights estratégicos.
4.  **Banco de Dados**: Migration `supabase/migrations/012_executive_reports.sql` pronta.

## ⚠️ Ação Necessária: Rodar a Migration

Como não consegui conectar diretamente ao seu banco de dados via TCP (porta 5432) devido a restrições de rede/DNS no ambiente, você precisa aplicar a migration manualmente para criar a tabela `executive_reports`.

### Opção 1: Via Supabase Dashboard (Recomendado)
1.  Acesse o [Supabase Dashboard](https://supabase.com/dashboard).
2.  Vá em **SQL Editor**.
3.  Cole o conteúdo do arquivo `supabase/migrations/012_executive_reports.sql`.
4.  Clique em **Run**.

### Opção 2: Via Script Local
Se você tiver a variável `DATABASE_URL` correta no seu `.env` e acesso liberado ao banco:
```bash
node scripts/run-reports-migration.js
```

Após isso, o módulo de Relatórios estará **100% funcional**.

## Importante sobre Custos
A geração de relatórios consome créditos da API da Anthropic. O sistema calcula e salva o custo estimado de cada relatório gerado.

**Divirta-se com os insights!**
