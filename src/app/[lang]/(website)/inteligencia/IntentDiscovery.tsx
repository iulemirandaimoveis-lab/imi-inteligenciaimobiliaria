'use client'

import { useMemo, useState } from 'react'
import { Sparkles, MapPin, ChevronRight, Search } from 'lucide-react'
import {
  INTENTS,
  DEFAULT_INTENTS,
  parseIntent,
  rankByIntent,
  explainFit,
  type IntentKey,
} from './intentEngine'

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

  const toggle = (key: IntentKey) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  const handleQuery = (text: string) => {
    setQuery(text)
    const parsed = parseIntent(text)
    if (parsed.length > 0) setSelected(parsed)
  }

  const results = useMemo(() => rankByIntent(selected), [selected])
  const topFit = results[0]?.fit ?? 0

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
            style={{ color: '#C8A44A', background: 'rgba(200,164,74,0.08)', borderColor: 'rgba(200,164,74,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A44A]" />
            Estimativa IMI
          </span>
        </div>

        {/* Entrada em linguagem natural */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#556170] pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            placeholder='Ex.: "quero renda de aluguel com liquidez em bairro que valoriza"'
            aria-label="Descreva sua intenção de investimento"
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-[#3D5166] focus:outline-none focus:border-[#C8A44A]/50 transition-all duration-200"
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
                    : 'bg-white/[0.04] text-[#7A8FA6] border-white/[0.08] hover:border-[#C8A44A]/40'
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
          <p className="text-[#556170] text-sm">
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
                          color: i === 0 ? '#C8A44A' : '#7A8FA6',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{r.neighborhood}</p>
                        <p className="flex items-center gap-1 text-[11px] text-[#556170]">
                          <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">{r.city} · {r.state}</span>
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
                      <p className="text-[9px] text-[#3D5166] font-bold uppercase tracking-widest mt-1">IMI Fit</p>
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

                  <p className="text-[12px] text-[#7A8FA6] leading-relaxed">{explainFit(r)}</p>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span
                      className="text-[11px] text-[#556170]"
                      style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
                    >
                      {fmtBRL(r.median_price_sqm)}/m²
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#556170] group-hover:text-[#C8A44A] transition-all duration-200">
                      Explorar {r.city}
                      <ChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
