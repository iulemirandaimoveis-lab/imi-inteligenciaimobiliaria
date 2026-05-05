'use client'

import { useMemo, useState } from 'react'
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

  const calc = useMemo(() => {
    const taxaGestao = 0.16
    const custosFixos = 1850
    const receitaBruta = diaria * 30 * ocupacao * unidades
    const receitaLiquida = receitaBruta * (1 - taxaGestao) - custosFixos * unidades
    const yieldAnual = (receitaLiquida * 12) / (valorImovel * unidades)

    const cenarios = {
      conservador: { val: 0.055, rendaAdj: 0.92 },
      base: { val: 0.083, rendaAdj: 1 },
      agressivo: { val: 0.108, rendaAdj: 1.08 }
    }

    const projecoes = Object.entries(cenarios).map(([nome, cfg]) => {
      const valorizacao = valorImovel * unidades * (1 + cfg.val) ** tempo
      const renda = receitaLiquida * cfg.rendaAdj * 12 * tempo
      return { nome, valorizacao, renda, total: valorizacao + renda }
    })

    const payback = (valorImovel * unidades) / Math.max(receitaLiquida * 12, 1)
    const perfil = valorImovel * unidades >= 1000000 ? 'Conservador de alta renda' : 'Conservador em formação de portfólio'
    const estrategia = yieldAnual >= 0.09 ? 'Renda recorrente (short stay)' : 'Valorização patrimonial + uso estratégico'
    const qtdIdeal = Math.max(1, Math.ceil(120000 / Math.max(receitaLiquida * 12, 1)))

    return { receitaLiquida, yieldAnual, projecoes, payback, perfil, estrategia, qtdIdeal }
  }, [diaria, ocupacao, tempo, unidades, valorImovel])

  const chart20y = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const ano = i + 1
    const val = valorImovel * unidades * (1 + 0.083) ** ano
    const renda = calc.receitaLiquida * 12 * ano
    return { ano, valorizacao: Math.round(val), renda: Math.round(renda), total: Math.round(val + renda) }
  }), [calc.receitaLiquida, unidades, valorImovel])

  const comparativo = [
    { ativo: 'Jazz Boulevard', retorno: Math.round(calc.projecoes.find((x) => x.nome === 'base')?.total ?? 0), cor: '#C8A96A' },
    { ativo: 'IFIX (média)', retorno: 1064000, cor: '#8B949E' },
    { ativo: 'Tesouro IPCA+', retorno: 940000, cor: '#7A848E' },
    { ativo: 'CDI', retorno: 884000, cor: '#6C747D' },
    { ativo: 'Poupança', retorno: 598000, cor: '#58616B' },
    { ativo: 'Imóvel tradicional', retorno: 980000, cor: '#4B545D' }
  ]

  const ocupacaoMensal = [
    { mes: 'Jan', oc: 58 }, { mes: 'Fev', oc: 84 }, { mes: 'Mar', oc: 72 }, { mes: 'Abr', oc: 61 }, { mes: 'Mai', oc: 74 }, { mes: 'Jun', oc: 56 },
    { mes: 'Jul', oc: 68 }, { mes: 'Ago', oc: 78 }, { mes: 'Set', oc: 91 }, { mes: 'Out', oc: 70 }, { mes: 'Nov', oc: 52 }, { mes: 'Dez', oc: 64 }
  ]

  async function trackEvent(evento: string, payload: Record<string, unknown>) {
    await supabase.from('jazz_events').insert({ evento, payload, created_at: new Date().toISOString() })
  }

  async function simulateAndSend() {
    await trackEvent('start_simulation', { valorImovel, diaria, ocupacao, tempo, unidades })
    await supabase.from('jazz_simulations').insert({ valor_imovel: valorImovel, diaria, ocupacao, tempo, unidades, receita_liquida: calc.receitaLiquida, yield: calc.yieldAnual })
    await trackEvent('click_whatsapp', { page: 'lp-jazz', tempo })
    window.open('https://wa.me/5581999999999?text=Quero%20a%20proposta%20autom%C3%A1tica%20do%20Jazz%20Boulevard', '_blank')
  }

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-4 pb-14 pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/35" />
        <div className="relative mx-auto grid max-w-7xl gap-8 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.25em] text-[#C8A96A]">INVISTA NA SUÍÇA PERNAMBUCANA</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">Ativo com <span className="text-[#E8C97A]">renda mensal</span>, valorização e lifestyle no mesmo endereço.</h1>
            <p className="mt-4 max-w-xl text-white/75">Simule em tempo real receita, yield e patrimônio, compare com IFIX, CDI e Tesouro e decida quantas unidades fazem sentido para sua estratégia.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={simulateAndSend} className="rounded-full bg-[#C8A96A] px-6 py-3 text-sm font-bold text-black">Simular investimento</button>
              <a href="https://wa.me/5581999999999" className="rounded-full border border-[#C8A96A66] px-6 py-3 text-sm">Falar com especialista</a>
            </div>
          </motion.div>
          <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-white/60">A PARTIR DE</p>
            <p className="text-5xl font-semibold text-[#E8C97A]">R$ 410 MIL</p>
            <p className="mt-2 text-sm text-white/75">Studios e apartamentos no primeiro complexo multiuso premium de Garanhuns.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <p className="mb-4 text-xs tracking-[0.2em] text-[#C8A96A]">STORYTELLING DE DECISÃO</p>
        <div className="grid gap-3 md:grid-cols-3">
          {['Erro: capital parado sem fluxo.', 'Tensão: baixa previsibilidade corrói retorno real.', 'Virada: Jazz como ativo de renda + valorização.', 'Desejo: uso em férias, renda quando ausente.', 'Lógica: simulação comparativa com benchmarks.', 'Decisão: quantas unidades comprar agora?'].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">{item}</div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[#C8A96A33] bg-gradient-to-b from-[#121417] to-[#0B0E11] p-6">
          <h2 className="text-2xl">Calculadora Inteligente</h2>
          {[{ l: 'Valor do imóvel', v: valorImovel, s: setValorImovel, min: 300000, max: 1500000 }, { l: 'Diária média', v: diaria, s: setDiaria, min: 150, max: 600 }, { l: 'Ocupação (%)', v: Math.round(ocupacao * 100), s: (x: number) => setOcupacao(x / 100), min: 30, max: 95 }, { l: 'Tempo (anos)', v: tempo, s: setTempo, min: 5, max: 20 }, { l: 'Quantidade de unidades', v: unidades, s: setUnidades, min: 1, max: 10 }].map((i) => (
            <label key={i.l} className="mt-4 block text-sm">
              {i.l}: <span className="text-[#E8C97A]">{i.v.toLocaleString('pt-BR')}</span>
              <input className="mt-2 w-full" type="range" min={i.min} max={i.max} value={i.v} onChange={(e) => { i.s(Number(e.target.value)); trackEvent('change_input', { field: i.l, value: Number(e.target.value) }) }} />
            </label>
          ))}
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl">Módulo de decisão automática</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>Receita mensal líquida: <b>R$ {Math.round(calc.receitaLiquida).toLocaleString('pt-BR')}</b></li>
            <li>Yield anual: <b>{(calc.yieldAnual * 100).toFixed(1)}%</b></li>
            <li>Payback: <b>{calc.payback.toFixed(1)} anos</b></li>
            <li>Perfil identificado: <b>{calc.perfil}</b></li>
            <li>Estratégia recomendada: <b>{calc.estrategia}</b></li>
            <li>Quantidade ideal: <b>{calc.qtdIdeal} unidades</b></li>
          </ul>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {calc.projecoes.map((c) => <div key={c.nome} className="rounded-xl border border-white/10 p-3"><p className="text-xs uppercase text-white/60">{c.nome}</p><p className="text-lg text-[#E8C97A]">R$ {Math.round(c.total).toLocaleString('pt-BR')}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="h-80 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-lg">Linha de crescimento patrimonial (20 anos)</p>
          <ResponsiveContainer width="100%" height="90%"><LineChart data={chart20y}><CartesianGrid stroke="#ffffff1e" /><XAxis dataKey="ano" /><YAxis /><Tooltip /><Legend /><Line dataKey="valorizacao" stroke="#C8A96A" /><Line dataKey="renda" stroke="#2cc2b0" /><Line dataKey="total" stroke="#7CE2D8" /></LineChart></ResponsiveContainer>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-3 md:grid-cols-2">
        <div className="h-80 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-lg">Comparativo de investimentos</p>
          <ResponsiveContainer width="100%" height="90%"><BarChart data={comparativo} layout="vertical" margin={{ left: 40 }}><CartesianGrid stroke="#ffffff1e" /><XAxis type="number" /><YAxis type="category" width={120} dataKey="ativo" /><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} /><Bar dataKey="retorno">{comparativo.map((x) => <Cell key={x.ativo} fill={x.cor} />)}</Bar></BarChart></ResponsiveContainer>
        </div>
        <div className="h-80 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-lg">Taxa de ocupação mensal</p>
          <ResponsiveContainer width="100%" height="90%"><LineChart data={ocupacaoMensal}><CartesianGrid stroke="#ffffff1e" /><XAxis dataKey="mes" /><YAxis /><Tooltip /><Line dataKey="oc" stroke="#2cc2b0" /></LineChart></ResponsiveContainer>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-2xl">Infraestrutura, experiência e contexto</h3>
          <p className="mt-3 text-white/80">Garanhuns, a Suíça Pernambucana, combina turismo forte, calendário de eventos, aeroporto regional e eixo Recife-interior em duplicação por etapas (sem promessa de data total concluída).</p>
          <p className="mt-3 text-[#E8C97A]">“Quando você não estiver usando, o ativo trabalha por você.”</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl">Mapa de captação e perfil de investidor</h3>
          <p className="mt-2 text-white/80">Público principal: médicos, empresários, advogados e profissionais liberais com perfil conservador e capital mínimo de R$ 1 milhão.</p>
          <div className="mt-4 flex flex-wrap gap-2">{cities.map((c) => <span key={c} className="rounded-full border border-[#C8A96A55] px-3 py-1 text-xs">{c}</span>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 text-center">
        <p className="text-2xl">Agora a decisão não é se investir. É quantas unidades fazem sentido para você.</p>
        <button onClick={simulateAndSend} className="mt-5 rounded-full bg-[#C8A96A] px-8 py-3 font-semibold text-black">Quero falar com um especialista</button>
      </section>
    </main>
  )
}
