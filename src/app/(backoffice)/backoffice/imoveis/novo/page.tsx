'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, Building2, Home, Star, Maximize,
  Globe, Flag, Briefcase, Loader2, Upload, X, Check,
  MapPin, Waves, Dumbbell, UtensilsCrossed, Flame, Trees,
  Trophy, Thermometer, ChefHat, Shield, Camera, Zap, Dog,
  MonitorPlay, Sunset, Sparkles, Plane, Link, FileVideo,
  CalendarDays, DollarSign, Image as ImageIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadMultipleImages, uploadFile, type ImageUploadFileStatus } from '@/lib/supabase-storage'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileAppBar, MobileBottomNav } from '../mobile-ui'
import UploadProgressPanel from '@/app/(backoffice)/components/ui/UploadProgressPanel'

/* ─── Design Tokens ────────────────────────────────────────────────────────── */
const T = {
  navy:     '#0B1120',
  surface:  '#101830',
  elevated: '#162040',
  raised:   '#1A3250',
  gold:     'var(--imi-gold-500)',
  goldBg:   'rgba(184,148,58,0.08)',
  goldBgHi: 'rgba(184,148,58,0.14)',
  border:   'rgba(184,148,58,0.15)',
  borderHi: 'rgba(184,148,58,0.4)',
  text:     '#EBE7E0',
  textSub:  '#9FAAB8',
  textDim:  '#5C6B7D',
  success:  '#2D8F5C',
  error:    '#EF4444',
  errorBg:  'rgba(239,68,68,0.08)',
} as const

/* ─── Constants ────────────────────────────────────────────────────────────── */
const TYPES = [
  { value: 'Apartamento', icon: Building2, desc: 'Condomínio residencial' },
  { value: 'Casa',        icon: Home,      desc: 'Unifamiliar, terreno'   },
  { value: 'Cobertura',   icon: Star,      desc: 'Último andar, rooftop'  },
  { value: 'Studio',      icon: Maximize,  desc: 'Compacto, investimento' },
  { value: 'Loft',        icon: Globe,     desc: 'Pé direito duplo'       },
  { value: 'Terreno',     icon: Flag,      desc: 'Loteamento, gleba'      },
  { value: 'Comercial',   icon: Briefcase, desc: 'Sala, loja, andar'      },
  { value: 'Villa',       icon: Star,      desc: 'Premium, resort'        },
]

const CONDITIONS = [
  { value: 'lancamento',    label: 'Lançamento'      },
  { value: 'em_construcao', label: 'Em Construção'   },
  { value: 'pronto',        label: 'Pronto p/ Morar' },
  { value: 'seminovo',      label: 'Seminovo'        },
  { value: 'usado',         label: 'Usado/Revenda'   },
]

const STATUSES = [
  { value: 'draft',     label: 'Rascunho'  },
  { value: 'published', label: 'Publicado' },
  { value: 'campaign',  label: 'Campanha'  },
  { value: 'private',   label: 'Privado'   },
]

const FEATURES: { label: string; icon: React.ElementType }[] = [
  { label: 'Piscina',           icon: Waves       },
  { label: 'Academia',          icon: Dumbbell    },
  { label: 'Salão de festas',   icon: UtensilsCrossed },
  { label: 'Churrasqueira',     icon: Flame       },
  { label: 'Playground',        icon: Trees       },
  { label: 'Quadra esportiva',  icon: Trophy      },
  { label: 'Sauna',             icon: Thermometer },
  { label: 'Espaço gourmet',    icon: ChefHat     },
  { label: 'Portaria 24h',      icon: Shield      },
  { label: 'Câmeras segurança', icon: Camera      },
  { label: 'Gerador',           icon: Zap         },
  { label: 'Pet friendly',      icon: Dog         },
  { label: 'Coworking',         icon: MonitorPlay },
  { label: 'Rooftop',           icon: Sunset      },
  { label: 'Spa',               icon: Sparkles    },
  { label: 'Cinema',            icon: MonitorPlay },
  { label: 'Heliponto',         icon: Plane       },
]

const DRAFT_KEY = 'imi-draft-imovel'

const STEP_META = [
  { title: 'Identificação',   subtitle: 'Nome, tipo e condição do empreendimento'   },
  { title: 'Localização',     subtitle: 'Endereço completo e CEP para auto-preenchimento' },
  { title: 'Características', subtitle: 'Especificações, valores e detalhes do imóvel' },
  { title: 'Mídia',           subtitle: 'Fotos, plantas, brochure e links de vídeo' },
]

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface Developer { id: string; name: string; logo_url?: string | null }

interface FormData {
  name: string; type: string; condition: string
  country: string; cep: string; state: string; city: string
  neighborhood: string; address: string; streetNumber: string; complement: string
  developer_id: string; developer: string
  area: string; bedrooms: string; bathrooms: string; parking: string; floor: string
  features: string[]
  priceMin: string; priceMax: string; pricePerSqm: string
  totalUnits: string; availableUnits: string; deliveryDate: string
  description: string; status_commercial: string; is_highlighted: boolean
  images: File[]; floorPlans: File[]; brochure: File | null
  videoUrl: string; videoShort: string
}

const DEFAULT_FORM: FormData = {
  name: '', type: '', condition: 'lancamento',
  country: 'Brasil', cep: '', state: '', city: '',
  neighborhood: '', address: '', streetNumber: '', complement: '',
  developer_id: '', developer: '',
  area: '', bedrooms: '', bathrooms: '', parking: '', floor: '',
  features: [],
  priceMin: '', priceMax: '', pricePerSqm: '',
  totalUnits: '', availableUnits: '', deliveryDate: '',
  description: '', status_commercial: 'draft', is_highlighted: false,
  images: [], floorPlans: [], brochure: null,
  videoUrl: '', videoShort: '',
}

