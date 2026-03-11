'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft, BookOpen, Play, CheckCircle, XCircle, Trophy,
  RefreshCw, ChevronRight, Star, Loader2, Sparkles, Target,
  BarChart2, Clock, Award, Zap, AlertCircle, ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

// ============================================================
// BANCO DE EXERCÍCIOS — NBR 14653 / Avaliação Imobiliária
// ============================================================

interface Exercicio {
  id: string
  categoria: string
  nivel: 'basico' | 'intermediario' | 'avancado'
  tipo: 'multipla_escolha' | 'calculo' | 'identificacao' | 'ordenacao'
  pergunta: string
  contexto?: string
  opcoes: string[]
  correta: number
  explicacao: string
  normaRef?: string
}

interface ScoreData {
  total: number
  corretas: number
  incorretas: number
  streak: number
  maxStreak: number
  categorias: Record<string, { total: number; corretas: number }>
}

const EXERCICIOS: Exercicio[] = [
  // METODOLOGIAS
  {
    id: 'met-1',
    categoria: 'Metodologias',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Qual metodologia é indicada pela NBR 14653-2 para avaliação de imóveis residenciais em regiões com mercado ativo?',
    opcoes: [
      'Método da Renda',
      'Método Comparativo Direto de Dados de Mercado',
      'Método Involutivo',
      'Método do Custo de Reprodução',
    ],
    correta: 1,
    explicacao: 'O Método Comparativo Direto é o preferencial quando há amostras de mercado suficientes, pois reflete diretamente o comportamento do mercado imobiliário local.',
    normaRef: 'NBR 14653-2 §8'
  },
  {
    id: 'met-2',
    categoria: 'Metodologias',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Um avaliador precisa determinar o valor de um terreno urbano vazio em área com potencial para incorporação residencial. Qual método é mais indicado?',
    opcoes: [
      'Método Comparativo Direto',
      'Método da Renda',
      'Método Involutivo',
      'Método Evolutivo',
    ],
    correta: 2,
    explicacao: 'O Método Involutivo é indicado para terrenos, pois simula uma hipotética incorporação e, retrocedendo os custos e lucros, obtém o valor do terreno.',
    normaRef: 'NBR 14653-2 §9'
  },
  {
    id: 'met-3',
    categoria: 'Metodologias',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Para avaliar um shopping center ou hotel operacional, qual metodologia capta melhor o valor do ativo?',
    opcoes: [
      'Método Evolutivo',
      'Método Comparativo',
      'Método da Renda',
      'Método do Custo',
    ],
    correta: 2,
    explicacao: 'O Método da Renda é adequado para imóveis que geram renda, pois capitaliza o fluxo de caixa futuro esperado para obter o valor presente do ativo.',
    normaRef: 'NBR 14653-2 §11'
  },
  {
    id: 'met-4',
    categoria: 'Metodologias',
    nivel: 'avancado',
    tipo: 'multipla_escolha',
    pergunta: 'No Método Evolutivo, o valor do imóvel é composto por:',
    opcoes: [
      'Valor de venda - custos de transação',
      'Valor do terreno + custo de reprodução das benfeitorias (com depreciação)',
      'Renda capitalizada + valor residual',
      'Custo de reposição + lucro do incorporador',
    ],
    correta: 1,
    explicacao: 'O Método Evolutivo soma o valor do terreno (pelo Comparativo) com o custo de reprodução das benfeitorias deduzido da depreciação física e funcional.',
    normaRef: 'NBR 14653-2 §10'
  },

  // GRAUS
  {
    id: 'grau-1',
    categoria: 'Graus NBR',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Quantas amostras de mercado são necessárias para atingir Grau III de fundamentação no Método Comparativo?',
    opcoes: ['3 amostras', '5 amostras', '8 amostras ou mais', '12 amostras'],
    correta: 1,
    explicacao: 'O Grau III exige no mínimo 5 amostras para fundamentar adequadamente o laudo pelo método comparativo, garantindo representatividade estatística.',
    normaRef: 'NBR 14653-2 Tabela 2'
  },
  {
    id: 'grau-2',
    categoria: 'Graus NBR',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Um laudo com CV (coeficiente de variação) de 35% está dentro do limite aceitável para qual grau de precisão?',
    opcoes: [
      'Grau I (CV > 30%)',
      'Grau II (CV ≤ 30%)',
      'Grau III (CV ≤ 15%)',
      'Não atinge nenhum grau',
    ],
    correta: 0,
    explicacao: 'A NBR 14653-2 classifica o Grau III com CV ≤ 15%, Grau II com CV ≤ 30% e Grau I para CV acima de 30%. Um CV de 35% seria Grau I de precisão.',
    normaRef: 'NBR 14653-2 Tabela 3'
  },

  // CÁLCULOS
  {
    id: 'calc-1',
    categoria: 'Cálculos',
    nivel: 'basico',
    tipo: 'calculo',
    pergunta: 'Um apartamento de 80m² foi avaliado em R$ 480.000. Qual é o valor unitário (R$/m²)?',
    contexto: 'Área: 80 m² | Valor total: R$ 480.000',
    opcoes: ['R$ 5.500/m²', 'R$ 6.000/m²', 'R$ 6.500/m²', 'R$ 7.000/m²'],
    correta: 1,
    explicacao: 'Valor unitário = R$ 480.000 ÷ 80m² = R$ 6.000/m². Sempre calcular o valor unitário das amostras para comparação homogênea.',
    normaRef: 'NBR 14653-2 §8.2'
  },
  {
    id: 'calc-2',
    categoria: 'Cálculos',
    nivel: 'intermediario',
    tipo: 'calculo',
    pergunta: 'Em 3 amostras com valores unitários de R$ 7.000, R$ 7.500 e R$ 8.500/m², qual é o valor médio?',
    contexto: 'Amostras: R$ 7.000 / R$ 7.500 / R$ 8.500 por m²',
    opcoes: ['R$ 7.500/m²', 'R$ 7.667/m²', 'R$ 8.000/m²', 'R$ 7.750/m²'],
    correta: 1,
    explicacao: 'Média = (7.000 + 7.500 + 8.500) / 3 = R$ 7.667/m². A média aritmética simples é o ponto de partida antes da ponderação estatística.',
  },
  {
    id: 'calc-3',
    categoria: 'Cálculos',
    nivel: 'avancado',
    tipo: 'calculo',
    pergunta: 'Um imóvel tem valor estimado de R$ 800.000. Usando fator de oferta de 10%, qual seria o valor de transação estimado?',
    contexto: 'Valor de oferta: R$ 800.000 | Fator oferta: -10%',
    opcoes: ['R$ 710.000', 'R$ 720.000', 'R$ 750.000', 'R$ 780.000'],
    correta: 1,
    explicacao: 'Valor de transação = R$ 800.000 × (1 - 0,10) = R$ 720.000. O fator de oferta desconta a diferença típica entre preço pedido e preço negociado.',
  },

  // HONORÁRIOS
  {
    id: 'hon-1',
    categoria: 'Honorários',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Qual referência normativa orienta o cálculo de honorários para avaliações imobiliárias no Brasil?',
    opcoes: [
      'ABNT NBR 14653-1',
      'Tabela do IBAPE/SP e IBAPE Nacional',
      'Resolução CONFEA nº 1010',
      'Decreto nº 81.871/78',
    ],
    correta: 1,
    explicacao: 'O IBAPE (Instituto Brasileiro de Avaliações e Perícias de Engenharia) publica tabelas de referência de honorários que orientam o mercado. Não é obrigatória, mas é amplamente aceita.',
  },
  {
    id: 'hon-2',
    categoria: 'Honorários',
    nivel: 'intermediario',
    tipo: 'multipla_escolha',
    pergunta: 'Para uma perícia judicial, os honorários do perito avaliador são em geral:',
    opcoes: [
      'Iguais a uma avaliação extrajudicial',
      'Menores, pois o tribunal controla',
      'Majorados em razão da responsabilidade judicial e complexidade',
      'Calculados apenas pelo valor do imóvel',
    ],
    correta: 2,
    explicacao: 'Em perícias judiciais, os honorários periciais são majorados em razão da responsabilidade perante o juízo, prazos processuais rígidos e eventual impugnação do trabalho.',
  },

  // FUNDAMENTAÇÃO
  {
    id: 'fund-1',
    categoria: 'Fundamentação',
    nivel: 'basico',
    tipo: 'identificacao',
    pergunta: 'Qual elemento NÃO faz parte obrigatoriamente de um Laudo de Avaliação NBR 14653?',
    opcoes: [
      'Caracterização do imóvel avaliando',
      'Identificação do solicitante',
      'Fotos em resolução 4K',
      'Declaração do grau de fundamentação',
    ],
    correta: 2,
    explicacao: 'A NBR 14653-1 exige fotos, mas não especifica resolução mínima em 4K. O requisito é que ilustrem o imóvel adequadamente. A resolução 4K não é critério normativo.',
    normaRef: 'NBR 14653-1 §8'
  },
  {
    id: 'fund-2',
    categoria: 'Fundamentação',
    nivel: 'avancado',
    tipo: 'multipla_escolha',
    pergunta: 'O campo de arbítrio do valor no Método Comparativo corresponde a:',
    opcoes: [
      '± 5% do valor estimado',
      '± 10% do valor estimado',
      '± 15% do estimado (Grau II) ou mínimo possível (Grau III)',
      '± 20% do valor estimado',
    ],
    correta: 2,
    explicacao: 'O campo de arbítrio é definido pelos limites de precisão: Grau III permite menor faixa, Grau II admite ± 15%. O avaliador deve enquadrar o valor final dentro desse campo.',
    normaRef: 'NBR 14653-2 §9.2'
  },

  // VISTORIA
  {
    id: 'vist-1',
    categoria: 'Vistoria',
    nivel: 'basico',
    tipo: 'multipla_escolha',
    pergunta: 'Durante a vistoria do imóvel avaliando, o avaliador deve obrigatoriamente:',
    opcoes: [
      'Realizar medições com laser profissional',
      'Identificar e registrar as características do imóvel com fotos e anotações',
      'Entrevistar todos os vizinhos',
      'Registrar em cartório a data da vistoria',
    ],
    correta: 1,
    explicacao: 'A vistoria deve identificar e documentar as características físicas do imóvel (estado de conservação, área, benfeitorias) com registro fotográfico, fundamentando a avaliação.',
    normaRef: 'NBR 14653-1 §6'
  },
]

