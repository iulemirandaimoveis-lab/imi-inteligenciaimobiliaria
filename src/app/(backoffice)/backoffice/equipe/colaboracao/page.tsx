'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, Building2, MessageSquare, Plus, ChevronRight,
  DollarSign, Handshake, X, Check, Clock, TrendingUp,
} from 'lucide-react'

/* ─── Mock Data ──────────────────────────────────────────────────── */

interface Broker {
  id: string
  name: string
  initials: string
  color: string
  role: string
  online: boolean
  lastSeen?: string
}

interface Deal {
  id: string
  property: string
  neighborhood: string
  price: string
  stage: 'visita' | 'proposta' | 'negociacao' | 'contrato'
  brokers: Broker[]
  splitPct: number[]
  daysActive: number
  thumbnail?: string
}

interface PartnershipInvite {
  id: string
  fromBroker: Broker
  property: string
  neighborhood: string
  price: string
  yourSplit: number
  message: string
  sentAt: string
}

const BROKERS: Broker[] = [
  { id: '1', name: 'Rodrigo Mendonça', initials: 'RM', color: '#5B9BD5', role: 'Corretor Sênior', online: true },
  { id: '2', name: 'Carla Figueiredo', initials: 'CF', color: '#D4913A', role: 'Corretora', online: true },
  { id: '3', name: 'Paulo Almeida', initials: 'PA', color: '#5DB887', role: 'Corretor', online: false, lastSeen: 'há 2h' },
  { id: '4', name: 'Isabela Rocha', initials: 'IR', color: '#E06B6B', role: 'Corretora Sênior', online: true },
  { id: '5', name: 'Fernando Costa', initials: 'FC', color: '#9B8FD5', role: 'Corretor', online: false, lastSeen: 'há 1d' },
  { id: '6', name: 'Mariana Lima', initials: 'ML', color: '#D4913A', role: 'Coordenadora', online: true },
]

const DEALS: Deal[] = [
  {
    id: 'd1',
    property: 'Residencial Miramar Prime',
    neighborhood: 'Miramar',
    price: 'R$ 1,85M',
    stage: 'negociacao',
    brokers: [BROKERS[0], BROKERS[1]],
    splitPct: [60, 40],
    daysActive: 14,
  },
  {
    id: 'd2',
    property: 'Cobertura Boa Viagem 304',
    neighborhood: 'Boa Viagem',
    price: 'R$ 2,4M',
    stage: 'proposta',
    brokers: [BROKERS[3], BROKERS[0]],
    splitPct: [55, 45],
    daysActive: 7,
  },
  {
    id: 'd3',
    property: 'Studio Recife Antigo',
    neighborhood: 'Recife Antigo',
    price: 'R$ 620K',
    stage: 'contrato',
    brokers: [BROKERS[2], BROKERS[5]],
    splitPct: [50, 50],
    daysActive: 28,
  },
  {
    id: 'd4',
    property: 'Apartamento Graças Tower',
    neighborhood: 'Graças',
    price: 'R$ 980K',
    stage: 'visita',
    brokers: [BROKERS[1]],
    splitPct: [100],
    daysActive: 3,
  },
]

const INVITES: PartnershipInvite[] = [
  {
    id: 'i1',
    fromBroker: BROKERS[4],
    property: 'Duplex Espinheiro Gardens',
    neighborhood: 'Espinheiro',
    price: 'R$ 1,3M',
    yourSplit: 40,
    message: 'Tenho cliente qualificado mas o imóvel está na sua carteira. Topas dividir? Posso entrar com a captação do comprador.',
    sentAt: 'há 3h',
  },
  {
    id: 'i2',
    fromBroker: BROKERS[3],
    property: 'Casa Casa Forte Residencial',
    neighborhood: 'Casa Forte',
    price: 'R$ 2,1M',
    yourSplit: 45,
    message: 'Conheço o proprietário há anos. Quero co-brokar com você que tem experiência nesse ticket. Pode ser uma parceria incrível.',
    sentAt: 'há 1d',
  },
]

