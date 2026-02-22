-- ============================================================
-- B12 — MIGRATION: Tabela contratos + Integrações
-- ============================================================

-- Habilita extensão para UUID se não existir
create extension if not exists "uuid-ossp";

-- ── Tabela principal de contratos ─────────────────────────────
create table if not exists public.contratos (
    id              uuid primary key default uuid_generate_v4(),
    numero          text not null unique,

    -- Modelo
    modelo_id       text not null,
    modelo_nome     text not null,
    categoria       text not null,

    -- Estado
    status          text not null default 'rascunho'
                    check (status in ('rascunho','gerado','aguardando_assinatura',
                                      'assinado_parcial','assinado','cancelado','expirado')),
    idioma          text not null default 'pt'
                    check (idioma in ('pt','en','es','ar','ja')),

    -- Partes (JSON)
    contratante     jsonb not null default '{}'::jsonb,
    contratado      jsonb not null default '{}'::jsonb,

    -- Dados do modelo
    dados_contrato  jsonb not null default '{}'::jsonb,

    -- Conteúdo gerado
    conteudo_markdown text,

    -- Arquivos
    pdf_url         text,
    docx_url        text,
    drive_url       text,        -- Google Drive (futuro)

    -- Responsável
    criado_por      text,
    criado_por_nome text,

    -- ClickSign / assinatura
    plataforma_assinatura text default 'sem_assinatura',
    clicksign_key   text,
    clicksign_status text,
    docusign_envelope_id text,
    signatarios     jsonb default '[]'::jsonb,

    -- Metadados
    notas           text,
    tags            text[],

    -- Timestamps
    criado_em       timestamptz not null default now(),
    atualizado_em   timestamptz not null default now()
);

-- ── Tabela de configurações de integrações (B12) ────────────
CREATE TABLE IF NOT EXISTS public.integracoes_config (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id  TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'nao_configurado',
  config_encrypted JSONB DEFAULT '{}',  -- valores criptografados
  atualizado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_por  TEXT
);

-- ── Índices ───────────────────────────────────────────────────
create index if not exists idx_contratos_status    on public.contratos (status);
create index if not exists idx_contratos_categoria on public.contratos (categoria);
create index if not exists idx_contratos_criado_por on public.contratos (criado_por);
create index if not exists idx_contratos_criado_em on public.contratos (criado_em desc);
create index if not exists idx_contratos_numero    on public.contratos (numero);

-- ── Trigger: atualiza atualizado_em automaticamente ──────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.atualizado_em = now();
    return new;
end;
$$;

drop trigger if exists trg_contratos_updated_at on public.contratos;
create trigger trg_contratos_updated_at
    before update on public.contratos
    for each row execute function public.set_updated_at();

-- ── RLS (Row Level Security) ──────────────────────────────────
alter table public.contratos enable row level security;
alter table public.integracoes_config enable row level security;

-- Contratos Policies
create policy "Usuários autenticados leem contratos"
    on public.contratos for select to authenticated using (true);

create policy "Usuários autenticados inserem contratos"
    on public.contratos for insert to authenticated with check (true);

create policy "Usuários atualizam contratos"
    on public.contratos for update to authenticated using (true);

create policy "Service role full access"
    on public.contratos for all to service_role using (true) with check (true);

-- Integrações Config Policies
CREATE POLICY "integracoes_read" ON public.integracoes_config
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "integracoes_write" ON public.integracoes_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Storage Bucket: contratos ─────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'contratos',
    'contratos',
    true,
    52428800,
    array[
        'text/html',
        'text/markdown',
        'text/plain',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
on conflict (id) do nothing;

-- RLS no bucket
create policy "Leitura pública de contratos" on storage.objects
    for select using (bucket_id = 'contratos');

create policy "Upload autenticado de contratos" on storage.objects
    for insert to authenticated, service_role
    with check (bucket_id = 'contratos');

create policy "Service role gerencia storage contratos" on storage.objects
    for all to service_role
    using (bucket_id = 'contratos')
    with check (bucket_id = 'contratos');

-- ── Dados de exemplo ──────────────────────────────────────────
insert into public.contratos (
    numero, modelo_id, modelo_nome, categoria, status, idioma,
    contratante, contratado, dados_contrato, criado_por_nome
) values (
    'IMI-2026-CTR-DEMO',
    'servicos-avaliacao',
    'Contrato de Prestação de Serviços de Avaliação',
    'avaliacao',
    'assinado',
    'pt',
    '{"nome":"Banco Bradesco S.A.","cpf_cnpj":"60.746.948/0001-12","tipo":"pessoa_juridica","email":"juridico@bradesco.com.br","razao_social":"Banco Bradesco"}'::jsonb,
    '{"nome":"Iule Miranda","cpf_cnpj":"000.000.000-00","tipo":"pessoa_fisica","email":"iulemirandaimoveis@gmail.com","cargo_representante":"CRECI 17933"}'::jsonb,
    '{"honorarios":1500,"prazo_entrega_dias":10,"finalidade_avaliacao":"Financiamento / SFH"}'::jsonb,
    'Iule Miranda'
) on conflict (numero) do nothing;