/* ─── Shared Styles ──────────────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  background: T.elevated,
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 4,
  padding: '11px 14px',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'Figtree, sans-serif',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: T.textSub,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontFamily: 'Figtree, sans-serif',
}

/* ─── Field Wrapper ──────────────────────────────────────────────────────────── */
function Field({ label, error, children, style, hint }: {
  label: string; error?: string; hint?: string
  children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...style }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && !error && <span style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{hint}</span>}
      {error && (
        <span style={{
          fontSize: 11, color: T.error, marginTop: 4,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 13 }}>!</span> {error}
        </span>
      )}
    </div>
  )
}

/* ─── Price Input Helper ─────────────────────────────────────────────────────── */
function formatBRL(val: string): string {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10)
  return num.toLocaleString('pt-BR')
}

function PriceInput({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; error?: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        fontSize: 12, fontWeight: 600, color: T.gold, fontFamily: 'JetBrains Mono, monospace',
        pointerEvents: 'none',
      }}>R$</span>
      <input
        className="ni"
        style={{
          ...inputStyle,
          paddingLeft: 36,
          borderColor: error ? T.error : T.border,
        }}
        value={value ? formatBRL(value) : ''}
        onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder={placeholder}
      />
    </div>
  )
}

/* ─── Shared Props Interface ─────────────────────────────────────────────────── */
interface StepProps {
  step: 1|2|3|4; form: FormData; errors: Record<string, string>
  developers: Developer[]; saving: boolean; cepLoading: boolean
  draftSaved: boolean
  set: (k: keyof FormData, v: unknown) => void
  next: () => void; prev: () => void; handleSave: () => void
  handleCepChange: (v: string) => void
  toggleFeature: (f: string) => void
  handleDrop: (e: React.DragEvent) => void
  handleImageInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: (i: number) => void
  uploadFiles: ImageUploadFileStatus[]
  uploadVisible: boolean
}

