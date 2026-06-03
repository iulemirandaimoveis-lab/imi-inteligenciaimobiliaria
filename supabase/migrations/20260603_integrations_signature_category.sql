-- Parte 2.3 — permite categoria 'signature' na tabela `integrations`
-- (Clicksign/DocuSign configuráveis pelo backoffice). Mantém os status válidos.
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_category_check;
ALTER TABLE public.integrations ADD CONSTRAINT integrations_category_check
  CHECK (category = ANY (ARRAY['ai','marketing','communication','storage','productivity','signature']));
-- status permitido: 'configured','valid','invalid','expired' (inalterado).
