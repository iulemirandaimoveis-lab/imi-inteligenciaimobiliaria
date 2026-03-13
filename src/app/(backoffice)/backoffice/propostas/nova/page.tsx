'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Building2, DollarSign, FileText, Send,
  ChevronLeft, ChevronRight, Plus, Trash2, Info,
  CheckCircle, AlertCircle, Banknote, CreditCard,
  Users, Calendar, Percent, Hash
} from 'lucide-react'
import { T, cardStyle, inputStyle } from '@/app/(backoffice)/lib/theme'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────
interface BalloonInstallment { month: number; value: number }

interface FormData {
  // Partes
  buyer_name: string
  buyer_cpf: string
  buyer_email: string
  buyer_phone: string
  buyer_marital_status: string
  buyer_profession: string
  seller_name: string
  seller_cpf: string
  // Imóvel
  property_id: string
  lead_id: string
  listed_price: string
  proposed_value: string
  // Pagamento
  payment_type: 'cash' | 'financing' | 'consortium' | 'direct' | 'mixed'
  entry_value: string
  financing_value: string
  financing_bank: string
  financing_term_months: string
  financing_rate: string
  consortium_value: string
  fgts_value: string
  cash_value: string
  direct_installments_count: string
  direct_installments_value: string
  balloon_installments: BalloonInstallment[]
  // Condições
  validity_days: string
  conditions: string
  commission_pct: string
  commission_who_pays: 'buyer' | 'seller' | 'split'
  notes: string
}

const INITIAL: FormData = {
  buyer_name: '', buyer_cpf: '', buyer_email: '', buyer_phone: '',
  buyer_marital_status: '', buyer_profession: '',
  seller_name: '', seller_cpf: '',
  property_id: '', lead_id: '',
  listed_price: '', proposed_value: '',
  payment_type: 'financing',
  entry_value: '', financing_value: '', financing_bank: '',
  financing_term_months: '360', financing_rate: '10.99',
  consortium_value: '', fgts_value: '', cash_value: '',
  direct_installments_count: '', direct_installments_value: '',
  balloon_installments: [],
  validity_days: '3', conditions: '',
  commission_pct: '6', commission_who_pays: 'seller',
  notes: '',
}

const STEPS = [
  { id: 'parties',   label: 'Partes',     icon: Users },
  { id: 'property',  label: 'Imóvel',     icon: Building2 },
  { id: 'payment',   label: 'Pagamento',  icon: DollarSign },
  { id: 'terms',     label: 'Condições',  icon: FileText },
  { id: 'review',    label: 'Revisão',    icon: CheckCircle },
]

const fmt = (v: string | number) => {
  const n = typeof v === 'string' ? parseFloat(v.replace(/\D/g, '')) / 100 : v
  if (!n || isNaN(n)) return 'R$ 0'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

const parseMoney = (v: string) => parseFloat(v.replace(/[^\d,]/g, '').replace(',', '.')) || 0

// ── Sub-components ───────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: T.textDim }}>{hint}</span>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', ...rest }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        ...inputStyle,
        padding: '10px 14px',
        fontSize: 13,
        width: '100%',
        color: T.text,
      }}
      {...rest}
    />
  )
}

function Select({ value, onChange, children }: any) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...inputStyle,
        padding: '10px 14px',
        fontSize: 13,
        width: '100%',
        color: T.text,
        cursor: 'pointer',
      }}
    >
      {children}
    </select>
  )
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  )
}

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: T.text, fontWeight: 500 }}>
        {title}
      </h2>
      {children}
    </motion.div>
  )
}

