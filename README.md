# IMI – Inteligência Imobiliária

Plataforma integrada de inteligência imobiliária conectando site institucional e backoffice de gestão.

## 🎯 Visão Geral

Este projeto é uma solução completa que combina:
- **Portal Público (Next.js)**: Vitrine de imóveis de luxo, perfil do corretor e geração de leads.
- **Backoffice (Admin)**: CRM completo para gestão de imóveis, leads e construtoras.
- **Banco de Dados (Supabase)**: Persistência de dados, autenticação e armazenamento de mídia.

## 🚀 Tecnologias

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, Framer Motion
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Data Fetching**: SWR, Server Actions
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## 🛠️ Instalação

1. **Clone o repositório**:
```bash
git clone https://github.com/iminet/dev-imi.git
cd dev-imi
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure as variáveis de ambiente**:
Duplique o arquivo `.env.example` para `.env.local` e preencha com suas credenciais do Supabase.

4. **Execute localmente**:
```bash
npm run dev
```

## 🔐 Acesso ao Backoffice

O sistema possui uma área administrativa protegida.
- URL: `/backoffice`
- Login: Requer conta criada no Supabase (tabela `auth.users`).

### Funcionalidades do Backoffice

1.  **Dashboard**: KPIs em tempo real, gráficos de vendas e leads.
2.  **Gestão de Imóveis**: 
    - CRUD completo de empreendimentos.
    - Upload de mídia (Galeria, Plantas, Vídeos) com Drag & Drop.
    - Gestão de status (Lançamento, Pronto, Em Obras).
3.  **Gestão de Leads (CRM)**:
    - Pipeline estilo Kanban.
    - Timelime de interações.
    - Classificação automática (Hot/Warm/Cold).
4.  **Construtoras**: Cadastro de parceiros e upload de logos.

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (backoffice)/       # Área administrativa (protegida)
│   ├── (website)/          # Site público (SEO otimizado)
│   ├── api/                # Rotas de API
│   └── layout.tsx          # Root Layout
├── components/
│   ├── backoffice/         # UI do Admin (Sidebar, Charts, Forms)
│   ├── website/            # UI do Site Público
│   └── ui/                 # Componentes base (Buttons, Inputs)
├── hooks/                  # Custom Hooks (SWR/Supabase)
├── lib/                    # Configurações (Supabase Client, utils)
└── types/                  # Definições TS
```

## 🔄 Fluxo de Dados

1.  **Imóveis**: Criados no Backoffice -> Salvos no Supabase -> Revalidados via ISR/SSR no Site Público.
2.  **Mídia**: Upload via Backoffice -> Supabase Storage (Buckets: `developments`, `developers`) -> URLs públicas salvas no banco.
3.  **Leads**: Capturados no Site (Formulários) -> Salvos no Supabase -> Visíveis no Kanban do Backoffice.

## 📱 Mobile First

O projeto foi desenhado com prioridade para dispositivos móveis:
- **Site**: navegação otimizada para toque, imagens responsivas.
- **Backoffice**: Gestão completa via celular (Sidebar colapsável, tagueamento fácil).

## 📄 Licença
Propriedade IMI Inteligência Imobiliária.
