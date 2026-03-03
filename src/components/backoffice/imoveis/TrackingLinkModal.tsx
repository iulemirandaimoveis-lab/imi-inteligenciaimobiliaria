'use client'

import { useState } from 'react'
import { X, Copy, Check, ExternalLink, Hash, RefreshCcw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Development } from '@/types/development'
import { useToast } from '@/components/ui/Toast'

interface TrackingLinkModalProps {
    property: Development // Using Development type
    onClose: () => void
}

export default function TrackingLinkModal({ property, onClose }: TrackingLinkModalProps) {
    const supabase = createClient()
    const { showToast } = useToast()
    const [campaign, setCampaign] = useState('')
    const [medium, setMedium] = useState('social')
    const [source, setSource] = useState('instagram')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedLink, setGeneratedLink] = useState('')
    const [isCopied, setIsCopied] = useState(false)

    async function generateLink() {
        if (!campaign.trim()) {
            showToast('Nome da campanha é obrigatório', 'error')
            return
        }

        setIsGenerating(true)

        try {
            // Gerar código curto único
            const shortCode = Math.random().toString(36).substring(2, 8)

            // URL base do imóvel
            // Assuming we have a slug or using id
            const identifier = (property as any).slug || property.id
            const baseUrl = `${window.location.origin}/imoveis/${identifier}`

            // URL com UTM params
            const utmParams = new URLSearchParams({
                utm_source: source,
                utm_medium: medium,
                utm_campaign: campaign,
                utm_content: identifier,
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
            showToast('Link de rastreamento criado!', 'success')
        } catch (err: any) {
            showToast('Erro ao gerar link: ' + err.message, 'error')
        } finally {
            setIsGenerating(false)
        }
    }

    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(generatedLink)
            setIsCopied(true)
            showToast('Copiado para a área de transferência', 'success')
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            showToast('Erro ao copiar link', 'error')
        }
    }

    const reset = () => {
        setGeneratedLink('')
        setCampaign('')
        setIsCopied(false)
    }

    return (
        <div className="fixed inset-0 bg-imi-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col border border-imi-100">
                <div className="px-8 py-6 border-b border-imi-50 flex items-center justify-between bg-white relative">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-imi-50 rounded-2xl flex items-center justify-center">
                            <Hash className="w-6 h-6 text-imi-900" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-imi-900 uppercase tracking-tight leading-none mb-1 font-display">Gerador de Links</h2>
                            <p className="text-xs text-imi-400 font-bold uppercase tracking-widest">{(property as any).title || property.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-imi-50 rounded-xl transition-colors text-imi-400 hover:text-red-500"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    {!generatedLink ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Identificador da Campanha *</label>
                                <input
                                    value={campaign}
                                    onChange={(e) => setCampaign(e.target.value)}
                                    placeholder="Ex: verao-2026-leads (Sem espaços)"
                                    className="w-full h-14 px-4 rounded-xl border border-imi-100 bg-imi-50/50 font-medium text-imi-900 focus:outline-none focus:ring-2 focus:ring-imi-900 placeholder:text-imi-300"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Origem (Source)</label>
                                    <div className="relative">
                                        <select
                                            value={source}
                                            onChange={(e) => setSource(e.target.value)}
                                            className="w-full h-14 px-4 rounded-xl border border-imi-100 bg-white font-medium text-imi-700 focus:outline-none focus:ring-2 focus:ring-imi-900 appearance-none"
                                        >
                                            <option value="instagram">Instagram</option>
                                            <option value="facebook">Facebook</option>
                                            <option value="google">Google Ads</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="email">Email Marketing</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-imi-400 uppercase tracking-widest">Meio (Medium)</label>
                                    <div className="relative">
                                        <select
                                            value={medium}
                                            onChange={(e) => setMedium(e.target.value)}
                                            className="w-full h-14 px-4 rounded-xl border border-imi-100 bg-white font-medium text-imi-700 focus:outline-none focus:ring-2 focus:ring-imi-900 appearance-none"
                                        >
                                            <option value="social">Social Organic</option>
                                            <option value="paid">Paid Ads (CPC)</option>
                                            <option value="email">Newsletter</option>
                                            <option value="referral">Referral</option>
                                            <option value="direct">Direct</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 h-14 rounded-xl border-imi-200 text-imi-500 font-bold uppercase tracking-widest hover:bg-imi-50"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={generateLink}
                                    disabled={isGenerating || !campaign.trim()}
                                    className="flex-[2] h-14 bg-imi-900 text-white rounded-xl shadow-elevated hover:bg-black font-bold uppercase tracking-widest"
                                >
                                    {isGenerating ? 'Processando...' : 'Gerar URL Rastreada'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in zoom-in-95 duration-300">
                            <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-100">
                                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                                    <Check className="w-8 h-8" strokeWidth={3} />
                                </div>
                                <h4 className="text-green-900 font-black text-lg mb-1">Link Gerado com Sucesso!</h4>
                                <p className="text-green-700/80 text-sm font-medium">O traqueamento está ativo e pronto para uso.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-black text-imi-400 uppercase tracking-widest">URL Encurtada para Campanha</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-imi-50 rounded-xl flex items-center px-4 border border-imi-100">
                                        <span className="font-mono text-sm text-imi-900 truncate">{generatedLink}</span>
                                    </div>
                                    <Button
                                        onClick={copyToClipboard}
                                        className={`h-14 w-14 rounded-xl flex items-center justify-center transition-all ${isCopied ? 'bg-green-500 text-white' : 'bg-imi-900 text-white hover:bg-black'}`}
                                    >
                                        {isCopied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                    </Button>
                                    <a
                                        href={generatedLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-14 w-14 rounded-xl border-2 border-imi-100 flex items-center justify-center text-imi-400 hover:text-imi-900 hover:border-imi-900 transition-all"
                                    >
                                        <ExternalLink className="w-6 h-6" />
                                    </a>
                                </div>
                            </div>

                            <button
                                onClick={reset}
                                className="w-full py-4 text-center text-xs font-bold text-imi-400 hover:text-imi-900 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Criar Novo Link
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
