# Alto Bellevue — Localização Correta

**NUNCA alterar estas informações sem confirmar diretamente com o cliente.**

## Link correto do Google Maps

```
https://maps.app.goo.gl/spcmb18mdf1yUWjG6
```

Este link foi confirmado diversas vezes pelo cliente (iule.miranda.imoveis@gmail.com).

## Onde estes valores são usados

Arquivo: `src/app/[lang]/(website)/imoveis/components/DevelopmentLocation.tsx`

```typescript
const DIRECT_MAPS_URLS: Record<string, string> = {
    'alto-bellevue': 'https://maps.app.goo.gl/spcmb18mdf1yUWjG6',
};

const EMBED_PLACE_QUERIES: Record<string, string> = {
    'alto-bellevue': 'Condomínio Alto Bellevue, Garanhuns, PE, Brasil',
};
```

- `DIRECT_MAPS_URLS['alto-bellevue']` → botão "Abrir no Maps" (link direto fornecido pelo cliente)
- `EMBED_PLACE_QUERIES['alto-bellevue']` → iframe do mapa embutido (busca por nome do empreendimento)

## O que NÃO fazer

- Não usar coordenadas brutas do banco de dados para alto-bellevue (estavam incorretas)
- Não remover as entradas de `DIRECT_MAPS_URLS` e `EMBED_PLACE_QUERIES`
- Não colocar alto-bellevue de volta em `COORD_OVERRIDES` com coordenadas genéricas de Garanhuns

## Histórico

O cliente reclamou repetidamente que a localização mostrada estava errada.
A causa era o `COORD_OVERRIDES` apontando para o centro de Garanhuns (`lat: -8.8894, lng: -36.4923`)
em vez do endereço correto do condomínio.

Solução implementada em 2026-06-14:
- Removido alto-bellevue de `COORD_OVERRIDES`
- Adicionado `DIRECT_MAPS_URLS` com o link exato fornecido pelo cliente
- Adicionado `EMBED_PLACE_QUERIES` para o mapa embutido usar busca por nome
