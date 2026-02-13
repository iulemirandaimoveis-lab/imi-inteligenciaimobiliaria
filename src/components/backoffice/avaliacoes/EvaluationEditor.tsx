'use client'

import { useState } from 'react'
import {
    Sparkles,
    Save,
    Download,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Loader,
    FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface EvaluationEditorProps {
    evaluationId: string
    documents: Array<{ url: string; name: string; type: string }>
    propertyData: {
        address: string
        type: string
        area?: number
        bedrooms?: number
        bathrooms?: number
        city?: string
        state?: string
    }
    onSave: (content: string) => Promise<void>
}

export default function EvaluationEditor({
    evaluationId,
    documents,
    propertyData,
    onSave
}: EvaluationEditorProps) {
    const [content, setContent] = useState('')
    const [generating, setGenerating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [generationProgress, setGenerationProgress] = useState('')

    const generateDraft = async () => {
        if (documents.length === 0) {
            toast.error('Adicione pelo menos um documento antes de gerar o laudo')
            return
        }

        setGenerating(true)
        setGenerationProgress('Analisando documentos...')

        try {
            setGenerationProgress('Gerando laudo técnico NBR 14653...')

            // Chamar API do Claude
            const response = await fetch('/api/claude/generate-evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyData, // Passando propertyData corretamente
                    evaluationId,
                    documents: documents.map(d => ({ url: d.url, name: d.name, type: d.type }))
                })
            })

            if (!response.ok) {
                throw new Error('Erro ao gerar laudo')
            }

            const data = await response.json()

            setGenerationProgress('Finalizando...')
            setContent(data.content)

            toast.success('Laudo técnico gerado com sucesso!')
            toast.info('Revise o conteúdo antes de finalizar')

        } catch (error: any) {
            console.error('Erro ao gerar draft:', error)
            toast.error(error.message || 'Erro ao gerar laudo')
        } finally {
            setGenerating(false)
            setGenerationProgress('')
        }
    }

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error('Adicione conteúdo antes de salvar')
            return
        }

        setSaving(true)
        try {
            await onSave(content)
            toast.success('Laudo salvo com sucesso!')
        } catch (error) {
            toast.error('Erro ao salvar laudo')
        } finally {
            setSaving(false)
        }
    }

    const handleExportPDF = async () => {
        toast.info('Gerando PDF... (funcionalidade em desenvolvimento)')
        // Implementar export para PDF
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-imi-900">Laudo Técnico de Avaliação</h3>
                    <p className="text-sm text-imi-600 mt-1">NBR 14653-2</p>
                </div>

                <div className="flex items-center gap-3">
                    {content && (
                        <>
                            <button
                                onClick={handleExportPDF}
                                className="h-10 px-4 rounded-xl border border-imi-200 text-imi-700 hover:bg-imi-50 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <Download size={16} />
                                Exportar PDF
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-10 px-4 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader size={16} className="animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Salvar
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Generate Button */}
            {!content && !generating && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-2xl p-12 text-center">
                    <Sparkles size={64} className="text-purple-600 mx-auto mb-6" />
                    <h4 className="text-2xl font-bold text-imi-900 mb-3">
                        Geração Automática com IA
                    </h4>
                    <p className="text-imi-600 mb-8 max-w-2xl mx-auto">
                        Nossa IA especializada analisará os documentos anexados e gerará um laudo técnico
                        completo seguindo a norma NBR 14653-2. Você poderá revisar e editar antes de finalizar.
                    </p>
                    <button
                        onClick={generateDraft}
                        disabled={documents.length === 0}
                        className="inline-flex items-center gap-3 h-14 px-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles size={24} />
                        Gerar Laudo Automático
                    </button>

                    {documents.length === 0 && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-imi-500">
                            <AlertCircle size={16} />
                            <span>Adicione documentos antes de gerar o laudo</span>
                        </div>
                    )}
                </div>
            )}

            {/* Generating */}
            {generating && (
                <div className="bg-white rounded-2xl border border-imi-100 p-12 text-center">
                    <Loader size={64} className="text-purple-600 animate-spin mx-auto mb-6" />
                    <h4 className="text-xl font-bold text-imi-900 mb-3">
                        Gerando Laudo Técnico...
                    </h4>
                    <p className="text-imi-600 mb-6">{generationProgress}</p>
                    <div className="max-w-md mx-auto">
                        <div className="h-2 bg-imi-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse" style={{ width: '70%' }} />
                        </div>
                    </div>
                    <p className="text-xs text-imi-500 mt-4">
                        Isso pode levar alguns segundos...
                    </p>
                </div>
            )}

            {/* Editor */}
            {content && !generating && (
                <div className="space-y-4">
                    {/* Info */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-700">
                            <p className="font-medium mb-1">Laudo gerado com sucesso!</p>
                            <p className="text-green-600">
                                Revise o conteúdo abaixo e faça ajustes se necessário.
                                O laudo já está formatado segundo a NBR 14653-2.
                            </p>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between bg-white border border-imi-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-imi-600">
                            <FileText size={16} />
                            <span>{content.split('\n').length} linhas</span>
                            <span>•</span>
                            <span>{content.split(' ').length} palavras</span>
                        </div>
                        <button
                            onClick={generateDraft}
                            className="h-9 px-4 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <RefreshCw size={14} />
                            Regenerar
                        </button>
                    </div>

                    {/* Text Editor */}
                    <div className="bg-white rounded-2xl border border-imi-100 p-6">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full min-h-[600px] p-6 border border-imi-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm leading-relaxed resize-y"
                            placeholder="O laudo será exibido aqui..."
                        />
                    </div>

                    {/* Word Count */}
                    <div className="text-center text-xs text-imi-500">
                        Clique em "Salvar" para finalizar e arquivar este laudo
                    </div>
                </div>
            )}
        </div>
    )
}
