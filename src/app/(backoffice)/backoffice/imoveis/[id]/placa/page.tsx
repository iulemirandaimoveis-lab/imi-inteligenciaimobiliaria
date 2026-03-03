'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Printer, Download, QrCode, Loader2, Building2 } from 'lucide-react'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function PlacaPdfPage() {
    const router = useRouter()
    const params = useParams()
    const plaqueRef = useRef<HTMLDivElement>(null)

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        const fetchDevelopment = async () => {
            try {
                const res = await fetch(`/api/developments?id=${params.id}`)
                if (!res.ok) throw new Error('Erro ao carregar')
                const d = await res.json()
                setData(d)

                // Create a tracking link automatically for this Placa if we want
                await generateTrackingQrCode(d)
            } catch (err: any) {
                console.error(err)
                toast.error('Erro ao carregar empreendimento')
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchDevelopment()
    }, [params.id])

    const generateTrackingQrCode = async (imovel: any) => {
        try {
            setIsGenerating(true)
            const identifier = imovel.slug || imovel.id
            const baseUrl = `${window.location.origin}/imoveis/${identifier}`

            // Create a tracking link specifically for the physical plaque
            const shortCode = Math.random().toString(36).substring(2, 8)
            const utmParams = new URLSearchParams({
                utm_source: 'placa_fisica',
                utm_medium: 'qrcode',
                utm_campaign: `placa-${identifier}`,
            })
            const fullUrl = `${baseUrl}?${utmParams.toString()}`

            try {
                const { error } = await supabase
                    .from('tracked_links')
                    .insert([{
                        property_id: imovel.id,
                        short_code: shortCode,
                        original_url: fullUrl,
                        clicks: 0,
                        unique_clicks: 0,
                    }])

                if (error) {
                    throw new Error('Falha no banco de dados. Sincronização offline acionada.')
                }
            } catch (fallbackError: any) {
                console.warn('[Supabase Offline/Error Fallback]', fallbackError)
                toast.warning('Aviso de Sincronização', {
                    description: 'O tracker não foi salvo devido à instabilidade do servidor. O QR Code atual funcionará normalmente em modo fallback direto.'
                })
            }

            const shortUrl = `${window.location.origin}/l/${shortCode}`

            // Generate base64 QR Code
            const qrDataUrl = await QRCode.toDataURL(shortUrl, {
                width: 400,
                margin: 1,
                color: {
                    dark: '#1e293b', // Muted dark blue/gray
                    light: '#ffffff'
                }
            })
            setQrCodeUrl(qrDataUrl)
        } catch (err: any) {
            console.error('Erro ao gerar QR Code', err)
            // Fallback para URL direta sem tracker se falhar
            const fallbackUrl = `${window.location.origin}/imoveis/${imovel.slug || imovel.id}`
            const qrDataUrl = await QRCode.toDataURL(fallbackUrl, { width: 400, margin: 1 })
            setQrCodeUrl(qrDataUrl)
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="animate-spin text-[#C49D5B]" />
                    <p className="text-sm text-gray-500">Montando Placa Inteligente...</p>
                </div>
            </div>
        )
    }

    if (!data) return null

    const mainImage = data.image || (data.gallery_images?.[0]) || null
    const priceStr = data.price_min ? `A partir de R$ ${(data.price_min / 1000000).toFixed(2).replace('.', ',')}M` : 'Consulte'
    const statusLabel = data.status === 'lancamento' ? 'LANÇAMENTO' : data.status === 'disponivel' ? 'VENDE-SE' : 'OPORTUNIDADE'

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header / Ações fora da área de impressão */}
            <div className="print:hidden flex items-center justify-between mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft size={16} /> Voltar
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#C49D5B] text-white rounded-lg font-bold hover:bg-[#b08c50] transition-colors shadow-lg disabled:opacity-50"
                    >
                        <Printer size={18} /> Imprimir Placa
                    </button>
                </div>
            </div>

            {/* A4 PRINT AREA */}
            <div className="bg-white mx-auto shadow-2xl print:shadow-none print:m-0" style={{ width: '210mm', minHeight: '297mm', position: 'relative' }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body { visibility: hidden; background: white; }
                        /* Configurar impressão para tamanho A4 sem margens */
                        @page { size: A4 portrait; margin: 0; }
                        #placa-container {
                            visibility: visible;
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 210mm;
                            height: 297mm;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                `}} />

                <div id="placa-container" ref={plaqueRef} className="w-full h-full flex flex-col bg-white overflow-hidden relative">

                    {/* Imagem de Capa e Overlay */}
                    <div className="w-full h-[50%] relative bg-slate-100">
                        {mainImage ? (
                            <img src={mainImage} alt={data.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <Building2 size={100} className="text-gray-400" />
                            </div>
                        )}
                        {/* Gradient Bottom Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        {/* Title Info na Imagem */}
                        <div className="absolute bottom-8 left-10 pr-10">
                            <div className="inline-block px-4 py-1.5 bg-[#C49D5B] text-white font-black tracking-widest text-sm mb-4 rounded-sm shadow-md uppercase">
                                {statusLabel}
                            </div>
                            <h1 className="text-5xl font-extrabold text-white tracking-tight leading-none drop-shadow-lg mb-2">
                                {data.name}
                            </h1>
                            <p className="text-xl text-gray-200 font-medium">
                                {data.neighborhood} {data.city && `- ${data.city}`}
                            </p>
                        </div>
                    </div>

                    {/* Conteúdo Inferior */}
                    <div className="flex-1 p-10 flex flex-col bg-slate-50">
                        {/* Features Main */}
                        <div className="flex gap-8 border-b-2 border-gray-200 pb-8 mb-8">
                            <div className="flex-1">
                                <h2 className="text-3xl font-black text-slate-800 mb-2">{data.tipo || data.property_type || 'Exclusivo'}</h2>
                                <p className="text-4xl font-extrabold text-[#C49D5B]">{priceStr}</p>
                            </div>
                            <div className="flex gap-6 text-slate-700">
                                {data.bedrooms && (
                                    <div className="text-center">
                                        <div className="text-3xl font-black mb-1">{data.bedrooms}</div>
                                        <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">Quartos</div>
                                    </div>
                                )}
                                {data.private_area && (
                                    <div className="text-center border-l-2 pl-6 border-gray-200">
                                        <div className="text-3xl font-black mb-1">{data.private_area}</div>
                                        <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">m²</div>
                                    </div>
                                )}
                                {data.parking_spaces && (
                                    <div className="text-center border-l-2 pl-6 border-gray-200">
                                        <div className="text-3xl font-black mb-1">{data.parking_spaces}</div>
                                        <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">Vagas</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Call to action & QR Code */}
                        <div className="flex items-center justify-between mt-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                            <div className="max-w-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <QrCode size={32} className="text-[#C49D5B]" />
                                    <h3 className="text-2xl font-black text-slate-800">Escaneie para detalhes</h3>
                                </div>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    Aponte a câmera do seu celular para o QR Code ao lado para acessar fotos, plantas, tour virtual e falar diretamente com o corretor.
                                </p>
                            </div>

                            <div className="w-48 h-48 bg-white rounded-2xl p-2 shadow-inner border-2 border-gray-100 flex items-center justify-center relative">
                                {isGenerating ? (
                                    <Loader2 size={32} className="animate-spin text-[#C49D5B]" />
                                ) : qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                                ) : null}

                                {/* IMI Logo center of QR Code (Optional) */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-8 h-8 bg-white flex items-center justify-center p-1 rounded-sm shadow-sm">
                                        <span className="font-extrabold text-[10px] tracking-tighter text-slate-900">IMI</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer da Placa */}
                        <div className="mt-8 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                                Criado via Inteligência Imobiliária IMI
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