function PaymentTag({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', borderRadius: T.radius.md, cursor: 'pointer',
        border: `1px solid ${active ? T.accent : T.border}`,
        background: active ? T.accentBg : T.surface,
        color: active ? T.accent : T.textMuted,
        fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
        transition: T.transition.normal,
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function NovaPropostaPage() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>({
    ...INITIAL,
    property_id: params.get('property_id') ?? '',
    lead_id: params.get('lead_id') ?? '',
  })
  const [imoveis, setImoveis] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof FormData) => (val: any) =>
    setForm(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    supabase.from('developments').select('id, name, price_min, address').limit(100)
      .then(({ data }) => data && setImoveis(data))
    supabase.from('leads').select('id, name, email, phone').limit(100)
      .then(({ data }) => data && setLeads(data))
  }, [])

  // Auto-fill listed price when property selected
  useEffect(() => {
    const imovel = imoveis.find(i => i.id === form.property_id)
    if (imovel?.price_min && !form.listed_price) {
      setForm(prev => ({
        ...prev,
        listed_price: String(imovel.price_min),
        proposed_value: prev.proposed_value || String(imovel.price_min),
      }))
    }
  }, [form.property_id, imoveis])

  // Auto-fill buyer from lead
  useEffect(() => {
    const lead = leads.find(l => l.id === form.lead_id)
    if (lead && !form.buyer_name) {
      setForm(prev => ({
        ...prev,
        buyer_name: prev.buyer_name || lead.name || '',
        buyer_email: prev.buyer_email || lead.email || '',
        buyer_phone: prev.buyer_phone || lead.phone || '',
      }))
    }
  }, [form.lead_id, leads])

  function addBalloon() {
    setForm(prev => ({
      ...prev,
      balloon_installments: [...prev.balloon_installments, { month: 6, value: 0 }]
    }))
  }

  function removeBalloon(idx: number) {
    setForm(prev => ({
      ...prev,
      balloon_installments: prev.balloon_installments.filter((_, i) => i !== idx)
    }))
  }

  function updateBalloon(idx: number, field: 'month' | 'value', val: number) {
    setForm(prev => {
      const arr = [...prev.balloon_installments]
      arr[idx] = { ...arr[idx], [field]: val }
      return { ...prev, balloon_installments: arr }
    })
  }

  async function handleSave(sendNow = false) {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const imovel = imoveis.find(i => i.id === form.property_id)

      const payload = {
        broker_id: user?.id,
        property_id: form.property_id || null,
        lead_id: form.lead_id || null,
        buyer_name: form.buyer_name,
        buyer_cpf: form.buyer_cpf,
        buyer_email: form.buyer_email,
        buyer_phone: form.buyer_phone,
        buyer_marital_status: form.buyer_marital_status,
        buyer_profession: form.buyer_profession,
        seller_name: form.seller_name,
        seller_cpf: form.seller_cpf,
        property_snapshot: imovel ? { titulo: imovel.titulo, endereco: imovel.endereco } : null,
        listed_price: parseMoney(form.listed_price) || null,
        proposed_value: parseMoney(form.proposed_value),
        entry_value: parseMoney(form.entry_value),
        financing_value: parseMoney(form.financing_value),
        financing_bank: form.financing_bank,
        financing_term_months: parseInt(form.financing_term_months) || null,
        financing_rate: parseFloat(form.financing_rate) || null,
        consortium_value: parseMoney(form.consortium_value),
        fgts_value: parseMoney(form.fgts_value),
        cash_value: parseMoney(form.cash_value),
        direct_installments_count: parseInt(form.direct_installments_count) || 0,
        direct_installments_value: parseMoney(form.direct_installments_value),
        balloon_installments: form.balloon_installments,
        validity_days: parseInt(form.validity_days) || 3,
        validity_until: new Date(Date.now() + (parseInt(form.validity_days) || 3) * 86400000).toISOString(),
        conditions: form.conditions,
        commission_pct: parseFloat(form.commission_pct) || null,
        commission_who_pays: form.commission_who_pays,
        notes: form.notes,
        status: sendNow ? 'sent' : 'draft',
        sent_at: sendNow ? new Date().toISOString() : null,
      }

      const { data, error: err } = await supabase
        .from('proposals')
        .insert(payload)
        .select('id, token')
        .single()

      if (err) throw err

      if (sendNow && data) {
        await supabase.from('proposal_events').insert({
          proposal_id: data.id,
          event_type: 'proposal_sent',
          metadata: { channel: 'link' },
        })
      }

      router.push(`/backoffice/propostas/${data.id}`)
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar proposta')
    } finally {
      setSaving(false)
    }
  }

  const totalPayment =
    parseMoney(form.entry_value) +
    parseMoney(form.financing_value) +
    parseMoney(form.consortium_value) +
    parseMoney(form.fgts_value) +
    parseMoney(form.cash_value) +
    (parseInt(form.direct_installments_count) || 0) * parseMoney(form.direct_installments_value)

  const proposed = parseMoney(form.proposed_value)
  const discount = form.listed_price
    ? ((parseMoney(form.listed_price) - proposed) / parseMoney(form.listed_price)) * 100
    : 0

  // ── Steps ─────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0: return (
        <StepCard title="Identificação das Partes">
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.accent, marginBottom: 16 }}>
              Comprador
            </h3>
            <Grid cols={2}>
              <Field label="Nome completo *">
                <Input value={form.buyer_name} onChange={set('buyer_name')} placeholder="Nome do comprador" />
              </Field>
              <Field label="CPF">
                <Input value={form.buyer_cpf} onChange={set('buyer_cpf')} placeholder="000.000.000-00" />
              </Field>
              <Field label="E-mail">
                <Input value={form.buyer_email} onChange={set('buyer_email')} type="email" placeholder="email@exemplo.com" />
              </Field>
              <Field label="Telefone">
                <Input value={form.buyer_phone} onChange={set('buyer_phone')} placeholder="(81) 99999-9999" />
              </Field>
              <Field label="Estado civil">
                <Select value={form.buyer_marital_status} onChange={set('buyer_marital_status')}>
                  <option value="">Selecione</option>
                  <option value="solteiro">Solteiro(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viuvo">Viúvo(a)</option>
                  <option value="uniao_estavel">União Estável</option>
                </Select>
              </Field>
              <Field label="Profissão">
                <Input value={form.buyer_profession} onChange={set('buyer_profession')} placeholder="Ex.: empresário" />
              </Field>
            </Grid>
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.accent, marginBottom: 16 }}>
              Vendedor
            </h3>
            <Grid cols={2}>
              <Field label="Nome do vendedor">
                <Input value={form.seller_name} onChange={set('seller_name')} placeholder="Nome do proprietário" />
              </Field>
              <Field label="CPF do vendedor">
                <Input value={form.seller_cpf} onChange={set('seller_cpf')} placeholder="000.000.000-00" />
              </Field>
            </Grid>
          </div>
        </StepCard>
      )

      case 1: return (
        <StepCard title="Imóvel & Valores">
          <Grid cols={2}>
            <Field label="Lead (comprador no CRM)">
              <Select value={form.lead_id} onChange={set('lead_id')}>
                <option value="">— Selecionar lead —</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.name} {l.phone ? `· ${l.phone}` : ''}</option>
                ))}
              </Select>
            </Field>
            <Field label="Imóvel">
              <Select value={form.property_id} onChange={set('property_id')}>
                <option value="">— Selecionar imóvel —</option>
                {imoveis.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
            </Field>
          </Grid>

          <div style={{ height: 1, background: T.border }} />

          <Grid cols={2}>
            <Field label="Valor anunciado" hint="Preço de tabela do imóvel">
              <Input value={form.listed_price} onChange={set('listed_price')} placeholder="R$ 0" />
            </Field>
            <Field label="Valor proposto *" hint={discount > 0 ? `Desconto de ${discount.toFixed(1)}%` : undefined}>
              <Input value={form.proposed_value} onChange={set('proposed_value')} placeholder="R$ 0" />
            </Field>
          </Grid>

          {proposed > 0 && form.listed_price && (
            <div style={{
              ...cardStyle,
              padding: '12px 16px',
              background: discount > 0 ? 'rgba(251,191,36,0.06)' : T.accentBg,
              borderColor: discount > 0 ? 'rgba(251,191,36,0.2)' : T.borderGold,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Info size={14} color={discount > 0 ? '#fbbf24' : T.accent} />
              <span style={{ fontSize: 12, color: discount > 0 ? '#fbbf24' : T.accent }}>
                {discount > 0
                  ? `Proposta ${discount.toFixed(1)}% abaixo do valor anunciado (${fmt(parseMoney(form.listed_price))})`
                  : `Proposta no valor de tabela`}
              </span>
            </div>
          )}
        </StepCard>
      )

      case 2: return (
        <StepCard title="Composição do Pagamento">
          <div>
            <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 12 }}>
              TIPO DE OPERAÇÃO — selecione todos que se aplicam
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'financing', icon: Banknote, label: 'Financiamento' },
                { key: 'cash', icon: DollarSign, label: 'À Vista' },
                { key: 'consortium', icon: CreditCard, label: 'Consórcio' },
                { key: 'direct', icon: Hash, label: 'Direto c/ Vendedor' },
              ].map(({ key, icon, label }) => (
                <PaymentTag
                  key={key}
                  active={form.payment_type === key}
                  onClick={() => set('payment_type')(key as any)}
                  icon={icon}
                  label={label}
                />
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: T.border }} />

          {/* Entrada / Sinal */}
          <Grid cols={2}>
            <Field label="Sinal / Entrada" hint="Valor pago na assinatura da proposta">
              <Input value={form.entry_value} onChange={set('entry_value')} placeholder="R$ 0" />
            </Field>
            <Field label="FGTS">
              <Input value={form.fgts_value} onChange={set('fgts_value')} placeholder="R$ 0" />
            </Field>
          </Grid>

          {/* Financiamento */}
          {(form.payment_type === 'financing' || form.payment_type === 'mixed') && (
            <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.accent }}>
                Financiamento Bancário
              </h4>
              <Grid cols={2}>
                <Field label="Valor financiado">
                  <Input value={form.financing_value} onChange={set('financing_value')} placeholder="R$ 0" />
                </Field>
                <Field label="Banco">
                  <Select value={form.financing_bank} onChange={set('financing_bank')}>
                    <option value="">— Banco —</option>
                    <option value="Caixa">Caixa Econômica Federal</option>
                    <option value="Bradesco">Bradesco</option>
                    <option value="Itaú">Itaú</option>
                    <option value="Santander">Santander</option>
                    <option value="BB">Banco do Brasil</option>
                    <option value="Outros">Outros</option>
                  </Select>
                </Field>
                <Field label="Prazo (meses)">
                  <Input value={form.financing_term_months} onChange={set('financing_term_months')} type="number" placeholder="360" />
                </Field>
                <Field label="Taxa a.a. (%)" hint="Usada para estimativa de parcela">
                  <Input value={form.financing_rate} onChange={set('financing_rate')} type="number" step="0.01" placeholder="10.99" />
                </Field>
              </Grid>
            </div>
          )}

          {/* Consórcio */}
          {(form.payment_type === 'consortium') && (
            <Field label="Valor da carta de crédito (consórcio)">
              <Input value={form.consortium_value} onChange={set('consortium_value')} placeholder="R$ 0" />
            </Field>
          )}

          {/* Parcelamento direto */}
          {(form.payment_type === 'direct') && (
            <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.accent }}>
                Parcelas Diretas
              </h4>
              <Grid cols={2}>
                <Field label="Nº de parcelas mensais">
                  <Input value={form.direct_installments_count} onChange={set('direct_installments_count')} type="number" placeholder="36" />
                </Field>
                <Field label="Valor de cada parcela">
                  <Input value={form.direct_installments_value} onChange={set('direct_installments_value')} placeholder="R$ 0" />
                </Field>
              </Grid>

              {/* Intercaladas */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>
                    Parcelas Intercaladas
                  </span>
                  <button
                    onClick={addBalloon}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.accentBg, border: `1px solid ${T.borderGold}`, borderRadius: T.radius.sm, padding: '5px 10px', color: T.accent, fontSize: 11, cursor: 'pointer' }}
                  >
                    <Plus size={12} /> Adicionar
                  </button>
                </div>
                {form.balloon_installments.map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                    <Input value={String(b.month)} onChange={(v: string) => updateBalloon(idx, 'month', parseInt(v) || 0)} placeholder="Mês" type="number" />
                    <Input value={String(b.value)} onChange={(v: string) => updateBalloon(idx, 'value', parseFloat(v) || 0)} placeholder="Valor R$" type="number" />
                    <button onClick={() => removeBalloon(idx)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo */}
          {proposed > 0 && (
            <div style={{ ...cardStyle, padding: 16, background: T.accentBg, borderColor: T.borderGold }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Valor proposto', v: proposed },
                  { label: 'Composição total', v: totalPayment },
                ].map(({ label, v }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</div>
                  </div>
                ))}
              </div>
              {Math.abs(totalPayment - proposed) > 1 && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={12} />
                  Diferença de {fmt(Math.abs(totalPayment - proposed))} — verifique a composição
                </div>
              )}
            </div>
          )}
        </StepCard>
      )

      case 3: return (
        <StepCard title="Condições da Proposta">
          <Grid cols={3}>
            <Field label="Validade (dias)" hint="Prazo para resposta do vendedor">
              <Input value={form.validity_days} onChange={set('validity_days')} type="number" placeholder="3" />
            </Field>
            <Field label="Comissão (%)">
              <Input value={form.commission_pct} onChange={set('commission_pct')} type="number" step="0.5" placeholder="6" />
            </Field>
            <Field label="Quem paga a comissão">
              <Select value={form.commission_who_pays} onChange={set('commission_who_pays')}>
                <option value="seller">Vendedor</option>
                <option value="buyer">Comprador</option>
                <option value="split">Dividido</option>
              </Select>
            </Field>
          </Grid>

          <Field label="Condicionantes" hint="Ex.: sujeita a aprovação de financiamento, vistoria de engenharia, etc.">
            <textarea
              value={form.conditions}
              onChange={e => set('conditions')(e.target.value)}
              rows={4}
              placeholder="Descreva as condições para aceite da proposta..."
              style={{ ...inputStyle, padding: '10px 14px', fontSize: 13, width: '100%', color: T.text, resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>

          <Field label="Notas internas (visível apenas para você)">
            <textarea
              value={form.notes}
              onChange={e => set('notes')(e.target.value)}
              rows={3}
              placeholder="Observações estratégicas, histórico de negociação..."
              style={{ ...inputStyle, padding: '10px 14px', fontSize: 13, width: '100%', color: T.text, resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>
        </StepCard>
      )

      case 4: return (
        <StepCard title="Revisão Final">
          {[
            {
              section: 'Comprador', items: [
                ['Nome', form.buyer_name],
                ['CPF', form.buyer_cpf],
                ['E-mail', form.buyer_email],
                ['Telefone', form.buyer_phone],
              ]
            },
            {
              section: 'Valores', items: [
                ['Valor anunciado', form.listed_price ? fmt(parseMoney(form.listed_price)) : '—'],
                ['Valor proposto', form.proposed_value ? fmt(parseMoney(form.proposed_value)) : '—'],
                ['Sinal/Entrada', form.entry_value ? fmt(parseMoney(form.entry_value)) : 'R$ 0'],
                ['Financiamento', form.financing_value ? fmt(parseMoney(form.financing_value)) : 'R$ 0'],
                ['FGTS', form.fgts_value ? fmt(parseMoney(form.fgts_value)) : 'R$ 0'],
              ]
            },
            {
              section: 'Condições', items: [
                ['Validade', `${form.validity_days} dias`],
                ['Comissão', `${form.commission_pct}%`],
                ['Quem paga', form.commission_who_pays === 'seller' ? 'Vendedor' : form.commission_who_pays === 'buyer' ? 'Comprador' : 'Dividido'],
              ]
            },
          ].map(({ section, items }) => (
            <div key={section} style={{ ...cardStyle, padding: 20 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.accent, marginBottom: 14 }}>
                {section}
              </h4>
              {items.map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.borderSubtle}` }}>
                  <span style={{ fontSize: 12, color: T.textMuted }}>{k}</span>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{v}</span>
                </div>
              ) : null)}
            </div>
          ))}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: T.radius.md }}>
              <AlertCircle size={14} color="#f87171" />
              <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !form.buyer_name || !form.proposed_value}
              style={{
                flex: 1, padding: '12px 20px', borderRadius: T.radius.md, cursor: 'pointer',
                background: T.surface, border: `1px solid ${T.border}`,
                color: T.text, fontSize: 13, fontWeight: 600,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Salvando...' : 'Salvar como Rascunho'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !form.buyer_name || !form.proposed_value}
              style={{
                flex: 2, padding: '12px 20px', borderRadius: T.radius.md, cursor: 'pointer',
                background: T.accent, border: 'none',
                color: '#000', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Send size={14} />
              {saving ? 'Enviando...' : 'Salvar & Enviar Link'}
            </button>
          </div>
        </StepCard>
      )

      default: return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '32px 24px', maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 13 }}
        >
          <ChevronLeft size={16} /> Voltar
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted }}>
          Nova Proposta
        </span>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 40 }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const done = i < step
          const active = i === step
          return (
            <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: '100%', height: 3, borderRadius: 2,
                background: done || active ? T.accent : T.border,
                opacity: done ? 0.6 : 1,
                transition: T.transition.normal,
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon size={12} color={active ? T.accent : done ? T.textMuted : T.textDim} />
                <span style={{ fontSize: 10, color: active ? T.accent : done ? T.textMuted : T.textDim, fontWeight: active ? 700 : 400, letterSpacing: '0.04em' }}>
                  {s.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      {/* Navigation */}
      {step < 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: T.radius.md, cursor: step === 0 ? 'default' : 'pointer',
              background: T.surface, border: `1px solid ${T.border}`,
              color: step === 0 ? T.textDim : T.text, fontSize: 13,
            }}
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <button
            onClick={() => setStep(s => Math.min(4, s + 1))}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 24px', borderRadius: T.radius.md, cursor: 'pointer',
              background: T.accent, border: 'none',
              color: '#000', fontSize: 13, fontWeight: 700,
            }}
          >
            {step === 3 ? 'Revisar' : 'Próximo'} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
