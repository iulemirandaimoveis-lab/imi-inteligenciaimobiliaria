'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadMultipleImages, uploadFile, type ImageUploadFileStatus } from '@/lib/supabase-storage'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileAppBar } from '../mobile-ui'
import UploadProgressPanel from '@/app/(backoffice)/components/ui/UploadProgressPanel'

import type { Developer, FormData, StepProps, DesktopStepProps } from './types'
import { DEFAULT_FORM, STEP_META, DRAFT_KEY } from './types'
import { T } from './form-ui'
import { StepIdentificacao, StepLocalizacao, StepCaracteristicas, StepMidia } from './steps'

/* ─── Progress Bar ──────────────────────────────────────────────── */
function StepProgressBar({ step, setStep, canJumpTo }: {
  step: 1|2|3|4; setStep?: (s: 1|2|3|4) => void; canJumpTo: (s: number) => boolean
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
            <button type="button" disabled={!canClick} onClick={() => canClick && setStep?.(n)} style={{ background: 'none', border: 'none', cursor: canClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', color: active ? T.gold : done ? T.textSub : T.textDim, transition: 'color var(--dur-2) var(--ease)', flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: active ? T.gold : done ? T.goldBg : T.elevated, border: `2px solid ${active ? T.gold : done ? T.gold : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: active ? T.navy : done ? T.gold : T.textDim, transition: 'all var(--dur-2) var(--ease)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {done ? <Check size={13} /> : n}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, fontFamily: 'var(--font-sans)', display: 'none' }} className="step-label">{meta.title}</span>
            </button>
            {n < 4 && <div style={{ flex: 1, height: 2, margin: '0 6px', background: done ? T.gold : T.border, borderRadius: 6, transition: 'background var(--dur-3) var(--ease)' }} />}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────── */
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setForm(prev => ({ ...prev, ...saved, images: [], floorPlans: [], brochure: null }))
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('developers').select('*').order('name')
      .then(({ data }) => { if (data) setDevelopers(data) })
  }, [])

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

  const handleCepChange = useCallback(async (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    set('cep', digits)
    if (digits.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm(prev => ({ ...prev, cep: digits, state: data.uf || prev.state, city: data.localidade || prev.city, neighborhood: data.bairro || prev.neighborhood, address: data.logradouro || prev.address }))
        }
      } catch { /* ignore */ } finally { setCepLoading(false) }
    }
  }, [set])

  const validateStep = useCallback((s: number): boolean => {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!form.name.trim()) e.name = 'Nome do empreendimento é obrigatório'
      if (!form.type) e.type = 'Selecione o tipo do imóvel'
    }
    if (s === 3) { if (!form.priceMin.trim()) e.priceMin = 'Preço mínimo é obrigatório' }
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form])

  const canJumpTo = useCallback((s: number) => step > s, [step])

  const next = useCallback(() => {
    if (!validateStep(step)) return
    if (step < 4) setStep(prev => (prev + 1) as 1|2|3|4)
  }, [step, validateStep])

  const prev = useCallback(() => {
    if (step > 1) setStep(prev => (prev - 1) as 1|2|3|4)
  }, [step])

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
          bucket: 'media', folder: 'developments',
          onFileStatus: (status) => { setUploadFiles(prev => { const next = [...prev]; next[status.index] = status; return next }) },
        })
        imageUrls = results.filter(r => !r.error).map(r => r.url)
      }
      if (form.floorPlans.length > 0) {
        const results = await uploadMultipleImages(form.floorPlans, { bucket: 'media', folder: 'floor-plans' })
        floorPlanUrls = results.filter(r => !r.error).map(r => r.url)
      }
      if (form.brochure) {
        const result = await uploadFile(form.brochure, 'media', 'brochures')
        if (!result.error) brochureUrl = result.url
      }
      setUploadVisible(false); setUploadFiles([])

      const payload = {
        name: form.name, type: form.type, condition: form.condition,
        country: form.country, cep: form.cep, street: form.address,
        street_number: form.streetNumber, complement: form.complement,
        state: form.state, city: form.city, location: form.neighborhood,
        address: [form.address, form.streetNumber, form.complement].filter(Boolean).join(', '),
        developer: form.developer, developer_id: form.developer_id || null,
        area: form.area, bedrooms: form.bedrooms, bathrooms: form.bathrooms,
        parking: form.parking, floor: form.floor, features: form.features,
        priceMin: form.priceMin, priceMax: form.priceMax, pricePerSqm: form.pricePerSqm,
        totalUnits: form.totalUnits, availableUnits: form.availableUnits,
        deliveryDate: form.deliveryDate, description: form.description,
        status_commercial: form.status_commercial, is_highlighted: form.is_highlighted,
        gallery_images: imageUrls, image: imageUrls[0] || null,
        floor_plans: floorPlanUrls, brochure_url: brochureUrl,
        video_url: form.videoUrl, video_short_url: form.videoShort,
      }

      const res = await fetch('/api/developments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err instanceof Error ? err.message : 'Erro desconhecido') || `Erro ${res.status}`) }
      localStorage.removeItem(DRAFT_KEY)
      toast.success('Imóvel criado com sucesso!')
      router.push('/backoffice/imoveis')
    } catch (err: unknown) {
      setUploadVisible(false); setUploadFiles([])
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar imóvel')
    } finally { setSaving(false) }
  }, [form, step, validateStep, router])

  const toggleFeature = useCallback((f: string) => {
    setForm(prev => ({ ...prev, features: prev.features.includes(f) ? prev.features.filter(x => x !== f) : [...prev.features, f] }))
  }, [])

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

  const renderStep = (mob?: boolean) => {
    switch (step) {
      case 1: return <StepIdentificacao form={form} errors={errors} developers={developers} set={set} isMobile={mob} />
      case 2: return <StepLocalizacao form={form} errors={errors} cepLoading={cepLoading} set={set} handleCepChange={handleCepChange} isMobile={mob} />
      case 3: return <StepCaracteristicas form={form} errors={errors} set={set} toggleFeature={toggleFeature} isMobile={mob} />
      case 4: return <StepMidia form={form} set={set} handleDrop={handleDrop} handleImageInput={handleImageInput} removeImage={removeImage} isMobile={mob} />
    }
  }

  if (isMobile) return <MobileNovo step={step} saving={saving} draftSaved={draftSaved} next={next} prev={prev} handleSave={handleSave} uploadFiles={uploadFiles} uploadVisible={uploadVisible} renderStep={renderStep} />

  return <DesktopNovo step={step} setStep={setStep} saving={saving} draftSaved={draftSaved} next={next} prev={prev} handleSave={handleSave} uploadFiles={uploadFiles} uploadVisible={uploadVisible} canJumpTo={canJumpTo} renderStep={renderStep} />
}

