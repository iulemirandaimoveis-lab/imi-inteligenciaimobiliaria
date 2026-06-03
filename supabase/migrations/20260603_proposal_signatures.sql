-- Parte 2.3 — Propostas digitais + assinatura eletrônica
-- Reusa a tabela `proposals` (proposta integrada a lote/lead/corretor).
-- Abstração de provedor: Clicksign | DocuSign (escolhido por env).

-- ── 1. Colunas de assinatura na proposta ────────────────────────────────────
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS signature_provider     TEXT
    CHECK (signature_provider IS NULL OR signature_provider IN ('clicksign','docusign')),
  ADD COLUMN IF NOT EXISTS signature_status       TEXT NOT NULL DEFAULT 'nao_enviada'
    CHECK (signature_status IN ('nao_enviada','enviada','assinada','recusada','expirada','cancelada')),
  ADD COLUMN IF NOT EXISTS signature_envelope_id  TEXT,   -- id do documento/envelope no provedor
  ADD COLUMN IF NOT EXISTS signature_request_url  TEXT,   -- link de assinatura do signatário
  ADD COLUMN IF NOT EXISTS signed_pdf_url         TEXT,   -- PDF assinado final
  ADD COLUMN IF NOT EXISTS signature_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signature_signed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signers                JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_proposals_signature_envelope
  ON public.proposals(signature_envelope_id);

-- ── 2. Auditoria de eventos de assinatura (webhooks do provedor) ────────────
CREATE TABLE IF NOT EXISTS public.proposal_signature_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  envelope_id TEXT,
  raw         JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sig_events_proposal ON public.proposal_signature_events(proposal_id);
CREATE INDEX IF NOT EXISTS idx_sig_events_envelope ON public.proposal_signature_events(envelope_id);

-- RLS: trilha imutável; leitura só admin/manager; insert pelo service_role (webhook).
ALTER TABLE public.proposal_signature_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sig_events_read" ON public.proposal_signature_events;
CREATE POLICY "sig_events_read" ON public.proposal_signature_events
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));
-- sem INSERT/UPDATE/DELETE p/ anon/authenticated → webhook usa service_role (bypassa RLS)
