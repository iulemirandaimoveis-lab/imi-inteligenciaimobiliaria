'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Building2, Megaphone, Radio,
    QrCode, Download, FileText, Copy, Check,
    ChevronRight, Edit3, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'

const supabase = createClient()

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    border: 'var(--bo-border)',
    hover: 'var(--bo-hover)',
    accent: '#C49D5B',
    accentBg: 'rgba(196,157,91,0.10)',
    accentBorder: 'rgba(196,157,91,0.25)',
}

const UTM_SOURCES = [
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'facebook', label: 'Facebook', icon: '👤' },
    { value: 'google', label: 'Google Ads', icon: '🔍' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { value: 'email', label: 'E-mail Marketing', icon: '📧' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'placa', label: 'Placa Física / Offline', icon: '🏢' },
    { value: 'qrcode', label: 'QR Code Impresso', icon: '📱' },
    { value: 'direct', label: 'Direto', icon: '🔗' },
    { value: 'referral', label: 'Indicação', icon: '🤝' },
]

const UTM_MEDIUMS = [
    { value: 'cpc', label: 'CPC (Pago)' },
    { value: 'organic', label: 'Orgânico' },
    { value: 'social', label: 'Social' },
    { value: 'email', label: 'E-mail' },
    { value: 'offline', label: 'Offline / Placa' },
    { value: 'story', label: 'Story' },
    { value: 'post', label: 'Post' },
    { value: 'banner', label: 'Banner' },
]

type Step = 'property' | 'channel' | 'campaign' | 'result'

