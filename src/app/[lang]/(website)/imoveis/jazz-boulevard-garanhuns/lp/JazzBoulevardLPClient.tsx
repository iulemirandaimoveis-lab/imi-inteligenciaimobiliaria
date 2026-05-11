'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import {
  BarChart, Bar, CartesianGrid, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

type Scenario = 'conservador' | 'base' | 'agressivo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
)

const GOLD = '#C8A96A'
const GOLD_LIGHT = '#E8C97A'
const DARK = '#070B12'

const gallery = [
  { src: '/jazz-boulevard/exterior-dia.jpg', label: 'Fachada — dia' },
  { src: '/jazz-boulevard/exterior-noite.jpg', label: 'Fachada — noite' },
  { src: '/jazz-boulevard/lobby.jpg', label: 'Lobby' },
  { src: '/jazz-boulevard/studio-interior.jpg', label: 'Studio' },
  { src: '/jazz-boulevard/apartamento-interior.jpg', label: 'Apartamento' },
  { src: '/jazz-boulevard/rooftop.jpg', label: 'Rooftop' },
  { src: '/jazz-boulevard/terraco.jpg', label: 'Terraço' },
  { src: '/jazz-boulevard/gourmet.jpg', label: 'Espaço Gourmet' },
]

const plants = [
  { src: '/jazz-boulevard/planta-studio.jpg', label: 'Studio', area: '28 m²' },
  { src: '/jazz-boulevard/planta-apto1q.jpg', label: '1 Quarto', area: '42 m²' },
  { src: '/jazz-boulevard/planta-apto2q.jpg', label: '2 Quartos', area: '58 m²' },
  { src: '/jazz-boulevard/planta-sala.jpg', label: 'Sala Privativa', area: 'Sob consulta' },
]

const amenities = [
  { icon: '🏊', title: 'Piscina aquecida', desc: 'No rooftop com vista panorâmica' },
  { icon: '🎵', title: 'Jazz Bar & Lounge', desc: 'Espaço social temático exclusivo' },
  { icon: '🍽️', title: 'Restaurante gourmet', desc: 'Operado por chef residente' },
  { icon: '💆', title: 'SPA completo', desc: 'Sauna, ofurô e sala de massagem' },
  { icon: '🏋️', title: 'Academia premium', desc: 'Equipamentos de alta performance' },
  { icon: '🔒', title: 'Segurança 24h', desc: 'Portaria blindada e CFTV' },
  { icon: '🚗', title: 'Valet & Garagem', desc: 'Para residentes e hóspedes' },
  { icon: '📡', title: 'Wi-Fi 1 Gbps', desc: 'Em todos os ambientes' },
]

