# Alto Bellevue — Localização Correta (IMUTÁVEL)

## Endereço
Condomínio Alto Bellevue, Bairro Magano, Garanhuns, PE, Brasil

**Correção 2026-07-07**: o bairro estava incorretamente registrado como "Aloísio Pinto" em
código e banco de dados. Confirmado pelo cliente (dono) que o bairro correto é **Magano**.
Uma sessão anterior (ver `.memory/CHANGE_RECEIPT.md`, entrada "Fix contraste do breadcrumb")
diagnosticou uma reclamação idêntica como bug visual e manteve "Aloísio Pinto" como
invariante — isso estava errado; o dado em si era o problema, não o contraste.

## Link do Google Maps (confirmado pelo cliente — NUNCA ALTERAR)
https://maps.app.goo.gl/mRgnY7oMYvxgiViV6

## Tour Virtual 360° (Kuula)
https://kuula.co/share/collection/7KKb9?logo=1&info=0&logosize=68&fs=1&vr=1&zoom=1&initload=0&thumbs=0&margin=20&alpha=0.86&inst=pt

## Implementação
- `src/app/[lang]/(website)/imoveis/components/DevelopmentLocation.tsx`
  - `DIRECT_MAPS_URLS['alto-bellevue']` → link do Maps acima (prioridade máxima — atualizado pelo cliente em 2026-06-15)
  - `EMBED_PLACE_QUERIES['alto-bellevue']` → query para o mapa embed
- `src/app/[lang]/(website)/imoveis/components/DevelopmentGallery.tsx`
  - Tour kuula.co abre externamente (`shouldOpenTourExternally`)
- `next.config.js` — `frame-src` inclui `kuula.co`

## Regra
NUNCA alterar o link do Maps ou o link do Kuula sem autorização explícita do cliente.
Não geocodificar a partir do banco de dados — usar sempre os overrides hardcoded acima.
