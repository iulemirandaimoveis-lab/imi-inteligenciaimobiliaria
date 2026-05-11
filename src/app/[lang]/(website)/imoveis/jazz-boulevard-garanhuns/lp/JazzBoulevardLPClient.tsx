'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { BarChart, Bar, CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type Scenario = 'conservador' | 'base' | 'agressivo'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')

export default function JazzBoulevardLPClient() {
  const [valorImovel, setValorImovel] = useState(980000)
  const [diaria, setDiaria] = useState(540)
  const [ocupacao, setOcupacao] = useState(0.68)
  const [anos, setAnos] = useState(10)
  const [unidades, setUnidades] = useState(1)

  const calc = useMemo(() => {
    const managementFee = 0.18
    const custosFixos = 2800
    const receitaBruta = diaria * 30 * ocupacao * unidades
    const receitaLiquida = receitaBruta * (1 - managementFee) - custosFixos * unidades
    const yieldAnual = (receitaLiquida * 12) / (valorImovel * unidades)
    const valorizacao = { conservador: 0.06, base: 0.085, agressivo: 0.11 }

    const cenarios = (Object.keys(valorizacao) as Scenario[]).map((c) => {
      const fator = (1 + valorizacao[c]) ** anos
      const patrimonial = valorImovel * unidades * fator
      const total = patrimonial + receitaLiquida * 12 * anos
      return { cenario: c, patrimonial, total }
    })

    const payback = (valorImovel * unidades) / Math.max(receitaLiquida * 12, 1)
    const perfil = valorImovel * unidades >= 1000000 ? 'Conservador de alta renda' : 'Moderado em construção patrimonial'
    const estrategia = yieldAnual >= 0.09 ? 'Renda recorrente (short stay profissional)' : 'Valorização + uso estratégico'
    const ideal = Math.max(1, Math.ceil((120000 / Math.max(receitaLiquida, 1))))

    return { receitaLiquida, yieldAnual, payback, cenarios, perfil, estrategia, ideal }
  }, [anos, diaria, ocupacao, unidades, valorImovel])

  const growthData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const year = i + 1
      const baseValue = valorImovel * unidades * (1.085 ** year)
      const renda = calc.receitaLiquida * 12 * year
      return { ano: year, patrimonio: Math.round(baseValue + renda), valorizacao: Math.round(baseValue), renda: Math.round(renda) }
    })
  }, [calc.receitaLiquida, unidades, valorImovel])

  const investCompare = [
    { nome: 'Jazz Boulevard', retorno: 13.8, liquidez: 5, risco: 4, uso: 10, valorizacao: 9 },
    { nome: 'CDI', retorno: 10.4, liquidez: 10, risco: 8, uso: 0, valorizacao: 4 },
    { nome: 'Tesouro IPCA', retorno: 8.9, liquidez: 7, risco: 7, uso: 0, valorizacao: 5 },
    { nome: 'Poupança', retorno: 6.1, liquidez: 9, risco: 9, uso: 0, valorizacao: 2 },
    { nome: 'IFIX', retorno: 11.2, liquidez: 8, risco: 6, uso: 0, valorizacao: 6 },
    { nome: 'Imóvel tradicional', retorno: 7.8, liquidez: 3, risco: 7, uso: 7, valorizacao: 6 }
  ]

  const saveSimulation = async () => {
    await supabase.from('jazz_simulations').insert({
      valor_imovel: valorImovel,
      diaria,
      ocupacao,
      anos,
      unidades,
      receita_liquida: calc.receitaLiquida,
      yield: calc.yieldAnual,
      created_at: new Date().toISOString()
    })
    window.open('https://wa.me/5581999999999?text=Quero%20uma%20simula%C3%A7%C3%A3o%20completa%20do%20Jazz%20Boulevard', '_blank')
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <section className="relative overflow-hidden px-5 pb-14 pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.25),transparent_48%)]" />
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto max-w-6xl">
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[#C8A96A]">Jazz Boulevard Investment Intelligence</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">Um ativo premium em Garanhuns para renda mensal, valorização e lifestyle em um único movimento.</h1>
          <p className="mt-5 max-w-2xl text-white/70">Simule agora cenários conservador, base e agressivo e compare com CDI, Tesouro, poupança e IFIX antes de decidir quantas unidades fazem sentido.</p>
          <div className="mt-8 flex gap-3">
            <button onClick={saveSimulation} className="rounded-full bg-[#C8A96A] px-6 py-3 text-sm font-semibold text-black">Simular investimento</button>
            <a href="https://wa.me/5581999999999" className="rounded-full border border-[#C8A96A66] px-6 py-3 text-sm">Falar com especialista</a>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-xl">Calculadora Inteligente</h2>
          {[
            { value: valorImovel, set: setValorImovel, min: 350000, max: 3000000, label: 'Valor do imóvel' },
            { value: diaria, set: setDiaria, min: 250, max: 1200, label: 'Diária média' },
            { value: Math.round(ocupacao * 100), set: (v: number) => setOcupacao(v / 100), min: 35, max: 95, label: 'Ocupação %' },
            { value: anos, set: setAnos, min: 5, max: 20, label: 'Prazo (anos)' },
            { value: unidades, set: setUnidades, min: 1, max: 10, label: 'Unidades' }
          ].map((control) => (
            <label key={control.label} className="mb-4 block text-sm text-white/80">
              {control.label}: <span className="text-[#E8C97A]">{Number(control.value).toLocaleString('pt-BR')}</span>
              <input type="range" min={control.min} max={control.max} value={Number(control.value)} onChange={(e) => control.set(Number(e.target.value))} className="mt-2 w-full" />
            </label>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg">Módulo de decisão automática</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>Receita mensal líquida: <b>R$ {Math.round(calc.receitaLiquida).toLocaleString('pt-BR')}</b></li>
            <li>Yield anual: <b>{(calc.yieldAnual * 100).toFixed(2)}%</b></li>
            <li>Payback estimado: <b>{calc.payback.toFixed(1)} anos</b></li>
            <li>Perfil identificado: <b>{calc.perfil}</b></li>
            <li>Estratégia recomendada: <b>{calc.estrategia}</b></li>
            <li>Quantidade ideal (meta R$120 mil/ano): <b>{calc.ideal} unidades</b></li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="h-72 rounded-3xl border border-white/10 bg-white/5 p-4">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={growthData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" /><XAxis dataKey="ano" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="patrimonio" stroke="#C8A96A" /><Line type="monotone" dataKey="renda" stroke="#00C5B5" /></LineChart></ResponsiveContainer>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="h-80 rounded-3xl border border-white/10 bg-white/5 p-4">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={investCompare}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" /><XAxis dataKey="nome" /><YAxis /><Tooltip /><Bar dataKey="retorno" fill="#C8A96A" /></BarChart></ResponsiveContainer>
        </div>
        <p className="mt-8 text-center text-xl">“Agora a decisão não é se investir. É quantas unidades fazem sentido para você.”</p>
      </section>
    </main>
  )
}
