# IMI CADAM — Arquitetura Técnica

**Status**: Fase 1 — Fork técnico  
**Data**: 2026-05-30  
**Licença upstream**: GNU GPL-3.0 (Adam-CAD/CADAM)

---

## Decisão arquitetural

O CADAM (Adam-CAD/CADAM) é usado como **referência de arquitetura e motor conceitual**, não como código copiado. O hardfork IMI-CADAM é uma implementação própria que:

- Mantém separação total de código GPL do core proprietário IMI
- Usa `@anthropic-ai/sdk` já presente no projeto para geração via LLM
- Gera OpenSCAD como IR intermediário (mesma abordagem do CADAM)
- Exporta GLTF simplificado para o IMI Viewer / Pascal

---

## Separação de responsabilidades

```
CADAM engine        → gera geometria (OpenSCAD → GLTF)
Pascal/IMI Viewer   → exibe empreendimento ao cliente
IMI Domain          → dados comerciais canônicos
CRM                 → leads, reservas, corretores
```

**Regra de ouro**: Preço, lead, cliente, corretor e reserva **nunca** entram no motor CAD.

---

## Estrutura de pacotes

```
packages/
  imi-cad-generator/       # Core: Text-to-CAD via Anthropic
  imi-scene-adapter/       # Converte geometria em entidades IMI
  imi-property-metadata/   # Metadata CAD vinculada a imóveis
  imi-domain/              # Tipos comerciais canônicos (isolados)
  imi-crm-adapter/         # CRM read-only stub

templates/
  subdivision/             # Miguel Marques, Alto Bellevue
  building/                # Jazz Boulevard
  floorplan/               # 2br, 3br, studio

src/
  app/api/cadam/           # API routes (autenticadas, rate-limited)
  app/(backoffice)/backoffice/cadam-studio/   # Studio interno
  features/cadam/          # Componentes e hooks
  lib/cadam/               # Sanitização, logs

supabase/migrations/
  20260530_cadam_generation_logs.sql
```

---

## Pipeline de geração

```
Prompt / imagem / parâmetros
  ↓
prompt-sanitizer.ts         (bloqueia code injection, data leaks)
  ↓
imi-cad-generator           (Anthropic claude-opus → OpenSCAD)
  ↓
OpenSCAD (futuro: WASM worker isolado)
  ↓
geometry-cleaner            (futuro: fase 2)
  ↓
GLTF simplificado
  ↓
imi-scene-adapter           (mapeia nodes → propertyId)
  ↓
Pascal/IMI Viewer
```

---

## API Routes

| Endpoint | Método | Acesso |
|---|---|---|
| `/api/cadam/generate` | POST | admin, super_admin, developer_admin |
| `/api/cadam/templates` | GET | autenticado |
| `/api/cadam/scene` | POST | admin, super_admin, developer_admin |

---

## Segurança

- Autenticação Supabase obrigatória em todas as rotas
- RBAC: apenas roles admin podem gerar modelos
- Sanitização de prompt contra code injection e data leaks comerciais
- Validação Zod em todos os inputs
- Logs de auditoria na tabela `cadam_generation_logs`
- OpenSCAD/WASM deve ser isolado em Worker (Fase 2)
- Rate limit via Upstash (a implementar na Fase 2)

---

## Templates IMI

| ID | Nome | Tipo |
|---|---|---|
| `miguel-marques` | Miguel Marques | subdivision |
| `alto-bellevue` | Alto Bellevue | subdivision |
| `jazz-boulevard` | Jazz Boulevard | building |
| `apartment-2br` | Apartamento 2 Quartos | floorplan |
| `apartment-3br` | Apartamento 3 Quartos | floorplan |
| `studio` | Studio | floorplan |

---

## Licença

O CADAM upstream usa **GPL-3.0**. Por isso:

- Hardfork mantido em repositório/módulo separado
- Código GPL não está presente neste repositório
- Modificações ao conceito são implementações originais IMI
- Antes de uso comercial público: validar com jurídico

---

## Roadmap

### Fase 1 — Fork técnico ✅
- [x] Estrutura de pacotes criada
- [x] Types e interfaces definidos
- [x] Templates IMI criados
- [x] API routes com autenticação e sanitização
- [x] CADAM Studio no backoffice
- [x] Migration de logs Supabase
- [x] Documentação técnica

### Fase 2 — OpenSCAD WASM
- [ ] Integrar binários OpenSCAD WASM em worker isolado
- [ ] geometry-cleaner para simplificação de malha
- [ ] Export real para DXF/STL/GLTF
- [ ] Preview 3D com Three.js/R3F no studio

### Fase 3 — Integração com viewer
- [ ] Exportar GLTF simplificado
- [ ] Criar sceneNodeId por lote/unidade
- [ ] Associar propertyId via IMI Admin
- [ ] Enviar cena ao Pascal/IMI Viewer

### Fase 4 — Admin IMI
- [ ] Salvar versões de modelo
- [ ] Aprovação antes de publicar
- [ ] Associar lote/unidade via UI
- [ ] Publicar para viewer público
