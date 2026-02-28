'use client'

import { useState } from 'react'
import { Lightbulb, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Scale, Users, Building2, CreditCard, Briefcase } from 'lucide-react'

// ── Playbooks data ────────────────────────────────────────────
const PLAYBOOKS = [
  {
    id: 'avaliacao_residencial',
    icon: Scale,
    titulo: 'Avaliação Residencial — Método Comparativo',
    categoria: 'Avaliações',
    tempo_estimado: '3-5 dias úteis',
    norma: 'NBR 14653-2',
    etapas: [
      { id: 1, titulo: 'Recebimento e triagem do pedido', desc: 'Verificar solicitante, finalidade, tipo de imóvel e prazo. Confirmar honorários e emitir proposta.' },
      { id: 2, titulo: 'Coleta de documentação', desc: 'Matrícula atualizada (RI Digital), IPTU, planta baixa, habite-se, fotos do imóvel (mínimo 8).' },
      { id: 3, titulo: 'Vistoria técnica', desc: 'Inspeção presencial: padrão construtivo, estado de conservação, benfeitorias, infraestrutura do entorno.' },
      { id: 4, titulo: 'Pesquisa de mercado', desc: 'Mínimo 5 amostras comparáveis (Grau III). Fontes: ZAP, VivaReal, ONR, RI Digital. CV < 30%.' },
      { id: 5, titulo: 'Homogeneização', desc: 'Aplicar fatores de homogeneização: área, padrão, conservação, andar, vagas. Calcular valor unitário homogeneizado.' },
      { id: 6, titulo: 'Saneamento estatístico', desc: 'Verificar CV, calcular intervalo de confiança 80%. Validar grau de fundamentação e precisão.' },
      { id: 7, titulo: 'Elaboração do laudo', desc: 'Redigir PTAM ou Laudo de Avaliação conforme NBR. Inserir memorial descritivo, fotos, planilha de comparáveis.' },
      { id: 8, titulo: 'Revisão e assinatura', desc: 'Revisão técnica, assinatura com CNAI, carimbo CRECI. Emitir ART se necessário (CREA/PE).' },
      { id: 9, titulo: 'Entrega e faturamento', desc: 'Enviar laudo PDF ao solicitante. Emitir NFS-e. Atualizar status no sistema IMI.' },
    ]
  },
  {
    id: 'qualificacao_lead',
    icon: Users,
    titulo: 'Qualificação e Conversão de Lead',
    categoria: 'CRM',
    tempo_estimado: '1-3 dias',
    norma: null,
    etapas: [
      { id: 1, titulo: 'Recepção do lead', desc: 'Registrar origem (site, WhatsApp, Instagram, indicação). Preencher dados básicos no sistema.' },
      { id: 2, titulo: 'Primeiro contato (< 2h)', desc: 'WhatsApp ou ligação em até 2 horas. Apresentar IMI, identificar necessidade imediata.' },
      { id: 3, titulo: 'Qualificação BANT', desc: 'Budget (orçamento disponível), Authority (quem decide), Need (urgência real), Timeline (prazo de decisão).' },
      { id: 4, titulo: 'Diagnóstico imobiliário', desc: 'Entender tipo de imóvel, finalidade (moradia/investimento), bairro preferido, financiamento ou à vista.' },
      { id: 5, titulo: 'Proposta personalizada', desc: 'Enviar proposta com serviço adequado: avaliação, consultoria, intermediação ou crédito.' },
      { id: 6, titulo: 'Follow-up estruturado', desc: 'D+1: WhatsApp. D+3: e-mail com material. D+7: ligação de decisão. Máximo 4 tentativas.' },
      { id: 7, titulo: 'Conversão ou descarte', desc: 'Fechar proposta ou marcar lead como inativo com motivo registrado no sistema.' },
    ]
  },
  {
    id: 'captacao_imovel',
    icon: Building2,
    titulo: 'Captação de Imóvel para Portfólio',
    categoria: 'Imóveis',
    tempo_estimado: '1-2 semanas',
    norma: null,
    etapas: [
      { id: 1, titulo: 'Prospecção ativa', desc: 'Identificar imóvel: indicação, ZAP, VivaReal, visita ao bairro. Confirmar disponibilidade com proprietário.' },
      { id: 2, titulo: 'Avaliação prévia', desc: 'Pesquisa rápida de mercado para estimar valor. Verificar coerência com pretensão do proprietário.' },
      { id: 3, titulo: 'Documentação básica', desc: 'Matrícula, IPTU, habite-se, certidões negativas do proprietário. Verificar existência de ônus.' },
      { id: 4, titulo: 'Contrato de exclusividade', desc: 'Assinar CRECI-PE ou VRF com prazo, comissão e exclusividade. Mínimo 90 dias recomendado.' },
      { id: 5, titulo: 'Produção do conteúdo', desc: 'Fotos profissionais (mínimo 20), planta baixa, tour virtual se possível. Texto descritivo otimizado.' },
      { id: 6, titulo: 'Cadastro no sistema', desc: 'Preencher ficha completa no backoffice IMI. Definir preço, condições e público-alvo.' },
      { id: 7, titulo: 'Publicação nos portais', desc: 'ZAP Imóveis, VivaReal, OLX. Definir orçamento de destaque se for prioridade.' },
    ]
  },
  {
    id: 'processo_credito',
    icon: CreditCard,
    titulo: 'Processo de Crédito Imobiliário',
    categoria: 'Crédito',
    tempo_estimado: '30-90 dias',
    norma: null,
    etapas: [
      { id: 1, titulo: 'Simulação e enquadramento', desc: 'Usar simulador IMI para PRICE e SAC. Verificar LTV máximo (80% SFH, 70% SFI). Calcular renda mínima necessária.' },
      { id: 2, titulo: 'Escolha do banco', desc: 'Comparar: Caixa Econômica (SFH/FGTS), Bradesco (SFI), Santander, Itaú. Considerar taxa + CET + tempo.' },
      { id: 3, titulo: 'Documentação do cliente', desc: 'RG, CPF, comprovante renda (3 últimos), IRPF, extrato FGTS, comprovante residência, estado civil.' },
      { id: 4, titulo: 'Documentação do imóvel', desc: 'Matrícula atualizada, IPTU, habite-se, planta baixa aprovada, certidões do vendedor.' },
      { id: 5, titulo: 'Análise de crédito', desc: 'Acompanhar aprovação junto ao banco. Prazo médio: 5-15 dias úteis. Documentar pendências.' },
      { id: 6, titulo: 'Avaliação bancária', desc: 'Laudo do banco (PTAM). Se IMI for contratada como avaliadora: emitir conforme NBR 14653-2.' },
      { id: 7, titulo: 'Assinatura do contrato', desc: 'Comparecimento ao banco ou cartório. Registro da alienação fiduciária no RI. Liberação do crédito.' },
    ]
  },
  {
    id: 'consultoria_patrimonial',
    icon: Briefcase,
    titulo: 'Consultoria Patrimonial — Holding Familiar',
    categoria: 'Consultorias',
    tempo_estimado: '4-8 semanas',
    norma: null,
    etapas: [
      { id: 1, titulo: 'Diagnóstico patrimonial', desc: 'Levantamento completo: imóveis, outros ativos, dívidas, renda familiar, regime de casamento, herdeiros.' },
      { id: 2, titulo: 'Análise tributária comparativa', desc: 'Calcular carga tributária: pessoa física vs. holding. ITBI, ITCMD, ganho de capital, IR sobre aluguel.' },
      { id: 3, titulo: 'Avaliação dos imóveis', desc: 'Emitir laudos NBR 14653 para todos os imóveis a serem integralizados. Necessário para base da holding.' },
      { id: 4, titulo: 'Estruturação jurídica', desc: 'Recomendar tipo societário (LTDA ou SA). Definir objeto social, quotas, administração. Encaminhar a advogado.' },
      { id: 5, titulo: 'Integralização dos imóveis', desc: 'Lavrar escritura de integralização em cartório. Registrar no RI. Transferir titularidade para a holding.' },
      { id: 6, titulo: 'Planejamento sucessório', desc: 'Estruturar doação de quotas com usufruto vitalício, cláusulas de impenhorabilidade e incomunicabilidade.' },
      { id: 7, titulo: 'Relatório executivo final', desc: 'Entrega do relatório com toda a estrutura, benefícios fiscais projetados, mapa de imóveis e orientações.' },
    ]
  },
]

