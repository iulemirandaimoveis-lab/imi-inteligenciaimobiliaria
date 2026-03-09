'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Upload, FileText, Image as ImageIcon, Sparkles,
    CheckCircle, Download, Save, Edit3, Loader2, AlertCircle,
    MapPin, Ruler, User, Building2, Copy, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

const T = {
    bg: 'var(--bo-surface)',
    card: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    sub: 'var(--bo-text-muted)',
}

type Step = 1 | 2 | 3 | 4

interface UploadedFile {
    id: string
    name: string
    type: 'document' | 'image'
    size: number
}

const TIPOS_IMOVEL = ['Apartamento', 'Casa', 'Cobertura', 'Studio', 'Loft', 'Terreno', 'Comercial']

export default function AvaliacaoIAPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState<Step>(1)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [aiContent, setAiContent] = useState('')
    const [editableContent, setEditableContent] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [aiMeta, setAiMeta] = useState<{ tokens?: number; model?: string }>({})

    const [propertyForm, setPropertyForm] = useState({
        address: '',
        type: 'Apartamento',
        area: '',
        bedrooms: '',
        bathrooms: '',
        parking: '',
        floor: '',
        clientName: '',
        clientCpf: '',
    })

    const setField = (key: keyof typeof propertyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setPropertyForm(p => ({ ...p, [key]: e.target.value }))

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const newFiles: UploadedFile[] = files.map(file => ({
            id: crypto.randomUUID().slice(0, 9),
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'document',
            size: file.size,
        }))
        setUploadedFiles(prev => [...prev, ...newFiles])
    }

    const removeFile = (id: string) => setUploadedFiles(prev => prev.filter(f => f.id !== id))

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const buildPrompt = () => {
        const fileList = uploadedFiles.length > 0
            ? uploadedFiles.map(f => `  - ${f.name} (${formatFileSize(f.size)})`).join('\n')
            : '  - Nenhum arquivo enviado'

        return `Solicitação de Avaliação Imobiliária — NBR 14653-2

DADOS DO IMÓVEL:
  Endereço: ${propertyForm.address || 'Não informado'}
  Tipo: ${propertyForm.type}
  Área privativa: ${propertyForm.area ? propertyForm.area + ' m²' : 'Não informada'}
  Quartos: ${propertyForm.bedrooms || '-'} | Banheiros: ${propertyForm.bathrooms || '-'} | Vagas: ${propertyForm.parking || '-'}
  Andar: ${propertyForm.floor || '-'}

DADOS DO CLIENTE:
  Nome: ${propertyForm.clientName || 'Não informado'}
  CPF: ${propertyForm.clientCpf || 'Não informado'}

DOCUMENTOS ENVIADOS:
${fileList}

Por favor, gere um laudo de avaliação imobiliária completo seguindo a norma NBR 14653-2, incluindo: protocolo, identificação do imóvel, descrição técnica, metodologia utilizada, pesquisa de mercado com pelo menos 3 imóveis comparáveis na região, cálculo do valor de mercado com intervalo de confiança, e conclusão técnica fundamentada.`
    }

    const handleAnalyze = async () => {
        if (!propertyForm.address.trim()) {
            toast.error('Informe o endereço do imóvel antes de analisar')
            return
        }

        setIsAnalyzing(true)
        setCurrentStep(2)

        try {
            const res = await fetch('/api/claude/generate-evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: buildPrompt(),
                    evaluationId: `AVL-${Date.now()}`,
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Falha na análise IA')
            }

            const data = await res.json()
            const content = data.content || ''
            setAiContent(content)
            setEditableContent(content)
            setAiMeta({ tokens: data.tokens, model: data.model })
            setCurrentStep(3)
        } catch (e: any) {
            toast.error('Erro ao analisar: ' + e.message)
            setCurrentStep(1)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleSave = async () => {
        const content = isEditing ? editableContent : aiContent
        try {
            const res = await fetch('/api/avaliacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: propertyForm.type,
                    endereco: propertyForm.address,
                    cliente: propertyForm.clientName,
                    area: propertyForm.area ? parseFloat(propertyForm.area) : null,
                    laudo_ia: content,
                    status: 'rascunho',
                }),
            })
            if (!res.ok) throw new Error('Erro ao salvar')
            toast.success('Laudo salvo com sucesso!')
            router.push('/backoffice/avaliacoes')
        } catch (e: any) {
            toast.error('Erro ao salvar: ' + e.message)
        }
    }

    const STEPS = [
        { number: 1, label: 'Dados', icon: Building2 },
        { number: 2, label: 'Análise IA', icon: Sparkles },
        { number: 3, label: 'Revisão', icon: Edit3 },
        { number: 4, label: 'Exportar', icon: Download },
    ]

    const inputStyle: React.CSSProperties = {
        width: '100%', height: '42px', padding: '0 12px',
        borderRadius: '10px', fontSize: '14px', outline: 'none',
        background: T.bg, border: `1px solid ${T.border}`, color: T.text,
    }
    const inputWithIconStyle: React.CSSProperties = { ...inputStyle, paddingLeft: '36px' }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: T.card, border: `1px solid ${T.border}` }}
                    >
                        <ArrowLeft size={20} style={{ color: T.text }} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: T.text }}>
                            Gerar Laudo com IA
                            <span
                                className="px-3 py-1 rounded-full text-xs font-medium border"
                                style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', borderColor: 'rgba(139,92,246,0.25)' }}
                            >
                                <Sparkles size={11} className="inline mr-1" />
                                Claude AI
                            </span>
                        </h1>
                        <p className="text-sm mt-1" style={{ color: T.sub }}>Geração automática de laudos NBR 14653</p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="rounded-2xl p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="flex items-center">
                    {STEPS.map((step, index) => {
                        const StepIcon = step.icon
                        const isActive = currentStep === step.number
                        const isDone = currentStep > step.number
                        return (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                                        style={{
                                            background: isDone ? 'rgba(107,184,123,0.15)' : isActive ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                                            border: `2px solid ${isDone ? '#6BB87B' : isActive ? '#8B5CF6' : T.border}`,
                                            color: isDone ? '#6BB87B' : isActive ? '#8B5CF6' : T.sub,
                                        }}
                                    >
                                        {isDone ? <CheckCircle size={20} /> : <StepIcon size={20} />}
                                    </div>
                                    <p className="text-xs font-medium mt-2" style={{ color: isActive ? '#8B5CF6' : isDone ? '#6BB87B' : T.sub }}>
                                        {step.label}
                                    </p>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className="h-0.5 flex-1 mx-2 rounded-full transition-all"
                                        style={{ background: currentStep > step.number ? '#6BB87B' : T.border }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Step 1: Form + Upload ── */}
            {currentStep === 1 && (
                <div className="space-y-5">
                    {/* Property form */}
                    <div className="rounded-2xl p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: T.sub }}>Dados do Imóvel</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium mb-1.5" style={{ color: T.sub }}>Endereço Completo *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.sub }} />
                                    <input
                                        type="text"
                                        value={propertyForm.address}
                                        onChange={setField('address')}
                                        placeholder="Ex: Av. Boa Viagem, 3500 — Apto 802, Boa Viagem, Recife/PE"
                                        style={inputWithIconStyle}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: T.sub }}>Tipo de Imóvel</label>
                                <select value={propertyForm.type} onChange={setField('type')} style={inputStyle}>
                                    {TIPOS_IMOVEL.map(t => <option key={t} value={t} style={{ background: 'var(--bo-elevated)' }}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: T.sub }}>Área Privativa (m²)</label>
                                <div className="relative">
                                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.sub }} />
                                    <input type="number" value={propertyForm.area} onChange={setField('area')} placeholder="95" style={inputWithIconStyle} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: T.sub }}>Quartos</label>
                                <input type="number" value={propertyForm.bedrooms} onChange={setField('bedrooms')} placeholder="3" style={inputStyle} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: T.sub }}>Banheiros</label>
                                <input type="number" value={propertyForm.bathrooms} onChange={setField('bathrooms')} placeholder="2" style={inputStyle} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: T.sub }}>Vagas de Garagem</label>
                                <input type="number" value={propertyForm.parking} onChange={setField('parking')} placeholder="2" style={inputStyle} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: T.sub }}>Andar</label>
                                <input type="number" value={propertyForm.floor} onChange={setField('floor')} placeholder="8" style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    {/* Client form */}
                    <div className="rounded-2xl p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: T.sub }}>Dados do Cliente</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: T.sub }}>Nome</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.sub }} />
                                    <input
                                        type="text"
                                        value={propertyForm.clientName}
                                        onChange={setField('clientName')}
                                        placeholder="Maria Santos Silva"
                                        style={inputWithIconStyle}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: T.sub }}>CPF</label>
                                <input type="text" value={propertyForm.clientCpf} onChange={setField('clientCpf')} placeholder="000.000.000-00" style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    {/* File upload */}
                    <div className="rounded-2xl p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: T.sub }}>Documentos de Suporte</h2>
                        <label className="block cursor-pointer">
                            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                            <div
                                className="border-2 border-dashed rounded-2xl p-8 text-center transition-all hover:opacity-80"
                                style={{ borderColor: T.border }}
                            >
                                <Upload size={32} className="mx-auto mb-3" style={{ color: T.sub, opacity: 0.5 }} />
                                <p className="text-sm font-semibold mb-1" style={{ color: T.text }}>Clique para fazer upload</p>
                                <p className="text-xs" style={{ color: T.sub }}>PDF, JPG, PNG, DOC (máx. 10MB cada)</p>
                            </div>
                        </label>
                        {uploadedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {uploadedFiles.map(file => (
                                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.bg }}>
                                        {file.type === 'image'
                                            ? <ImageIcon size={17} style={{ color: 'var(--bo-accent)' }} />
                                            : <FileText size={17} style={{ color: '#8B5CF6' }} />
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate" style={{ color: T.text }}>{file.name}</p>
                                            <p className="text-[11px]" style={{ color: T.sub }}>{formatFileSize(file.size)}</p>
                                        </div>
                                        <button onClick={() => removeFile(file.id)} className="text-xs font-medium" style={{ color: '#E57373' }}>
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(72,101,129,0.08)', border: '1px solid rgba(72,101,129,0.2)' }}>
                        <div className="flex gap-3">
                            <AlertCircle size={18} style={{ color: 'var(--bo-accent)', flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <p className="text-sm font-bold mb-1" style={{ color: '#8CA4B8' }}>Documentos Recomendados</p>
                                <ul className="text-xs space-y-0.5" style={{ color: '#8CA4B8' }}>
                                    <li>• Escritura ou matrícula do imóvel</li>
                                    <li>• IPTU atualizado</li>
                                    <li>• Fotos internas e externas (mínimo 5)</li>
                                    <li>• Planta baixa (opcional)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={!propertyForm.address.trim()}
                            className="flex items-center gap-2 h-11 px-8 rounded-xl font-medium transition-all disabled:opacity-40"
                            style={{ background: 'var(--bo-accent)', color: 'white' }}
                        >
                            <Sparkles size={18} />
                            Analisar com IA
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 2: Loading ── */}
            {currentStep === 2 && (
                <div className="rounded-2xl p-12" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="max-w-md mx-auto text-center">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                            style={{ background: 'rgba(139,92,246,0.12)' }}
                        >
                            <Loader2 size={40} className="animate-spin" style={{ color: '#8B5CF6' }} />
                        </div>
                        <h2 className="text-xl font-bold mb-3" style={{ color: T.text }}>Analisando com IA...</h2>
                        <p className="text-sm mb-8" style={{ color: T.sub }}>
                            Claude está gerando o laudo técnico NBR 14653-2. Isso pode levar alguns segundos.
                        </p>
                        <div className="space-y-3 text-left">
                            {[
                                'Interpretando dados do imóvel',
                                'Aplicando norma NBR 14653-2',
                                'Pesquisando imóveis comparáveis',
                                'Calculando valor de mercado',
                                'Gerando laudo técnico completo',
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    {i < 2
                                        ? <CheckCircle size={18} style={{ color: '#6BB87B', flexShrink: 0 }} />
                                        : i === 2
                                            ? <Loader2 size={18} className="animate-spin flex-shrink-0" style={{ color: '#8B5CF6' }} />
                                            : <div className="w-[18px] h-[18px] rounded-full border-2 flex-shrink-0" style={{ borderColor: T.border }} />
                                    }
                                    <span className="text-sm" style={{ color: i <= 2 ? T.text : T.sub }}>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step 3: Review ── */}
            {currentStep === 3 && aiContent && (
                <div className="space-y-5">
                    {aiMeta.model && (
                        <div
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
                            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}
                        >
                            <Sparkles size={14} />
                            Gerado por {aiMeta.model} • {aiMeta.tokens?.toLocaleString()} tokens usados
                        </div>
                    )}
                    <div className="rounded-2xl p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold" style={{ color: T.text }}>Laudo Gerado</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { navigator.clipboard.writeText(aiContent); toast.success('Copiado!') }}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all"
                                    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.sub }}
                                >
                                    <Copy size={13} />
                                    Copiar
                                </button>
                                <button
                                    onClick={() => { setIsEditing(v => !v); if (!isEditing) setEditableContent(aiContent) }}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all"
                                    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.sub }}
                                >
                                    <Edit3 size={13} />
                                    {isEditing ? 'Visualizar' : 'Editar'}
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <textarea
                                value={editableContent}
                                onChange={e => setEditableContent(e.target.value)}
                                rows={30}
                                className="w-full rounded-xl p-5 text-sm font-mono resize-none focus:outline-none"
                                style={{
                                    background: T.bg,
                                    border: `1px solid ${T.border}`,
                                    color: T.text,
                                    lineHeight: '1.7',
                                }}
                            />
                        ) : (
                            <div
                                className="rounded-xl p-5 overflow-y-auto"
                                style={{
                                    background: T.bg,
                                    border: `1px solid ${T.border}`,
                                    color: T.text,
                                    fontSize: '13px',
                                    lineHeight: '1.8',
                                    maxHeight: '60vh',
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {aiContent}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => { setCurrentStep(1); setAiContent('') }}
                            className="flex items-center gap-2 h-11 px-5 rounded-xl font-medium text-sm transition-all"
                            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub }}
                        >
                            <RefreshCw size={15} />
                            Gerar Novamente
                        </button>
                        <button
                            onClick={() => setCurrentStep(4)}
                            className="flex-1 h-11 rounded-xl font-medium text-sm transition-all"
                            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
                        >
                            Exportar PDF
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 h-11 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                            style={{ background: '#1E3A5F', color: 'white' }}
                        >
                            <Save size={18} />
                            Salvar no Sistema
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 4: Done ── */}
            {currentStep === 4 && (
                <div className="rounded-2xl p-12 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(107,184,123,0.12)' }}
                    >
                        <CheckCircle size={36} style={{ color: '#6BB87B' }} />
                    </div>
                    <h2 className="text-xl font-bold mb-2" style={{ color: T.text }}>Laudo Pronto!</h2>
                    <p className="text-sm mb-8" style={{ color: T.sub }}>O laudo foi gerado com sucesso e está pronto para download.</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            className="flex items-center gap-2 h-11 px-6 rounded-xl font-medium transition-all"
                            style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}
                        >
                            <Download size={18} />
                            Download PDF
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 h-11 px-6 rounded-xl font-medium transition-all"
                            style={{ background: '#1E3A5F', color: 'white' }}
                        >
                            <Save size={18} />
                            Salvar e Voltar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
