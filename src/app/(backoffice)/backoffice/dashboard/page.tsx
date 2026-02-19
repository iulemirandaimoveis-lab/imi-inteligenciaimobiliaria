'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Users, Building2, DollarSign,
  FileText, ArrowRight, Target,
  Zap, CheckCircle2, MoreHorizontal,
  MapPin, Eye, Calendar, ChevronRight, Flame,
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// ── Data ──────────────────────────────────────────────────────
const sparkData = {
  leads: [42, 55, 38, 67, 71, 80, 95, 88, 104, 117, 127],
  imoveis: [28, 30, 29, 31, 32, 34, 33, 34, 34, 34, 34],
  conversao: [20, 22, 21, 24, 23, 25, 24, 23, 24, 22, 23.5],
  receita: [1.2, 1.4, 1.1, 1.6, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4],
}

const areaData = [
  { mes: 'Set', leads: 82, fechamentos: 17, receita: 1.2 },
  { mes: 'Out', leads: 95, fechamentos: 20, receita: 1.4 },
  { mes: 'Nov', leads: 78, fechamentos: 16, receita: 1.1 },
  { mes: 'Dez', leads: 112, fechamentos: 26, receita: 1.8 },
  { mes: 'Jan', leads: 118, fechamentos: 28, receita: 2.1 },
  { mes: 'Fev', leads: 127, fechamentos: 30, receita: 2.4 },
]

const activity = [
  {
    id: 1, type: 'lead', icon: Users, color: '#3B82F6', bg: '#EFF6FF',
    title: 'Novo lead qualificado', desc: 'Maria Santos — Boa Viagem, 3Q', time: '8 min'
  },
  {
    id: 2, type: 'avaliacao', icon: FileText, color: '#10B981', bg: '#F0FDF4',
    title: 'Avaliação aprovada', desc: 'Reserva Atlantis — Laudo NBR 14653', time: '2h'
  },
  {
    id: 3, type: 'campanha', icon: Target, color: '#C49D5B', bg: '#FFF9E6',
    title: 'Campanha no ar', desc: 'Instagram · Ocean Blue Cobertura', time: '5h'
  },
  {
    id: 4, type: 'conversao', icon: DollarSign, color: '#8B5CF6', bg: '#FAF5FF',
    title: 'Proposta aceita', desc: 'Smart Pina · Unidade 12B · R$ 420k', time: '1d'
  },
  {
    id: 5, type: 'lead', icon: Users, color: '#3B82F6', bg: '#EFF6FF',
    title: '3 novos leads', desc: 'Via formulário — Boa Viagem', time: '1d'
  },
]

const tasksData = [
  { id: 1, title: 'Enviar laudo NBR para João Almeida', priority: 'high', done: false },
  { id: 2, title: 'Revisar orçamento campanha Reserva Atlantis', priority: 'medium', done: false },
  { id: 3, title: 'Follow-up lead Maria Santos', priority: 'high', done: true },
  { id: 4, title: 'Atualizar portfolio empreendimentos Q1', priority: 'low', done: false },
]

const empreendimentos = [
  { id: 1, name: 'Reserva Atlantis', loc: 'Litoral Norte', units: 320, sold: 0, status: 'estruturacao', vgv: '480M', pct: 0 },
  { id: 2, name: 'Ocean Blue', loc: 'Boa Viagem', units: 48, sold: 12, status: 'lancamento', vgv: '96M', pct: 25 },
  { id: 3, name: 'Villa Jardins', loc: 'Piedade', units: 32, sold: 24, status: 'obras', vgv: '22M', pct: 75 },
  { id: 4, name: 'Smart Pina', loc: 'Pina', units: 24, sold: 20, status: 'pronto', vgv: '10M', pct: 83 },
]

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  estruturacao: { label: 'Estruturação', bg: '#EFF6FF', text: '#1D4ED8' },
  lancamento: { label: 'Lançamento', bg: '#F0FDF4', text: '#15803D' },
  obras: { label: 'Em Obras', bg: '#FFF9E6', text: '#92400E' },
  pronto: { label: 'Pronto', bg: '#F0FDF4', text: '#166534' },
}

// ── Animated Counter ─────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 100, damping: 25, mass: 0.5 })

  useEffect(() => {
    if (inView) motionVal.set(value)
  }, [inView, value, motionVal])

  useEffect(() => {
    return spring.on('change', v => {
      if (ref.current) {
        ref.current.textContent = prefix + v.toFixed(decimals) + suffix
      }
    })
  }, [spring, prefix, suffix, decimals])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