/* ─── Stage config ───────────────────────────────────────────────── */
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  visita: { label: 'Visita', color: '#5B9BD5' },
  proposta: { label: 'Proposta', color: '#D4913A' },
  negociacao: { label: 'Negociação', color: 'var(--accent-400)' },
  contrato: { label: 'Contrato', color: 'var(--success)' },
}

/* ─── Nova Parceria Modal ────────────────────────────────────────── */
function NovaParceriaModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null)
  const [mySplit, setMySplit] = useState(50)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const mockProperties = [
    'Residencial Pina Sky',
    'Cobertura Derby 801',
    'Apartamento Boa Vista Premium',
    'Studio Tamarineira',
  ]

  function handleSend() {
    if (!selectedProperty || !selectedBroker) return
    setSent(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.3)', borderRadius: 8, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(61,111,255,0.12)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(61,111,255,0.04)' }}>
          <Handshake size={16} style={{ color: 'var(--accent-400)' }} />
          <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>Nova Parceria</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={16} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        {sent ? (
          <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(93,184,135,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} style={{ color: 'var(--success)' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>Convite enviado!</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)', textAlign: 'center' }}>
              {selectedBroker?.name} receberá sua proposta de parceria.
            </p>
          </div>
        ) : (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= s ? 'var(--accent-400)' : 'rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: step >= s ? '#0B1120' : 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{s}</div>
                  <span style={{ fontSize: 11, color: step >= s ? 'var(--accent-400)' : 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{s === 1 ? 'Imóvel & Corretor' : 'Split & Mensagem'}</span>
                  {s < 2 && <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <>
                {/* Property select */}
                <div>
                  <label style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700, display: 'block', marginBottom: 8 }}>Imóvel</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {mockProperties.map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedProperty(p)}
                        style={{ padding: '10px 14px', borderRadius: 6, background: selectedProperty === p ? 'rgba(61,111,255,0.12)' : 'rgba(255,255,255,0.04)', border: selectedProperty === p ? '1px solid rgba(61,111,255,0.4)' : '1px solid rgba(255,255,255,0.08)', color: selectedProperty === p ? 'var(--accent-400)' : 'var(--text-primary)', fontSize: 12, textAlign: 'left', fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <Building2 size={13} />
                        {p}
                        {selectedProperty === p && <Check size={12} style={{ marginLeft: 'auto', color: 'var(--accent-400)' }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Broker select */}
                <div>
                  <label style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700, display: 'block', marginBottom: 8 }}>Convidar Corretor</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {BROKERS.filter(b => b.id !== '1').map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBroker(b)}
                        style={{ padding: '10px 12px', borderRadius: 6, background: selectedBroker?.id === b.id ? `${b.color}18` : 'rgba(255,255,255,0.04)', border: selectedBroker?.id === b.id ? `1px solid ${b.color}50` : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{b.initials}</div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{b.name.split(' ')[0]}</p>
                          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{b.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { if (selectedProperty && selectedBroker) setStep(2) }}
                  disabled={!selectedProperty || !selectedBroker}
                  style={{ padding: '10px', borderRadius: 6, background: selectedProperty && selectedBroker ? 'var(--btn-primary-bg, var(--accent-400))' : 'rgba(255,255,255,0.06)', border: 'none', color: selectedProperty && selectedBroker ? '#0B1120' : 'var(--text-tertiary)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)', cursor: selectedProperty && selectedBroker ? 'pointer' : 'not-allowed' }}
                >
                  Próximo
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Split slider */}
                <div>
                  <label style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700, display: 'block', marginBottom: 12 }}>Split de Comissão</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontFamily: 'var(--font-dm-mono)', color: 'var(--accent-400)', fontWeight: 400 }}>{mySplit}%</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>Você</div>
                    </div>
                    <div style={{ flex: 1, height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${mySplit}%`, background: 'linear-gradient(90deg, var(--accent-400), #D4913A)', borderRadius: 6, transition: 'width 0.15s' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontFamily: 'var(--font-dm-mono)', color: '#5B9BD5', fontWeight: 400 }}>{100 - mySplit}%</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{selectedBroker?.name.split(' ')[0]}</div>
                    </div>
                  </div>
                  <input
                    type="range" min={10} max={90} step={5} value={mySplit}
                    onChange={e => setMySplit(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-400)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>10%</span>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>50/50</span>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>90%</span>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700, display: 'block', marginBottom: 8 }}>Mensagem (opcional)</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Explique a oportunidade de parceria…"
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(61,111,255,0.2)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-outfit, sans-serif)', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: '10px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(61,111,255,0.2)', color: 'var(--accent-400)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>Voltar</button>
                  <button onClick={handleSend} style={{ flex: 2, padding: '10px', borderRadius: 6, background: 'var(--btn-primary-bg, var(--accent-400))', border: 'none', color: '#0B1120', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Handshake size={13} /> Enviar Convite
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Shared Notes Modal ─────────────────────────────────────────── */
function SharedNotesModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const [notes, setNotes] = useState('- Cliente: Pedro Alves Barros\n- Visita agendada para quinta-feira 14h\n- Interesse em financiamento CEF\n- Casal com 2 filhos, quer escola por perto\n')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.3)', borderRadius: 8, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(61,111,255,0.12)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(61,111,255,0.04)' }}>
          <MessageSquare size={15} style={{ color: 'var(--accent-400)' }} />
          <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>Notas — {deal.property}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={15} style={{ color: 'var(--text-tertiary)' }} /></button>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={8}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(61,111,255,0.2)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-outfit, sans-serif)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(61,111,255,0.2)', color: 'var(--accent-400)', fontSize: 12, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={onClose} style={{ flex: 2, padding: '9px', borderRadius: 6, background: 'var(--btn-primary-bg, var(--accent-400))', border: 'none', color: '#0B1120', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>Salvar Notas</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Deal Card ──────────────────────────────────────────────────── */
function DealCard({ deal, onNotes }: { deal: Deal; onNotes: (d: Deal) => void }) {
  const stage = STAGE_CONFIG[deal.stage]

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.15)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(61,111,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)', marginBottom: 2 }}>{deal.property}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{deal.neighborhood} · {deal.price}</p>
          </div>
          <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 20, background: `${stage.color}18`, border: `1px solid ${stage.color}40`, fontSize: 10, fontWeight: 700, color: stage.color, fontFamily: 'var(--font-outfit, sans-serif)', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {stage.label}
          </span>
        </div>

        {/* Brokers + split */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {deal.brokers.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{b.initials}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{b.name}</p>
              </div>
              {deal.brokers.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <DollarSign size={11} style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-dm-mono)', color: 'var(--success)', fontWeight: 600 }}>{deal.splitPct[i]}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card footer */}
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{deal.daysActive}d ativo</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onNotes(deal)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}
          >
            <MessageSquare size={10} /> Notas
          </button>
          <Link href="/backoffice/omnichannel">
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>
              <MessageSquare size={10} /> Chat
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ColaboracaoPage() {
  const [showModal, setShowModal] = useState(false)
  const [notesDeal, setNotesDeal] = useState<Deal | null>(null)
  const [invites, setInvites] = useState(INVITES)

  function acceptInvite(id: string) { setInvites(prev => prev.filter(i => i.id !== id)) }
  function declineInvite(id: string) { setInvites(prev => prev.filter(i => i.id !== id)) }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
      {/* Header */}
      <header style={{ padding: '24px 32px 20px', borderBottom: '1px solid rgba(61,111,255,0.12)', background: 'var(--bg-elevated)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(61,111,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(61,111,255,0.015) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: 'var(--accent-400)', fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700 }}>IMI</span>
            <span style={{ color: 'rgba(61,111,255,0.3)', fontSize: 11 }}>›</span>
            <Link href="/backoffice/equipe"><span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>Equipe</span></Link>
            <span style={{ color: 'rgba(61,111,255,0.3)', fontSize: 11 }}>›</span>
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: 'var(--accent-400)', fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700 }}>Colaboração</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.1 }}>
                IMI <em style={{ fontStyle: 'italic', color: 'var(--accent-400)' }}>Connect</em>
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 300 }}>
                Co-brokagem · parcerias · notas compartilhadas · splits de comissão
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 6, background: 'var(--btn-primary-bg, var(--accent-400))', border: 'none', color: '#0B1120', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}
            >
              <Plus size={14} /> Nova Parceria
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── Section 1: Em Andamento ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <TrendingUp size={15} style={{ color: 'var(--accent-400)' }} />
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: 'var(--accent-400)', fontWeight: 700 }}>Em Andamento</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>— {DEALS.length} negócios ativos</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {DEALS.map(deal => (
              <DealCard key={deal.id} deal={deal} onNotes={setNotesDeal} />
            ))}
          </div>
        </section>

        {/* ── Section 2: Convites de Parceria ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Handshake size={15} style={{ color: '#5B9BD5' }} />
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#5B9BD5', fontWeight: 700 }}>Convites de Parceria</span>
            {invites.length > 0 && (
              <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 10, background: '#5B9BD520', border: '1px solid #5B9BD540', fontSize: 10, fontWeight: 700, color: '#5B9BD5' }}>{invites.length}</span>
            )}
          </div>

          {invites.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.1)', borderRadius: 8 }}>
              <Handshake size={32} style={{ color: 'rgba(61,111,255,0.2)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>Nenhum convite pendente</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {invites.map(invite => (
                <div key={invite.id} style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(91,155,213,0.2)', borderRadius: 8, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Broker avatar */}
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: invite.fromBroker.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {invite.fromBroker.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)', marginBottom: 2 }}>{invite.fromBroker.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{invite.fromBroker.role} · {invite.sentAt}</p>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(93,184,135,0.1)', border: '1px solid rgba(93,184,135,0.3)', fontSize: 11, fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
                          <DollarSign size={10} /> Sua parte: {invite.yourSplit}%
                        </span>
                      </div>
                      {/* Property info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', padding: '8px 12px', borderRadius: 6, background: 'rgba(61,111,255,0.05)', border: '1px solid rgba(61,111,255,0.12)' }}>
                        <Building2 size={13} style={{ color: 'var(--accent-400)', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{invite.property}</p>
                          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{invite.neighborhood} · {invite.price}</p>
                        </div>
                      </div>
                      {/* Message */}
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-outfit, sans-serif)', lineHeight: 1.6, marginBottom: 12 }}>
                        "{invite.message}"
                      </p>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => acceptInvite(invite.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 6, background: 'rgba(93,184,135,0.12)', border: '1px solid rgba(93,184,135,0.3)', color: 'var(--success)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>
                          <Check size={12} /> Aceitar
                        </button>
                        <button onClick={() => declineInvite(invite.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 6, background: 'rgba(224,107,107,0.08)', border: '1px solid rgba(224,107,107,0.2)', color: 'var(--error)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>
                          <X size={12} /> Recusar
                        </button>
                        <Link href="/backoffice/omnichannel">
                          <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>
                            <MessageSquare size={12} /> Chat
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 3: Minha Equipe ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Users size={15} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: 'var(--success)', fontWeight: 700 }}>Minha Equipe</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>— {BROKERS.filter(b => b.online).length} online agora</span>
          </div>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.12)', borderRadius: 8, overflow: 'hidden' }}>
            {BROKERS.map((broker, i) => (
              <div
                key={broker.id}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < BROKERS.length - 1 ? '1px solid rgba(61,111,255,0.06)' : 'none' }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: broker.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{broker.initials}</div>
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: broker.online ? 'var(--success)' : 'var(--text-tertiary)', border: '2px solid var(--bg-elevated)' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)', marginBottom: 2 }}>{broker.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{broker.role}</p>
                </div>

                {/* Online status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  {broker.online ? (
                    <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-outfit, sans-serif)' }}>Online</span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{broker.lastSeen}</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setShowModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: 'rgba(61,111,255,0.06)', border: '1px solid rgba(61,111,255,0.18)', color: 'var(--accent-400)', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}
                  >
                    <Handshake size={10} /> Convidar
                  </button>
                  <Link href="/backoffice/omnichannel">
                    <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>
                      <MessageSquare size={10} /> Mensagem
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modals */}
      {showModal && <NovaParceriaModal onClose={() => setShowModal(false)} />}
      {notesDeal && <SharedNotesModal deal={notesDeal} onClose={() => setNotesDeal(null)} />}
    </div>
  )
}
