# Política de Regressão de UI — Regra Absoluta

**NUNCA suba uma atualização que quebre o que já existe. Evoluir, jamais regredir.**

---

## Regra Fundamental

Antes de qualquer alteração de layout/estilo, confirmar o estado atual com:
1. Leitura do arquivo alvo
2. Identificação do comportamento existente que deve ser preservado
3. Alteração cirúrgica — só o necessário

---

## Checklist Obrigatório Antes de Commitar UI

### Desktop (≥ 1024px)
- [ ] Sidebar/aside visível e alinhado corretamente
- [ ] Cards de preço, corretor e CTA renderizando sem overflow
- [ ] Sticky behavior idêntico ao estado anterior (ou explicitamente alterado com aprovação)
- [ ] Layout de grid `lg:col-span-8 / lg:col-span-4` preservado

### Mobile (< 1024px)
- [ ] Seção `section#corretor.lg:hidden` com `grid-cols-2` funcionando
- [ ] Cards compactos lado a lado sem corte de conteúdo
- [ ] `MobileStickyBar` visível e funcional
- [ ] Todos os textos cabeando sem overflow

### Fullscreen / Modais
- [ ] Botões na barra de filtros visíveis (nenhum cortado pela borda)
- [ ] Sheets e modais abrindo dentro do portal correto

---

## Padrão de Sticky no Sidebar Desktop

O `position: sticky` no sidebar **deve ficar no próprio componente** (`DevelopmentCTA`),
**não no `<aside>`**. Isso porque:
- O `<aside>` tem `align-self: stretch` por padrão (preenche a altura da grid row)
- Aplicar `self-start` no aside sem `lg:` afeta todos os breakpoints de forma inesperada
- A regra `self-start` sem prefixo responsivo pode criar comportamentos imprevisíveis

```tsx
// CORRETO — sticky no componente interno
<aside className="hidden lg:block lg:col-span-4 space-y-6">
    <RealtorCard ... />                      {/* não sticky, rola junto */}
    <DevelopmentCTA ... />                   {/* sticky via wrapper interno */}
</aside>

// ERRADO — sticky no aside quebra o layout
<aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-28 self-start space-y-6">
```

---

## Alterações de CSS Grid — Regras

- `items-stretch` no mobile grid só adicionar se ambos os filhos tiverem `h-full` explícito
- Nunca adicionar `self-start` sem prefixo `lg:` num elemento de aside/sidebar
- Qualquer mudança de `position: sticky` deve ser testada em desktop (scroll real)

---

## Alto Bellevue — Itens Imutáveis

Ver `.claude/ALTO_BELLEVUE_LOCATION.md`. **NUNCA alterar** sem autorização explícita do cliente:
- Link do Google Maps
- URL do tour Kuula

---

**Last Updated**: 2026-06-15