// ── Component ─────────────────────────────────────────────────
export default function PlaybooksPage() {
  const [aberto, setAberto] = useState<string | null>(null)
  const [concluidos, setConcluidos] = useState<Record<string, Set<number>>>({})
  const [filtro, setFiltro] = useState('todos')

  const toggle = (id: string) => setAberto(prev => prev === id ? null : id)

  const toggleStep = (playId: string, stepId: number) => {
    setConcluidos(prev => {
      const set = new Set(prev[playId] || [])
      if (set.has(stepId)) set.delete(stepId)
      else set.add(stepId)
      return { ...prev, [playId]: set }
    })
  }

  const categorias = ['todos', ...Array.from(new Set(PLAYBOOKS.map(p => p.categoria)))]
  const filtered = filtro === 'todos' ? PLAYBOOKS : PLAYBOOKS.filter(p => p.categoria === filtro)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Playbooks Operacionais</h1>
        <p className="text-xs text-gray-500 mt-0.5">SOPs e checklists para operações padrão IMI</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {categorias.map(c => (
          <button key={c} onClick={() => setFiltro(c)}
            className={`h-8 px-3 rounded-xl text-xs font-medium border transition-colors ${
              filtro === c ? 'bg-[#141420] text-white border-[#141420]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {c === 'todos' ? 'Todos' : c}
          </button>
        ))}
      </div>

      {/* Playbook list */}
      <div className="space-y-3">
        {filtered.map(pb => {
          const Icon = pb.icon
          const isOpen = aberto === pb.id
          const done = concluidos[pb.id] || new Set()
          const pct = Math.round((done.size / pb.etapas.length) * 100)

          return (
            <div key={pb.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <button onClick={() => toggle(pb.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-[#3B82F6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">{pb.titulo}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{pb.categoria}</span>
                    {pb.norma && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{pb.norma}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={11} /> {pb.tempo_estimado}
                    </span>
                    <span className="text-xs text-gray-500">{pb.etapas.length} etapas</span>
                    {done.size > 0 && (
                      <span className="text-xs font-medium text-[#3B82F6]">{pct}% concluído</span>
                    )}
                  </div>
                  {done.size > 0 && (
                    <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-[#1A1A2E] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                {isOpen ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
              </button>

              {/* Etapas */}
              {isOpen && (
                <div className="border-t border-gray-50">
                  {pb.etapas.map((step, i) => {
                    const isConcluida = done.has(step.id)
                    return (
                      <div key={step.id}
                        className={`flex gap-3 px-5 py-3 border-b border-gray-50 last:border-0 transition-colors ${isConcluida ? 'bg-emerald-50/40' : 'hover:bg-gray-50'}`}>
                        <button onClick={() => toggleStep(pb.id, step.id)} className="mt-0.5 flex-shrink-0">
                          {isConcluida
                            ? <CheckCircle2 size={18} className="text-emerald-500" />
                            : <Circle size={18} className="text-gray-300" />
                          }
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                            <p className={`text-sm font-semibold ${isConcluida ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              {step.titulo}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-900 mb-1">Playbooks Customizados</p>
        <p className="text-xs text-amber-700">
          Os playbooks são checklists interativos — marque cada etapa como concluída durante a execução.
          Novos SOPs podem ser adicionados conforme o crescimento operacional da IMI. O progresso é salvo localmente na sessão.
        </p>
      </div>
    </div>
  )
}