interface DesktopStepProps extends StepProps {
  setStep: (s: 1|2|3|4) => void
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP COMPONENTS
════════════════════════════════════════════════════════════════════════════════ */

/* ─── Step 1: Identificação ──────────────────────────────────────────────────── */
function StepIdentificacao({ form, errors, developers, set, isMobile }: {
  form: FormData; errors: Record<string, string>; developers: Developer[]
  set: (k: keyof FormData, v: unknown) => void; isMobile?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Name */}
      <Field label="Nome do empreendimento" error={errors.name}
        hint="Use o nome comercial oficial do empreendimento">
        <input
          className="ni"
          style={{ ...inputStyle, borderColor: errors.name ? T.error : T.border, fontSize: 15 }}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Ex: Residencial Parque das Flores"
          autoFocus
        />
      </Field>

      {/* Type grid */}
      <div>
        <label style={labelStyle}>Tipo de imóvel</label>
        {errors.type && (
          <span style={{ fontSize: 11, color: T.error, display: 'block', marginBottom: 8 }}>
            ! {errors.type}
          </span>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 10,
        }}>
          {TYPES.map(({ value, icon: Icon, desc }) => {
            const sel = form.type === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => set('type', value)}
                style={{
                  background: sel ? T.goldBgHi : T.elevated,
                  border: `1.5px solid ${sel ? T.gold : T.border}`,
                  borderRadius: 4,
                  padding: isMobile ? '12px 8px' : '16px 10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 7,
                  transition: 'all 150ms ease',
                  boxShadow: sel ? `0 0 0 1px ${T.gold}22, 0 4px 16px rgba(184,148,58,0.08)` : 'none',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 4,
                  background: sel ? `rgba(184,148,58,0.15)` : 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={sel ? T.gold : T.textSub} />
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: sel ? T.gold : T.text,
                  fontFamily: 'Figtree, sans-serif',
                }}>{value}</span>
                <span style={{
                  fontSize: 10, color: T.textDim,
                  fontFamily: 'Figtree, sans-serif',
                  lineHeight: 1.3,
                }}>{desc}</span>
                {sel && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 16, height: 16, borderRadius: '50%',
                    background: T.gold,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={9} color={T.navy} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Condition + Status + Developer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
        gap: 14,
      }}>
        <Field label="Condição">
          <select className="ni" style={inputStyle} value={form.condition}
            onChange={e => set('condition', e.target.value)}>
            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>

        <Field label="Status comercial">
          <select className="ni" style={inputStyle} value={form.status_commercial}
            onChange={e => set('status_commercial', e.target.value)}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>

        <Field label="Incorporadora">
          <select className="ni" style={inputStyle} value={form.developer_id}
            onChange={e => {
              const dev = developers.find(d => d.id === e.target.value)
              set('developer_id', e.target.value)
              set('developer', dev?.name || '')
            }}>
            <option value="">Selecionar incorporadora</option>
            {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
      </div>

      {/* Highlight toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        background: form.is_highlighted ? T.goldBg : T.elevated,
        border: `1px solid ${form.is_highlighted ? T.border : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
        onClick={() => set('is_highlighted', !form.is_highlighted)}
      >
        <div style={{
          width: 40, height: 22, borderRadius: 4,
          background: form.is_highlighted ? T.gold : T.raised,
          border: `1px solid ${form.is_highlighted ? T.gold : T.border}`,
          position: 'relative', transition: 'all 200ms ease', flexShrink: 0,
        }}>
          <span style={{
            position: 'absolute', top: 3,
            left: form.is_highlighted ? 20 : 3,
            width: 14, height: 14, borderRadius: '50%',
            background: form.is_highlighted ? T.navy : T.textSub,
            transition: 'left 200ms ease',
          }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: 'Figtree, sans-serif' }}>
            Destacar empreendimento
          </div>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'Figtree, sans-serif' }}>
            Aparece em destaque na vitrine e buscas
          </div>
        </div>
        {form.is_highlighted && <Star size={16} color={T.gold} style={{ marginLeft: 'auto', fill: T.gold }} />}
      </div>
    </div>
  )
}

/* ─── Step 2: Localização ────────────────────────────────────────────────────── */
function StepLocalizacao({ form, errors, cepLoading, set, handleCepChange, isMobile }: {
  form: FormData; errors: Record<string, string>
  cepLoading: boolean; set: (k: keyof FormData, v: unknown) => void
  handleCepChange: (v: string) => void; isMobile?: boolean
}) {
  const cepFormatted = form.cep.length >= 5
    ? `${form.cep.slice(0, 5)}-${form.cep.slice(5)}`
    : form.cep

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Country */}
      <Field label="País">
        <input className="ni" style={inputStyle} value={form.country}
          onChange={e => set('country', e.target.value)} placeholder="Brasil" />
      </Field>

      {/* CEP — prominent, with inline spinner */}
      <Field label="CEP" hint="Digite o CEP para auto-preencher o endereço">
        <div style={{ position: 'relative' }}>
          <input
            className="ni"
            style={{
              ...inputStyle,
              paddingRight: 44,
              letterSpacing: '0.1em',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 15,
            }}
            value={cepFormatted}
            onChange={e => handleCepChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
          />
          <div style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center',
          }}>
            {cepLoading
              ? <Loader2 size={16} color={T.gold} style={{ animation: 'spin 1s linear infinite' }} />
              : form.cep.length === 8
                ? <Check size={16} color={T.success} />
                : <MapPin size={16} color={T.textDim} />
            }
          </div>
        </div>
        {cepLoading && (
          <span style={{
            fontSize: 11, color: T.gold, marginTop: 4,
            fontFamily: 'Figtree, sans-serif',
            animation: 'fadeIn 150ms ease',
          }}>
            Buscando endereço...
          </span>
        )}
      </Field>

      {/* Address row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 100px',
        gap: 14,
        opacity: form.cep.length > 0 ? 1 : 0.55,
        transition: 'opacity 300ms ease',
      }}>
        <Field label="Logradouro">
          <input className="ni" style={inputStyle} value={form.address}
            onChange={e => set('address', e.target.value)} placeholder="Rua, Av., Alameda..." />
        </Field>
        <Field label="Número">
          <input className="ni" style={inputStyle} value={form.streetNumber}
            onChange={e => set('streetNumber', e.target.value)} placeholder="123" />
        </Field>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 14,
        opacity: form.cep.length > 0 ? 1 : 0.55,
        transition: 'opacity 300ms ease',
      }}>
        <Field label="Bairro">
          <input className="ni" style={inputStyle} value={form.neighborhood}
            onChange={e => set('neighborhood', e.target.value)} placeholder="Nome do bairro" />
        </Field>
        <Field label="Cidade">
          <input className="ni" style={inputStyle} value={form.city}
            onChange={e => set('city', e.target.value)} placeholder="Cidade" />
        </Field>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '80px 1fr',
        gap: 14,
        opacity: form.cep.length > 0 ? 1 : 0.55,
        transition: 'opacity 300ms ease',
      }}>
        <Field label="UF">
          <input className="ni" style={{ ...inputStyle, textTransform: 'uppercase' }}
            value={form.state} onChange={e => set('state', e.target.value.toUpperCase())}
            placeholder="SP" maxLength={2} />
        </Field>
        <Field label="Complemento">
          <input className="ni" style={inputStyle} value={form.complement}
            onChange={e => set('complement', e.target.value)} placeholder="Apto, bloco, andar..." />
        </Field>
      </div>
    </div>
  )
}

/* ─── Step 3: Características ────────────────────────────────────────────────── */
function StepCaracteristicas({ form, errors, set, toggleFeature, isMobile }: {
  form: FormData; errors: Record<string, string>
  set: (k: keyof FormData, v: unknown) => void
  toggleFeature: (f: string) => void; isMobile?: boolean
}) {
  const priceMin = parseInt(form.priceMin || '0', 10)
  const area = parseInt(form.area || '0', 10)
  const autoSqm = priceMin > 0 && area > 0
    ? Math.round(priceMin / area).toLocaleString('pt-BR')
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Specs grid */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Especificações</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          gap: 12,
        }}>
          {[
            { k: 'area',      label: 'Área (m²)', placeholder: '80',  icon: '⊞' },
            { k: 'bedrooms',  label: 'Quartos',   placeholder: '3',   icon: '🛏' },
            { k: 'bathrooms', label: 'Banheiros', placeholder: '2',   icon: '🚿' },
            { k: 'parking',   label: 'Vagas',     placeholder: '2',   icon: '🚗' },
            { k: 'floor',     label: 'Andares',   placeholder: '12',  icon: '🏢' },
          ].map(({ k, label, placeholder }) => (
            <div key={k} style={{
              background: T.elevated,
              border: `1px solid ${T.border}`,
              borderRadius: 4, padding: '12px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.textDim,
                textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Figtree, sans-serif' }}>
                {label}
              </span>
              <input
                className="ni"
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: T.text, fontSize: 20, fontWeight: 600,
                  fontFamily: 'JetBrains Mono, monospace', padding: 0, width: '100%',
                }}
                type="number"
                min={0}
                value={form[k as keyof FormData] as string}
                onChange={e => set(k as keyof FormData, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Features / Amenities */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={labelStyle}>Diferenciais & Amenidades</label>
          {form.features.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: T.gold,
              background: T.goldBg, border: `1px solid ${T.border}`,
              borderRadius: 4, padding: '2px 8px',
              fontFamily: 'Figtree, sans-serif',
            }}>{form.features.length} selecionado{form.features.length > 1 ? 's' : ''}</span>
          )}
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
        }}>
          {FEATURES.map(({ label: f, icon: Icon }) => {
            const sel = form.features.includes(f)
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                style={{
                  background: sel ? T.goldBgHi : T.elevated,
                  border: `1.5px solid ${sel ? T.gold : T.border}`,
                  borderRadius: 4,
                  padding: '7px 13px',
                  fontSize: 12,
                  color: sel ? T.gold : T.textSub,
                  cursor: 'pointer',
                  fontWeight: sel ? 700 : 400,
                  transition: 'all 150ms ease',
                  display: 'flex', alignItems: 'center', gap: 6,
                  minHeight: 34,
                  fontFamily: 'Figtree, sans-serif',
                }}
              >
                <Icon size={12} />
                {f}
              </button>
            )
          })}
        </div>
      </div>

      {/* Prices */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Faixa de preço</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 14,
        }}>
          <Field label="Preço mínimo" error={errors.priceMin}>
            <PriceInput
              value={form.priceMin}
              onChange={v => set('priceMin', v)}
              placeholder="500.000"
              error={errors.priceMin}
            />
          </Field>
          <Field label="Preço máximo">
            <PriceInput
              value={form.priceMax}
              onChange={v => set('priceMax', v)}
              placeholder="1.200.000"
            />
          </Field>
        </div>
        {autoSqm && (
          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: T.goldBg, border: `1px solid ${T.border}`,
            borderRadius: 4, fontSize: 12, color: T.gold,
            fontFamily: 'Figtree, sans-serif',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <DollarSign size={13} />
            Estimativa: R$ {autoSqm} por m² (a partir do preço mínimo e área)
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <Field label="Preço por m² (opcional)">
            <PriceInput
              value={form.pricePerSqm}
              onChange={v => set('pricePerSqm', v)}
              placeholder="8.500"
            />
          </Field>
        </div>
      </div>

      {/* Units + Delivery */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: 14,
      }}>
        <Field label="Total de unidades">
          <input className="ni" style={inputStyle} type="number" min={0}
            value={form.totalUnits} onChange={e => set('totalUnits', e.target.value)}
            placeholder="120" />
        </Field>
        <Field label="Unidades disponíveis">
          <input className="ni" style={inputStyle} type="number" min={0}
            value={form.availableUnits} onChange={e => set('availableUnits', e.target.value)}
            placeholder="45" />
        </Field>
        <Field label="Data de entrega">
          <div style={{ position: 'relative' }}>
            <input className="ni" style={{ ...inputStyle, paddingRight: 36 }}
              type="date" value={form.deliveryDate}
              onChange={e => set('deliveryDate', e.target.value)} />
            <CalendarDays size={14} color={T.textDim} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} />
          </div>
        </Field>
      </div>

      {/* Description */}
      <Field label="Descrição do empreendimento"
        hint={`${form.description.length} caracteres`}>
        <textarea
          className="ni"
          style={{
            ...inputStyle, minHeight: 120, resize: 'vertical',
            lineHeight: 1.6,
          }}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Descreva os pontos únicos do empreendimento: localização, arquitetura, conceito..."
        />
      </Field>
    </div>
  )
}

