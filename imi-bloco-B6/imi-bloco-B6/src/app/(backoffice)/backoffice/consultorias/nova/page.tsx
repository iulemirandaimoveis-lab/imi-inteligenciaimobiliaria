'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, Save, User, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'

const TIPOS = [
  { v: 'estrategica', l: 'Consultoria Estratégica', desc: 'Posicionamento, expansão, análise de portfólio' },
  { v: 'patrimonial', l: 'Estruturação Patrimonial', desc: 'Holding familiar, partilha, organização de bens' },
  { v: 'mercado', l: 'Análise de Mercado / VGV', desc: 'Viabilidade de empreendimento, FII, estudo de demanda' },
  { v: 'tributaria', l: 'Consultoria Tributária', desc: 'ITBI, ganho de capital, planejamento fiscal imobiliário' },
  { v: 'juridica', l: 'Suporte Jurídico / Laudo', desc: 'Perícia judicial, assistência técnica, parecer fundamentado' },
]

export default function NovaConsultoriaPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    cliente_nome: '', cliente_email: '', cliente_telefone: '', cliente_tipo: 'PF',
    tipo: '', descricao: '', objetivo: '',
    cidade: '', estado: 'PE',
    honorarios: '', forma_pagamento: 'parcelado_2x', honorarios_status: 'pendente',
    data_inicio: new Date().toISOString().split('T')[0],
    data_prev_conclusao: '',
    observacoes: '',
  })

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    // TODO: Supabase insert
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    router.push('/backoffice/consultorias')
  }

  const steps = ['Cliente', 'Tipo & Escopo', 'Honorários']

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/backoffice/consultorias"
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nova Consultoria</h1>
          <p className="text-xs text-gray-500">Registro de projeto e escopo</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 flex-1 ${i < steps.length - 1 ? 'mr-0' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                step > i + 1 ? 'bg-emerald-500 text-white' :
                step === i + 1 ? 'bg-[#C49D5B] text-white' :
                'bg-gray-100 text-gray-400'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${step === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`h-px flex-1 mx-3 ${step > i + 1 ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {/* Step 1 — Cliente */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-[#C49D5B]" />
              <h2 className="text-sm font-bold text-gray-900">Dados do Cliente</h2>
            </div>

            {/* PF / PJ */}
            <div className="flex gap-2">
              {['PF', 'PJ'].map(t => (
                <button key={t} onClick={() => set('cliente_tipo', t)}
                  className={`flex-1 h-9 rounded-xl border text-sm font-medium transition-colors ${
                    form.cliente_tipo === t ? 'bg-[#141420] text-white border-[#141420]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {t === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {[
                { k: 'cliente_nome', l: 'Nome completo / Razão social', placeholder: 'Ex.: Família Cavalcanti ou Construtora Omega S.A.' },
                { k: 'cliente_email', l: 'E-mail', placeholder: 'contato@email.com' },
                { k: 'cliente_telefone', l: 'Telefone / WhatsApp', placeholder: '(81) 9 9999-9999' },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label>
                  <input value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C49D5B]" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cidade</label>
                  <input value={form.cidade} onChange={e => set('cidade', e.target.value)}
                    placeholder="Recife"
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C49D5B]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select value={form.estado} onChange={e => set('estado', e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C49D5B] bg-white">
                    {['PE', 'RJ', 'SP', 'BA', 'CE', 'MG', 'RS', 'PR', 'SC', 'GO', 'DF'].map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2 — Tipo & Escopo */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={16} className="text-[#C49D5B]" />
              <h2 className="text-sm font-bold text-gray-900">Tipo e Escopo</h2>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700 mb-2">Tipo de Consultoria</label>
              {TIPOS.map(t => (
                <button key={t.v} onClick={() => set('tipo', t.v)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    form.tipo === t.v ? 'border-[#C49D5B] bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="text-sm font-medium text-gray-900">{t.l}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Descrição do Projeto</label>
              <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
                rows={3} placeholder="Descreva o contexto, o imóvel ou empreendimento envolvido, e o escopo esperado…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C49D5B] resize-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Objetivo Principal do Cliente</label>
              <textarea value={form.objetivo} onChange={e => set('objetivo', e.target.value)}
                rows={2} placeholder="O que o cliente precisa resolver ou decidir com esta consultoria?"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C49D5B] resize-none" />
            </div>
          </>
        )}

        {/* Step 3 — Honorários */}
        {step === 3 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-[#C49D5B]" />
              <h2 className="text-sm font-bold text-gray-900">Honorários e Prazos</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor dos Honorários (R$)</label>
                <input value={form.honorarios} onChange={e => set('honorarios', e.target.value)}
                  type="number" placeholder="8500"
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C49D5B]" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                <select value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#C49D5B]">
                  <option value="a_vista">À Vista</option>
                  <option value="parcelado_2x">2x</option>
                  <option value="parcelado_3x">3x</option>
                  <option value="50_50">50% Início / 50% Conclusão</option>
                  <option value="mensal">Mensal (retainer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status Honorários</label>
                <select value={form.honorarios_status} onChange={e => set('honorarios_status', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#C49D5B]">
                  <option value="pendente">Pendente</option>
                  <option value="parcial">Parcialmente Pago</option>
                  <option value="pago">Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de Início</label>
                <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C49D5B]" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Previsão de Conclusão</label>
                <input type="date" value={form.data_prev_conclusao} onChange={e => set('data_prev_conclusao', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C49D5B]" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações Internas</label>
                <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                  rows={3} placeholder="Notas sobre o cliente, contexto sensível, histórico de negociação…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C49D5B] resize-none" />
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-900 mb-2">Resumo da Consultoria</p>
              <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="font-medium">{form.cliente_nome || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="font-medium">{TIPOS.find(t => t.v === form.tipo)?.l || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Honorários</span>
                <span className="font-bold text-[#C49D5B]">
                  {form.honorarios ? `R$ ${Number(form.honorarios).toLocaleString('pt-BR')}` : '—'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/backoffice/consultorias')}
          className="h-10 px-5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </button>
        {step < 3
          ? <button onClick={() => setStep(s => s + 1)}
              className="h-10 px-6 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold hover:bg-[#b08a4a] transition-colors">
              Continuar
            </button>
          : <button onClick={handleSubmit} disabled={loading}
              className="h-10 px-6 bg-[#141420] text-white rounded-xl text-sm font-semibold hover:bg-[#1f1f30] disabled:opacity-60 flex items-center gap-2 transition-colors">
              {loading ? 'Salvando…' : <><Save size={15} /> Criar Consultoria</>}
            </button>
        }
      </div>
    </div>
  )
}
