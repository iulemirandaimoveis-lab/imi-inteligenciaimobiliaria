'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')
const cities = ['Recife', 'Caruaru', 'Vitória de Santo Antão', 'Petrolina', 'Maceió', 'João Pessoa', 'Campina Grande', 'Aracaju', 'Salvador']

export default function JazzBoulevardLPClient() {
  const [valorImovel, setValorImovel] = useState(430000)
  const [diaria, setDiaria] = useState(260)
  const [ocupacao, setOcupacao] = useState(0.66)
  const [tempo, setTempo] = useState(20)
  const [unidades, setUnidades] = useState(1)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [proposalLink, setProposalLink] = useState('')
  const [proposalPdf, setProposalPdf] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const startedAt = useRef<number>(Date.now())
  const sentDepths = useRef<Set<number>>(new Set())

  const calc = useMemo(() => {
    const receitaBruta = diaria * 30 * ocupacao * unidades
    const receitaLiquida = receitaBruta * (1 - 0.16) - 1850 * unidades
    const yieldAnual = (receitaLiquida * 12) / (valorImovel * unidades)
    const scen = { conservador: { val: 0.055, rendaAdj: 0.92 }, base: { val: 0.083, rendaAdj: 1 }, agressivo: { val: 0.108, rendaAdj: 1.08 } }
    const projecoes = Object.entries(scen).map(([nome, cfg]) => {
      const valorizacao = valorImovel * unidades * (1 + cfg.val) ** tempo
      const renda = receitaLiquida * cfg.rendaAdj * 12 * tempo
      return { nome, total: valorizacao + renda }
    })
    return {
      receitaLiquida,
      yieldAnual,
      projecoes,
      payback: (valorImovel * unidades) / Math.max(receitaLiquida * 12, 1),
      perfil: valorImovel * unidades >= 1000000 ? 'Conservador de alta renda' : 'Conservador em formação de portfólio',
      estrategia: yieldAnual >= 0.09 ? 'Renda recorrente (short stay)' : 'Valorização patrimonial + uso estratégico',
      qtdIdeal: Math.max(1, Math.ceil(120000 / Math.max(receitaLiquida * 12, 1)))
    }
  }, [diaria, ocupacao, tempo, unidades, valorImovel])

  const chart20y = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ ano: i + 1, total: Math.round((valorImovel * unidades * (1.083 ** (i + 1))) + (calc.receitaLiquida * 12 * (i + 1))) })), [calc.receitaLiquida, unidades, valorImovel])
  const comparativo = [
    { ativo: 'Jazz Boulevard', retorno: Math.round(calc.projecoes.find((x) => x.nome === 'base')?.total ?? 0), cor: '#C8A96A' },
    { ativo: 'IFIX (média)', retorno: 1064000, cor: '#8B949E' }, { ativo: 'Tesouro IPCA+', retorno: 940000, cor: '#7A848E' }, { ativo: 'CDI', retorno: 884000, cor: '#6C747D' }, { ativo: 'Poupança', retorno: 598000, cor: '#58616B' }
  ]

  useEffect(() => {
    trackEvent('view_hero', { page: 'lp-jazz' })
    const onScroll = () => {
      const depth = Math.round(((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100)
      if ([25, 50, 75, 100].includes(depth) && !sentDepths.current.has(depth)) { sentDepths.current.add(depth); trackEvent('scroll_depth', { depth }) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); trackEvent('time_on_page', { seconds: Math.round((Date.now() - startedAt.current) / 1000) }) }
  }, [])

  async function trackEvent(evento: string, payload: Record<string, unknown>) {
    try {
      await supabase.from('jazz_events').insert({ evento, payload, created_at: new Date().toISOString() })
      await fetch('/api/jazz/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ evento, payload, origem: 'lp-jazz' }) })
    } catch { }
  }

  async function createProposalLink() {
    if (!nome || !telefone || !email) return setErrorMsg('Preencha nome, WhatsApp e e-mail.')
    setErrorMsg(''); setIsSubmitting(true)
    try {
      const data = await (await fetch('/api/jazz/proposal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origin: window.location.origin }) })).json()
      await supabase.from('jazz_leads').insert({ nome, telefone, email, proposal_token: data.token, capital_disponivel: valorImovel * unidades, receita_simulada: calc.receitaLiquida, yield_simulado: calc.yieldAnual })
      setProposalLink(data.proposalUrl); setProposalPdf(data.pdfUrl)
    } finally { setIsSubmitting(false) }
  }

  return <main className="min-h-screen bg-[#050607] text-white"><section className="relative overflow-hidden border-b border-white/10 px-4 pb-14 pt-16"><Image src="/images/jazz-boulevard-hero.jpg" alt="Jazz Boulevard" fill className="object-cover opacity-35" priority /><div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/35" /><div className="relative mx-auto grid max-w-7xl gap-8 md:grid-cols-2"><motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}><p className="text-xs tracking-[0.25em] text-[#C8A96A]">INVISTA NA SUÍÇA PERNAMBUCANA</p><h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">Ativo com <span className="text-[#E8C97A]">renda mensal</span>, valorização e lifestyle no mesmo endereço.</h1><div className="mt-7 flex gap-3"><a href="https://wa.me/5581999999999" className="rounded-full bg-[#C8A96A] px-6 py-3 text-sm font-bold text-black">Falar com especialista</a></div></motion.div><div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur"><p className="text-sm text-white/60">A PARTIR DE</p><p className="text-5xl font-semibold text-[#E8C97A]">R$ 410 MIL</p></div></div></section><section className="mx-auto grid max-w-7xl gap-6 px-4 py-4 md:grid-cols-2"><div className="rounded-3xl border border-[#C8A96A33] bg-gradient-to-b from-[#121417] to-[#0B0E11] p-6">{[{ l: 'Valor do imóvel', v: valorImovel, s: setValorImovel, min: 300000, max: 1500000 }, { l: 'Diária média', v: diaria, s: setDiaria, min: 150, max: 600 }, { l: 'Ocupação (%)', v: Math.round(ocupacao * 100), s: (x: number) => setOcupacao(x / 100), min: 30, max: 95 }, { l: 'Tempo (anos)', v: tempo, s: setTempo, min: 5, max: 20 }, { l: 'Quantidade de unidades', v: unidades, s: setUnidades, min: 1, max: 10 }].map((i) => <label key={i.l} className="mt-3 block text-sm">{i.l}: <span className="text-[#E8C97A]">{i.v.toLocaleString('pt-BR')}</span><input className="mt-1 w-full" type="range" min={i.min} max={i.max} value={i.v} onChange={(e) => i.s(Number(e.target.value))} /></label>)}</div><div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm">Receita líquida: R$ {Math.round(calc.receitaLiquida).toLocaleString('pt-BR')}<br />Yield: {(calc.yieldAnual * 100).toFixed(1)}%<br />Payback: {calc.payback.toFixed(1)} anos<br />Perfil: {calc.perfil}<br />Estratégia: {calc.estrategia}<br />Qtd. ideal: {calc.qtdIdeal}</div></section><section className="mx-auto max-w-7xl px-4 py-4"><div className="h-80 rounded-3xl border border-white/10 bg-white/5 p-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart20y}><CartesianGrid stroke="#ffffff1e" /><XAxis dataKey="ano" /><YAxis /><Tooltip /><Legend /><Line dataKey="total" stroke="#7CE2D8" /></LineChart></ResponsiveContainer></div></section><section className="mx-auto max-w-7xl px-4 py-4"><div className="h-80 rounded-3xl border border-white/10 bg-white/5 p-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparativo} layout="vertical" margin={{ left: 30 }}><CartesianGrid stroke="#ffffff1e" /><XAxis type="number" /><YAxis type="category" width={120} dataKey="ativo" /><Tooltip /><Bar dataKey="retorno">{comparativo.map((x) => <Cell key={x.ativo} fill={x.cor} />)}</Bar></BarChart></ResponsiveContainer></div></section><section className="mx-auto max-w-7xl px-4 py-6"><div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-2"><div><input className="mb-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} /><input className="mb-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2" placeholder="WhatsApp" value={telefone} onChange={(e) => setTelefone(e.target.value)} /><input className="mb-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} /><button disabled={isSubmitting} onClick={createProposalLink} className="rounded-full bg-[#2cc2b0] px-6 py-2 text-sm font-semibold text-black">{isSubmitting ? 'Gerando proposta...' : 'Gerar proposta automática'}</button>{errorMsg && <p className="mt-1 text-xs text-red-300">{errorMsg}</p>}{proposalLink && <p className="mt-1 break-all text-xs text-[#E8C97A]">{proposalLink}</p>}{proposalPdf && <p className="mt-1 break-all text-xs text-[#2cc2b0]">{proposalPdf}</p>}</div><div className="text-sm text-white/80">{cities.map((c) => <span key={c} className="mr-2 inline-block rounded-full border border-[#C8A96A55] px-2 py-1 text-xs">{c}</span>)}</div></div></section></main>
}
