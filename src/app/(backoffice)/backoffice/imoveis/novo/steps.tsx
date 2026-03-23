'use client'

import { useState, useRef } from 'react'
import {
  Check, Loader2, Upload, X, MapPin, Star,
  Link, FileVideo, DollarSign, CalendarDays,
  Image as ImageIcon,
} from 'lucide-react'
import type { FormData } from './types'
import { TYPES, CONDITIONS, STATUSES, FEATURES } from './types'
import { T, inputStyle, labelStyle, Field, PriceInput } from './form-ui'

/* ─── Step 1: Identificacao ──────────────────────────────────────── */
export function StepIdentificacao({ form, errors, developers, set, isMobile }: {
  form: FormData; errors: Record<string, string>; developers: { id: string; name: string }[]
  set: (k: keyof FormData, v: unknown) => void; isMobile?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Field label="Nome do empreendimento" error={errors.name} hint="Use o nome comercial oficial do empreendimento">
        <input className="ni" style={{ ...inputStyle, borderColor: errors.name ? T.error : T.border, fontSize: 15 }} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Residencial Parque das Flores" autoFocus />
      </Field>
      <div>
        <label style={labelStyle}>Tipo de imóvel</label>
        {errors.type && <span style={{ fontSize: 11, color: T.error, display: 'block', marginBottom: 8 }}>! {errors.type}</span>}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
          {TYPES.map(({ value, icon: Icon, desc }) => {
            const sel = form.type === value
            return (
              <button key={`type-${value}`} type="button" onClick={() => set('type', value)} style={{ position: 'relative', background: sel ? T.goldBgHi : T.elevated, border: `1.5px solid ${sel ? T.gold : T.border}`, borderRadius: 6, padding: isMobile ? '12px 8px' : '16px 10px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, transition: 'all var(--dur-2) var(--ease)', boxShadow: sel ? 'var(--shadow-gold)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: sel ? 'rgba(61,111,255,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={sel ? T.gold : T.textSub} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: sel ? T.gold : T.text, fontFamily: 'var(--font-sans)' }}>{value}</span>
                <span style={{ fontSize: 11, color: T.textDim, fontFamily: 'var(--font-sans)', lineHeight: 1.3 }}>{desc}</span>
                {sel && <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: T.gold, marginTop: 2 }}><Check size={9} color={T.navy} /></div>}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 14 }}>
        <Field label="Condição">
          <select className="ni" style={inputStyle} value={form.condition} onChange={e => set('condition', e.target.value)}>
            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Status comercial">
          <select className="ni" style={inputStyle} value={form.status_commercial} onChange={e => set('status_commercial', e.target.value)}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Incorporadora">
          <select className="ni" style={inputStyle} value={form.developer_id} onChange={e => { const dev = developers.find(d => d.id === e.target.value); set('developer_id', e.target.value); set('developer', dev?.name || '') }}>
            <option value="">Selecionar incorporadora</option>
            {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: form.is_highlighted ? T.goldBg : T.elevated, border: `1px solid ${form.is_highlighted ? T.border : 'rgba(255,255,255,0.06)'}`, borderRadius: 6, cursor: 'pointer', transition: 'all var(--dur-2) var(--ease)' }} onClick={() => set('is_highlighted', !form.is_highlighted)}>
        <div style={{ width: 40, height: 22, borderRadius: 6, background: form.is_highlighted ? T.gold : T.raised, border: `1px solid ${form.is_highlighted ? T.gold : T.border}`, position: 'relative', transition: 'all var(--dur-2) var(--ease)', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 3, left: form.is_highlighted ? 20 : 3, width: 14, height: 14, borderRadius: '50%', background: form.is_highlighted ? T.navy : T.textSub, transition: 'left var(--dur-2) var(--ease)' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: 'var(--font-sans)' }}>Destacar empreendimento</div>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'var(--font-sans)' }}>Aparece em destaque na vitrine e buscas</div>
        </div>
        {form.is_highlighted && <Star size={16} color={T.gold} style={{ marginLeft: 'auto', fill: T.gold }} />}
      </div>
    </div>
  )
}

