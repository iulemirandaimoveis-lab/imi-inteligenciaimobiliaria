-- Fix notifications_type_check constraint to include all types used in the codebase
-- Previously only allowed generic types; add all semantic types used by API routes.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'lead'::text, 'lead_novo'::text, 'lead_atualizado'::text,
    'development'::text, 'imovel_novo'::text, 'imovel_atualizado'::text,
    'evaluation'::text, 'avaliacao_nova'::text, 'avaliacao_atualizada'::text,
    'consultation'::text,
    'system'::text, 'sistema'::text,
    'comment'::text, 'mensagem_nova'::text,
    'deploy'::text,
    'tracking'::text,
    'partnership'::text, 'proposta_nova'::text, 'proposta_atualizada'::text,
    'info'::text,
    'bug_report'::text,
    'agenda_novo'::text, 'agenda_atualizado'::text
  ]));
