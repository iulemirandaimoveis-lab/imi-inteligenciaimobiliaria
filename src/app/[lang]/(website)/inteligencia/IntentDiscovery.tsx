'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sparkles, MapPin, ChevronRight, Search, LandPlot } from 'lucide-react'
import { getDevelopmentBySlug } from '@/lib/lotmap/engine'
import {
  INTENTS,
  DEFAULT_INTENTS,
  parseIntent,
  rankByIntent,
  explainFit,
  intentsToProfile,
  nationalDataset,
  mergeDatasets,
  type IntentKey,
  type LiveNeighborhoodRow,
} from '@/lib/intelligence/intent-engine'

// ─── Lotes reais que combinam (ponte inteligência → inventário) ──────────────

interface RecommendedLot {
  id: string
  quadra: string
  lot_number: number
  area_m2: number
  price: number
  scores: { imiScore: number }
  reasons: string[]
}

/**
 * Consome a rota pública /api/intelligence/lots/recommend com o perfil
 * derivado das intenções. Sem dados (dev/stub, DB vazio ou erro) a seção
 * simplesmente não renderiza — nunca um estado quebrado.
 */
function MatchingLots({ intents, lang }: { intents: IntentKey[]; lang: string }) {
  const [lots, setLots] = useState<RecommendedLot[]>([])
  const profile = intentsToProfile(intents)
  const development = getDevelopmentBySlug('alto-bellevue')

  useEffect(() => {
    if (!development) return
    const controller = new AbortController()
    fetch(
      `/api/intelligence/lots/recommend?development_id=${development.id}&profile=${profile}&limit=3`,
      { signal: controller.signal },
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => setLots(Array.isArray(data?.recommendations) ? data.recommendations : []))
      .catch(() => setLots([]))
    return () => controller.abort()
  }, [profile, development])

  if (!development || lots.length === 0) return null

  return (
    <div className="mt-8 pt-8 border-t border-white/[0.05]" aria-label="Lotes que combinam com sua intenção">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#93A5B9]">
          <LandPlot className="w-3.5 h-3.5 text-[#C8A44A] flex-shrink-0" aria-hidden="true" />
          Do insight ao inventário · lotes reais no {development.name}
        </p>
        <span className="text-[10px] text-[#8496AC] font-medium">
          perfil {profile === 'investor' ? 'investidor' : profile === 'resident' ? 'moradia' : 'equilibrado'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {lots.map((lot) => (
          <a
            key={lot.id}
            href={`/${lang}/imoveis/${development.slug}?lote=${encodeURIComponent(`${lot.quadra}-${lot.lot_number}`)}`}
            className="group flex flex-col h-full gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#C8A44A]/35 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-white text-sm font-semibold truncate">
                Lote {lot.quadra}-{lot.lot_number}
              </p>
              <span
                className="text-[13px] font-bold flex-shrink-0"
                style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)", color: '#C8A44A' }}
              >
                {lot.scores.imiScore}
              </span>
            </div>
            <p
              className="text-[12px] text-[#93A5B9]"
              style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
            >
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lot.price)}
              <span className="text-[#8496AC]"> · {Math.round(lot.area_m2)} m²</span>
            </p>
            {lot.reasons[0] && (
              <p className="text-[11px] text-[#8496AC] leading-relaxed">{lot.reasons[0]}</p>
            )}
            <span className="flex items-center gap-1 mt-auto pt-1 text-[10px] font-bold uppercase tracking-wider text-[#8496AC] group-hover:text-[#C8A44A] transition-all duration-200">
              Ver no explorador
              <ChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

// Seção "Descoberta por Intenção": o usuário descreve o que procura (texto
// livre e/ou chips) e o motor ranqueia bairros de todo o Brasil com o porquê.
// Roda 100% no cliente sobre o dataset nacional (Estimativa IMI).
export default function IntentDiscovery({ lang }: { lang: string }) {
  const [selected, setSelected] = useState<IntentKey[]>(DEFAULT_INTENTS)
  const [query, setQuery] = useState('')
  const [liveRows, setLiveRows] = useState<LiveNeighborhoodRow[]>([])

  // Dados reais (neighborhood_intelligence) sobrepõem a estimativa nacional.
  // Falha da API → segue 100% na estimativa, sem estado quebrado.
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/intelligence/neighborhood?scope=national', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => setLiveRows(Array.isArray(data?.neighborhoods) ? data.neighborhoods : []))
      .catch(() => setLiveRows([]))
    return () => controller.abort()
  }, [])

  const toggle = (key: IntentKey) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  const handleQuery = (text: string) => {
    setQuery(text)
    const parsed = parseIntent(text)
    if (parsed.length > 0) setSelected(parsed)
  }

  const dataset = useMemo(() => mergeDatasets(nationalDataset(), liveRows), [liveRows])
  const results = useMemo(() => rankByIntent(selected, dataset), [selected, dataset])
  const topFit = results[0]?.fit ?? 0
  const hasLive = liveRows.length > 0

  return (
    <section className="py-10 md:py-14 border-b border-white/[0.05]" aria-label="Descoberta por intenção">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-5 h-px bg-[#C8A44A] opacity-50" />
          <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[10px]">
            Descoberta por Intenção
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
            Diga o que procura.{' '}
            <span className="text-[#C8A44A] italic">O IMI encontra onde.</span>
          </h2>
          <span
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0"
            style={
              hasLive
                ? { color: '#4ADE80', background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)' }
                : { color: '#C8A44A', background: 'rgba(200,164,74,0.08)', borderColor: 'rgba(200,164,74,0.2)' }
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hasLive ? 'bg-[#4ADE80]' : 'bg-[#C8A44A]'}`} />
            {hasLive ? 'Dados IMI + Estimativa' : 'Estimativa IMI'}
          </span>
        </div>

        {/* Entrada em linguagem natural */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8496AC] pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            placeholder='Ex.: "quero renda de aluguel com liquidez em bairro que valoriza"'
            aria-label="Descreva sua intenção de investimento"
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-[#75899E] focus:outline-none focus:border-[#C8A44A]/50 transition-all duration-200"
          />
        </div>

        {/* Chips de intenção */}
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Intenções de busca">
          {INTENTS.map((intent) => {
            const active = selected.includes(intent.key)
            return (
              <button
                key={intent.key}
                onClick={() => toggle(intent.key)}
                aria-pressed={active}
                title={intent.hint}
                className={`flex items-center gap-1.5 h-9 px-4 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'bg-[#C8A44A] text-[#060D16] border-[#C8A44A]'
                    : 'bg-white/[0.04] text-[#93A5B9] border-white/[0.08] hover:border-[#C8A44A]/40'
                }`}
              >
                {active && <Sparkles className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
                {intent.label}
              </button>
            )
          })}
        </div>

        {/* Resultados */}
        {results.length === 0 ? (
          <p className="text-[#8496AC] text-sm">
            Selecione ao menos uma intenção — ou descreva o que procura no campo acima.
          </p>
        ) : (
          <ol className="grid grid-cols-1 lg:grid-cols-2 gap-3" aria-label="Bairros recomendados">
            {results.map((r, i) => (
              <li
                key={`${r.state}-${r.city}-${r.neighborhood}`}
                style={{ animation: 'fadeSlideUp 0.4s ease-out both', animationDelay: `${i * 45}ms` }}
              >
                <a
                  href={`/${lang}/inteligencia/brasil/${r.state.toLowerCase()}/${slugify(r.city)}`}
                  className="group flex flex-col h-full gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#C8A44A]/35 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold flex-shrink-0"
                        style={{
                          fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                          background: i === 0 ? 'rgba(200,164,74,0.15)' : 'rgba(255,255,255,0.05)',
                          color: i === 0 ? '#C8A44A' : '#93A5B9',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{r.neighborhood}</p>
                        <p className="flex items-center gap-1 text-[11px] text-[#8496AC]">
                          <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">{r.city} · {r.state}</span>
                          {r.source === 'live' && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] flex-shrink-0"
                              title="Dado real IMI"
                              aria-label="Dado real IMI"
                            />
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-lg font-bold leading-none"
                        style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)", color: '#C8A44A' }}
                      >
                        {r.fit}
                      </p>
                      <p className="text-[9px] text-[#75899E] font-bold uppercase tracking-widest mt-1">IMI Fit</p>
                    </div>
                  </div>

                  {/* Barra de aderência */}
                  <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${topFit ? Math.max(8, (r.fit / topFit) * 100) : 0}%`,
                        background: 'linear-gradient(90deg, rgba(200,164,74,0.5), #C8A44A)',
                      }}
                    />
                  </div>

                  <p className="text-[12px] text-[#93A5B9] leading-relaxed">{explainFit(r)}</p>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span
                      className="text-[11px] text-[#8496AC]"
                      style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
                    >
                      {fmtBRL(r.median_price_sqm)}/m²
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8496AC] group-hover:text-[#C8A44A] transition-all duration-200">
                      Explorar {r.city}
                      <ChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        )}

        {selected.length > 0 && <MatchingLots intents={selected} lang={lang} />}
      </div>
    </section>
  )
}