/* ─── Step 2: Localizacao ────────────────────────────────────────── */
export function StepLocalizacao({ form, errors, cepLoading, set, handleCepChange, isMobile }: {
  form: FormData; errors: Record<string, string>; cepLoading: boolean
  set: (k: keyof FormData, v: unknown) => void; handleCepChange: (v: string) => void; isMobile?: boolean
}) {
  const cepFormatted = form.cep.length >= 5 ? `${form.cep.slice(0, 5)}-${form.cep.slice(5)}` : form.cep
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="País"><input className="ni" style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Brasil" /></Field>
      <Field label="CEP" hint="Digite o CEP para auto-preencher o endereço">
        <div style={{ position: 'relative' }}>
          <input className="ni" style={{ ...inputStyle, paddingRight: 44, letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', fontSize: 15 }} value={cepFormatted} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" maxLength={9} />
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            {cepLoading ? <Loader2 size={16} color={T.gold} style={{ animation: 'spin 1s linear infinite' }} /> : form.cep.length === 8 ? <Check size={16} color={T.success} /> : <MapPin size={16} color={T.textDim} />}
          </div>
        </div>
        {cepLoading && <span style={{ fontSize: 11, color: T.gold, marginTop: 4, fontFamily: 'var(--font-sans)', animation: 'fadeIn 150ms ease' }}>Buscando endereço...</span>}
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 100px', gap: 14, opacity: form.cep.length > 0 ? 1 : 0.55, transition: 'opacity var(--dur-3) var(--ease)' }}>
        <Field label="Logradouro"><input className="ni" style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua, Av., Alameda..." /></Field>
        <Field label="Número"><input className="ni" style={inputStyle} value={form.streetNumber} onChange={e => set('streetNumber', e.target.value)} placeholder="123" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, opacity: form.cep.length > 0 ? 1 : 0.55, transition: 'opacity var(--dur-3) var(--ease)' }}>
        <Field label="Bairro"><input className="ni" style={inputStyle} value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} placeholder="Nome do bairro" /></Field>
        <Field label="Cidade"><input className="ni" style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Cidade" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '80px 1fr', gap: 14, opacity: form.cep.length > 0 ? 1 : 0.55, transition: 'opacity var(--dur-3) var(--ease)' }}>
        <Field label="UF"><input className="ni" style={{ ...inputStyle, textTransform: 'uppercase' }} value={form.state} onChange={e => set('state', e.target.value.toUpperCase())} placeholder="SP" maxLength={2} /></Field>
        <Field label="Complemento"><input className="ni" style={inputStyle} value={form.complement} onChange={e => set('complement', e.target.value)} placeholder="Apto, bloco, andar..." /></Field>
      </div>
    </div>
  )
}

