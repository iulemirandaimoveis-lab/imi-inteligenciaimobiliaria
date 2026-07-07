-- Corrige o bairro do Alto Bellevue: estava incorretamente "Aloísio Pinto",
-- o correto (confirmado pelo dono) é "Magano". Uma sessão anterior tratou uma
-- reclamação idêntica como bug de contraste no breadcrumb e manteve o dado
-- errado como "invariante" — o problema sempre foi o dado, não o CSS.
UPDATE public.developments
SET
  neighborhood = 'Magano',
  description = 'Condomínio fechado premium em Magano, Garanhuns (PE). 383 lotes de 289 a 693 m² em 16 quadras, com infraestrutura completa, portaria 24h, câmeras de segurança e condições especiais de financiamento.'
WHERE slug = 'alto-bellevue';
