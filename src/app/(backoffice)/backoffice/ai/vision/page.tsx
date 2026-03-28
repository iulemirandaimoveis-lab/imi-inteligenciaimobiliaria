'use client'

import { useState, useRef } from 'react'
import {
    Eye, Upload, Image as ImageIcon, Loader2,
    Sparkles, X, Camera, CheckCircle2, Building2,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface AnalysisResult {
    description: string
    features: string[]
    condition: string
    suggestions: string[]
    score: number
}

export default function AIVisionPage() {
    const [image, setImage] = useState<string | null>(null)
    const [fileName, setFileName] = useState('')
    const [analyzing, setAnalyzing] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Selecione uma imagem válida')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Imagem muito grande (máx 10MB)')
            return
        }
        setFileName(file.name)
        setResult(null)
        const reader = new FileReader()
        reader.onload = () => setImage(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    const analyze = async () => {
        if (!image) return
        setAnalyzing(true)
        try {
            const res = await fetch('/api/ai/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image }),
            })
            if (!res.ok) throw new Error('Erro na análise')
            const data = await res.json()
            setResult(data)
            toast.success('Análise concluída')
        } catch {
            toast.error('Erro ao analisar imagem. Verifique a configuração da IA.')
        } finally {
            setAnalyzing(false)
        }
    }

    const clear = () => {
        setImage(null)
        setFileName('')
        setResult(null)
    }

    return (
        <div style={{ padding: '24px 28px', maxWidth: 960, margin: '0 auto' }}>
            <PageIntelHeader
                title="Visão IA"
                subtitle="Análise inteligente de imagens de imóveis"
                icon={Eye}
            />

            {/* Upload area */}
            <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !image && fileRef.current?.click()}
                style={{
                    marginTop: 24,
                    border: `2px dashed ${image ? T.borderLight : T.border}`,
                    borderRadius: 16,
                    background: image ? 'transparent' : T.elevated,
                    padding: image ? 0 : 48,
                    textAlign: 'center',
                    cursor: image ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleFile(file)
                    }}
                />

                {!image ? (
                    <div>
                        <Upload size={40} style={{ color: T.textDim, marginBottom: 12 }} />
                        <p style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>
                            Arraste uma foto do imóvel ou clique para selecionar
                        </p>
                        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
                            JPG, PNG ou WebP · Máx 10MB
                        </p>
                    </div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <img
                            src={image}
                            alt={fileName}
                            style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
                        />
                        <button
                            onClick={clear}
                            style={{
                                position: 'absolute', top: 12, right: 12,
                                background: 'rgba(0,0,0,0.6)', border: 'none',
                                borderRadius: 8, padding: 8, cursor: 'pointer',
                            }}
                        >
                            <X size={16} style={{ color: '#fff' }} />
                        </button>
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            padding: '12px 16px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span style={{ color: '#fff', fontSize: 13, opacity: 0.9 }}>
                                <ImageIcon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                                {fileName}
                            </span>
                            <button
                                onClick={analyze}
                                disabled={analyzing}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: analyzing ? T.borderLight : 'var(--gold, #C8A44A)',
                                    color: analyzing ? T.textMuted : '#0B1120',
                                    border: 'none', borderRadius: 10,
                                    padding: '8px 18px', fontSize: 13, fontWeight: 700,
                                    cursor: analyzing ? 'wait' : 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                                {analyzing ? 'Analisando...' : 'Analisar com IA'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ marginTop: 24 }}
                    >
                        {/* Score */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: 20, borderRadius: 12,
                            background: T.surface, border: `1px solid ${T.border}`,
                            marginBottom: 16,
                        }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 12,
                                background: result.score >= 80 ? 'rgba(52,211,153,0.15)' : result.score >= 60 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, fontWeight: 800,
                                color: result.score >= 80 ? '#34D399' : result.score >= 60 ? '#FCD34D' : '#F87171',
                            }}>
                                {result.score}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>
                                    Score de Apresentação
                                </p>
                                <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>
                                    Condição: {result.condition}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{
                            padding: 20, borderRadius: 12,
                            background: T.surface, border: `1px solid ${T.border}`,
                            marginBottom: 16,
                        }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Building2 size={16} style={{ color: 'var(--gold, #C8A44A)' }} />
                                Descrição
                            </h3>
                            <p style={{ margin: 0, fontSize: 14, color: T.textBody, lineHeight: 1.6 }}>
                                {result.description}
                            </p>
                        </div>

                        {/* Features */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
                        }}>
                            <div style={{
                                padding: 20, borderRadius: 12,
                                background: T.surface, border: `1px solid ${T.border}`,
                            }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle2 size={16} style={{ color: '#34D399' }} />
                                    Pontos Fortes
                                </h3>
                                <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {result.features.map((f, i) => (
                                        <li key={i} style={{ fontSize: 13, color: T.textBody }}>{f}</li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{
                                padding: 20, borderRadius: 12,
                                background: T.surface, border: `1px solid ${T.border}`,
                            }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Camera size={16} style={{ color: 'var(--gold, #C8A44A)' }} />
                                    Sugestões de Melhoria
                                </h3>
                                <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {result.suggestions.map((s, i) => (
                                        <li key={i} style={{ fontSize: 13, color: T.textBody }}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