/* ─── Step 3: Caracteristicas ────────────────────────────────────── */
export function StepCaracteristicas({ form, errors, set, toggleFeature, isMobile }: {
  form: FormData; errors: Record<string, string>; set: (k: keyof FormData, v: unknown) => void
  toggleFeature: (f: string) => void; isMobile?: boolean
}) {
  const priceMin = parseInt(form.priceMin || '0', 10)
  const area = parseInt(form.area || '0', 10)
  const autoSqm = priceMin > 0 && area > 0 ? Math.round(priceMin / area).toLocaleString('pt-BR') : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Especificações</label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { k: 'area', label: 'Área (m²)', placeholder: '80' },
            { k: 'bedrooms', label: 'Quartos', placeholder: '3' },
            { k: 'bathrooms', label: 'Banheiros', placeholder: '2' },
            { k: 'parking', label: 'Vagas', placeholder: '2' },
            { k: 'floor', label: 'Andares', placeholder: '12' },
          ].map(({ k, label, placeholder }) => (
            <div key={k} style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>{label}</span>
              <input className="ni" style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: 0, width: '100%' }} type="number" min={0} value={form[k as keyof FormData] as string} onChange={e => set(k as keyof FormData, e.target.value)} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <label style={labelStyle}>Diferenciais & Amenidades</label>
          {form.features.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, background: T.goldBg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--font-sans)' }}>{form.features.length} selecionado{form.features.length > 1 ? 's' : ''}</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FEATURES.map(({ label: f, icon: Icon }) => {
            const sel = form.features.includes(f)
            return (
              <button key={f} type="button" onClick={() => toggleFeature(f)} style={{ background: sel ? T.goldBgHi : T.elevated, border: `1.5px solid ${sel ? T.gold : T.border}`, borderRadius: 6, padding: '7px 13px', fontSize: 12, color: sel ? T.gold : T.textSub, cursor: 'pointer', fontWeight: sel ? 700 : 400, transition: 'all var(--dur-2) var(--ease)', display: 'flex', alignItems: 'center', gap: 6, minHeight: 34, fontFamily: 'var(--font-sans)' }}>
                <Icon size={12} />{f}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Faixa de preço</label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <Field label="Preço mínimo" error={errors.priceMin}><PriceInput value={form.priceMin} onChange={v => set('priceMin', v)} placeholder="500.000" error={errors.priceMin} /></Field>
          <Field label="Preço máximo"><PriceInput value={form.priceMax} onChange={v => set('priceMax', v)} placeholder="1.200.000" /></Field>
        </div>
        {autoSqm && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: T.goldBg, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, color: T.gold, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={13} />Estimativa: R$ {autoSqm} por m² (a partir do preço mínimo e área)
          </div>
        )}
        <div style={{ marginTop: 12 }}><Field label="Preço por m² (opcional)"><PriceInput value={form.pricePerSqm} onChange={v => set('pricePerSqm', v)} placeholder="8.500" /></Field></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 14 }}>
        <Field label="Total de unidades"><input className="ni" style={inputStyle} type="number" min={0} value={form.totalUnits} onChange={e => set('totalUnits', e.target.value)} placeholder="120" /></Field>
        <Field label="Unidades disponíveis"><input className="ni" style={inputStyle} type="number" min={0} value={form.availableUnits} onChange={e => set('availableUnits', e.target.value)} placeholder="45" /></Field>
        <Field label="Data de entrega">
          <div style={{ position: 'relative' }}>
            <input className="ni" style={{ ...inputStyle, paddingRight: 36 }} type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
            <CalendarDays size={14} color={T.textDim} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </Field>
      </div>
      <Field label="Descrição do empreendimento" hint={`${form.description.length} caracteres`}>
        <textarea className="ni" style={{ ...inputStyle, minHeight: 120, resize: 'vertical', lineHeight: 1.6 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descreva os pontos únicos do empreendimento: localização, arquitetura, conceito..." />
      </Field>
    </div>
  )
}