export default function QRGeneratorPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('property')
    const [loading, setLoading] = useState(false)
    const [developments, setDevelopments] = useState<any[]>([])
    const [copied, setCopied] = useState(false)

    // Form state
    const [selectedDev, setSelectedDev] = useState<any>(null)
    const [selectedSource, setSelectedSource] = useState<typeof UTM_SOURCES[0] | null>(null)
    const [selectedMedium, setSelectedMedium] = useState('')
    const [campaignName, setCampaignName] = useState('')
    const [utmContent, setUtmContent] = useState('')
    const [customSlug, setCustomSlug] = useState('')

    // Result state
    const [generatedLink, setGeneratedLink] = useState<any>(null)
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [shortUrl, setShortUrl] = useState('')

    useEffect(() => {
        loadDevelopments()
    }, [])

    const loadDevelopments = async () => {
        const { data } = await supabase
            .from('developments')
            .select('id, name, slug')
            .order('name')

        setDevelopments(data || [])
    }

    const steps: { key: Step; label: string }[] = [
        { key: 'property', label: 'IMÓVEL' },
        { key: 'channel', label: 'CANAL' },
        { key: 'campaign', label: 'CAMPANHA' },
    ]

    const currentStepIndex = steps.findIndex(s => s.key === step)

    const handleGenerate = async () => {
        if (!selectedDev || !selectedSource || !campaignName) {
            toast.error('Preencha todos os campos obrigatórios')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/qr/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    development_id: selectedDev.id,
                    campaign_name: campaignName,
                    utm_source: selectedSource.value,
                    utm_medium: selectedMedium || 'social',
                    utm_campaign: campaignName.toLowerCase().replace(/\s+/g, '-'),
                    utm_content: utmContent || undefined,
                    custom_slug: customSlug || undefined,
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setGeneratedLink(data.link)
            setShortUrl(data.link.short_url)

            // Generate high-quality QR
            const qr = await QRCode.toDataURL(data.link.short_url, {
                width: 600,
                margin: 2,
                color: { dark: '#0A0A0A', light: '#FFFFFF' },
                errorCorrectionLevel: 'H'
            })
            setQrCodeUrl(qr)

            setStep('result')
            toast.success('QR Code gerado com sucesso!')
        } catch (err: any) {
            toast.error(err.message || 'Erro ao gerar QR Code')
        } finally {
            setLoading(false)
        }
    }

    const copyUrl = () => {
        navigator.clipboard.writeText(shortUrl)
        setCopied(true)
        toast.success('URL copiada!')
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadQR = (format: 'png' | 'pdf') => {
        if (!qrCodeUrl) return
        const a = document.createElement('a')
        a.href = qrCodeUrl
        a.download = `qrcode-${campaignName || 'imi'}.${format === 'pdf' ? 'png' : 'png'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.success(`QR Code baixado!`)
    }

    // Stepper indicator
    const StepIndicator = () => (
        <div className="flex justify-between items-center py-4 mb-2">
            {steps.map((s, i) => {
                const isActive = i <= currentStepIndex || step === 'result'
                return (
                    <div key={s.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div
                                className="w-2.5 h-2.5 rounded-full mb-1 transition-colors"
                                style={{ background: isActive ? T.accent : 'var(--bo-border)' }}
                            />
                            <span
                                className="text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: isActive ? T.accent : T.textMuted }}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className="flex-1 h-px mx-3"
                                style={{ background: i < currentStepIndex || step === 'result' ? T.accentBorder : 'var(--bo-border)' }}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )

    // Selection summary cards
    const SummaryCard = ({ icon: Icon, label, value, onEdit, color }: any) => (
        <div
            className="rounded-xl p-4 flex items-center gap-4 transition-all"
            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
        >
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}` }}
            >
                <Icon size={18} style={{ color: color || T.accent }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>
                    {label}
                </p>
                <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                    {value}
                </p>
            </div>
            {onEdit && (
                <button onClick={onEdit} className="p-1 opacity-50 hover:opacity-100 transition-opacity">
                    <Edit3 size={14} style={{ color: T.textMuted }} />
                </button>
            )}
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => {
                        if (step === 'result') setStep('campaign')
                        else if (step === 'campaign') setStep('channel')
                        else if (step === 'channel') setStep('property')
                        else router.push('/backoffice/tracking')
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <ArrowLeft size={18} style={{ color: T.accent }} />
                </button>
                <div>
                    <h1 className="text-sm font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
                        {step === 'result' ? 'QR Code Gerado' : 'Novo QR Code'}
                    </h1>
                </div>
            </div>

            {/* Stepper */}
            <StepIndicator />

            {/* STEP: Select Property */}
            {step === 'property' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.textMuted }}>
                        Selecione o Imóvel
                    </p>
                    {developments.length === 0 ? (
                        <div className="py-12 text-center" style={{ color: T.textMuted }}>
                            <Building2 size={32} className="mx-auto mb-3 opacity-40" />
                            <p className="text-sm">Nenhum empreendimento cadastrado</p>
                        </div>
                    ) : (
                        developments.map(dev => (
                            <button
                                key={dev.id}
                                onClick={() => { setSelectedDev(dev); setStep('channel') }}
                                className="w-full rounded-xl p-4 flex items-center gap-4 transition-all text-left"
                                style={{
                                    background: selectedDev?.id === dev.id ? T.accentBg : T.elevated,
                                    border: `1px solid ${selectedDev?.id === dev.id ? T.accentBorder : T.border}`,
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}` }}
                                >
                                    <Building2 size={18} style={{ color: T.accent }} />
                                </div>
                                <span className="text-sm font-semibold flex-1" style={{ color: T.text }}>
                                    {dev.name}
                                </span>
                                <ChevronRight size={16} style={{ color: T.textMuted }} />
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* STEP: Select Channel */}
            {step === 'channel' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    {selectedDev && (
                        <SummaryCard
                            icon={Building2}
                            label="Imóvel Selecionado"
                            value={selectedDev.name}
                            onEdit={() => setStep('property')}
                        />
                    )}

                    <p className="text-xs font-bold uppercase tracking-wider mt-6 mb-4" style={{ color: T.textMuted }}>
                        Selecione o Canal de Origem
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {UTM_SOURCES.map(source => (
                            <button
                                key={source.value}
                                onClick={() => { setSelectedSource(source); setStep('campaign') }}
                                className="rounded-xl p-4 flex items-center gap-3 transition-all text-left"
                                style={{
                                    background: selectedSource?.value === source.value ? T.accentBg : T.elevated,
                                    border: `1px solid ${selectedSource?.value === source.value ? T.accentBorder : T.border}`,
                                }}
                            >
                                <span className="text-lg">{source.icon}</span>
                                <span className="text-sm font-semibold" style={{ color: T.text }}>
                                    {source.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-4">
                        <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: T.textMuted }}>
                            Mídia (utm_medium)
                        </label>
                        <select
                            value={selectedMedium}
                            onChange={e => setSelectedMedium(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl text-sm font-medium"
                            style={{
                                background: T.elevated,
                                border: `1px solid ${T.border}`,
                                color: T.text,
                            }}
                        >
                            <option value="">Automático</option>
                            {UTM_MEDIUMS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* STEP: Campaign Details */}
            {step === 'campaign' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    {selectedDev && (
                        <SummaryCard
                            icon={Building2}
                            label="Imóvel Selecionado"
                            value={selectedDev.name}
                            onEdit={() => setStep('property')}
                        />
                    )}
                    {selectedSource && (
                        <SummaryCard
                            icon={Radio}
                            label="Canal de Origem"
                            value={selectedSource.label}
                            onEdit={() => setStep('channel')}
                        />
                    )}

                    <p className="text-xs font-bold uppercase tracking-wider mt-6 mb-4" style={{ color: T.textMuted }}>
                        Configurar Campanha
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: T.textMuted }}>
                                Nome da Campanha *
                            </label>
                            <input
                                type="text"
                                value={campaignName}
                                onChange={e => setCampaignName(e.target.value)}
                                placeholder="Ex: Lançamento Verão 2025"
                                className="w-full h-12 px-4 rounded-xl text-sm"
                                style={{
                                    background: T.elevated,
                                    border: `1px solid ${T.border}`,
                                    color: T.text,
                                }}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: T.textMuted }}>
                                Conteúdo / Variação (opcional)
                            </label>
                            <input
                                type="text"
                                value={utmContent}
                                onChange={e => setUtmContent(e.target.value)}
                                placeholder="Ex: banner-topo, variante-a"
                                className="w-full h-12 px-4 rounded-xl text-sm"
                                style={{
                                    background: T.elevated,
                                    border: `1px solid ${T.border}`,
                                    color: T.text,
                                }}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: T.textMuted }}>
                                Slug Personalizado (opcional)
                            </label>
                            <input
                                type="text"
                                value={customSlug}
                                onChange={e => setCustomSlug(e.target.value)}
                                placeholder="Ex: verao-2025"
                                className="w-full h-12 px-4 rounded-xl text-sm"
                                style={{
                                    background: T.elevated,
                                    border: `1px solid ${T.border}`,
                                    color: T.text,
                                }}
                            />
                            <p className="text-[10px] mt-1" style={{ color: T.textMuted }}>
                                Será usado na URL: iulemirandaimoveis.com.br/l/verao-2025
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!campaignName || loading}
                        className="w-full h-14 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-3 mt-6 transition-all disabled:opacity-50"
                        style={{
                            background: T.accent,
                            color: '#fff',
                            boxShadow: '0 4px 16px rgba(196,157,91,0.25)',
                        }}
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <QrCode size={20} />
                        )}
                        {loading ? 'Gerando...' : 'Gerar QR Code'}
                    </button>
                </div>
            )}

            {/* STEP: Result */}
            {step === 'result' && qrCodeUrl && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Summary cards */}
                    <div className="space-y-3">
                        <SummaryCard icon={Building2} label="Imóvel Selecionado" value={selectedDev?.name} />
                        <SummaryCard icon={Radio} label="Canal de Origem" value={selectedSource?.label} />
                        <SummaryCard icon={Megaphone} label="Campanha Ativa" value={campaignName} color={T.accent} />
                    </div>

                    {/* QR Code Display */}
                    <div className="relative">
                        <div
                            className="absolute inset-0 blur-[80px] rounded-full -z-10 opacity-30"
                            style={{ background: T.accent }}
                        />
                        <div
                            className="bg-white rounded-2xl p-6 flex flex-col items-center"
                            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: `3px solid ${T.accentBorder}` }}
                        >
                            {/* QR Image */}
                            <div className="relative p-2 bg-white rounded-lg">
                                <img
                                    src={qrCodeUrl}
                                    alt="QR Code"
                                    className="w-[200px] h-[200px] block"
                                />
                                {/* Center logo overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-white p-1 rounded-sm shadow-sm">
                                        <div
                                            className="text-[10px] font-black px-1.5 py-0.5 text-white rounded-[2px] tracking-tighter"
                                            style={{ background: T.accent }}
                                        >
                                            IMI
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tracking URL */}
                            <div
                                className="mt-6 w-full rounded-lg p-3"
                                style={{ background: 'var(--bo-surface)', border: `1px solid ${T.border}` }}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold tracking-wider" style={{ color: T.textMuted }}>
                                        URL COM TRACKING
                                    </span>
                                    <span
                                        className="text-[9px] font-bold px-1.5 rounded uppercase"
                                        style={{ color: T.accent, background: T.accentBg }}
                                    >
                                        Trackeado
                                    </span>
                                </div>
                                <p
                                    className="text-[11px] font-mono break-all leading-tight"
                                    style={{ color: T.text }}
                                >
                                    {shortUrl}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => downloadQR('png')}
                            className="w-full py-4 px-6 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-3 transition-all text-white"
                            style={{ background: T.accent, boxShadow: '0 4px 16px rgba(196,157,91,0.25)' }}
                        >
                            <Download size={18} />
                            Baixar PNG (Alta Resolução)
                        </button>

                        <button
                            onClick={() => downloadQR('pdf')}
                            className="w-full py-4 px-6 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-3 transition-all"
                            style={{
                                background: T.elevated,
                                border: `1px solid ${T.accentBorder}`,
                                color: T.text,
                            }}
                        >
                            <FileText size={18} />
                            Baixar PDF para Impressão
                        </button>

                        <button
                            onClick={copyUrl}
                            className="w-full py-3 px-6 rounded-xl font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                            style={{ color: T.textMuted }}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'URL Copiada!' : 'Copiar URL Curta'}
                        </button>
                    </div>

                    {/* Analytics Preview */}
                    <div style={{ borderTop: `1px solid ${T.border}` }} className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 rounded-full" style={{ background: T.accent }} />
                            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: T.text }}>
                                Analytics Tracking IMI
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className="p-3 rounded-lg"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                            >
                                <p className="text-[10px] font-bold mb-1" style={{ color: T.textMuted }}>
                                    SCANS REGISTRADOS
                                </p>
                                <p className="text-lg font-bold" style={{ color: T.text }}>
                                    0 <span className="text-[10px]" style={{ color: T.textMuted }}>novo</span>
                                </p>
                            </div>
                            <div
                                className="p-3 rounded-lg"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                            >
                                <p className="text-[10px] font-bold mb-1" style={{ color: T.textMuted }}>
                                    CONVERSÃO EST.
                                </p>
                                <p className="text-lg font-bold" style={{ color: T.text }}>
                                    --
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Generate Another */}
                    <button
                        onClick={() => {
                            setStep('property')
                            setGeneratedLink(null)
                            setQrCodeUrl('')
                            setShortUrl('')
                            setCampaignName('')
                            setUtmContent('')
                            setCustomSlug('')
                        }}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{ color: T.accent }}
                    >
                        + Gerar Novo QR Code
                    </button>
                </div>
            )}
        </div>
    )
}
