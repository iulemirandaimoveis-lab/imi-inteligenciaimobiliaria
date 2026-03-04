'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, Save, User, DollarSign } from 'lucide-react'
import Link from 'next/link'

const T = {
  bg: 'var(--bo-surface)',
  card: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  sub: 'var(--bo-text-muted)',
}

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
    try {
      const response = await fetch('/api/consultorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao salvar')
      router.push('/backoffice/consultorias')
    } catch (error) {
      console.error('Erro ao salvar consultoria:', error)
    } finally {
      setLoading(false)
    }
  }

  const steps = ['Cliente', 'Tipo & Escopo', 'Honorários']

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/backoffice/consultorias"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover-card"
          style={{ border: `1px solid ${T.border}`, color: T.text }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Nova Consultoria</h1>
          <p className="text-xs" style={{ color: T.sub }}>Registro de projeto e escopo</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 flex-1 ${i < steps.length - 1 ? 'mr-0' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors`}
                style={{
                  background: step > i + 1 ? '#10b981' : step === i + 1 ? '#102A43' : 'var(--bo-elevated)',
                  color: step > i + 1 || step === i + 1 ? '#fff' : T.sub,
                }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium whitespace-nowrap"
                style={{ color: step === i + 1 ? T.text : T.sub }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px flex-1 mx-3"
                style={{ background: step > i + 1 ? '#6ee7b7' : T.border }} />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="rounded-xl p-6 space-y-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        {/* Step 1 — Cliente */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-[#486581]" />
              <h2 className="text-sm font-bold" style={{ color: T.text }}>Dados do Cliente</h2>
            </div>

            {/* PF / PJ */}
            <div className="flex gap-2">
              {['PF', 'PJ'].map(t => (
                <button key={t} onClick={() => set('cliente_tipo', t)}
                  className="flex-1 h-9 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: form.cliente_tipo === t ? '#141420' : T.card,
                    color: form.cliente_tipo === t ? '#fff' : T.text,
                    border: `1px solid ${form.cliente_tipo === t ? '#141420' : T.border}`,
                  }}>
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
                  <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>{f.l}</label>
                  <input value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:border-[#334E68]"
                    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Cidade</label>
                  <input value={form.cidade} onChange={e => set('cidade', e.target.value)}
                    placeholder="Recife"
                    className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:border-[#334E68]"
                    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Estado</label>
                  <select value={form.estado} onChange={e => set('estado', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:border-[#334E68]"
                    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}>
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
              <Briefcase size={16} className="text-[#486581]" />
              <h2 className="text-sm font-bold" style={{ color: T.text }}>Tipo e Escopo</h2>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium mb-2" style={{ color: T.sub }}>Tipo de Consultoria</label>
              {TIPOS.map(t => (
                <button key={t.v} onClick={() => set('tipo', t.v)}
                  className="w-full text-left p-3 rounded-xl transition-all"
                  style={{
                    border: `1px solid ${form.tipo === t.v ? '#334E68' : T.border}`,
                    background: form.tipo === t.v ? 'rgba(51,78,104,0.15)' : T.bg,
                  }}>
                  <p className="text-sm font-medium" style={{ color: T.text }}>{t.l}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.sub }}>{t.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Descrição do Projeto</label>
              <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
                rows={3} placeholder="Descreva o contexto, o imóvel ou empreendimento envolvido, e o escopo esperado…"
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-[#334E68] resize-none"
                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Objetivo Principal do Cliente</label>
              <textarea value={form.objetivo} onChange={e => set('objetivo', e.target.value)}
                rows={2} placeholder="O que o cliente precisa resolver ou decidir com esta consultoria?"
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-[#334E68] resize-none"
                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
            </div>
          </>
        )}

        {/* Step 3 — Honorários */}
        {step === 3 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-[#486581]" />
              <h2 className="text-sm font-bold" style={{ color: T.text }}>Honorários e Prazos</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Valor dos Honorários (R$)</label>
                <input value={form.honorarios} onChange={e => set('honorarios', e.target.value)}
                  type="number" placeholder="8500"
                  className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:border-[#334E68]"
                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Forma de Pagamento</label>
                <select value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:border-[#334E68]"
                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}>
                  <option value="a_vista">À Vista</option>
                  <option value="parcelado_2x">2x</option>
                  <option value="parcelado_3x">3x</option>
                  <option value="50_50">50% Início / 50% Conclusão</option>
                  <option value="mensal">Mensal (retainer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Status Honorários</label>
                <select value={form.honorarios_status} onChange={e => set('honorarios_status', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:border-[#334E68]"
                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}>
                  <option value="pendente">Pendente</option>
                  <option value="parcial">Parcialmente Pago</option>
                  <option value="pago">Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Data de Início</label>
                <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:border-[#334E68]"
                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Previsão de Conclusão</label>
                <input type="date" value={form.data_prev_conclusao} onChange={e => set('data_prev_conclusao', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:border-[#334E68]"
                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: T.sub }}>Observações Internas</label>
                <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                  rows={3} placeholder="Notas sobre o cliente, contexto sensível, histórico de negociação…"
                  className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-[#334E68] resize-none"
                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
              </div>
            </div>

            {/* Resumo */}
            <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
              <p className="font-semibold mb-2" style={{ color: T.text }}>Resumo da Consultoria</p>
              <div className="flex justify-between">
                <span style={{ color: T.sub }}>Cliente</span>
                <span className="font-medium" style={{ color: T.text }}>{form.cliente_nome || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: T.sub }}>Tipo</span>
                <span className="font-medium" style={{ color: T.text }}>{TIPOS.find(t => t.v === form.tipo)?.l || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: T.sub }}>Honorários</span>
                <span className="font-bold text-[#486581]">
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
          className="h-10 px-5 rounded-xl text-sm font-medium transition-colors hover-card"
          style={{ border: `1px solid ${T.border}`, color: T.text }}>
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </button>
        {step < 3
          ? <button onClick={() => setStep(s => s + 1)}
            className="h-10 px-6 bg-[#102A43] text-white rounded-xl text-sm font-semibold hover:bg-[#16162A] transition-colors">
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