/* ─── Step 4: Mídia ──────────────────────────────────────────────────────────── */
function StepMidia({ form, set, handleDrop, handleImageInput, removeImage, isMobile }: {
  form: FormData; set: (k: keyof FormData, v: unknown) => void
  handleDrop: (e: React.DragEvent) => void
  handleImageInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: (i: number) => void; isMobile?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDropInner = (e: React.DragEvent) => {
    setIsDragging(false)
    handleDrop(e)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Cover / Gallery upload zone */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={labelStyle}>Galeria de imagens</label>
          {form.images.length > 0 && (
            <span style={{
              fontSize: 10, color: T.textSub, fontFamily: 'Figtree, sans-serif',
            }}>
              {form.images.length} imagem{form.images.length > 1 ? 's' : ''} · primeira = capa
            </span>
          )}
        </div>

        <div
          onDrop={handleDropInner}
          onDragOver={e => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? T.gold : T.border}`,
            borderRadius: 4,
            padding: isMobile ? '28px 20px' : '40px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? T.goldBg : T.elevated,
            transition: 'all 200ms ease',
            boxShadow: isDragging ? `0 0 0 4px rgba(184,148,58,0.08)` : 'none',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageInput}
          />
          <div style={{
            width: 56, height: 56, borderRadius: 4,
            background: isDragging ? 'rgba(184,148,58,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isDragging ? T.gold : T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            transition: 'all 200ms ease',
          }}>
            <Upload size={24} color={isDragging ? T.gold : T.textDim} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: isDragging ? T.gold : T.textSub,
            fontFamily: 'Figtree, sans-serif', marginBottom: 4 }}>
            {isDragging ? 'Soltar para adicionar' : 'Arraste imagens ou clique para selecionar'}
          </div>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'Figtree, sans-serif' }}>
            JPG, PNG, WEBP · Máx 50 MB por arquivo
          </div>
        </div>

        {/* Image grid preview */}
        {form.images.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 10,
            marginTop: 14,
          }}>
            {form.images.map((file, idx) => (
              <div key={idx} style={{
                position: 'relative', borderRadius: 4, overflow: 'hidden',
                background: T.elevated, aspectRatio: '4/3',
                boxShadow: idx === 0 ? `0 0 0 2px ${T.gold}` : 'none',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(11,25,40,0.5) 0%, transparent 50%)',
                }} />
                {idx === 0 && (
                  <span style={{
                    position: 'absolute', top: 6, left: 6,
                    background: T.gold, color: T.navy,
                    fontSize: 8, fontWeight: 800,
                    padding: '2px 7px', borderRadius: 4,
                    letterSpacing: '0.5px',
                    fontFamily: 'Figtree, sans-serif',
                  }}>CAPA</span>
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeImage(idx) }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(0,0,0,0.65)',
                    border: 'none', borderRadius: '50%',
                    width: 24, height: 24,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', transition: 'background 150ms ease',
                  }}
                >
                  <X size={12} />
                </button>
                {/* File name */}
                <span style={{
                  position: 'absolute', bottom: 5, left: 7,
                  fontSize: 9, color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'JetBrains Mono, monospace',
                  maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {file.name}
                </span>
              </div>
            ))}
            {/* Add more button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                borderRadius: 4, aspectRatio: '4/3',
                border: `2px dashed ${T.border}`,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 6, color: T.textDim,
              }}
            >
              <ImageIcon size={20} />
              <span style={{ fontSize: 10, fontFamily: 'Figtree, sans-serif' }}>Adicionar</span>
            </button>
          </div>
        )}
      </div>

      {/* Floor plans */}
      <Field label="Plantas baixas"
        hint={form.floorPlans.length > 0 ? `${form.floorPlans.length} arquivo(s) selecionado(s)` : undefined}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          background: T.elevated,
          border: `1px solid ${T.border}`,
          borderRadius: 4, cursor: 'pointer',
        }}>
          <Upload size={15} color={T.textDim} />
          <span style={{ fontSize: 13, color: T.textSub, fontFamily: 'Figtree, sans-serif' }}>
            {form.floorPlans.length > 0
              ? `${form.floorPlans.length} planta(s) selecionada(s)`
              : 'Selecionar plantas (imagem ou PDF)'}
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            style={{ display: 'none' }}
            onChange={e => {
              const files = Array.from(e.target.files || [])
              if (files.length) set('floorPlans', [...form.floorPlans, ...files])
            }}
          />
        </label>
      </Field>

      {/* Brochure */}
      <Field label="Brochure / Material de vendas"
        hint={form.brochure ? form.brochure.name : undefined}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          background: T.elevated,
          border: `1px solid ${form.brochure ? T.gold : T.border}`,
          borderRadius: 4, cursor: 'pointer',
        }}>
          <Upload size={15} color={form.brochure ? T.gold : T.textDim} />
          <span style={{ fontSize: 13, color: form.brochure ? T.gold : T.textSub,
            fontFamily: 'Figtree, sans-serif', flex: 1 }}>
            {form.brochure ? form.brochure.name : 'Selecionar PDF ou imagem'}
          </span>
          {form.brochure && (
            <button
              type="button"
              onClick={e => { e.preventDefault(); set('brochure', null) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.textDim, display: 'flex', alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
          <input
            type="file"
            accept="application/pdf,image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) set('brochure', f) }}
          />
        </label>
      </Field>

      {/* Video URLs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Field label="URL do vídeo (YouTube / Vimeo)">
          <div style={{ position: 'relative' }}>
            <input className="ni" style={{ ...inputStyle, paddingLeft: 38 }}
              value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..." />
            <Link size={14} color={T.textDim} style={{
              position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} />
          </div>
        </Field>
        <Field label="Vídeo curto (Reels / Shorts)">
          <div style={{ position: 'relative' }}>
            <input className="ni" style={{ ...inputStyle, paddingLeft: 38 }}
              value={form.videoShort} onChange={e => set('videoShort', e.target.value)}
              placeholder="https://youtube.com/shorts/..." />
            <FileVideo size={14} color={T.textDim} style={{
              position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} />
          </div>
        </Field>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PROGRESS BAR COMPONENT
════════════════════════════════════════════════════════════════════════════════ */

function StepProgressBar({ step, setStep, canJumpTo }: {
  step: 1|2|3|4
  setStep?: (s: 1|2|3|4) => void
  canJumpTo: (s: number) => boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STEP_META.map((meta, i) => {
        const n = (i + 1) as 1|2|3|4
        const active = step === n
        const done = step > n
        const canClick = canJumpTo(n) && !!setStep

        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 0 }}>
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && setStep?.(n)}
              style={{
                background: 'none', border: 'none',
                cursor: canClick ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 4px',
                color: active ? T.gold : done ? T.textSub : T.textDim,
                transition: 'color 200ms ease',
                flexShrink: 0,
              }}
            >
              {/* Step circle */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: active ? T.gold : done ? T.goldBg : T.elevated,
                border: `2px solid ${active ? T.gold : done ? T.gold : T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: active ? T.navy : done ? T.gold : T.textDim,
                transition: 'all 200ms ease',
                fontFamily: 'JetBrains Mono, monospace',
                flexShrink: 0,
              }}>
                {done ? <Check size={13} /> : n}
              </div>
              {/* Label — hide on mobile */}
              <span style={{
                fontSize: 12, fontWeight: active ? 700 : 400,
                fontFamily: 'Figtree, sans-serif',
                display: 'none',
              }} className="step-label">
                {meta.title}
              </span>
            </button>

            {/* Connector line */}
            {n < 4 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px',
                background: done ? T.gold : T.border,
                borderRadius: 4, transition: 'background 300ms ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
════════════════════════════════════════════════════════════════════════════════ */

export default function NovoImovelPage() {
  const isMobile = useIsMobile()
  const router = useRouter()
  const [step, setStep] = useState<1|2|3|4>(1)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<ImageUploadFileStatus[]>([])
  const [uploadVisible, setUploadVisible] = useState(false)
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)
  const draftIndicatorRef = useRef<NodeJS.Timeout | null>(null)

  /* ── Load draft ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setForm(prev => ({ ...prev, ...saved, images: [], floorPlans: [], brochure: null }))
      }
    } catch { /* ignore */ }
  }, [])

  /* ── Fetch developers ── */
  useEffect(() => {
    const supabase = createClient()
    supabase.from('developers').select('*').order('name')
      .then(({ data }) => { if (data) setDevelopers(data) })
  }, [])

  /* ── Auto-save draft every 30s ── */
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      const { images, floorPlans, brochure, ...serializable } = form
      localStorage.setItem(DRAFT_KEY, JSON.stringify(serializable))
      setDraftSaved(true)
      if (draftIndicatorRef.current) clearTimeout(draftIndicatorRef.current)
      draftIndicatorRef.current = setTimeout(() => setDraftSaved(false), 3000)
    }, 30000)
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
      if (draftIndicatorRef.current) clearTimeout(draftIndicatorRef.current)
    }
  }, [form])

  const set = useCallback((k: keyof FormData, v: unknown) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }, [])

  /* ── CEP auto-fill ── */
  const handleCepChange = useCallback(async (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    set('cep', digits)
    if (digits.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            cep: digits,
            state: data.uf || prev.state,
            city: data.localidade || prev.city,
            neighborhood: data.bairro || prev.neighborhood,
            address: data.logradouro || prev.address,
          }))
        }
      } catch { /* ignore */ } finally {
        setCepLoading(false)
      }
    }
  }, [set])

  /* ── Step validation ── */
  const validateStep = useCallback((s: number): boolean => {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!form.name.trim()) e.name = 'Nome do empreendimento é obrigatório'
      if (!form.type) e.type = 'Selecione o tipo do imóvel'
    }
    if (s === 3) {
      if (!form.priceMin.trim()) e.priceMin = 'Preço mínimo é obrigatório'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form])

  const canJumpTo = useCallback((s: number) => step > s, [step])

  /* ── Navigation ── */
  const next = useCallback(() => {
    if (!validateStep(step)) return
    if (step < 4) setStep(prev => (prev + 1) as 1|2|3|4)
  }, [step, validateStep])

  const prev = useCallback(() => {
    if (step > 1) setStep(prev => (prev - 1) as 1|2|3|4)
  }, [step])

  /* ── Save / Publish ── */
  const handleSave = useCallback(async () => {
    if (!validateStep(step)) return
    setSaving(true)
    try {
      let imageUrls: string[] = []
      let floorPlanUrls: string[] = []
      let brochureUrl: string | null = null

      if (form.images.length > 0) {
        setUploadVisible(true)
        const results = await uploadMultipleImages(form.images, {
          bucket: 'media',
          folder: 'developments',
          onFileStatus: (status) => {
            setUploadFiles(prev => {
              const next = [...prev]
              next[status.index] = status
              return next
            })
          },
        })
        imageUrls = results.filter(r => !r.error).map(r => r.url)
      }

      if (form.floorPlans.length > 0) {
        const results = await uploadMultipleImages(form.floorPlans, {
          bucket: 'media',
          folder: 'floor-plans',
        })
        floorPlanUrls = results.filter(r => !r.error).map(r => r.url)
      }

      if (form.brochure) {
        const result = await uploadFile(form.brochure, 'media', 'brochures')
        if (!result.error) brochureUrl = result.url
      }

      setUploadVisible(false)
      setUploadFiles([])

      const payload = {
        name: form.name,
        type: form.type,
        condition: form.condition,
        country: form.country,
        cep: form.cep,
        street: form.address,
        street_number: form.streetNumber,
        complement: form.complement,
        state: form.state,
        city: form.city,
        location: form.neighborhood,
        address: [form.address, form.streetNumber, form.complement].filter(Boolean).join(', '),
        developer: form.developer,
        developer_id: form.developer_id || null,
        area: form.area,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        parking: form.parking,
        floor: form.floor,
        features: form.features,
        priceMin: form.priceMin,
        priceMax: form.priceMax,
        pricePerSqm: form.pricePerSqm,
        totalUnits: form.totalUnits,
        availableUnits: form.availableUnits,
        deliveryDate: form.deliveryDate,
        description: form.description,
        status_commercial: form.status_commercial,
        is_highlighted: form.is_highlighted,
        gallery_images: imageUrls,
        image: imageUrls[0] || null,
        floor_plans: floorPlanUrls,
        brochure_url: brochureUrl,
        video_url: form.videoUrl,
        video_short_url: form.videoShort,
      }

      const res = await fetch('/api/developments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Erro ${res.status}`)
      }

      localStorage.removeItem(DRAFT_KEY)
      toast.success('Imóvel criado com sucesso!')
      router.push('/backoffice/imoveis')
    } catch (err: unknown) {
      setUploadVisible(false)
      setUploadFiles([])
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar imóvel')
    } finally {
      setSaving(false)
    }
  }, [form, step, validateStep, router])

  /* ── Feature toggle ── */
  const toggleFeature = useCallback((f: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter(x => x !== f)
        : [...prev.features, f],
    }))
  }, [])

  /* ── Image drag/drop ── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) set('images', [...form.images, ...files])
  }, [form.images, set])

  const handleImageInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) set('images', [...form.images, ...files])
  }, [form.images, set])

  const removeImage = useCallback((idx: number) => {
    set('images', form.images.filter((_, i) => i !== idx))
  }, [form.images, set])

  /* ── Shared step content render ── */
  const renderStep = (mob?: boolean) => {
    switch (step) {
      case 1: return <StepIdentificacao form={form} errors={errors} developers={developers}
        set={set} isMobile={mob} />
      case 2: return <StepLocalizacao form={form} errors={errors} cepLoading={cepLoading}
        set={set} handleCepChange={handleCepChange} isMobile={mob} />
      case 3: return <StepCaracteristicas form={form} errors={errors}
        set={set} toggleFeature={toggleFeature} isMobile={mob} />
      case 4: return <StepMidia form={form} set={set}
        handleDrop={handleDrop} handleImageInput={handleImageInput}
        removeImage={removeImage} isMobile={mob} />
    }
  }

  const sharedProps: StepProps = {
    step, form, errors, developers, saving, cepLoading, draftSaved,
    set, next, prev, handleSave, handleCepChange, toggleFeature,
    handleDrop, handleImageInput, removeImage, uploadFiles, uploadVisible,
  }

  if (isMobile) {
    return <MobileNovo {...sharedProps} renderStep={renderStep} />
  }

  return <DesktopNovo {...sharedProps} setStep={setStep} renderStep={renderStep} canJumpTo={canJumpTo} />
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DESKTOP LAYOUT
════════════════════════════════════════════════════════════════════════════════ */

