'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Search, Sparkles } from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard } from '../ui/primitives'
import { getDevelopmentBySlug } from '@/lib/lotmap/engine'
import {
  INTENTS,
  parseIntent,
  intentsToProfile,
  type IntentKey,
} from '@/lib/intelligence/intent-engine'

interface RecommendedLot {
  id: string
  quadra: string
  lot_number: number
  area_m2: number
  price: number
  scores: { imiScore: number }
  reasons: string[]
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const PROFILE_LABEL = { investor: 'investidor', resident: 'moradia', all: 'equilibrado' } as const

// Match de Cliente — o corretor descreve o que o cliente procura em linguagem
// natural; o motor de intenção deriva o perfil e o ranking de lotes reais
// (lots/recommend) devolve as melhores opções, com teto de preço opcional.
// Sem dependência de sessão: usa apenas a rota pública de recomendação.
export function ClientMatchPanel() {
  const [text, setText] = useState('')
  const [budget, setBudget] = useState('')
  const [lots, setLots] = useState<RecommendedLot[]>([])
  const [loading, setLoading] = useState(false)

  const intents = useMemo<IntentKey[]>(() => parseIntent(text), [text])
  const profile = intentsToProfile(intents)
  const development = getDevelopmentBySlug('alto-bellevue')

  useEffect(() => {
    if (!development) return
    const controller = new AbortController()
    setLoading(true)
    fetch(
      `/api/intelligence/lots/recommend?development_id=${development.id}&profile=${profile}&limit=10`,
      { signal: controller.signal },
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => setLots(Array.isArray(data?.recommendations) ? data.recommendations : []))
      .catch(() => setLots([]))
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [profile, development])

  const budgetValue = Number(budget.replace(/\D/g, '')) || null
  const visible = lots
    .filter((l) => (budgetValue ? l.price <= budgetValue : true))
    .slice(0, 5)

  return (
    <GlassCard style={{ padding: 20 }}>
      {/* Entrada */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: '2 1 280px' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.t3, pointerEvents: 'none' }}
            aria-hidden="true"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Ex.: "cliente quer investir para alugar, com boa revenda"'
            aria-label="Descreva o que o cliente procura"
            style={{
              width: '100%', height: 40, paddingLeft: 34, paddingRight: 12,
              borderRadius: 10, background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${T.glassBorder}`, color: T.t1, fontSize: 13, outline: 'none',
            }}
          />
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Teto (R$)"
          aria-label="Teto de preço em reais (opcional)"
          style={{
            flex: '1 1 120px', maxWidth: 160, height: 40, padding: '0 12px',
            borderRadius: 10, background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${T.glassBorder}`, color: T.t1, fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Intenções detectadas + perfil */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {intents.length === 0 ? (
          <span style={{ fontSize: 11, color: T.t3 }}>
            Descreva a intenção do cliente — o perfil é detectado automaticamente.
          </span>
        ) : (
          INTENTS.filter((i) => intents.includes(i.key)).map((i) => (
            <span
              key={i.key}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '5px 10px', borderRadius: 999,
                color: T.gold, background: T.goldSoft, border: `1px solid ${T.goldBorder}`,
              }}
            >
              <Sparkles size={10} aria-hidden="true" />
              {i.label}
            </span>
          ))
        )}
        <span style={{ fontSize: 10, color: T.t3, marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          perfil {PROFILE_LABEL[profile]}
        </span>
      </div>

      {/* Resultados */}
      {loading ? (
        <p style={{ fontSize: 12, color: T.t3 }}>Buscando lotes…</p>
      ) : visible.length === 0 ? (
        <p style={{ fontSize: 12, color: T.t3 }}>
          {budgetValue
            ? 'Nenhum lote disponível dentro do teto informado.'
            : 'Sem recomendações no momento.'}
        </p>
      ) : (
        <ol style={{ display: 'grid', gap: 8, listStyle: 'none', margin: 0, padding: 0 }} aria-label="Lotes recomendados para o cliente">
          {visible.map((lot, i) => (
            <li key={lot.id}>
              <a
                href={`/pt/imoveis/${development?.slug}?lote=${encodeURIComponent(`${lot.quadra}-${lot.lot_number}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${T.glassBorder}`, textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 8, fontSize: 11, fontWeight: 700, flexShrink: 0,
                    fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                    background: i === 0 ? T.goldSoft : 'rgba(255,255,255,0.05)',
                    color: i === 0 ? T.gold : T.t2,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.t1 }}>
                    Lote {lot.quadra}-{lot.lot_number}
                    <span style={{ color: T.t3, fontWeight: 400 }}> · {Math.round(lot.area_m2)} m²</span>
                  </span>
                  {lot.reasons[0] && (
                    <span style={{ display: 'block', fontSize: 11, color: T.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lot.reasons[0]}
                    </span>
                  )}
                </span>
                <span style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.t1, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                    {fmtBRL(lot.price)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.gold, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                    IMI {lot.scores.imiScore}
                    <ExternalLink size={10} aria-hidden="true" />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </GlassCard>
  )
}