/* ─── Desktop Tips ──────────────────────────────────────────────── */
const DESKTOP_TIPS: Record<number, { title: string; items: string[] }> = {
  1: { title: 'Dicas de Identificação', items: ['Use o nome comercial exato do empreendimento', 'O tipo influencia os filtros de busca', 'Empreendimentos destacados têm prioridade na vitrine'] },
  2: { title: 'Dicas de Localização', items: ['O CEP auto-preenche cidade, bairro e logradouro', 'Bairro e cidade aparecem nos cartões de busca', 'Use complemento para torre, bloco ou gleba'] },
  3: { title: 'Dicas de Características', items: ['Área mínima ativa o cálculo de R$/m² automático', 'Amenidades aparecem como filtros de busca', 'Descrição aparece no site público e campanhas'] },
  4: { title: 'Dicas de Mídia', items: ['A primeira imagem é a capa no catálogo', 'Formatos: JPG, PNG, WEBP · máx 50 MB cada', 'Reels/Shorts aumentam engajamento em 3×'] },
}

/* ─── Desktop Layout ────────────────────────────────────────────── */
function DesktopNovo({ step, setStep, saving, draftSaved, next, prev, handleSave, uploadFiles, uploadVisible, canJumpTo, renderStep }: {
  step: 1|2|3|4; setStep: (s: 1|2|3|4) => void; saving: boolean; draftSaved: boolean
  next: () => void; prev: () => void; handleSave: () => void
  uploadFiles: ImageUploadFileStatus[]; uploadVisible: boolean
  canJumpTo: (s: number) => boolean; renderStep: (mob?: boolean) => React.ReactNode
}) {
  const tip = DESKTOP_TIPS[step]
  return (
    <div style={{ minHeight: '100vh', background: T.navy, color: T.text }}>
      <style suppressHydrationWarning>{`
        .ni::placeholder { color: var(--text-tertiary) }
        .ni:focus { outline: none; border-color: var(--accent-400) !important; box-shadow: var(--shadow-xs); }
        .ni option { background: var(--bg-elevated); color: var(--text-primary); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes draftPop { 0%,100%{opacity:0;transform:translateY(4px)} 15%,85%{opacity:1;transform:translateY(0)} }
        .step-label { display: inline !important; }
      `}</style>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24, height: 64 }}>
          <a href="/backoffice/imoveis" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.textSub, textDecoration: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500, flexShrink: 0, transition: 'color var(--dur-2) var(--ease)' }}><ArrowLeft size={15} />Imóveis</a>
          <div style={{ width: 1, height: 24, background: T.border }} />
          <div style={{ flex: 1 }}><StepProgressBar step={step} setStep={setStep} canJumpTo={canJumpTo} /></div>
          {draftSaved && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.success, fontFamily: 'var(--font-sans)', animation: 'draftPop 3s ease forwards', flexShrink: 0 }}><Check size={12} />Rascunho salvo</div>}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 120px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 28, alignItems: 'start' }}>
        <div>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", fontSize: 26, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>{STEP_META[step - 1].title}</h1>
            <p style={{ fontSize: 13, color: T.textSub, margin: 0, fontFamily: 'var(--font-sans)' }}>{STEP_META[step - 1].subtitle}</p>
          </div>
          <div style={{ background: T.surface, borderRadius: 6, border: `1px solid ${T.border}`, padding: 28, animation: 'slideDown 250ms ease both' }}>{renderStep(false)}</div>
        </div>
        <div style={{ position: 'sticky', top: 96 }}>
          <div style={{ background: T.surface, borderRadius: 6, border: `1px solid ${T.border}`, padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>Progresso</div>
            {STEP_META.map((meta, i) => { const n = i + 1; const done = step > n; const active = step === n; return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: n < 4 ? '1px solid rgba(184,148,58,0.06)' : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? T.gold : active ? T.goldBg : T.elevated, border: `1.5px solid ${done || active ? T.gold : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {done ? <Check size={11} color={T.navy} /> : <span style={{ fontSize: 11, fontWeight: 700, color: active ? T.gold : T.textDim, fontFamily: 'var(--font-mono)' }}>{n}</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? T.text : done ? T.textSub : T.textDim, fontFamily: 'var(--font-sans)' }}>{meta.title}</span>
              </div>
            )})}
          </div>
          <div style={{ background: T.goldBg, borderRadius: 6, border: `1px solid ${T.border}`, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>{tip.title}</div>
            <ul style={{ margin: 0, padding: '0 0 0 14px' }}>{tip.items.map((item, i) => <li key={i} style={{ fontSize: 12, color: T.textSub, marginBottom: 8, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{item}</li>)}</ul>
          </div>
        </div>
      </div>
      {uploadVisible && <div style={{ position: 'fixed', bottom: 88, right: 24, width: 320, zIndex: 200 }}><UploadProgressPanel files={uploadFiles} total={uploadFiles.length} visible={uploadVisible} /></div>}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 90 }}>
        <button type="button" onClick={prev} disabled={step === 1} style={{ background: 'transparent', border: `1px solid ${step === 1 ? 'rgba(184,148,58,0.08)' : T.border}`, borderRadius: 6, padding: '10px 20px', fontSize: 13, fontWeight: 600, color: step === 1 ? T.textDim : T.textSub, cursor: step === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', transition: 'all var(--dur-2) var(--ease)' }}><ArrowLeft size={14} />Voltar</button>
        <span style={{ fontSize: 12, color: T.textDim, fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>Passo {step} / 4</span>
        {step < 4 ? (
          <button type="button" onClick={next} style={{ position: 'relative', overflow: 'hidden', background: '#0A1624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 24px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', transition: 'opacity var(--dur-2) var(--ease)' }}>Continuar<ArrowRight size={14} /><span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} /></button>
        ) : (
          <button type="button" onClick={handleSave} disabled={saving} style={{ position: 'relative', overflow: 'hidden', background: saving ? T.elevated : '#0A1624', border: saving ? `1px solid ${T.border}` : '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 28px', fontSize: 13, fontWeight: 700, color: saving ? T.textSub : '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', transition: 'all var(--dur-2) var(--ease)', opacity: saving ? 0.8 : 1 }}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Publicando...</> : <><Check size={14} />Publicar Imóvel</>}
            {!saving && <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Mobile Layout ─────────────────────────────────────────────── */
function MobileNovo({ step, saving, draftSaved, next, prev, handleSave, uploadFiles, uploadVisible, renderStep }: {
  step: 1|2|3|4; saving: boolean; draftSaved: boolean
  next: () => void; prev: () => void; handleSave: () => void
  uploadFiles: ImageUploadFileStatus[]; uploadVisible: boolean
  renderStep: (mob?: boolean) => React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: T.navy, color: T.text }}>
      <MobileGlobalStyles />
      <style suppressHydrationWarning>{`
        .ni::placeholder { color: var(--text-tertiary) }
        .ni:focus { outline: none; border-color: var(--accent-400) !important; box-shadow: var(--shadow-xs); }
        .ni option { background: var(--bg-elevated); color: var(--text-primary); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
      <MobileAppBar title={STEP_META[step - 1].title} subtitle={`Passo ${step} de 4 · ${STEP_META[step - 1].subtitle}`} backHref="/backoffice/imoveis" actions={draftSaved ? <span style={{ fontSize: 11, color: T.success, fontFamily: 'var(--font-sans)', padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={11} /> Salvo</span> : undefined} />
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99, background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 0 }}>
        {[1, 2, 3, 4].map(n => { const done = step > n; const active = step === n; return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: active ? T.gold : done ? T.goldBg : T.elevated, border: `2px solid ${active ? T.gold : done ? T.gold : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: active ? T.navy : done ? T.gold : T.textDim, fontFamily: 'var(--font-mono)', flexShrink: 0, transition: 'all var(--dur-2) var(--ease)' }}>
              {done ? <Check size={11} /> : n}
            </div>
            {n < 4 && <div style={{ flex: 1, height: 2, margin: '0 4px', background: done ? T.gold : T.border, borderRadius: 6, transition: 'background var(--dur-3) var(--ease)' }} />}
          </div>
        )})}
      </div>
      <div style={{ paddingTop: 104, paddingBottom: 140, padding: '104px 16px 140px', animation: 'slideDown 220ms ease both' }}>{renderStep(true)}</div>
      {uploadVisible && <div style={{ position: 'fixed', bottom: 'calc(64px + 74px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16, zIndex: 200 }}><UploadProgressPanel files={uploadFiles} total={uploadFiles.length} visible={uploadVisible} /></div>}
      <div style={{ position: 'fixed', bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))', left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, padding: '12px 16px', display: 'flex', gap: 10, zIndex: 90 }}>
        <button type="button" onClick={prev} disabled={step === 1} style={{ flex: '0 0 auto', width: 48, height: 48, borderRadius: 6, background: 'transparent', border: `1px solid ${step === 1 ? 'rgba(184,148,58,0.08)' : T.border}`, cursor: step === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step === 1 ? T.textDim : T.textSub }}><ArrowLeft size={18} /></button>
        {step < 4 ? (
          <button type="button" onClick={next} style={{ position: 'relative', overflow: 'hidden', flex: 1, height: 48, borderRadius: 6, background: '#0A1624', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-sans)' }}>Continuar<ArrowRight size={16} /><span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} /></button>
        ) : (
          <button type="button" onClick={handleSave} disabled={saving} style={{ position: 'relative', overflow: 'hidden', flex: 1, height: 48, borderRadius: 6, background: saving ? T.elevated : '#0A1624', border: saving ? `1px solid ${T.border}` : '1px solid rgba(255,255,255,0.08)', fontSize: 14, fontWeight: 700, color: saving ? T.textSub : '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-sans)', opacity: saving ? 0.85 : 1 }}>
            {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Publicando...</> : <><Check size={16} />Publicar Imóvel</>}
            {!saving && <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />}
          </button>
        )}
      </div>
    </div>
  )
}