const DESKTOP_TIPS: Record<number, { title: string; items: string[] }> = {
  1: {
    title: 'Dicas de Identificação',
    items: [
      'Use o nome comercial exato do empreendimento',
      'O tipo influencia os filtros de busca',
      'Empreendimentos destacados têm prioridade na vitrine',
    ],
  },
  2: {
    title: 'Dicas de Localização',
    items: [
      'O CEP auto-preenche cidade, bairro e logradouro',
      'Bairro e cidade aparecem nos cartões de busca',
      'Use complemento para torre, bloco ou gleba',
    ],
  },
  3: {
    title: 'Dicas de Características',
    items: [
      'Área mínima ativa o cálculo de R$/m² automático',
      'Amenidades aparecem como filtros de busca',
      'Descrição aparece no site público e campanhas',
    ],
  },
  4: {
    title: 'Dicas de Mídia',
    items: [
      'A primeira imagem é a capa no catálogo',
      'Formatos: JPG, PNG, WEBP · máx 50 MB cada',
      'Reels/Shorts aumentam engajamento em 3×',
    ],
  },
}

function DesktopNovo(props: DesktopStepProps & { renderStep: (mob?: boolean) => React.ReactNode; canJumpTo: (s: number) => boolean }) {
  const { step, setStep, saving, draftSaved, next, prev, handleSave,
    uploadFiles, uploadVisible, canJumpTo, renderStep } = props

  const tip = DESKTOP_TIPS[step]

  return (
    <div style={{ minHeight: '100vh', background: T.navy, color: T.text }}>
      <style suppressHydrationWarning>{`
        .ni::placeholder { color: #5C6B7D }
        .ni:focus { outline: none; border-color: var(--imi-gold-500) !important; box-shadow: 0 0 0 3px rgba(184,148,58,0.12); }
        .ni option { background: #162040; color: #EBE7E0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes draftPop { 0%,100%{opacity:0;transform:translateY(4px)} 15%,85%{opacity:1;transform:translateY(0)} }
        .step-label { display: inline !important; }
      `}</style>

      {/* Sticky header with progress */}
      <div style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: '0 32px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 24, height: 64,
        }}>
          <a
            href="/backoffice/imoveis"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: T.textSub, textDecoration: 'none',
              fontFamily: 'Figtree, sans-serif', fontWeight: 500,
              flexShrink: 0,
              transition: 'color 150ms ease',
            }}
          >
            <ArrowLeft size={15} />
            Imóveis
          </a>

          <div style={{ width: 1, height: 24, background: T.border }} />

          {/* Step progress */}
          <div style={{ flex: 1 }}>
            <StepProgressBar step={step} setStep={setStep} canJumpTo={canJumpTo} />
          </div>

          {/* Draft saved indicator */}
          {draftSaved && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: T.success,
              fontFamily: 'Figtree, sans-serif',
              animation: 'draftPop 3s ease forwards',
              flexShrink: 0,
            }}>
              <Check size={12} />
              Rascunho salvo
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '32px 32px 120px',
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 28,
        alignItems: 'start',
      }}>
        {/* Form card */}
        <div>
          {/* Step heading */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{
              fontFamily: 'Libre Baskerville, Georgia, serif',
              fontSize: 26, fontWeight: 700, color: T.text,
              margin: '0 0 4px',
            }}>
              {STEP_META[step - 1].title}
            </h1>
            <p style={{
              fontSize: 13, color: T.textSub, margin: 0,
              fontFamily: 'Figtree, sans-serif',
            }}>
              {STEP_META[step - 1].subtitle}
            </p>
          </div>

          <div style={{
            background: T.surface,
            borderRadius: 4,
            border: `1px solid ${T.border}`,
            padding: 28,
            animation: 'slideDown 250ms ease both',
          }}>
            {renderStep(false)}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 96 }}>
          {/* Progress summary */}
          <div style={{
            background: T.surface, borderRadius: 4,
            border: `1px solid ${T.border}`, padding: 18,
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: T.textDim,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              fontFamily: 'Figtree, sans-serif',
              marginBottom: 12,
            }}>Progresso</div>
            {STEP_META.map((meta, i) => {
              const n = i + 1
              const done = step > n
              const active = step === n
              return (
                <div key={n} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 0',
                  borderBottom: n < 4 ? `1px solid rgba(184,148,58,0.06)` : 'none',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: done ? T.gold : active ? T.goldBg : T.elevated,
                    border: `1.5px solid ${done || active ? T.gold : T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {done
                      ? <Check size={11} color={T.navy} />
                      : <span style={{ fontSize: 9, fontWeight: 700, color: active ? T.gold : T.textDim,
                        fontFamily: 'JetBrains Mono, monospace' }}>{n}</span>
                    }
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    color: active ? T.text : done ? T.textSub : T.textDim,
                    fontFamily: 'Figtree, sans-serif',
                  }}>{meta.title}</span>
                </div>
              )
            })}
          </div>

          {/* Tips */}
          <div style={{
            background: T.goldBg, borderRadius: 4,
            border: `1px solid ${T.border}`, padding: 18,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: T.gold,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              fontFamily: 'Figtree, sans-serif', marginBottom: 12,
            }}>{tip.title}</div>
            <ul style={{ margin: 0, padding: '0 0 0 14px' }}>
              {tip.items.map((item, i) => (
                <li key={i} style={{
                  fontSize: 12, color: T.textSub, marginBottom: 8,
                  fontFamily: 'Figtree, sans-serif', lineHeight: 1.5,
                }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploadVisible && (
        <div style={{ position: 'fixed', bottom: 88, right: 24, width: 320, zIndex: 200 }}>
          <UploadProgressPanel files={uploadFiles} total={uploadFiles.length} visible={uploadVisible} />
        </div>
      )}

      {/* Sticky bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: T.surface,
        borderTop: `1px solid ${T.border}`,
        padding: '14px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 90,
      }}>
        {/* Back */}
        <button
          type="button"
          onClick={prev}
          disabled={step === 1}
          style={{
            background: 'transparent',
            border: `1px solid ${step === 1 ? 'rgba(184,148,58,0.08)' : T.border}`,
            borderRadius: 4, padding: '10px 20px',
            fontSize: 13, fontWeight: 600,
            color: step === 1 ? T.textDim : T.textSub,
            cursor: step === 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'Figtree, sans-serif',
            transition: 'all 150ms ease',
          }}
        >
          <ArrowLeft size={14} />
          Voltar
        </button>

        {/* Step indicator */}
        <span style={{
          fontSize: 12, color: T.textDim,
          fontFamily: 'Figtree, sans-serif', fontVariantNumeric: 'tabular-nums',
        }}>
          Passo {step} / 4
        </span>

        {/* Next or Publish */}
        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            style={{
              background: T.gold, border: 'none', borderRadius: 4,
              padding: '10px 24px', fontSize: 13, fontWeight: 700,
              color: T.navy, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'Figtree, sans-serif',
              boxShadow: '0 4px 16px rgba(184,148,58,0.2)',
              transition: 'opacity 150ms ease',
            }}
          >
            Continuar
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? T.elevated : T.gold,
              border: saving ? `1px solid ${T.border}` : 'none',
              borderRadius: 4, padding: '10px 28px',
              fontSize: 13, fontWeight: 700,
              color: saving ? T.textSub : T.navy,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'Figtree, sans-serif',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(184,148,58,0.2)',
              transition: 'all 200ms ease',
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Publicando...</>
              : <><Check size={14} />Publicar Imóvel</>
            }
          </button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MOBILE LAYOUT
════════════════════════════════════════════════════════════════════════════════ */

function MobileNovo(props: StepProps & { renderStep: (mob?: boolean) => React.ReactNode }) {
  const { step, saving, draftSaved, next, prev, handleSave,
    uploadFiles, uploadVisible, renderStep } = props

  return (
    <div style={{ minHeight: '100vh', background: T.navy, color: T.text }}>
      <MobileGlobalStyles />
      <style suppressHydrationWarning>{`
        .ni::placeholder { color: #5C6B7D }
        .ni:focus { outline: none; border-color: var(--imi-gold-500) !important; box-shadow: 0 0 0 3px rgba(184,148,58,0.12); }
        .ni option { background: #162040; color: #EBE7E0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* App bar */}
      <MobileAppBar
        title={STEP_META[step - 1].title}
        subtitle={`Passo ${step} de 4 · ${STEP_META[step - 1].subtitle}`}
        backHref="/backoffice/imoveis"
        actions={
          draftSaved ? (
            <span style={{
              fontSize: 10, color: T.success,
              fontFamily: 'Figtree, sans-serif',
              padding: '0 8px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Check size={11} /> Salvo
            </span>
          ) : undefined
        }
      />

      {/* Step progress dots */}
      <div style={{
        position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 0,
      }}>
        {[1, 2, 3, 4].map(n => {
          const done = step > n
          const active = step === n
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: active ? T.gold : done ? T.goldBg : T.elevated,
                border: `2px solid ${active ? T.gold : done ? T.gold : T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: active ? T.navy : done ? T.gold : T.textDim,
                fontFamily: 'JetBrains Mono, monospace',
                flexShrink: 0,
                transition: 'all 200ms ease',
              }}>
                {done ? <Check size={11} /> : n}
              </div>
              {n < 4 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 4px',
                  background: done ? T.gold : T.border,
                  borderRadius: 4, transition: 'background 300ms ease',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Scrollable content */}
      <div style={{
        paddingTop: 104, // 56 appbar + 42 step bar
        paddingBottom: 140, // above nav bars
        padding: '104px 16px 140px',
        animation: 'slideDown 220ms ease both',
      }}>
        {renderStep(true)}
      </div>

      {/* Upload progress */}
      {uploadVisible && (
        <div style={{ position: 'fixed', bottom: 130, left: 16, right: 16, zIndex: 200 }}>
          <UploadProgressPanel files={uploadFiles} total={uploadFiles.length} visible={uploadVisible} />
        </div>
      )}

      {/* Sticky CTA bar */}
      <div style={{
        position: 'fixed', bottom: 56, left: 0, right: 0,
        background: T.surface,
        borderTop: `1px solid ${T.border}`,
        padding: '12px 16px',
        display: 'flex', gap: 10,
        zIndex: 90,
      }}>
        <button
          type="button"
          onClick={prev}
          disabled={step === 1}
          style={{
            flex: '0 0 auto',
            width: 48, height: 48, borderRadius: 4,
            background: 'transparent',
            border: `1px solid ${step === 1 ? 'rgba(184,148,58,0.08)' : T.border}`,
            cursor: step === 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: step === 1 ? T.textDim : T.textSub,
          }}
        >
          <ArrowLeft size={18} />
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            style={{
              flex: 1, height: 48, borderRadius: 4,
              background: T.gold, border: 'none',
              fontSize: 14, fontWeight: 700, color: T.navy,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'Figtree, sans-serif',
              boxShadow: '0 4px 16px rgba(184,148,58,0.2)',
            }}
          >
            Continuar
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, height: 48, borderRadius: 4,
              background: saving ? T.elevated : T.gold,
              border: saving ? `1px solid ${T.border}` : 'none',
              fontSize: 14, fontWeight: 700,
              color: saving ? T.textSub : T.navy,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'Figtree, sans-serif',
              opacity: saving ? 0.85 : 1,
            }}
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Publicando...</>
              : <><Check size={16} />Publicar Imóvel</>
            }
          </button>
        )}
      </div>

      <MobileBottomNav />
    </div>
  )
}
