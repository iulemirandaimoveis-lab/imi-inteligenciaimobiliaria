'use client'

import { useState, useEffect, useCallback } from "react"

const CHECKLIST = [
  {
    group: "P0 — BLOCKERS CRÍTICOS",
    color: "#EF4444",
    description: "Sem estes, ninguém consegue usar a plataforma",
    items: [
      { id: "b1-sql", label: "Executar SQL get_or_create_dm no Supabase", detail: "SQL Editor → colar o conteúdo do 20260330_connect_dm_function.sql → Run", module: "Connect" },
      { id: "b2-fk", label: "Executar SQL da FK chat_members_user_profile_fkey", detail: "Está no mesmo arquivo SQL. Limpa órfãos e cria a FK nomeada", module: "Connect" },
      { id: "b1-verify", label: "Verificar que função e FK foram criadas", detail: "Rodar as queries de verificação no final do SQL (devem retornar 1 linha cada)", module: "Connect" },
      { id: "b3-fix", label: "Fix busca de DM existente no connect/page.tsx", detail: "Linha ~237: trocar ch.name?.includes(broker.name) por ch.members?.some(m => m.user_id === selectedBrokerId)", module: "Connect" },
      { id: "b3-deploy", label: "Commit + deploy das alterações do Connect", detail: "git add → commit → push → verificar build no Vercel", module: "Deploy" },
    ],
  },
  {
    group: "CONNECT — Teste funcional",
    color: "#F59E0B",
    description: "Validar que DM e canais funcionam end-to-end",
    items: [
      { id: "conn-open", label: "Abrir /backoffice/connect — página carrega sem erros", detail: "Console do browser: zero erros vermelhos", module: "Connect" },
      { id: "conn-plus", label: "Clicar no '+' — modal de nova conversa abre", detail: "Deve mostrar opções Direct e Team, lista de corretores", module: "Connect" },
      { id: "conn-brokers", label: "Lista de corretores carrega (inclui Valderi)", detail: "Se vazio: verificar tabela profiles no Supabase", module: "Connect" },
      { id: "conn-dm-create", label: "Selecionar Valderi → canal DM criado", detail: "Canal aparece na lista com nome 'Iule e Valderi'", module: "Connect" },
      { id: "conn-send", label: "Enviar mensagem 'Olá, testando' → aparece no chat", detail: "Mensagem renderiza como bolha do lado direito (isOwn)", module: "Connect" },
      { id: "conn-receive", label: "Login como Valderi → canal visível + mensagem do Iule", detail: "Abrir em aba anônima ou outro browser", module: "Connect" },
      { id: "conn-realtime", label: "Valderi responde → Iule vê em TEMPO REAL sem refresh", detail: "Se não aparece: verificar Realtime habilitado na tabela chat_messages", module: "Connect" },
      { id: "conn-reopen", label: "Fechar e reabrir Connect → conversa persiste na lista", detail: "Deve manter histórico de mensagens", module: "Connect" },
      { id: "conn-team", label: "Criar canal Team '#vendas-boa-viagem' → funciona", detail: "Alternar para modo Team no modal, dar nome, criar", module: "Connect" },
      { id: "conn-mobile", label: "Testar Connect em 390px (mobile) — lista + chat", detail: "View list → tap conversa → chat abre → enviar msg → voltar", module: "Connect" },
    ],
  },
  {
    group: "CADASTRO DE IMÓVEL — Venda",
    color: "#C9A84C",
    description: "Cadastrar o imóvel real do Iule end-to-end",
    items: [
      { id: "imovel-novo-open", label: "/backoffice/imoveis/novo abre sem erros (mobile 390px)", detail: "Step 1 visível com campos Nome, Tipo, Condição", module: "Imóveis" },
      { id: "imovel-step1", label: "Step 1: Nome + Tipo (Apartamento) + Condição (Pronto)", detail: "Selecionar tipo nos cards com ícone, condição no dropdown", module: "Imóveis" },
      { id: "imovel-step2-cep", label: "Step 2: CEP 51021350 → auto-preenche Boa Viagem, Recife, PE", detail: "Chama API ViaCEP. Se não preenche: verificar fetch no handleCepChange", module: "Imóveis" },
      { id: "imovel-step2-addr", label: "Step 2: Endereço, número, complemento preenchidos", detail: "Rua Carlos Pereira Falcão, 500, Apt 902", module: "Imóveis" },
      { id: "imovel-step3-specs", label: "Step 3: Área=120, Quartos=3, Banheiros=2, Vagas=2", detail: "Campos numéricos aceitam valores", module: "Imóveis" },
      { id: "imovel-step3-price", label: "Step 3: Preço mín=850000, Preço máx=900000", detail: "Preço/m² deve ser calculado automaticamente se implementado", module: "Imóveis" },
      { id: "imovel-step3-feat", label: "Step 3: Features selecionadas (Piscina, Portaria 24h, etc.)", detail: "Tags clicáveis com ícones, estado toggle", module: "Imóveis" },
      { id: "imovel-step3-desc", label: "Step 3: Descrição preenchida", detail: "Textarea com texto descritivo do imóvel", module: "Imóveis" },
      { id: "imovel-step4-photos", label: "Step 4: Upload de 3+ fotos funciona", detail: "Drag-and-drop ou input file. Progress bar visível", module: "Imóveis" },
      { id: "imovel-save", label: "Clicar 'Publicar Imóvel' → toast de sucesso", detail: "Sem erros no console. Redireciona para listagem", module: "Imóveis" },
      { id: "imovel-list", label: "Imóvel aparece na listagem /backoffice/imoveis", detail: "Com nome, preço, foto, bairro corretos", module: "Imóveis" },
      { id: "imovel-detail-mobile", label: "Detalhe do imóvel em mobile mostra TUDO", detail: "4 tabs (Visão Geral, Análise, Analytics, Mais) — todas com conteúdo", module: "Imóveis" },
      { id: "imovel-detail-score", label: "IMI Score + barras de breakdown visíveis", detail: "Score numérico + 5 barras coloridas (Yield, Mercado, Liquidez, etc.)", module: "Imóveis" },
      { id: "imovel-detail-share", label: "Tab 'Mais' → Compartilhar (Link, WhatsApp, LinkedIn, Instagram)", detail: "Todos os 4 botões funcionam (copiar link, abrir wa.me, etc.)", module: "Imóveis" },
      { id: "imovel-website", label: "Imóvel visível no site público", detail: "Acessar iulemirandaimoveis.com.br/imoveis/[slug] → foto, preço, dados", module: "Website" },
    ],
  },
  {
    group: "CADASTRO DE IMÓVEL — Aluguel",
    color: "#8B5CF6",
    description: "Validar módulo Rentals",
    items: [
      { id: "rental-novo-open", label: "/backoffice/rentals/novo abre sem erros (mobile)", detail: "Form com campos de tipo, modo de locação, preço", module: "Rentals" },
      { id: "rental-fill", label: "Preencher dados completos de aluguel", detail: "Tipo, modo (temporada/tradicional), preço, quartos, endereço", module: "Rentals" },
      { id: "rental-save", label: "Salvar → toast de sucesso", detail: "Sem erros. Redireciona para listagem", module: "Rentals" },
      { id: "rental-list", label: "Imóvel aparece em /backoffice/rentals", detail: "Com dados corretos", module: "Rentals" },
    ],
  },
  {
    group: "AVALIAÇÃO PTAM",
    color: "#22C55E",
    description: "Gerar avaliação com método comparativo direto",
    items: [
      { id: "aval-nova-open", label: "/backoffice/avaliacoes/nova abre sem erros", detail: "Wizard de 6 steps visível", module: "Avaliações" },
      { id: "aval-step1", label: "Step 1: Selecionar imóvel avaliando do banco", detail: "Buscar pelo nome do imóvel cadastrado", module: "Avaliações" },
      { id: "aval-step2", label: "Step 2: Finalidade=Venda, Solicitante preenchido", detail: "Dropdown com opções: Venda, Financiamento, Judicial, etc.", module: "Avaliações" },
      { id: "aval-step3", label: "Step 3: Cadastrar 3+ comparáveis com dados reais", detail: "Buscar imóveis em OLX/ZAP de Boa Viagem. Preencher endereço, área, preço, fonte", module: "Avaliações" },
      { id: "aval-step4", label: "Step 4: Ajustar fatores de homogeneização", detail: "Fator oferta=0.90, localização, idade, pavimento, vagas", module: "Avaliações" },
      { id: "aval-step5-stats", label: "Step 5: Estatísticas calculadas corretamente", detail: "Média, mediana, desvio padrão, coef. variação visíveis", module: "Avaliações" },
      { id: "aval-step5-grade", label: "Step 5: Grau de fundamentação I/II/III mostrado", detail: "Grau III se ≥6 comparáveis + CV ≤25%", module: "Avaliações" },
      { id: "aval-step6-preview", label: "Step 6: Preview do PTAM com brandkit IMI", detail: "Playfair Display, cores navy/gold, estrutura COFECI", module: "Avaliações" },
      { id: "aval-export-html", label: "Exportar HTML → abre em nova aba", detail: "HTML self-contained com CSS inline, imprimível via Ctrl+P", module: "Avaliações" },
      { id: "aval-save-pdf", label: "Ctrl+P no HTML → Salvar como PDF funciona", detail: "Layout limpo, sem cortes, brandkit preservado", module: "Avaliações" },
    ],
  },
  {
    group: "EQUIPE & USUÁRIOS",
    color: "#3B82F6",
    description: "Cadastrar e gerir corretores",
    items: [
      { id: "env-service-key", label: "SUPABASE_SERVICE_ROLE_KEY configurada no Vercel", detail: "Vercel Dashboard → Settings → Environment Variables", module: "Infra" },
      { id: "user-novo-open", label: "/backoffice/settings/usuarios/novo abre", detail: "Form com nome, email, role", module: "Usuários" },
      { id: "user-create", label: "Criar novo corretor → toast de sucesso", detail: "Email + nome + role=EDITOR (ou ADMIN)", module: "Usuários" },
      { id: "user-list", label: "Novo usuário aparece em /backoffice/settings/usuarios", detail: "Com nome, email, role corretos", module: "Usuários" },
      { id: "user-login", label: "Novo corretor consegue fazer login", detail: "Usando email + senha temporária ou link de reset", module: "Usuários" },
      { id: "user-access", label: "Novo corretor acessa o backoffice e vê o dashboard", detail: "Sem erros de permissão ou tela em branco", module: "Usuários" },
      { id: "equipe-list", label: "/backoffice/equipe lista todos os corretores", detail: "Com status, role, dados de contato", module: "Equipe" },
    ],
  },
  {
    group: "CONTEÚDO & PUBLICAÇÃO",
    color: "#EC4899",
    description: "Criar e agendar conteúdo do backoffice",
    items: [
      { id: "content-criador", label: "/backoffice/conteudo/criador funciona", detail: "Gera texto via IA a partir de prompt sobre imóvel", module: "Conteúdo" },
      { id: "content-novo", label: "/backoffice/conteudo/novo → form de publicação completo", detail: "Título, texto, imagem, redes sociais selecionáveis", module: "Conteúdo" },
      { id: "content-calendar", label: "/backoffice/conteudo/calendario exibe posts agendados", detail: "Visualização por mês/semana com posts posicionados", module: "Conteúdo" },
      { id: "content-save", label: "Criar conteúdo → salva no banco → aparece no calendário", detail: "Persistência end-to-end verificada", module: "Conteúdo" },
    ],
  },
  {
    group: "PARCERIAS",
    color: "#F97316",
    description: "Depende do Connect funcional (P0)",
    items: [
      { id: "parcerias-open", label: "/backoffice/parcerias abre sem erros", detail: "Lista de parcerias (pode estar vazia)", module: "Parcerias" },
      { id: "parcerias-create", label: "Criar proposta de parceria para um imóvel", detail: "Selecionar imóvel + corretor parceiro + split de comissão", module: "Parcerias" },
      { id: "parcerias-notify", label: "Corretor parceiro recebe notificação/visualiza a proposta", detail: "Via Connect ou via listagem de parcerias do parceiro", module: "Parcerias" },
      { id: "parcerias-accept", label: "Parceiro aceita → deal room criado no Connect", detail: "Canal tipo 'deal_room' aparece para ambos", module: "Parcerias" },
    ],
  },
  {
    group: "MOBILE UX — Auditoria global",
    color: "#6B7280",
    description: "Verificar responsividade em 390px",
    items: [
      { id: "mob-dashboard", label: "Dashboard em 390px — KPIs legíveis, sem overflow", detail: "Cards não cortam, gráficos redimensionam", module: "Mobile" },
      { id: "mob-leads", label: "Leads em 390px — lista ou kanban funcional", detail: "Se kanban: scroll horizontal entre colunas", module: "Mobile" },
      { id: "mob-agenda", label: "Agenda em 390px — calendário navegável", detail: "Tap em data → ver eventos, criar novo", module: "Mobile" },
      { id: "mob-settings", label: "Settings em 390px — forms não quebram", detail: "Inputs full-width, botões acessíveis", module: "Mobile" },
      { id: "mob-zero-scroll-x", label: "NENHUMA página tem scroll horizontal indesejado", detail: "Verificar: document.documentElement.scrollWidth > window.innerWidth", module: "Mobile" },
      { id: "mob-buttons-44", label: "Todos os botões ≥ 44px de touch target", detail: "Especialmente na bottom nav e nos forms", module: "Mobile" },
      { id: "mob-nav", label: "Bottom nav visível e funcional em todas as páginas", detail: "5 itens: Hoje, Imóveis, Mais, Leads, Connect", module: "Mobile" },
    ],
  },
  {
    group: "PERFORMANCE & INFRA",
    color: "#64748B",
    description: "Velocidade e estabilidade",
    items: [
      { id: "perf-build", label: "next build completa sem erros", detail: "Zero warnings críticos no build log", module: "Infra" },
      { id: "perf-lcp", label: "LCP < 3s no Lighthouse mobile (página principal)", detail: "Chrome DevTools → Lighthouse → Mobile → Performance", module: "Performance" },
      { id: "perf-no-console-errors", label: "Zero console.error em páginas principais", detail: "Dashboard, Imóveis, Connect, Avaliações — verificar console", module: "Infra" },
      { id: "mapa-funciona", label: "Mapa de imóveis renderiza com pins", detail: "Se não: verificar API key ou migrar para Leaflet/OSM", module: "Imóveis" },
    ],
  },
]