export default function JazzBoulevardLPClient() {
  const [valorImovel, setValorImovel] = useState(980000)
  const [diaria, setDiaria] = useState(540)
  const [ocupacao, setOcupacao] = useState(0.68)
  const [anos, setAnos] = useState(10)
  const [unidades, setUnidades] = useState(1)
  const [activeGallery, setActiveGallery] = useState<number | null>(null)
  const [showCalcPulse, setShowCalcPulse] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowCalcPulse(true), 3000)
    return () => clearTimeout(t)
  }, [])

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
      return {
        ano: year,
        patrimônio: Math.round(baseValue + renda),
        valorização: Math.round(baseValue),
        renda: Math.round(renda)
      }
    })
  }, [calc.receitaLiquida, unidades, valorImovel])

  const investCompare = [
    { nome: 'Jazz Blvd', retorno: 13.8 },
    { nome: 'CDI', retorno: 10.4 },
    { nome: 'Tesouro IPCA', retorno: 8.9 },
    { nome: 'Poupança', retorno: 6.1 },
    { nome: 'IFIX', retorno: 11.2 },
    { nome: 'Imóvel trad.', retorno: 7.8 },
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

  const scrollToCalc = () => {
    document.getElementById('calculadora')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen text-white" style={{ background: DARK }}>

      {/* ─── FLOATING CTA ─── */}
      <AnimatePresence>
        {showCalcPulse && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={scrollToCalc}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-black shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}
          >
            <span className="text-base">📊</span>
            Calcular meu investimento
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── HERO ─── */}
      <section className="relative h-screen min-h-[620px] overflow-hidden">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 h-full w-full object-cover"
          poster="/jazz-boulevard/exterior-dia.jpg"
        >
          <source src="/jazz-boulevard/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#070B12]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative flex h-full flex-col items-start justify-end px-6 pb-20 md:px-16 lg:px-24"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Jazz Boulevard · Garanhuns — PE
          </p>
          <h1 className="max-w-3xl text-4xl font-light leading-tight md:text-6xl lg:text-7xl">
            Um ativo premium que<br />
            <span style={{ color: GOLD_LIGHT }}>paga renda, valoriza</span><br />
            e você ainda usa.
          </h1>
          <p className="mt-5 max-w-xl text-white/70">
            Hotel boutique de alto padrão em Garanhuns, PE. Studios e apartamentos com administração profissional,
            rendimento superior ao CDI e valorização histórica de 8,5% a.a.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={scrollToCalc}
              className="rounded-full px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}
            >
              Simular meu investimento →
            </button>
            <a
              href="https://wa.me/5581999999999"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border px-7 py-3.5 text-sm text-white/80 backdrop-blur-sm transition hover:bg-white/10"
              style={{ borderColor: `${GOLD}55` }}
            >
              Falar com especialista
            </a>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <div className="h-8 w-[1px] bg-white" />
          <p className="text-[10px] uppercase tracking-widest text-white">scroll</p>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section
        className="border-y px-6 py-8 md:px-16"
        style={{ borderColor: `${GOLD}22`, background: `${GOLD}08` }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { value: '13,8%', label: 'Retorno anual estimado' },
            { value: '8,5%', label: 'Valorização histórica a.a.' },
            { value: '68%', label: 'Ocupação média anual' },
            { value: '< 10 anos', label: 'Payback projetado' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-light" style={{ color: GOLD_LIGHT }}>{s.value}</p>
              <p className="mt-1 text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <p className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: GOLD }}>O empreendimento</p>
          <h2 className="text-3xl font-light md:text-4xl">Cada detalhe, uma declaração de sofisticação.</h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {gallery.map((img, i) => (
            <motion.div
              key={img.src}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
              style={{ aspectRatio: i === 0 ? '1/1' : '4/3' }}
              onClick={() => setActiveGallery(i)}
            >
              <Image
                src={img.src}
                alt={img.label}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
                {img.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {activeGallery !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setActiveGallery(null)}
            >
              <div className="relative max-h-[90vh] max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                <Image
                  src={gallery[activeGallery].src}
                  alt={gallery[activeGallery].label}
                  width={1200}
                  height={800}
                  className="rounded-2xl object-contain max-h-[85vh] w-full"
                />
                <p className="mt-3 text-center text-sm text-white/60">{gallery[activeGallery].label}</p>
                <button
                  className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                  onClick={() => setActiveGallery(null)}
                >✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ─── AMENITIES ─── */}
      <section
        className="px-4 py-20 md:px-8"
        style={{ background: 'linear-gradient(180deg, transparent, #0B1220 40%, transparent)' }}
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: GOLD }}>Infraestrutura</p>
            <h2 className="text-3xl font-light md:text-4xl">Diferenciais que justificam a ocupação premium.</h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {amenities.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border p-5 transition-colors hover:border-[#C8A96A44]"
                style={{ borderColor: '#ffffff12', background: '#ffffff06' }}
              >
                <span className="text-2xl">{a.icon}</span>
                <p className="mt-3 text-sm font-medium">{a.title}</p>
                <p className="mt-1 text-xs text-white/50">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FLOOR PLANS ─── */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <p className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: GOLD }}>Tipologias</p>
          <h2 className="text-3xl font-light md:text-4xl">Plantas inteligentes para diferentes estratégias.</h2>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {plants.map((p, i) => (
            <motion.div
              key={p.src}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group overflow-hidden rounded-2xl border"
              style={{ borderColor: '#ffffff12' }}
            >
              <div className="relative aspect-square overflow-hidden bg-white/5">
                <Image
                  src={p.src}
                  alt={p.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <p className="font-medium" style={{ color: GOLD_LIGHT }}>{p.label}</p>
                <p className="mt-0.5 text-xs text-white/50">{p.area}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FEATURE IMAGE ─── */}
      <section className="relative h-72 overflow-hidden md:h-96">
        <Image
          src="/jazz-boulevard/rooftop.jpg"
          alt="Rooftop Jazz Boulevard"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070B12] via-[#070B12]/60 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6 md:px-16">
          <div className="max-w-lg">
            <p className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: GOLD }}>Lifestyle</p>
            <h3 className="text-2xl font-light leading-tight md:text-4xl">
              Garanhuns é a capital das flores.<br />
              <span style={{ color: GOLD_LIGHT }}>Jazz Boulevard é o topo dela.</span>
            </h3>
          </div>
        </div>
      </section>

      {/* ─── CALCULADORA ─── */}
      <section id="calculadora" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <p className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: GOLD }}>Sistema de decisão</p>
          <h2 className="text-3xl font-light md:text-4xl">Quantas unidades fazem sentido para você?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60 text-sm">
            Ajuste os parâmetros e veja em tempo real: renda mensal, yield, payback e sua estratégia ideal.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Controles */}
          <div
            className="rounded-3xl border p-6"
            style={{ borderColor: `${GOLD}22`, background: `${GOLD}06` }}
          >
            <h3 className="mb-6 text-lg font-medium" style={{ color: GOLD_LIGHT }}>Calculadora Inteligente</h3>
            {[
              { value: valorImovel, set: setValorImovel, min: 350000, max: 3000000, step: 10000, label: 'Valor do imóvel', prefix: 'R$', fmt: (v: number) => v.toLocaleString('pt-BR') },
              { value: diaria, set: setDiaria, min: 250, max: 1200, step: 10, label: 'Diária média', prefix: 'R$', fmt: (v: number) => v.toLocaleString('pt-BR') },
              { value: Math.round(ocupacao * 100), set: (v: number) => setOcupacao(v / 100), min: 35, max: 95, step: 1, label: 'Taxa de ocupação', prefix: '', fmt: (v: number) => `${v}%` },
              { value: anos, set: setAnos, min: 5, max: 20, step: 1, label: 'Horizonte de investimento', prefix: '', fmt: (v: number) => `${v} anos` },
              { value: unidades, set: setUnidades, min: 1, max: 10, step: 1, label: 'Número de unidades', prefix: '', fmt: (v: number) => `${v} un.` },
            ].map((ctrl) => (
              <div key={ctrl.label} className="mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">{ctrl.label}</span>
                  <span className="font-semibold" style={{ color: GOLD_LIGHT }}>
                    {ctrl.prefix}{ctrl.fmt(Number(ctrl.value))}
                  </span>
                </div>
                <input
                  type="range"
                  min={ctrl.min}
                  max={ctrl.max}
                  step={ctrl.step}
                  value={Number(ctrl.value)}
                  onChange={(e) => ctrl.set(Number(e.target.value))}
                  className="mt-2 w-full accent-[#C8A96A]"
                />
              </div>
            ))}
          </div>

          {/* Resultados */}
          <div
            className="rounded-3xl border p-6"
            style={{ borderColor: `${GOLD}22`, background: `${GOLD}06` }}
          >
            <h3 className="mb-6 text-lg font-medium" style={{ color: GOLD_LIGHT }}>Módulo de Decisão</h3>
            <div className="space-y-4">
              {[
                { label: 'Receita mensal líquida', value: `R$ ${Math.round(calc.receitaLiquida).toLocaleString('pt-BR')}`, highlight: true },
                { label: 'Yield anual', value: `${(calc.yieldAnual * 100).toFixed(2)}% a.a.`, highlight: true },
                { label: 'Payback estimado', value: `${calc.payback.toFixed(1)} anos`, highlight: false },
                { label: 'Perfil identificado', value: calc.perfil, highlight: false },
                { label: 'Estratégia recomendada', value: calc.estrategia, highlight: false },
                { label: 'Quantidade ideal (meta R$120k/ano)', value: `${calc.ideal} unidades`, highlight: true },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 border-b pb-3" style={{ borderColor: '#ffffff0a' }}>
                  <span className="text-sm text-white/60">{item.label}</span>
                  <span
                    className="text-right text-sm font-semibold"
                    style={{ color: item.highlight ? GOLD_LIGHT : 'white' }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Cenários */}
            <div className="mt-6">
              <p className="mb-3 text-xs uppercase tracking-wider text-white/50">Projeção patrimonial em {anos} anos</p>
              <div className="grid grid-cols-3 gap-2">
                {calc.cenarios.map((c) => (
                  <div
                    key={c.cenario}
                    className="rounded-xl border p-3 text-center"
                    style={{ borderColor: c.cenario === 'base' ? `${GOLD}55` : '#ffffff10', background: c.cenario === 'base' ? `${GOLD}10` : 'transparent' }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{c.cenario}</p>
                    <p className="text-xs font-semibold" style={{ color: c.cenario === 'base' ? GOLD_LIGHT : 'white' }}>
                      R$ {(c.total / 1e6).toFixed(1)}M
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={saveSimulation}
              className="mt-6 w-full rounded-full py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}
            >
              Quero minha simulação completa →
            </button>
          </div>
        </div>
      </section>

      {/* ─── CHARTS ─── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border p-5" style={{ borderColor: '#ffffff0f', background: '#ffffff04' }}>
            <p className="mb-4 text-sm font-medium text-white/70">Evolução patrimonial projetada (20 anos)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
                  <XAxis dataKey="ano" tick={{ fill: '#ffffff44', fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} tick={{ fill: '#ffffff44', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: `1px solid ${GOLD}33`, borderRadius: 12 }}
                    formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="patrimônio" stroke={GOLD} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="renda" stroke="#00C5B5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border p-5" style={{ borderColor: '#ffffff0f', background: '#ffffff04' }}>
            <p className="mb-4 text-sm font-medium text-white/70">Comparativo de retorno — Jazz Blvd vs. mercado</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investCompare} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
                  <XAxis dataKey="nome" tick={{ fill: '#ffffff55', fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: '#ffffff44', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: `1px solid ${GOLD}33`, borderRadius: 12 }}
                    formatter={(v: number) => [`${v}% a.a.`, 'Retorno']}
                  />
                  <Bar
                    dataKey="retorno"
                    radius={[6, 6, 0, 0]}
                    fill={GOLD}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CLOSING CTA ─── */}
      <section className="relative overflow-hidden py-24">
        <Image
          src="/jazz-boulevard/exterior-noite.jpg"
          alt="Jazz Boulevard à noite"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #070B12ee, #070B12bb)' }} />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-3xl px-6 text-center"
        >
          <p className="mb-4 text-xs uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Agora a decisão não é se investir.
          </p>
          <h2 className="text-3xl font-light leading-tight md:text-5xl">
            É quantas unidades<br />
            <span style={{ color: GOLD_LIGHT }}>fazem sentido para você.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-white/60">
            Nossa equipe está pronta para montar sua estratégia personalizada: quantidade de unidades, melhor tipologia e
            projeção de retorno para o seu perfil.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={scrollToCalc}
              className="rounded-full px-8 py-3.5 text-sm font-semibold text-black"
              style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}
            >
              Simular agora
            </button>
            <a
              href="https://wa.me/5581999999999?text=Quero%20investir%20no%20Jazz%20Boulevard%20Garanhuns"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border px-8 py-3.5 text-sm text-white/80 hover:bg-white/10 transition"
              style={{ borderColor: `${GOLD}55` }}
            >
              Falar com especialista
            </a>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="border-t px-6 py-8 text-center text-xs text-white/30"
        style={{ borderColor: '#ffffff0a' }}
      >
        <p>© 2025 Iule Miranda Imóveis · Jazz Boulevard é comercializado exclusivamente por nossa equipe.</p>
        <p className="mt-1">CRECI/PE · Valores e projeções são estimativas com base em dados históricos. Não constituem garantia de rentabilidade.</p>
      </footer>
    </main>
  )
}
