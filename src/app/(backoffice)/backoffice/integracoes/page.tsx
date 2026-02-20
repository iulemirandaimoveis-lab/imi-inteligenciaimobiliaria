// ============================================
// BLOCO 4 — SCRIPT 4: INTEGRAÇÕES DO SISTEMA
// ⚠️ COPIAR EXATAMENTE — NÃO MODIFICAR
// ============================================

/**
 * SALVAR EM: src/app/(backoffice)/backoffice/integracoes/page.tsx
 */

'use client'

import { useState } from 'react'
import {
  Layers,
  Check,
  ExternalLink,
  Search,
  Zap,
  MessageSquare,
  BarChart3,
  Mail,
  Home,
  CreditCard,
  Camera,
  Globe,
  Database,
  Bell,
  AlertCircle,
  Settings,
  Link2,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Integrações disponíveis (Status: ativo, disponivel, configurar, breve)
const INTEGRACOES = [
  // Portais
  {
    id: 'zap',
    nome: 'ZAP Imóveis',
    desc: 'Sincronize seu portfólio com o maior portal imobiliário do Brasil.',
    categoria: 'portais',
    status: 'disponivel',
    icone: Home,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    id: 'vivareal',
    nome: 'VivaReal',
    desc: 'Publique imóveis automaticamente no VivaReal e OLX.',
    categoria: 'portais',
    status: 'disponivel',
    icone: Globe,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'imovelweb',
    nome: 'ImovelWeb',
    desc: 'Integração com o portal líder no Nordeste.',
    categoria: 'portais',
    status: 'breve',
    icone: Home,
    color: 'text-green-600 bg-green-50',
  },
  // CRM / Marketing
  {
    id: 'rdstation',
    nome: 'RD Station',
    desc: 'Sincronize leads e automações de marketing digital.',
    categoria: 'marketing',
    status: 'disponivel',
    icone: Zap,
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    id: 'hubspot',
    nome: 'HubSpot',
    desc: 'CRM e pipeline de vendas integrado ao HubSpot.',
    categoria: 'marketing',
    status: 'breve',
    icone: Database,
    color: 'text-orange-500 bg-orange-50',
  },
  // WhatsApp
  {
    id: 'meta_wa',
    nome: 'Meta WhatsApp API',
    desc: 'Integração oficial com a WhatsApp Business API.',
    categoria: 'comunicacao',
    status: 'configurar',
    icone: MessageSquare,
    color: 'text-green-600 bg-green-50',
    link: 'https://developers.facebook.com/docs/whatsapp',
  },
  {
    id: 'evolution',
    nome: 'Evolution API',
    desc: 'WhatsApp multi-sessão self-hosted para desenvolvimento.',
    categoria: 'comunicacao',
    status: 'breve',
    icone: MessageSquare,
    color: 'text-emerald-600 bg-emerald-50',
  },
  // Analytics
  {
    id: 'meta_ads',
    nome: 'Meta Ads',
    desc: 'Importe métricas de campanhas Facebook e Instagram.',
    categoria: 'analytics',
    status: 'ativo',
    icone: BarChart3,
    color: 'text-blue-600 bg-blue-50',
    ativo_desde: '2025-11-01',
    ultima_sync: '2026-02-19T06:00:00',
  },
  {
    id: 'google_ads',
    nome: 'Google Ads',
    desc: 'Sincronização de campanhas e conversões do Google.',
    categoria: 'analytics',
    status: 'disponivel',
    icone: BarChart3,
    color: 'text-red-600 bg-red-50',
  },
  {
    id: 'analytics',
    nome: 'Google Analytics 4',
    desc: 'Dados de tráfego e conversão do website.',
    categoria: 'analytics',
    status: 'ativo',
    icone: BarChart3,
    color: 'text-orange-600 bg-orange-50',
    ativo_desde: '2025-10-15',
    ultima_sync: '2026-02-19T08:00:00',
  },
  // Email
  {
    id: 'sendgrid',
    nome: 'SendGrid',
    desc: 'Disparo de emails transacionais e marketing.',
    categoria: 'email',
    status: 'disponivel',
    icone: Mail,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'mailchimp',
    nome: 'Mailchimp',
    desc: 'Automação de email marketing e newsletters.',
    categoria: 'email',
    status: 'breve',
    icone: Mail,
    color: 'text-yellow-600 bg-yellow-50',
  },
  // Financeiro
  {
    id: 'asaas',
    nome: 'Asaas',
    desc: 'Cobranças, boletos e gestão financeira integrada.',
    categoria: 'financeiro',
    status: 'breve',
    icone: CreditCard,
    color: 'text-blue-600 bg-blue-50',
  },
  // IA
  {
    id: 'anthropic',
    nome: 'Claude (Anthropic)',
    desc: 'Geração de conteúdo, análise de leads e avaliações com IA.',
    categoria: 'ia',
    status: 'ativo',
    icone: Zap,
    color: 'text-accent-600 bg-accent-50',
    ativo_desde: '2026-01-01',
    ultima_sync: '2026-02-19T14:00:00',
  },
  {
    id: 'openai',
    nome: 'OpenAI (GPT)',
    desc: 'Modelos GPT-4o para geração de conteúdo alternativo.',
    categoria: 'ia',
    status: 'configurar',
    icone: Zap,
    color: 'text-green-600 bg-green-50',
  },
  {
    id: 'gemini',
    nome: 'Google Gemini',
    desc: 'Geração de imagens e conteúdo com Gemini Pro e Flash.',
    categoria: 'ia',
    status: 'configurar',
    icone: Camera,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'kling',
    nome: 'Kling AI',
    desc: 'Geração de vídeos curtos para Instagram e YouTube.',
    categoria: 'ia',
    status: 'breve',
    icone: Camera,
    color: 'text-purple-600 bg-purple-50',
  },
  // Notificações
  {
    id: 'supabase_realtime',
    nome: 'Supabase Realtime',
    desc: 'Notificações em tempo real de eventos do banco de dados.',
    categoria: 'sistema',
    status: 'ativo',
    icone: Bell,
    color: 'text-green-600 bg-green-50',
    ativo_desde: '2025-09-01',
  },
]

const CATEGORIAS = [
  { id: 'todas', label: 'Todas' },
  { id: 'portais', label: 'Portais' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'comunicacao', label: 'Comunicação' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'email', label: 'E-mail' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'ia', label: 'IA' },
  { id: 'sistema', label: 'Sistema' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'bg-green-50 text-green-700 border-green-200' },
  disponivel: { label: 'Disponível', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  configurar: { label: 'Configurar', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  breve: { label: 'Em breve', color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export default function IntegracoesPage() {
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas')

  const integracoesFiltradas = INTEGRACOES.filter(i => {
    const matchBusca = i.nome.toLowerCase().includes(busca.toLowerCase()) ||
      i.desc.toLowerCase().includes(busca.toLowerCase())
    const matchCategoria = categoriaAtiva === 'todas' || i.categoria === categoriaAtiva
    return matchBusca && matchCategoria
  })

  const stats = {
    ativas: INTEGRACOES.filter(i => i.status === 'ativo').length,
    disponiveis: INTEGRACOES.filter(i => i.status === 'disponivel').length,
    configurar: INTEGRACOES.filter(i => i.status === 'configurar').length,
    total: INTEGRACOES.length,
  }

  const formatSync = (iso?: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    }) + ' · ' + new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
          <p className="text-sm text-gray-600 mt-1">
            Conecte portais, ferramentas de marketing e serviços externos
          </p>
        </div>
        <button className="flex items-center gap-2 h-10 px-4 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
          <Settings size={16} />
          Configurações de API
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ativas', value: stats.ativas, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Disponíveis', value: stats.disponiveis, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Configurar', value: stats.configurar, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar integração..."
            className="w-full h-11 pl-11 pr-4 bg-transparent border-none rounded-xl text-sm text-gray-900 focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 px-2 overflow-x-auto pb-2 md:pb-0">
          {CATEGORIAS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider ${categoriaAtiva === cat.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grade de integrações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integracoesFiltradas.map(integracao => {
          const Icon = integracao.icone
          const statusCfg = STATUS_CONFIG[integracao.status]
          return (
            <div
              key={integracao.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${integracao.color}`}>
                  <Icon size={24} />
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
              </div>

              <h3 className="text-sm font-bold text-gray-900 mb-1">{integracao.nome}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 min-h-[32px]">{integracao.desc}</p>

              {/* Info adicional para integrações ativas */}
              {integracao.status === 'ativo' && (
                <div className="text-[10px] text-gray-400 mb-4 space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  {integracao.ultima_sync && (
                    <div className="flex justify-between">
                      <span className="font-medium uppercase tracking-widest text-[8px]">Última Sync</span>
                      <span className="text-gray-600">{formatSync(integracao.ultima_sync)}</span>
                    </div>
                  )}
                  {integracao.ativo_desde && (
                    <div className="flex justify-between">
                      <span className="font-medium uppercase tracking-widest text-[8px]">Ativo Desde</span>
                      <span className="text-gray-600">{new Date(integracao.ativo_desde).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-2 mt-auto">
                {integracao.status === 'ativo' && (
                  <>
                    <button className="flex items-center gap-1.5 h-9 px-3 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors">
                      <Check size={14} />
                      Conectado
                    </button>
                    <button className="h-9 px-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
                      Configurar
                    </button>
                  </>
                )}
                {integracao.status === 'disponivel' && (
                  <button className="flex items-center gap-1.5 h-9 px-4 bg-accent-50 text-accent-700 rounded-xl text-xs font-bold hover:bg-accent-100 transition-colors border border-accent-100">
                    <Link2 size={14} />
                    Conectar
                  </button>
                )}
                {integracao.status === 'configurar' && (
                  <button className="flex items-center gap-1.5 h-9 px-4 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors border border-amber-100">
                    <Zap size={14} />
                    Configurar API Key
                  </button>
                )}
                {integracao.status === 'breve' && (
                  <span className="text-xs text-gray-400 italic font-medium">Disponível em breve</span>
                )}
                {integracao.link && (
                  <a
                    href={integracao.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          )
        })}

        {integracoesFiltradas.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-white rounded-3xl border border-gray-100">
            <Layers size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium italic">Nenhuma integração encontrada para os filtros selecionados</p>
          </div>
        )}
      </div>
    </div>
  )
}