const STORAGE_KEY = "imi-launch-checklist-v2"

function getStoredState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export default function IMIChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all")
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setChecked(getStoredState())
    setLoaded(true)
  }, [])

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    if (confirm("Resetar todo o progresso? Esta ação não pode ser desfeita.")) {
      setChecked({})
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const totalItems = CHECKLIST.reduce((s, g) => s + g.items.length, 0)
  const totalChecked = Object.values(checked).filter(Boolean).length
  const pct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0

  const filteredGroups = CHECKLIST.map((g) => {
    const items =
      filter === "all" ? g.items :
      filter === "pending" ? g.items.filter((i) => !checked[i.id]) :
      g.items.filter((i) => checked[i.id])
    return { ...g, items }
  }).filter((g) => g.items.length > 0)

  if (!loaded) return null

  return (
    <div style={{ minHeight: "100vh", background: "#050B14", color: "#E8E6E1", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,164,74,0.2); border-radius: 8px; }
        .imi-check-item { transition: all 150ms ease; cursor: pointer; }
        .imi-check-item:hover { background: rgba(200,164,74,0.04) !important; }
        .imi-check-item:active { transform: scale(0.995); }
        .filter-btn { transition: all 150ms ease; cursor: pointer; border: none; font-family: inherit; }
        .filter-btn:hover { opacity: 0.9; }
        .group-header { cursor: pointer; transition: all 150ms ease; }
        .group-header:hover { background: rgba(200,164,74,0.03); }
        @keyframes progressGrow { from { width: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 300ms ease both; }
      `}</style>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(5,11,20,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(200,164,74,0.12)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#C9A84C" }}>IMI</span>
                <span style={{ width: 1, height: 16, background: "rgba(200,164,74,0.3)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(200,164,74,0.7)", textTransform: "uppercase" }}>Launch Checklist</span>
              </div>
              <p style={{ fontSize: 12, color: "#8B8D90" }}>
                {totalChecked}/{totalItems} concluídos · {pct}%
              </p>
            </div>
            <button onClick={resetAll} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "6px 12px", fontSize: 11, color: "#EF4444", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              Resetar
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: "rgba(200,164,74,0.08)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 8,
              background: pct === 100 ? "linear-gradient(90deg, #22C55E, #16A34A)" : "linear-gradient(90deg, #C9A84C, #D4B96A)",
              width: `${pct}%`, transition: "width 500ms cubic-bezier(0.16,1,0.3,1)",
              animation: "progressGrow 800ms ease",
            }} />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {([
              { key: "all" as const, label: `Todos (${totalItems})` },
              { key: "pending" as const, label: `Pendentes (${totalItems - totalChecked})` },
              { key: "done" as const, label: `Concluídos (${totalChecked})` },
            ]).map((f) => (
              <button key={f.key} className="filter-btn" onClick={() => setFilter(f.key)} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: filter === f.key ? "rgba(200,164,74,0.15)" : "transparent",
                color: filter === f.key ? "#C9A84C" : "#8B8D90",
                border: filter === f.key ? "1px solid rgba(200,164,74,0.3)" : "1px solid transparent",
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 20px 100px" }}>
        {pct === 100 && (
          <div className="fade-in" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🚀</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#22C55E" }}>Plataforma pronta para lançamento</div>
            <div style={{ fontSize: 12, color: "#8B8D90", marginTop: 4 }}>Todos os {totalItems} itens foram validados</div>
          </div>
        )}

        {filteredGroups.map((group, gi) => {
          const groupChecked = group.items.filter((i) => checked[i.id]).length
          const groupTotal = CHECKLIST.find(g => g.group === group.group)?.items.length || group.items.length
          const groupPct = Math.round((groupChecked / groupTotal) * 100)
          const isExpanded = expandedGroup === null || expandedGroup === gi

          return (
            <div key={group.group} className="fade-in" style={{ marginBottom: 16, animationDelay: `${gi * 40}ms` }}>
              {/* Group header */}
              <div className="group-header" onClick={() => setExpandedGroup(isExpanded && expandedGroup !== null ? null : gi)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                borderRadius: isExpanded ? "10px 10px 0 0" : "10px",
                background: "rgba(15,31,53,0.6)", border: "1px solid rgba(200,164,74,0.08)",
                borderBottom: isExpanded ? "none" : undefined,
              }}>
                <div style={{ width: 4, height: 28, borderRadius: 4, background: group.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#E8E6E1" }}>{group.group}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: groupPct === 100 ? "#22C55E" : group.color }}>
                      {groupChecked}/{groupTotal}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#8B8D90", marginTop: 2 }}>{group.description}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms ease", flexShrink: 0 }}>
                  <path d="M4 6l4 4 4-4" stroke="#8B8D90" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Items */}
              {isExpanded && (
                <div style={{ background: "rgba(10,22,40,0.4)", border: "1px solid rgba(200,164,74,0.08)", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                  {group.items.map((item, ii) => {
                    const done = !!checked[item.id]
                    return (
                      <div key={item.id} className="imi-check-item" onClick={() => toggle(item.id)} style={{
                        display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
                        borderBottom: ii < group.items.length - 1 ? "1px solid rgba(200,164,74,0.04)" : "none",
                        opacity: done && filter === "all" ? 0.55 : 1,
                      }}>
                        {/* Checkbox */}
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                          border: done ? "2px solid #22C55E" : "2px solid rgba(200,164,74,0.25)",
                          background: done ? "rgba(34,197,94,0.12)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 200ms ease",
                        }}>
                          {done && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: done ? "#8B8D90" : "#E8E6E1",
                            textDecoration: done ? "line-through" : "none",
                            transition: "all 200ms ease",
                          }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3, lineHeight: 1.4 }}>
                            {item.detail}
                          </div>
                        </div>

                        {/* Module badge */}
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                          padding: "3px 7px", borderRadius: 4, flexShrink: 0, marginTop: 2,
                          background: "rgba(200,164,74,0.06)", color: "rgba(200,164,74,0.6)",
                          border: "1px solid rgba(200,164,74,0.08)", textTransform: "uppercase",
                        }}>
                          {item.module}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
