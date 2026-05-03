'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileAppBar } from '../../../mobile-ui'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
    unit_name: string
    unit_type: string
    status: string
    area: string
    total_price: string
    bedrooms: string
    bathrooms: string
    parking_spots: string
    position: string
    tower: string
    is_highlighted: boolean
    notes: string
}

const UNIT_TYPES = [
    'Apartamento', 'Studio', 'Flat', 'Cobertura', 'Cobertura Duplex',
    'Garden', 'Loft', 'Casa', 'Sala Comercial', 'Loja', 'Outro',
]

const STATUS_OPTIONS = [
    { value: 'available', label: 'Disponível' },
    { value: 'reserved', label: 'Reservada' },
    { value: 'sold', label: 'Vendida' },
]

const POSITION_OPTIONS = [
    'Norte', 'Sul', 'Leste', 'Oeste',
    'Nascente', 'Poente', 'Nascente/Sul', 'Norte/Sul',
]

// ─── Field components ─────────────────────────────────────────────────────────

interface FieldProps {
    label: string
    required?: boolean
    children: React.ReactNode
    hint?: string
}

function Field({ label, required, children, hint }: FieldProps) {
    return (
        <div>
            <label style={{
                display: 'block',
                fontFamily: 'var(--font-outfit, sans-serif)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: T.textMuted,
                marginBottom: 6,
            }}>
                {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
            </label>
            {children}
            {hint && (
                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{hint}</p>
            )}
        </div>
    )
}

const inputStyle = {
    width: '100%',
    height: 42,
    padding: '0 12px',
    borderRadius: 8,
    background: T.elevated,
    border: `1px solid ${T.border}`,
    color: T.text,
    fontFamily: 'var(--font-outfit, sans-serif)',
    fontSize: 14,
    outline: 'none',
} as React.CSSProperties

const selectStyle = { ...inputStyle, cursor: 'pointer' } as React.CSSProperties

// ─── Form ─────────────────────────────────────────────────────────────────────

interface UnitFormProps {
    form: FormData
    setForm: React.Dispatch<React.SetStateAction<FormData>>
    saving: boolean
    onSubmit: (e: React.FormEvent) => void
    onBack: () => void
    devName?: string
    isMobile?: boolean
}

function UnitForm({ form, setForm, saving, onSubmit, onBack, devName, isMobile }: UnitFormProps) {
    const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [k]: e.target.value }))
    }

    const content = (
        <form onSubmit={onSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                {/* Unit name */}
                <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                    <Field label="Nome / Identificador" required>
                        <input
                            style={inputStyle}
                            placeholder="Ex: APTO 201, GARDEN 03, COBERTURA A"
                            value={form.unit_name}
                            onChange={set('unit_name')}
                            required
                        />
                    </Field>
                </div>

                {/* Type */}
                <Field label="Tipo">
                    <select style={selectStyle} value={form.unit_type} onChange={set('unit_type')}>
                        {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </Field>

                {/* Status */}
                <Field label="Status">
                    <select style={selectStyle} value={form.status} onChange={set('status')}>
                        {STATUS_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </Field>

                {/* Price */}
                <Field label="Valor Total (R$)" required hint="Somente números. Ex: 450000">
                    <input
                        style={inputStyle}
                        type="number"
                        min={0}
                        placeholder="450000"
                        value={form.total_price}
                        onChange={set('total_price')}
                        required
                    />
                </Field>

                {/* Area */}
                <Field label="Área (m²)" hint="Somente números">
                    <input
                        style={inputStyle}
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="68.5"
                        value={form.area}
                        onChange={set('area')}
                    />
                </Field>

                {/* Bedrooms */}
                <Field label="Quartos">
                    <input
                        style={inputStyle}
                        type="number"
                        min={0}
                        placeholder="2"
                        value={form.bedrooms}
                        onChange={set('bedrooms')}
                    />
                </Field>

                {/* Bathrooms */}
                <Field label="Banheiros">
                    <input
                        style={inputStyle}
                        type="number"
                        min={0}
                        placeholder="2"
                        value={form.bathrooms}
                        onChange={set('bathrooms')}
                    />
                </Field>

                {/* Parking */}
                <Field label="Vagas de garagem">
                    <input
                        style={inputStyle}
                        type="number"
                        min={0}
                        placeholder="1"
                        value={form.parking_spots}
                        onChange={set('parking_spots')}
                    />
                </Field>

                {/* Position */}
                <Field label="Posição / Orientação solar">
                    <select style={selectStyle} value={form.position} onChange={set('position')}>
                        <option value="">Não informada</option>
                        {POSITION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </Field>

                {/* Tower */}
                <Field label="Torre / Bloco">
                    <input
                        style={inputStyle}
                        placeholder="Ex: A, B, Norte, Sul"
                        value={form.tower}
                        onChange={set('tower')}
                    />
                </Field>

                {/* Notes */}
                <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                    <Field label="Observações">
                        <textarea
                            style={{
                                ...inputStyle,
                                height: 80,
                                padding: '10px 12px',
                                resize: 'vertical',
                            } as React.CSSProperties}
                            placeholder="Notas internas sobre esta unidade..."
                            value={form.notes}
                            onChange={set('notes')}
                        />
                    </Field>
                </div>

                {/* Highlighted */}
                <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                    <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, is_highlighted: !prev.is_highlighted }))}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: form.is_highlighted ? 'rgba(61,111,255,0.10)' : T.elevated,
                            border: `1px solid ${form.is_highlighted ? 'rgba(61,111,255,0.5)' : T.border}`,
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                        }}
                    >
                        <Star
                            size={18}
                            style={{
                                fill: form.is_highlighted ? T.accent : 'transparent',
                                color: form.is_highlighted ? T.accent : T.textMuted,
                                flexShrink: 0,
                            }}
                        />
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-outfit, sans-serif)',
                                fontSize: 13,
                                fontWeight: 600,
                                color: T.text,
                            }}>
                                Unidade em destaque
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-outfit, sans-serif)',
                                fontSize: 11,
                                color: T.textMuted,
                            }}>
                                Aparece com borda dourada no inventário
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        height: 42,
                        padding: '0 20px',
                        borderRadius: 8,
                        background: T.elevated,
                        border: `1px solid ${T.border}`,
                        color: T.textDim,
                        fontFamily: 'var(--font-outfit, sans-serif)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        height: 42,
                        padding: '0 24px',
                        borderRadius: 8,
                        background: T.accent,
                        border: 'none',
                        color: '#0B1120',
                        fontFamily: 'var(--font-outfit, sans-serif)',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        opacity: saving ? 0.7 : 1,
                    }}
                >
                    {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                    {saving ? 'Salvando...' : 'Salvar Unidade'}
                </button>
            </div>
            <style suppressHydrationWarning>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </form>
    )

    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 72, paddingBottom: 40 }}>
                <MobileGlobalStyles />
                <MobileAppBar
                    title="Nova Unidade"
                    subtitle={devName || 'Empreendimento'}
                    onBack={onBack}
                />
                <div style={{ padding: '0 16px' }}>
                    <div style={{
                        background: 'var(--bg-elevated)',
                        borderRadius: 12,
                        padding: 16,
                        border: '1px solid rgba(61,111,255,0.12)',
                    }}>
                        {content}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Back nav */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.textMuted }}>
                    {devName || 'Imóvel'} / Unidades / Nova
                </span>
            </div>

            <PageIntelHeader
                moduleLabel="CADASTRO DE UNIDADE"
                title="Nova Unidade"
                subtitle="Preencha os dados da unidade para adicioná-la ao inventário"
            />

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-lg p-6"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
                {content}
            </motion.div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NovaUnidadePage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string
    const isMobile = useIsMobile()

    const [devName, setDevName] = useState<string>('')
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<FormData>({
        unit_name: '',
        unit_type: 'Apartamento',
        status: 'available',
        area: '',
        total_price: '',
        bedrooms: '',
        bathrooms: '',
        parking_spots: '',
        position: '',
        tower: '',
        is_highlighted: false,
        notes: '',
    })

    useEffect(() => {
        if (!id) return
        createClient()
            .from('developments')
            .select('name')
            .eq('id', id)
            .single()
            .then(({ data }) => { if (data?.name) setDevName(data.name) })
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.unit_name.trim()) {
            toast.error('Nome da unidade é obrigatório')
            return
        }
        if (!form.total_price || Number(form.total_price) <= 0) {
            toast.error('Valor total é obrigatório')
            return
        }

        setSaving(true)
        const supabase = createClient()
        const { error } = await supabase.from('development_units').insert({
            development_id: id,
            unit_name: form.unit_name.trim().toUpperCase(),
            unit_type: form.unit_type,
            status: form.status,
            area: form.area ? Number(form.area) : null,
            total_price: Number(form.total_price),
            bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
            bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
            parking_spots: form.parking_spots ? Number(form.parking_spots) : null,
            position: form.position || null,
            tower: form.tower.trim() || null,
            is_highlighted: form.is_highlighted,
            notes: form.notes.trim() || null,
        })

        setSaving(false)

        if (error) {
            console.error(error)
            toast.error('Erro ao salvar unidade: ' + error.message)
            return
        }

        toast.success('Unidade cadastrada com sucesso!')
        router.push(`/backoffice/imoveis/${id}/unidades`)
    }

    return (
        <UnitForm
            form={form}
            setForm={setForm}
            saving={saving}
            onSubmit={handleSubmit}
            onBack={() => router.push(`/backoffice/imoveis/${id}/unidades`)}
            devName={devName}
            isMobile={isMobile}
        />
    )
}
