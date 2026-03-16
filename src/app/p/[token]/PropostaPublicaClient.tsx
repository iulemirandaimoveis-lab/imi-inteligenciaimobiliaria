'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Maximize2, Car, Bath, Bed, CheckCircle,
  Phone, MessageCircle, ChevronDown, Calculator,
  Clock, AlertCircle, Send, RefreshCw
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
interface Props { proposal: any }

// ── Utils ────────────────────────────────────────────────────
const fmt = (v: number) =>
  v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) : 'R$ 0'

const fmtDate = (s: string) =>
  s ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(s)) : '—'

async function trackEvent(proposalId: string, eventType: string, metadata: any = {}, timeOnPage?: number) {
  try {
    await fetch('/api/proposals/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: proposalId,
        event_type: eventType,
        metadata,
        time_on_page_seconds: timeOnPage,
        device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      }),
    })
  } catch { /* silent */ }
}

// ── Component ────────────────────────────────────────────────
export default function PropostaPublicaClient({ proposal }: Props) {
  const imovel = proposal.imoveis
  const [simOpen, setSimOpen] = useState(false)
  const [counterOpen, setCounterOpen] = useState(false)
  const [counterValue, setCounterValue] = useState('')
  const [counterConditions, setCounterConditions] = useState('')
  const [counterSent, setCounterSent] = useState(false)
  const [accepted, setAccepted] = useState(proposal.status === 'accepted')
  const startTime = useRef(Date.now())
  const tracked = useRef(false)

  const proposalId = proposal.id
  const isExpired = proposal.validity_until && new Date(proposal.validity_until) < new Date()

  // Track open
  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    trackEvent(proposalId, 'proposal_opened', {})
  }, [proposalId])

  // Track time on page on unmount
  useEffect(() => {
    return () => {
      const seconds = Math.round((Date.now() - startTime.current) / 1000)
      trackEvent(proposalId, 'proposal_opened', { revisit: true }, seconds)
    }
  }, [proposalId])

  // Estimated financing installment
  const estParcel = (() => {
    if (!proposal.financing_value || !proposal.financing_term_months || !proposal.financing_rate) return null
    const P = proposal.financing_value
    const r = (proposal.financing_rate / 100) / 12
    const n = proposal.financing_term_months
    if (r === 0) return P / n
    return P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  })()

  const paymentRows = [
    proposal.entry_value > 0 && { label: 'Sinal / Entrada', v: proposal.entry_value },
    proposal.financing_value > 0 && { label: `Financiamento${proposal.financing_bank ? ` · ${proposal.financing_bank}` : ''}`, v: proposal.financing_value },
    proposal.consortium_value > 0 && { label: 'Consórcio (carta de crédito)', v: proposal.consortium_value },
    proposal.fgts_value > 0 && { label: 'FGTS', v: proposal.fgts_value },
    proposal.cash_value > 0 && { label: 'À Vista', v: proposal.cash_value },
    proposal.direct_installments_count > 0 && {
      label: `${proposal.direct_installments_count}× parcelas diretas`,
      v: proposal.direct_installments_count * proposal.direct_installments_value,
    },
  ].filter(Boolean) as { label: string; v: number }[]

  async function handleAccept() {
    await fetch('/api/proposals/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId, action: 'accepted' }),
    })
    trackEvent(proposalId, 'proposal_accepted', {})
    setAccepted(true)
  }

  async function handleCounter() {
    await fetch('/api/proposals/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: proposalId,
        action: 'countered',
        counter: { value: parseFloat(counterValue.replace(/[^\d,]/g, '').replace(',', '.')) || null, conditions: counterConditions },
      }),
    })
    trackEvent(proposalId, 'counter_submitted', { value: counterValue })
    setCounterSent(true)
    setCounterOpen(false)
  }

  const whatsappBroker = proposal.broker_phone
    ? `https://wa.me/55${proposal.broker_phone.replace(/\D/g, '')}?text=Olá, tenho interesse na proposta para ${encodeURIComponent(imovel?.titulo ?? 'o imóvel')}`
    : null

  // Colors — luxury dark theme for client page
  const C = {
    bg: '#0D1B2A',
    surface: 'rgba(28,47,66,0.85)',
    elevated: 'rgba(28,47,66,0.6)',
    border: 'rgba(201,168,76,0.18)',
    gold: '#C9A84C',
    goldPale: 'rgba(201,168,76,0.08)',
    text: '#F0EDE8',
    textMuted: '#A8B0BC',
    textDim: '#6B7785',
    white: '#FFFFFF',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Montserrat', sans-serif", fontSize: 14 }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Expired banner */}
      {isExpired && !accepted && (
        <div style={{ background: 'rgba(248,113,113,0.12)', borderBottom: '1px solid rgba(248,113,113,0.2)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <AlertCircle size={14} color="#f87171" />
          <span style={{ fontSize: 12, color: '#f87171', fontWeight: 500 }}>
            Esta proposta expirou em {fmtDate(proposal.validity_until)}
          </span>
        </div>
      )}

      {/* Header */}
      <header style={{ padding: '28px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, letterSpacing: 1, color: C.white }}>
            IMI
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold }}>
            Inteligência Imobiliária
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>Proposta exclusiva para</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{proposal.buyer_name}</div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ paddingTop: 40, paddingBottom: 32 }}
        >
          {imovel?.fotos?.[0] && (
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 24, height: 280, position: 'relative' }}>
              <img
                src={imovel.fotos[0]}
                alt={imovel.titulo}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onLoad={() => trackEvent(proposalId, 'section_viewed', { section: 'photos' })}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(13,27,42,0.7) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: C.white, marginBottom: 4 }}>
                  {imovel.titulo}
                </h1>
                {imovel.endereco && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                    <MapPin size={11} /> {imovel.endereco}
                  </div>
                )}
              </div>
            </div>
          )}

          {!imovel?.fotos?.[0] && (
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: C.white, marginBottom: 8 }}>
                {imovel?.titulo ?? 'Proposta Imobiliária'}
              </h1>
              {imovel?.endereco && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textMuted, fontSize: 13, marginBottom: 24 }}>
                  <MapPin size={13} /> {imovel.endereco}
                </div>
              )}
            </div>
          )}

          {/* Property specs */}
          {imovel && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
              {[
                imovel.quartos && { icon: Bed, val: `${imovel.quartos} quartos` },
                imovel.banheiros && { icon: Bath, val: `${imovel.banheiros} banheiros` },
                imovel.vagas && { icon: Car, val: `${imovel.vagas} vagas` },
                imovel.area_total && { icon: Maximize2, val: `${imovel.area_total}m²` },
              ].filter(Boolean).map(({ icon: Icon, val }: any) => (
                <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textMuted }}>
                  <Icon size={13} color={C.gold} /> {val}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Accepted state */}
        {accepted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 12, padding: 28, textAlign: 'center', marginBottom: 24 }}
          >
            <CheckCircle size={36} color="#34d399" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#34d399', marginBottom: 8 }}>
              Proposta Aceita!
            </h2>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
              O corretor responsável entrará em contato para os próximos passos.
            </p>
          </motion.div>
        )}

        {/* Financial proposal card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}
          onViewportEnter={() => trackEvent(proposalId, 'section_viewed', { section: 'financing' })}
        >
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>
            Condições da Proposta
          </div>

          {/* Main value */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Valor proposto</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 600, color: C.gold, letterSpacing: '-0.01em' }}>
                {fmt(proposal.proposed_value)}
              </div>
            </div>
            {proposal.listed_price && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Valor anunciado</div>
                <div style={{ fontSize: 15, color: C.textMuted, textDecoration: 'line-through' }}>{fmt(proposal.listed_price)}</div>
                {proposal.listed_price > proposal.proposed_value && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', marginTop: 2 }}>
                    -{((proposal.listed_price - proposal.proposed_value) / proposal.listed_price * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment breakdown */}
          {paymentRows.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              {paymentRows.map(({ label, v }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid rgba(201,168,76,0.08)` }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{label}</span>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span>
                </div>
              ))}
              {estParcel && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: C.goldPale, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>Parcela estimada (financiamento)</span>
                  <span style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>≈ {fmt(estParcel)}/mês</span>
                </div>
              )}
            </div>
          )}

          {/* Intercaladas */}
          {proposal.balloon_installments?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Parcelas Intercaladas
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {proposal.balloon_installments.map((b: any, i: number) => (
                  <div key={i} style={{ padding: '6px 12px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.textMuted }}>Mês {b.month}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{fmt(b.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Simulator toggle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}
        >
          <button
            onClick={() => {
              setSimOpen(v => !v)
              if (!simOpen) trackEvent(proposalId, 'simulation_opened', {})
            }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', color: C.text, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calculator size={16} color={C.gold} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Simulador de Financiamento</span>
            </div>
            <ChevronDown
              size={16}
              color={C.textMuted}
              style={{ transform: simOpen ? 'rotate(180deg)' : 'none', transition: '200ms' }}
            />
          </button>
          <AnimatePresence>
            {simOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ padding: '0 20px 20px' }}
              >
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  {estParcel ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { label: 'Valor financiado', v: fmt(proposal.financing_value) },
                        { label: 'Prazo', v: `${proposal.financing_term_months} meses` },
                        { label: 'Taxa estimada', v: `${proposal.financing_rate}% a.a.` },
                        { label: 'Parcela estimada', v: fmt(estParcel), highlight: true },
                        { label: 'Banco', v: proposal.financing_bank || 'A definir' },
                      ].map(({ label, v, highlight }) => (
                        <div key={label} style={{ padding: 12, background: C.elevated, borderRadius: 8, border: highlight ? `1px solid ${C.border}` : 'none' }}>
                          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? C.gold : C.text }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: C.textMuted }}>Detalhes do financiamento não informados nesta proposta.</p>
                  )}
                  <p style={{ fontSize: 10, color: C.textDim, marginTop: 10, lineHeight: 1.6 }}>
                    * Simulação estimada. Valores sujeitos à aprovação de crédito e condições do banco.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Conditions */}
        {(proposal.conditions || proposal.validity_days) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>
              Condições
            </div>
            {proposal.validity_until && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 12px', background: C.goldPale, borderRadius: 8 }}>
                <Clock size={13} color={C.gold} />
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  Válida até <strong style={{ color: C.text }}>{fmtDate(proposal.validity_until)}</strong>
                </span>
              </div>
            )}
            {proposal.conditions && (
              <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.8 }}>{proposal.conditions}</p>
            )}
          </motion.div>
        )}

        {/* CTAs */}
        {!accepted && !isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <button
              onClick={() => {
                trackEvent(proposalId, 'cta_clicked', { cta: 'advance' })
                handleAccept()
              }}
              style={{
                width: '100%', padding: '16px', borderRadius: 10, cursor: 'pointer',
                background: C.gold, border: 'none', color: '#000',
                fontWeight: 700, fontSize: 15, fontFamily: "'Montserrat', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <CheckCircle size={17} />
              Aceitar Proposta
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {whatsappBroker && (
                <a
                  href={whatsappBroker}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent(proposalId, 'whatsapp_clicked', {})}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 10, textDecoration: 'none',
                    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
                    color: '#34d399', fontWeight: 600, fontSize: 13, fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  <MessageCircle size={15} /> Falar com Corretor
                </a>
              )}

              <button
                onClick={() => {
                  setCounterOpen(v => !v)
                  trackEvent(proposalId, 'cta_clicked', { cta: 'counter' })
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(201,168,76,0.08)', border: `1px solid ${C.border}`,
                  color: C.gold, fontWeight: 600, fontSize: 13, fontFamily: "'Montserrat', sans-serif",
                }}
              >
                <RefreshCw size={15} /> Fazer Contraproposta
              </button>
            </div>

            {/* Counter proposal form */}
            <AnimatePresence>
              {counterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Sua Contraproposta</div>
                    <div>
                      <label style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                        Valor sugerido (opcional)
                      </label>
                      <input
                        value={counterValue}
                        onChange={e => setCounterValue(e.target.value)}
                        placeholder="R$ 0"
                        style={{ width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Montserrat', sans-serif" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                        Condições
                      </label>
                      <textarea
                        value={counterConditions}
                        onChange={e => setCounterConditions(e.target.value)}
                        rows={3}
                        placeholder="Ex.: aceito com inclusão de armários embutidos..."
                        style={{ width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Montserrat', sans-serif", resize: 'vertical', lineHeight: 1.6 }}
                      />
                    </div>
                    <button
                      onClick={handleCounter}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: C.gold, border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}
                    >
                      <Send size={14} /> Enviar Contraproposta
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {counterSent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, fontSize: 13, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <CheckCircle size={14} /> Contraproposta enviada! O corretor entrará em contato.
              </motion.div>
            )}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textDim }}>
          IMI · Inteligência Imobiliária · Recife, PE
        </div>
      </footer>
    </div>
  )
}
