'use client'

import { useState, useEffect } from 'react'
import { Link as LinkIcon, Copy, QrCode, Download, CheckCircle, Share2, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'

const supabase = createClient()

interface LinkForm {
    development_id: string
    campaign_name: string
    utm_source: string
    utm_medium: string
    utm_campaign: string
    utm_content?: string
    custom_slug?: string
}

const UTM_SOURCES = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'google', label: 'Google' },
    { value: 'email', label: 'E-mail' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'direct', label: 'Direto' },
    { value: 'referral', label: 'Indicação' }
]

const UTM_MEDIUMS = [
    { value: 'cpc', label: 'CPC (Pago)' },
    { value: 'organic', label: 'Orgânico' },
    { value: 'social', label: 'Social' },
    { value: 'email', label: 'E-mail' },
    { value: 'referral', label: 'Referência' },
    { value: 'banner', label: 'Banner' },
    { value: 'story', label: 'Story' },
    { value: 'post', label: 'Post' }
]

export default function LinkGenerator() {
    const [formData, setFormData] = useState<LinkForm>({
        development_id: '',
        campaign_name: '',
        utm_source: 'instagram',
        utm_medium: 'social',
        utm_campaign: '',
        utm_content: '',
        custom_slug: ''
    })
    const [generatedLink, setGeneratedLink] = useState('')
    const [shortLink, setShortLink] = useState('')
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [developments, setDevelopments] = useState<any[]>([])

    useEffect(() => {
        loadDevelopments()
    }, []) // Fix: Added dependency array to avoid infinite loop

    const loadDevelopments = async () => {
        const { data } = await supabase
            .from('developments')
            .select('id, name, slug')
            .eq('status', 'published')
            .order('name')

        setDevelopments(data || [])
    }

    const generateLink = async () => {
        if (!formData.development_id || !formData.utm_campaign) {
            toast.error('Preencha empreendimento e campanha')
            return
        }

        setLoading(true)

        try {
            const development = developments.find(d => d.id === formData.development_id)
            if (!development) throw new Error('Empreendimento não encontrado')

            // URL base
            const baseUrl = 'https://www.iulemirandaimoveis.com.br'
            const path = `/imoveis/${development.slug}`

            // Construir query params
            const params = new URLSearchParams()
            params.append('utm_source', formData.utm_source)
            params.append('utm_medium', formData.utm_medium)
            params.append('utm_campaign', formData.utm_campaign)
            if (formData.utm_content) params.append('utm_content', formData.utm_content)


            const fullLink = `${baseUrl}${path}?${params.toString()}`
            setGeneratedLink(fullLink)

            // Criar registro no banco
            const { data: trackingLink, error } = await supabase
                .from('tracked_links')
                .insert({
                    development_id: formData.development_id,
                    campaign_name: formData.campaign_name,
                    url: fullLink,
                    utm_params: {
                        source: formData.utm_source,
                        medium: formData.utm_medium,
                        campaign: formData.utm_campaign,
                        content: formData.utm_content
                    },
                    custom_slug: formData.custom_slug || null,
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            // Short link - logic placeholder, as actual shortener needs backend/middleware
            const slug = formData.custom_slug || trackingLink.id.substring(0, 8)
            const shortUrl = `${baseUrl}/l/${slug}`
            setShortLink(shortUrl)

            // Gerar QR Code
            const qr = await QRCode.toDataURL(fullLink, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#1A1A1A',
                    light: '#FFFFFF'
                }
            })
            setQrCodeUrl(qr)

            toast.success('Link gerado com sucesso!')

        } catch (error: any) {
            console.error('Erro ao gerar link:', error)
            toast.error(error.message || 'Erro ao gerar link')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Link copiado!')
    }

    const downloadQRCode = () => {
        // Create link and download
        const link = document.createElement('a')
        link.href = qrCodeUrl
        link.download = `qrcode-${formData.utm_campaign}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('QR Code baixado!')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-imi-900 mb-2">
                    Gerador de Links com Tracking
                </h1>
                <p className="text-imi-600">
                    Crie links rastreáveis para medir performance de campanhas
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-imi-100 p-8 space-y-6 shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-imi-700 mb-2">
                        Empreendimento *
                    </label>
                    <select
                        value={formData.development_id}
                        onChange={(e) => setFormData({ ...formData, development_id: e.target.value })}
                        className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="">Selecione um empreendimento</option>
                        {developments.map((dev) => (
                            <option key={dev.id} value={dev.id}>
                                {dev.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-imi-700 mb-2">
                        Nome da Campanha * (interno)
                    </label>
                    <input
                        type="text"
                        value={formData.campaign_name}
                        onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                        className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        placeholder="Ex: Lancamento Outubro 2025"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-imi-700 mb-2">
                            Origem (utm_source) *
                        </label>
                        <select
                            value={formData.utm_source}
                            onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                            className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                        >
                            {UTM_SOURCES.map((source) => (
                                <option key={source.value} value={source.value}>
                                    {source.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-imi-700 mb-2">
                            Mídia (utm_medium) *
                        </label>
                        <select
                            value={formData.utm_medium}
                            onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                            className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                        >
                            {UTM_MEDIUMS.map((medium) => (
                                <option key={medium.value} value={medium.value}>
                                    {medium.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-imi-700 mb-2">
                        Campanha (utm_campaign) *
                    </label>
                    <input
                        type="text"
                        value={formData.utm_campaign}
                        onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                        className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        placeholder="Ex: lancamento_2025"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-imi-700 mb-2">
                            Conteúdo (utm_content) (opcional)
                        </label>
                        <input
                            type="text"
                            value={formData.utm_content}
                            onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
                            className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                            placeholder="Ex: banner_topo"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-imi-700 mb-2">
                            Slug Personalizado (opcional)
                        </label>
                        <input
                            type="text"
                            value={formData.custom_slug}
                            onChange={(e) => setFormData({ ...formData, custom_slug: e.target.value })}
                            className="w-full h-12 px-4 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                            placeholder="Ex: promo-outubro"
                        />
                    </div>
                </div>

                <button
                    onClick={generateLink}
                    disabled={loading}
                    className="w-full h-12 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <LinkIcon size={20} />
                            Gerar Link Rastreável
                        </>
                    )}
                </button>
            </div>

            {/* Generated Links */}
            {generatedLink && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    {/* Full Link */}
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle size={20} className="text-green-600" />
                            <h3 className="font-bold text-green-900">Link Completo</h3>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-green-200">
                            <code className="flex-1 text-sm text-imi-700 overflow-x-auto whitespace-nowrap">
                                {generatedLink}
                            </code>
                            <button
                                onClick={() => copyToClipboard(generatedLink)}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
                            >
                                <Copy size={18} className="text-green-700" />
                            </button>
                        </div>
                    </div>

                    {/* Short Link */}
                    {shortLink && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Share2 size={20} className="text-blue-600" />
                                <h3 className="font-bold text-blue-900">Link Curto</h3>
                            </div>
                            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-blue-200">
                                <code className="flex-1 text-lg font-semibold text-blue-700">
                                    {shortLink}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(shortLink)}
                                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <Copy size={18} className="text-blue-700" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* QR Code */}
                    {qrCodeUrl && (
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <QrCode size={20} className="text-purple-600" />
                                    <h3 className="font-bold text-purple-900">QR Code</h3>
                                </div>
                                <button
                                    onClick={downloadQRCode}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                                >
                                    <Download size={16} />
                                    Baixar PNG
                                </button>
                            </div>
                            <div className="bg-white rounded-xl p-6 border border-purple-200 flex justify-center">
                                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                            </div>
                        </div>
                    )}

                    {/* Analytics Preview */}
                    <div className="bg-white border border-imi-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={20} className="text-accent-600" />
                            <h3 className="font-bold text-imi-900">Tracking Configurado</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-imi-50 rounded-lg">
                                <div className="text-xs text-imi-500 mb-1">Origem</div>
                                <div className="font-medium text-imi-900">{formData.utm_source}</div>
                            </div>
                            <div className="p-3 bg-imi-50 rounded-lg">
                                <div className="text-xs text-imi-500 mb-1">Mídia</div>
                                <div className="font-medium text-imi-900">{formData.utm_medium}</div>
                            </div>
                            <div className="p-3 bg-imi-50 rounded-lg">
                                <div className="text-xs text-imi-500 mb-1">Campanha</div>
                                <div className="font-medium text-imi-900">{formData.utm_campaign}</div>
                            </div>
                            <div className="p-3 bg-imi-50 rounded-lg">
                                <div className="text-xs text-imi-500 mb-1">Conteúdo</div>
                                <div className="font-medium text-imi-900">{formData.utm_content || '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
