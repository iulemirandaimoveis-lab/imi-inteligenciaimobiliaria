-- Amplia o check constraint de 'type' para aceitar 'condominio_fechado',
-- e corrige o Alto Bellevue de 'loteamento' para 'condominio_fechado'.

ALTER TABLE public.developments
  DROP CONSTRAINT developments_type_check;

ALTER TABLE public.developments
  ADD CONSTRAINT developments_type_check CHECK (
    type = ANY (ARRAY[
      'apartment', 'house', 'penthouse', 'studio', 'land', 'commercial',
      'resort', 'villa', 'loft', 'flat', 'duplex', 'triplex', 'cobertura',
      'garden', 'terreno', 'sala', 'loteamento', 'condominio_fechado'
    ])
  );

UPDATE public.developments
SET
  type        = 'condominio_fechado',
  description = 'Condomínio fechado premium em Aloísio Pinto, Garanhuns (PE). 383 lotes de 289 a 693 m² em 16 quadras, com infraestrutura completa, portaria 24h, câmeras de segurança e condições especiais de financiamento.'
WHERE slug = 'alto-bellevue';