// ── Spark Line ────────────────────────────────────────────────
function SparkLine({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ v, i }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          strokeLinecap="round"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── KPI Card ──────────────────────────────────────────────────
function KPICard({ kpi, index }: { kpi: any; index: number }) {
  const router = useRouter()
  const positive = !kpi.change.startsWith('-')
  const TrendIcon = positive ? TrendingUp : TrendingDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
      onClick={() => kpi.href && router.push(kpi.href)}
      className="bg-white rounded-2xl p-5 border cursor-pointer relative overflow-hidden"
      style={{ borderColor: '#E9ECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      {/* Subtle gradient bg */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${kpi.gradBg} 0%, transparent 65%)` }}
      />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: kpi.iconBg }}
          >
            <kpi.icon size={18} style={{ color: kpi.iconColor }} />
          </div>
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background: positive ? '#F0FDF4' : '#FEF2F2',
              color: positive ? '#15803D' : '#DC2626',
            }}
          >
            <TrendIcon size={11} />
            {kpi.change}
          </span>
        </div>

        {/* Value */}
        <div className="mb-1">
          <div className="text-2xl font-bold tracking-tight" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
            <AnimatedNumber value={kpi.numValue} prefix={kpi.prefix} suffix={kpi.suffix} decimals={kpi.decimals} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: '#ADB5BD' }}>
            {kpi.label}
          </p>
        </div>

        {/* Spark */}
        <div className="mt-3 -mx-1">
          <SparkLine data={kpi.spark} color={kpi.iconColor} />
        </div>

        {/* Subtitle */}
        <p className="text-xs mt-1" style={{ color: '#ADB5BD' }}>{kpi.subtitle}</p>
      </div>
    </motion.div>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl p-3 shadow-xl border" style={{ borderColor: '#E9ECEF', minWidth: 120 }}>
      <p className="text-xs font-semibold mb-2" style={{ color: '#6C757D' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: '#1A1A1A', fontWeight: 600 }}>{p.value}</span>
          <span style={{ color: '#ADB5BD' }}>{p.name === 'leads' ? 'leads' : p.name === 'fechamentos' ? 'fechamentos' : 'M'}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [tasksDone, setTasksDone] = useState<number[]>(tasksData.filter(t => t.done).map(t => t.id))
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Bom dia')
    else if (hour < 18) setGreeting('Boa tarde')
    else setGreeting('Boa noite')
  }, [])

  const kpis = [
    {
      label: 'Leads este mês', value: '127', numValue: 127,
      prefix: '', suffix: '', decimals: 0,
      change: '+18.2%', icon: Users,
      iconBg: '#EFF6FF', iconColor: '#3B82F6', gradBg: 'rgba(59,130,246,0.05)',
      spark: sparkData.leads, subtitle: '23 quentes agora',
      href: '/backoffice/leads',
    },
    {
      label: 'Empreendimentos', value: '34', numValue: 34,
      prefix: '', suffix: '', decimals: 0,
      change: '+8.2%', icon: Building2,
      iconBg: '#F0FDF4', iconColor: '#10B981', gradBg: 'rgba(16,185,129,0.05)',
      spark: sparkData.imoveis, subtitle: '12 em Boa Viagem',
      href: '/backoffice/imoveis',
    },
    {
      label: 'Taxa de conversão', value: '23.5%', numValue: 23.5,
      prefix: '', suffix: '%', decimals: 1,
      change: '-2.1%', icon: Target,
      iconBg: '#FFF7ED', iconColor: '#F59E0B', gradBg: 'rgba(245,158,11,0.05)',
      spark: sparkData.conversao, subtitle: '30 fechamentos no mês',
      href: '/backoffice/leads',
    },
    {
      label: 'Receita projetada', value: 'R$ 2.4M', numValue: 2.4,
      prefix: 'R$ ', suffix: 'M', decimals: 1,
      change: '+15.3%', icon: DollarSign,
      iconBg: '#FAF5FF', iconColor: '#8B5CF6', gradBg: 'rgba(139,92,246,0.05)',
      spark: sparkData.receita, subtitle: 'Pipeline Q1 2026',
      href: '/backoffice/financeiro',
    },
  ]

  const toggleTask = (id: number) => {
    setTasksDone(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#ADB5BD' }}>
            {greeting}, Iule 👋
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
            Visão Geral
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6C757D' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/backoffice/leads/novo')}
          className="hidden sm:flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))',
            boxShadow: '0 2px 12px rgba(196,157,91,0.3)',
          }}
        >
          <Zap size={15} />
          Novo Lead
        </motion.button>
      </motion.div>

      {/* ── KPI Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} kpi={kpi} index={i} />
        ))}
      </div>

      {/* ── Chart + Activity ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl border p-6"
          style={{ borderColor: '#E9ECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Performance 6 Meses</h2>
              <p className="text-xs mt-0.5" style={{ color: '#ADB5BD' }}>Leads · Fechamentos · Receita</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Leads</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />Fechamentos</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="leads-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fechamentos-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#ADB5BD' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#ADB5BD' }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} fill="url(#leads-grad)" dot={false} />
              <Area type="monotone" dataKey="fechamentos" stroke="#10B981" strokeWidth={2} fill="url(#fechamentos-grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4 }}
          className="bg-white rounded-2xl border overflow-hidden"
          style={{ borderColor: '#E9ECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F1F3F5' }}>
            <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Atividade</h2>
            <button
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--accent-600)' }}
            >
              Ver tudo <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: '#F8F9FA' }}>
            {activity.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors duration-100"
                onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FA')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: item.bg }}>
                  <item.icon size={14} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#1A1A1A' }}>{item.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#6C757D' }}>{item.desc}</p>
                </div>
                <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: '#ADB5BD' }}>{item.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Empreendimentos + Tasks ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Empreendimentos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="lg:col-span-3 bg-white rounded-2xl border overflow-hidden"
          style={{ borderColor: '#E9ECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F1F3F5' }}>
            <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Empreendimentos</h2>
            <button onClick={() => router.push('/backoffice/imoveis')}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--accent-600)' }}>
              Ver todos <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: '#F8F9FA' }}>
            {empreendimentos.map((emp, i) => {
              const sc = statusConfig[emp.status]
              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.06 }}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors duration-100"
                  onClick={() => router.push(`/backoffice/imoveis/${emp.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' }}>
                    {emp.name.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A1A1A' }}>{emp.name}</p>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                        style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} style={{ color: '#ADB5BD' }} />
                      <span className="text-xs truncate" style={{ color: '#ADB5BD' }}>{emp.loc}</span>
                    </div>

                    {/* Progress */}
                    {emp.pct > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-imi-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${emp.pct}%` }}
                            transition={{ delay: 0.8 + i * 0.08, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                            className="h-full rounded-full"
                            style={{ background: emp.pct > 80 ? '#10B981' : emp.pct > 50 ? 'var(--accent-500)' : '#3B82F6' }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold flex-shrink-0"
                          style={{ color: '#ADB5BD' }}>{emp.pct}%</span>
                      </div>
                    )}
                  </div>

                  {/* VGV */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--accent-700)' }}>R$ {emp.vgv}</p>
                    <p className="text-[10px]" style={{ color: '#ADB5BD' }}>{emp.sold}/{emp.units} un.</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56, duration: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl border overflow-hidden"
          style={{ borderColor: '#E9ECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F1F3F5' }}>
            <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Tarefas</h2>
            <span className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: '#F0FDF4', color: '#15803D' }}>
              {tasksData.length - tasksDone.length} abertas
            </span>
          </div>
          <div className="p-4 space-y-2">
            {tasksData.map((task, i) => {
              const done = tasksDone.includes(task.id)
              const priorityColors = {
                high: { dot: '#EF4444', bg: '#FEF2F2' },
                medium: { dot: '#F59E0B', bg: '#FFF7ED' },
                low: { dot: '#3B82F6', bg: '#EFF6FF' },
              }
              const pc = priorityColors[task.priority as keyof typeof priorityColors]

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + i * 0.06 }}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150"
                  style={{ background: done ? '#F8F9FA' : 'white', border: '1px solid', borderColor: done ? '#F1F3F5' : '#E9ECEF' }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    animate={{ scale: done ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CheckCircle2
                      size={16}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: done ? '#10B981' : '#DEE2E6' }}
                    />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug"
                      style={{
                        color: done ? '#ADB5BD' : '#1A1A1A',
                        textDecoration: done ? 'line-through' : 'none',
                      }}>
                      {task.title}
                    </p>
                    {!done && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: pc.dot }} />
                        <span className="text-[10px] font-medium"
                          style={{ color: pc.dot }}>
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Quick action */}
          <div className="px-5 py-4" style={{ borderTop: '1px solid #F1F3F5' }}>
            <motion.button
              whileHover={{ x: 3 }}
              className="flex items-center gap-2 text-xs font-semibold"
              style={{ color: 'var(--accent-600)' }}
            >
              <Flame size={13} />
              Ver pipeline completo
              <ArrowRight size={12} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
