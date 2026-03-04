'use client'

import { useState } from 'react'
import { X, Copy, Check, ExternalLink, Hash } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Property } from '../types'
import { createClient } from '@/lib/supabase/client'

interface TrackingLinkModalProps {
    property: Property
    onClose: () => void
}

export default function TrackingLinkModal({ property, onClose }: TrackingLinkModalProps) {
    const supabase = createClient()
    const [campaign, setCampaign] = useState('')
    const [medium, setMedium] = useState('social')
    const [source, setSource] = useState('instagram')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedLink, setGeneratedLink] = useState('')
    const [isCopied, setIsCopied] = useState(false)

    async function generateLink() {
        if (!campaign.trim()) {
            alert('Nome da campanha é obrigatório')
            return
        }

        setIsGenerating(true)

        try {
            // Gerar código curto único
            const shortCode = Math.random().toString(36).substring(2, 8)

            // URL base do imóvel
            const baseUrl = `${window.location.origin}/imoveis/${property.slug}`

            // URL com UTM params
            const utmParams = new URLSearchParams({
                utm_source: source,
                utm_medium: medium,
                utm_campaign: campaign,
                utm_content: property.slug,
            })

            const fullUrl = `${baseUrl}?${utmParams.toString()}`

            // Salvar no banco
            const { error } = await supabase
                .from('tracked_links')
                .insert([{
                    property_id: property.id,
                    short_code: shortCode,
                    original_url: fullUrl,
                    clicks: 0,
                    unique_clicks: 0,
                }])

            if (error) throw error

            // URL encurtada
            const shortUrl = `${window.location.origin}/l/${shortCode}`
            setGeneratedLink(shortUrl)
        } catch (err: any) {
            alert('Erro ao gerar link: ' + err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(generatedLink)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            alert('Erro ao copiar link')
        }
    }

    return (
        <div className="fixed inset-0 bg-imi-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-imi-50 rounded-xl flex items-center justify-center">
                            <Hash className="w-5 h-5 text-imi-900" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-imi-900 uppercase tracking-widest leading-none mb-1">Gerador de Links</h2>
                            <p className="text-xs text-slate-400 font-medium">{property.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {!generatedLink ? (
                        <div className="space-y-6">
                            <div className="bg-imi-50 border border-imi-100 rounded-xl p-5 mb-6">
                                <p className="text-xs font-bold text-imi-900 uppercase tracking-widest mb-2">Por que rastrear?</p>
                                <p className="text-sm text-imi-700 leading-relaxed">
                                    Crie links personalizados para cada canal de divulgação. Isso permite identificar quais campanhas trazem leads qualificados e maior conversão.
                                </p>
                            </div>

                            <Input
                                label="Identificador da Campanha *"
                                value={campaign}
                                onChange={(e) => setCampaign(e.target.value)}
                                placeholder="Ex: instagram-ads-fevereiro"
                                hint="Evite espaços ou caracteres especiais."
                            />

                            <div className="grid md:grid-cols-2 gap-6">
                                <Select
                                    label="Origem do Tráfego (Source)"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    options={[
                                        { value: 'instagram', label: 'Instagram' },
                                        { value: 'facebook', label: 'Facebook' },
                                        { value: 'whatsapp', label: 'WhatsApp' },
                                        { value: 'email', label: 'Email' },
                                        { value: 'google', label: 'Google Ads' },
                                        { value: 'linkedin', label: 'LinkedIn' },
                                        { value: 'tiktok', label: 'TikTok' },
                                        { value: 'youtube', label: 'YouTube' },
                                        { value: 'website', label: 'Website' },
                                        { value: 'other', label: 'Outro' },
                                    ]}
                                />

                                <Select
                                    label="Meio de Conversão (Medium)"
                                    value={medium}
                                    onChange={(e) => setMedium(e.target.value)}
                                    options={[
                                        { value: 'social', label: 'Social Content' },
                                        { value: 'email', label: 'Newsletter/Direct' },
                                        { value: 'paid', label: 'Paid Ads' },
                                        { value: 'organic', label: 'Organic/SEO' },
                                        { value: 'referral', label: 'Referral' },
                                        { value: 'direct', label: 'Direct' },
                                    ]}
                                />
                            </div>

                            <div className="space-y-6 pt-6">
                                <Button
                                    onClick={generateLink}
                                    disabled={isGenerating || !campaign.trim()}
                                    fullWidth
                                >
                                    {isGenerating ? 'Processando...' : 'Gerar URL de Alta Performance'}
                                </Button>
                                <Button variant="ghost" onClick={onClose} fullWidth>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-8 text-center">
                                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-6 h-6" strokeWidth={3} />
                                </div>
                                <h4 className="text-green-900 font-bold mb-1">Câmbio de Link Ativado!</h4>
                                <p className="text-sm text-green-700">O rastreamento está pronto para ser utilizado.</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-imi-400 uppercase tracking-widest mb-2">URL Curta para Divulgação</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                value={generatedLink}
                                                readOnly
                                                className="font-mono text-xs bg-slate-50"
                                            />
                                        </div>
                                        <Button onClick={copyToClipboard} variant={isCopied ? 'primary' : 'outline'} className="flex-shrink-0">
                                            {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        onClick={() => window.open(generatedLink, '_blank')}
                                        variant="outline"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Testar
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setGeneratedLink('')
                                            setCampaign('')
                                        }}
                                        variant="outline"
                                    >
                                        Novo Link
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