/* ─── Step 4: Midia ──────────────────────────────────────────────── */
export function StepMidia({ form, set, handleDrop, handleImageInput, removeImage, isMobile }: {
  form: FormData; set: (k: keyof FormData, v: unknown) => void
  handleDrop: (e: React.DragEvent) => void
  handleImageInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: (i: number) => void; isMobile?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDropInner = (e: React.DragEvent) => { setIsDragging(false); handleDrop(e) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <label style={labelStyle}>Galeria de imagens</label>
          {form.images.length > 0 && <span style={{ fontSize: 11, color: T.textSub, fontFamily: 'var(--font-sans)' }}>{form.images.length} imagem{form.images.length > 1 ? 's' : ''} · primeira = capa</span>}
        </div>
        <div onDrop={handleDropInner} onDragOver={e => e.preventDefault()} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${isDragging ? T.gold : T.border}`, borderRadius: 6, padding: isMobile ? '28px 20px' : '40px 32px', textAlign: 'center', cursor: 'pointer', background: isDragging ? T.goldBg : T.elevated, transition: 'all var(--dur-2) var(--ease)', boxShadow: isDragging ? 'var(--shadow-gold)' : 'none' }}>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageInput} />
          <div style={{ width: 56, height: 56, borderRadius: 6, background: isDragging ? 'rgba(61,111,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isDragging ? T.gold : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', transition: 'all var(--dur-2) var(--ease)' }}>
            <Upload size={24} color={isDragging ? T.gold : T.textDim} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: isDragging ? T.gold : T.textSub, fontFamily: 'var(--font-sans)', marginBottom: 4 }}>{isDragging ? 'Soltar para adicionar' : 'Arraste imagens ou clique para selecionar'}</div>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'var(--font-sans)' }}>JPG, PNG, WEBP · Máx 50 MB por arquivo</div>
        </div>
        {form.images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
            {form.images.map((file, idx) => (
              <div key={idx} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: T.elevated, aspectRatio: '4/3', boxShadow: idx === 0 ? 'var(--shadow-gold)' : 'none' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,25,40,0.5) 0%, transparent 50%)' }} />
                {idx === 0 && <span style={{ position: 'absolute', top: 6, left: 6, background: T.gold, color: T.navy, fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 6, letterSpacing: '0.5px', fontFamily: 'var(--font-sans)' }}>CAPA</span>}
                <button type="button" onClick={e => { e.stopPropagation(); removeImage(idx) }} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-inverse)', transition: 'background var(--dur-2) var(--ease)' }}><X size={12} /></button>
                <span style={{ position: 'absolute', bottom: 5, left: 7, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ borderRadius: 6, aspectRatio: '4/3', border: `2px dashed ${T.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: T.textDim }}>
              <ImageIcon size={20} /><span style={{ fontSize: 11, fontFamily: 'var(--font-sans)' }}>Adicionar</span>
            </button>
          </div>
        )}
      </div>
      <Field label="Plantas baixas" hint={form.floorPlans.length > 0 ? `${form.floorPlans.length} arquivo(s) selecionado(s)` : undefined}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' }}>
          <Upload size={15} color={T.textDim} />
          <span style={{ fontSize: 13, color: T.textSub, fontFamily: 'var(--font-sans)' }}>{form.floorPlans.length > 0 ? `${form.floorPlans.length} planta(s) selecionada(s)` : 'Selecionar plantas (imagem ou PDF)'}</span>
          <input type="file" accept="image/*,application/pdf" multiple style={{ display: 'none' }} onChange={e => { const files = Array.from(e.target.files || []); if (files.length) set('floorPlans', [...form.floorPlans, ...files]) }} />
        </label>
      </Field>
      <Field label="Brochure / Material de vendas" hint={form.brochure ? form.brochure.name : undefined}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: T.elevated, border: `1px solid ${form.brochure ? T.gold : T.border}`, borderRadius: 6, cursor: 'pointer' }}>
          <Upload size={15} color={form.brochure ? T.gold : T.textDim} />
          <span style={{ fontSize: 13, color: form.brochure ? T.gold : T.textSub, fontFamily: 'var(--font-sans)', flex: 1 }}>{form.brochure ? form.brochure.name : 'Selecionar PDF ou imagem'}</span>
          {form.brochure && <button type="button" onClick={e => { e.preventDefault(); set('brochure', null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDim, display: 'flex', alignItems: 'center' }}><X size={14} /></button>}
          <input type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) set('brochure', f) }} />
        </label>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Field label="URL do vídeo (YouTube / Vimeo)">
          <div style={{ position: 'relative' }}>
            <input className="ni" style={{ ...inputStyle, paddingLeft: 38 }} value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            <Link size={14} color={T.textDim} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </Field>
        <Field label="Vídeo curto (Reels / Shorts)">
          <div style={{ position: 'relative' }}>
            <input className="ni" style={{ ...inputStyle, paddingLeft: 38 }} value={form.videoShort} onChange={e => set('videoShort', e.target.value)} placeholder="https://youtube.com/shorts/..." />
            <FileVideo size={14} color={T.textDim} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </Field>
      </div>
    </div>
  )
}