const CATEGORIAS = [...new Set(EXERCICIOS.map(e => e.categoria))]
const NIVEIS = { basico: '🟢 Básico', intermediario: '🟡 Intermediário', avancado: '🔴 Avançado' }

export default function ExerciciosPage() {
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string>('Todos')
  const [selectedNivel, setSelectedNivel] = useState<string>('Todos')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [mode, setMode] = useState<'menu' | 'treino' | 'resultado'>('menu')
  const [score, setScore] = useState<ScoreData>({
    total: 0, corretas: 0, incorretas: 0, streak: 0, maxStreak: 0, categorias: {}
  })
  const [iaExercicio, setIaExercicio] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showIA, setShowIA] = useState(false)

  const filtered = EXERCICIOS.filter(e =>
    (selectedCat === 'Todos' || e.categoria === selectedCat) &&
    (selectedNivel === 'Todos' || e.nivel === selectedNivel)
  )

  const current = filtered[currentIdx]

  const handleAnswer = (idx: number) => {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)

    const correct = idx === current.correta
    const newStreak = correct ? score.streak + 1 : 0

    setScore(prev => ({
      total: prev.total + 1,
      corretas: correct ? prev.corretas + 1 : prev.corretas,
      incorretas: !correct ? prev.incorretas + 1 : prev.incorretas,
      streak: newStreak,
      maxStreak: Math.max(newStreak, prev.maxStreak),
      categorias: {
        ...prev.categorias,
        [current.categoria]: {
          total: (prev.categorias[current.categoria]?.total || 0) + 1,
          corretas: (prev.categorias[current.categoria]?.corretas || 0) + (correct ? 1 : 0)
        }
      }
    }))
  }

  const handleNext = () => {
    if (currentIdx < filtered.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      setMode('resultado')
    }
  }

  const startTreino = () => {
    setCurrentIdx(0)
    setSelected(null)
    setRevealed(false)
    setScore({ total: 0, corretas: 0, incorretas: 0, streak: 0, maxStreak: 0, categorias: {} })
    setMode('treino')
  }

  const generateIAExercise = async () => {
    setIsGenerating(true)
    try {
      // Chama rota de servidor — ANTHROPIC_API_KEY nunca exposta ao cliente
      const response = await fetch('/api/avaliacoes/gerar-exercicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: selectedCat, nivel: selectedNivel, quantidade: 1 })
      })
      const _data = await response.json()
      if (_data.success && _data.exercicios?.length > 0) {
        setIaExercicio(JSON.stringify(_data.exercicios[0]))
      } else {
        throw new Error(_data.error || 'Falha na geração')
      }

    } catch {
      setIaExercicio(JSON.stringify({
        pergunta: 'Qual o principal objetivo da NBR 14653-1?',
        opcoes: ['Regulamentar incorporações', 'Estabelecer procedimentos para avaliação de bens', 'Definir honorários obrigatórios', 'Regulamentar o CRECI'],
        correta: 1,
        explicacao: 'A NBR 14653-1 estabelece diretrizes gerais para avaliação de bens, sendo a norma-mãe da série.',
        normaRef: 'NBR 14653-1'
      }))
    }
    setIsGenerating(false)
  }

  const pct = score.total > 0 ? Math.round((score.corretas / score.total) * 100) : 0

  if (mode === 'resultado') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <div className="text-center py-8 rounded-2xl px-6" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: 'var(--bo-card-shadow)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Trophy size={36} style={{ color: '#F59E0B' }} />
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: T.text }}>Treino Concluído!</h2>
          <p style={{ color: T.textMuted }}>{score.total} questões respondidas</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              { label: 'Aproveitamento', value: `${pct}%`, color: pct >= 70 ? '#6BB87B' : '#E57373' },
              { label: 'Corretas', value: score.corretas, color: '#6BB87B' },
              { label: 'Sequência max.', value: score.maxStreak, color: '#F59E0B' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-3" style={{ background: T.elevated }}>
                <p className="text-2xl font-bold" style={{ color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</p>
                <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{item.label}</p>
              </div>
            ))}
          </div>

          {Object.entries(score.categorias).length > 0 && (
            <div className="mt-6 text-left space-y-2">
              <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Por categoria:</p>
              {Object.entries(score.categorias).map(([cat, data]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate" style={{ color: T.textMuted }}>{cat}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.border }}>
                    <div className="h-full bg-[#102A43] rounded-full transition-all" style={{ width: `${(data.corretas / data.total) * 100}%` }} />
                  </div>
                  <span className="text-xs w-12 text-right" style={{ color: T.textMuted }}>{data.corretas}/{data.total}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={startTreino} className="mt-6 w-full h-11 text-white rounded-xl font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
            style={{ background: 'var(--bo-accent)' }}>
            <RefreshCw size={18} /> Treinar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'treino' && current) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pb-20">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('menu')} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${T.border}` }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            {score.streak >= 3 && (
              <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                <Zap size={16} /> {score.streak}x
              </span>
            )}
            <span className="text-sm" style={{ color: T.textMuted }}>{currentIdx + 1} / {filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-600 font-bold">{score.corretas}✓</span>
            <span className="text-red-500 font-bold">{score.incorretas}✗</span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${((currentIdx) / filtered.length) * 100}%`, background: 'var(--bo-accent)' }} />
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: 'var(--bo-card-shadow)' }}>
          {/* Meta */}
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: T.elevated, color: T.textMuted }}>{current.categoria}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: T.elevated, color: T.textMuted }}>{NIVEIS[current.nivel]}</span>
            {current.normaRef && <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(72,101,129,0.15)', color: 'var(--bo-accent)' }}>{current.normaRef}</span>}
          </div>

          <p className="text-base font-semibold leading-relaxed" style={{ color: T.text }}>{current.pergunta}</p>

          {current.contexto && (
            <div className="p-3 rounded-xl text-sm font-mono" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)', color: '#F59E0B' }}>
              {current.contexto}
            </div>
          )}

          <div className="space-y-2">
            {current.opcoes.map((opt, idx) => {
              let inlineStyle: React.CSSProperties = { border: `1px solid ${T.border}`, color: T.text }
              if (revealed) {
                if (idx === current.correta) { inlineStyle = { border: '1px solid rgba(107,184,123,0.5)', background: 'rgba(107,184,123,0.12)', color: '#6BB87B' } }
                else if (idx === selected && idx !== current.correta) { inlineStyle = { border: '1px solid rgba(227,87,87,0.5)', background: 'rgba(227,87,87,0.12)', color: '#E35757' } }
                else { inlineStyle = { border: `1px solid ${T.border}`, color: T.textMuted } }
              }
              return (
                <button key={idx} onClick={() => handleAnswer(idx)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left text-sm transition-all"
                  style={inlineStyle}>
                  <div
                    className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={
                      revealed && idx === current.correta ? { background: '#6BB87B', borderColor: '#6BB87B', color: 'white' }
                      : revealed && idx === selected ? { background: '#E57373', borderColor: '#E57373', color: 'white' }
                      : { borderColor: T.border, color: T.textMuted }
                    }
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  {opt}
                  {revealed && idx === current.correta && <CheckCircle size={16} className="ml-auto" style={{ color: '#6BB87B' }} />}
                  {revealed && idx === selected && idx !== current.correta && <XCircle size={16} className="ml-auto" style={{ color: '#E57373' }} />}
                </button>
              )
            })}
          </div>

          {revealed && (
            <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(72,101,129,0.12)', border: '1px solid rgba(72,101,129,0.25)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--bo-accent)' }}>Explicação</p>
              <p style={{ color: T.textMuted }}>{current.explicacao}</p>
            </div>
          )}
        </div>

        {revealed && (
          <button onClick={handleNext} className="w-full h-11 text-white rounded-xl font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
            style={{ background: 'var(--bo-accent)' }}>
            {currentIdx < filtered.length - 1 ? <>Próxima <ChevronRight size={18} /></> : <>Ver Resultado <Trophy size={18} /></>}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <PageIntelHeader
        moduleLabel="AVALIAÇÕES · TREINAMENTO"
        title="Exercícios — NBR 14653"
        subtitle="Treine avaliação imobiliária diariamente com questões inteligentes"
        actions={
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
          >
            <ArrowLeft size={18} style={{ color: T.text }} />
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Questões', value: EXERCICIOS.length, icon: BookOpen, bg: 'rgba(72,101,129,0.12)', color: 'var(--bo-accent)' },
          { label: 'Categorias', value: CATEGORIAS.length, icon: Target, bg: 'rgba(139,92,246,0.12)', color: '#A78BFA' },
          { label: 'Geradas por IA', value: '∞', icon: Sparkles, bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: item.bg }}>
                <Icon size={18} style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: T.text }}>{item.value}</p>
                <p className="text-xs" style={{ color: T.textMuted }}>{item.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <p className="text-sm font-semibold" style={{ color: T.text }}>Filtros</p>
        <div className="flex flex-wrap gap-2">
          {['Todos', ...CATEGORIAS].map(cat => (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
              style={selectedCat === cat
                ? { background: 'var(--bo-accent)', color: 'white', border: '1px solid transparent' }
                : { background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['Todos', 'basico', 'intermediario', 'avancado'].map(nv => (
            <button key={nv} onClick={() => setSelectedNivel(nv)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedNivel === nv ? 'bg-[var(--bo-accent)] text-white border-transparent' : ''}`}
              style={selectedNivel !== nv ? { background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` } : undefined}>
              {nv === 'Todos' ? 'Todos os níveis' : NIVEIS[nv as keyof typeof NIVEIS]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-sm" style={{ color: T.textMuted }}><strong style={{ color: T.text }}>{filtered.length}</strong> questões selecionadas</p>
          <button onClick={startTreino} disabled={filtered.length === 0}
            className="flex items-center gap-2 h-9 px-5 text-white rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--bo-accent)' }}>
            <Play size={15} /> Iniciar Treino
          </button>
        </div>
      </div>

      {/* IA Generator */}
      <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <button type="button" onClick={() => setShowIA(!showIA)}
          className="w-full flex items-center justify-between p-4 transition-colors"
          style={{ background: T.surface }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Sparkles size={18} style={{ color: '#F59E0B' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: T.text }}>Gerar Exercício com IA</p>
              <p className="text-xs" style={{ color: T.textMuted }}>Questões personalizadas ilimitadas</p>
            </div>
          </div>
          <ChevronDown size={18} className={`transition-transform ${showIA ? 'rotate-180' : ''}`} style={{ color: T.textMuted }} />
        </button>

        {showIA && (
          <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${T.border}` }}>
            <button onClick={generateIAExercise} disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Gerando...</> : <><Sparkles size={16} /> Nova Questão</>}
            </button>
            {iaExercicio && (() => {
              try {
                const parsed = JSON.parse(iaExercicio)
                return (
                  <div className="space-y-3 p-3 rounded-xl" style={{ background: T.elevated }}>
                    <p className="text-sm font-medium" style={{ color: T.text }}>{parsed.pergunta}</p>
                    {parsed.opcoes?.map((opt: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: T.textMuted }}>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: T.border, color: T.text }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ fontWeight: i === parsed.correta ? 700 : undefined, color: i === parsed.correta ? '#6BB87B' : T.textMuted }}>{opt}</span>
                        {i === parsed.correta && <CheckCircle size={12} className="text-emerald-500" />}
                      </div>
                    ))}
                    <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded-lg">{parsed.explicacao}</p>
                  </div>
                )
              } catch {
                return <p className="text-xs text-red-500">Erro ao parsear questão</p>
              }
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
