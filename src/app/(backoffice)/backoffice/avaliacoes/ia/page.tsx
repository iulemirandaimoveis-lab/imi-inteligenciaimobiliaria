'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Upload,
    FileText,
    Image as ImageIcon,
    Sparkles,
    CheckCircle,
    Download,
    Save,
    Edit3,
    Loader2,
    AlertCircle,
    Home,
    MapPin,
    Ruler,
    Calendar,
    User,
    Building2,
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4

interface UploadedFile {
    id: string
    name: string
    type: 'document' | 'image'
    size: number
    preview?: string
}

interface LaudoData {
    protocol: string
    property: {
        address: string
        type: string
        area: number
        bedrooms: number
        bathrooms: number
        parking: number
        floor: number
    }
    client: {
        name: string
        cpf: string
    }
    evaluation: {
        method: string
        value: number
        valueMin: number
        valueMax: number
        valuePerSqm: number
    }
    comparables: Array<{
        address: string
        area: number
        value: number
        valuePerSqm: number
    }>
    conclusion: string
}

export default function AvaliacaoIAPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState<Step>(1)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [laudoData, setLaudoData] = useState<LaudoData | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    // Simulated AI-generated laudo data
    const mockLaudoData: LaudoData = {
        protocol: 'AVL-2026-IA-001',
        property: {
            address: 'Av. Boa Viagem, 3500 - Apto 802, Boa Viagem, Recife/PE',
            type: 'Apartamento',
            area: 95,
            bedrooms: 3,
            bathrooms: 2,
            parking: 2,
            floor: 8,
        },
        client: {
            name: 'Maria Santos Silva',
            cpf: '123.456.789-00',
        },
        evaluation: {
            method: 'Comparativo Direto de Dados de Mercado',
            value: 680000,
            valueMin: 650000,
            valueMax: 710000,
            valuePerSqm: 7158,
        },
        comparables: [
            { address: 'Av. Boa Viagem, 3200', area: 92, value: 650000, valuePerSqm: 7065 },
            { address: 'Av. Conselheiro Aguiar, 1500', area: 98, value: 720000, valuePerSqm: 7347 },
            { address: 'Rua Barão de Souza Leão, 450', area: 90, value: 630000, valuePerSqm: 7000 },
        ],
        conclusion: 'Com base na análise comparativa de mercado de 3 imóveis similares na região de Boa Viagem, utilizando o método NBR 14653-2, o valor de mercado estimado para o imóvel avaliado é de R$ 680.000,00 (seiscentos e oitenta mil reais), com intervalo de confiança entre R$ 650.000,00 e R$ 710.000,00. O imóvel apresenta características compatíveis com o padrão da região, estado de conservação adequado e localização privilegiada.',
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const newFiles: UploadedFile[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'document',
            size: file.size,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }))
        setUploadedFiles(prev => [...prev, ...newFiles])
    }

    const removeFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id))
    }

    const handleAnalyze = async () => {
        setIsAnalyzing(true)
        setCurrentStep(2)

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 3000))

        setLaudoData(mockLaudoData)
        setIsAnalyzing(false)
        setCurrentStep(3)
    }

    const handleSave = async () => {
        try {
            const response = await fetch('/api/avaliacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(laudoData),
            })
            if (!response.ok) throw new Error('Erro ao salvar')
            alert('Laudo salvo com sucesso!')
            router.push('/backoffice/avaliacoes')
        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar o laudo.')
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const steps = [
        { number: 1, label: 'Upload', icon: Upload },
        { number: 2, label: 'Análise IA', icon: Sparkles },
        { number: 3, label: 'Revisão', icon: Edit3 },
        { number: 4, label: 'Exportar', icon: Download },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Gerar Laudo com IA
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                                <Sparkles size={12} className="inline mr-1" />
                                Powered by Claude AI
                            </span>
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">Geração automática de laudos NBR 14653</p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon
                        const isActive = currentStep === step.number
                        const isCompleted = currentStep > step.number

                        return (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 text-white' :
                                        isActive ? 'bg-purple-500 text-white' :
                                            'bg-gray-100 text-gray-400'
                                        }`}>
                                        {isCompleted ? <CheckCircle size={24} /> : <StepIcon size={24} />}
                                    </div>
                                    <p className={`text-sm font-medium mt-2 ${isActive ? 'text-purple-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                                        }`}>
                                        {step.label}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`h-1 flex-1 mx-4 rounded-full transition-all ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Step 1: Upload */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-8 border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Upload de Documentos</h2>

                        {/* Upload Area */}
                        <label className="block">
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer">
                                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-lg font-semibold text-gray-900 mb-2">
                                    Arraste arquivos ou clique para fazer upload
                                </p>
                                <p className="text-sm text-gray-600 mb-4">
                                    Aceito: PDF, JPG, PNG, DOC (máx. 10MB cada)
                                </p>
                                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <FileText size={14} />
                                        Escritura
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FileText size={14} />
                                        IPTU
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ImageIcon size={14} />
                                        Fotos
                                    </span>
                                </div>
                            </div>
                        </label>

                        {/* Uploaded Files */}
                        {uploadedFiles.length > 0 && (
                            <div className="mt-6 space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Arquivos ({uploadedFiles.length})
                                </h3>
                                {uploadedFiles.map(file => (
                                    <div key={file.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.type === 'image' ? 'bg-blue-100' : 'bg-purple-100'
                                            }`}>
                                            {file.type === 'image' ? (
                                                <ImageIcon size={20} className="text-blue-600" />
                                            ) : (
                                                <FileText size={20} className="text-purple-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                        <div className="flex gap-4">
                            <AlertCircle size={24} className="text-blue-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold text-blue-900 mb-2">Documentos Recomendados</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Escritura ou matrícula do imóvel</li>
                                    <li>• IPTU atualizado</li>
                                    <li>• Fotos internas e externas (mínimo 5)</li>
                                    <li>• Planta baixa (opcional)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={uploadedFiles.length === 0}
                            className="flex items-center gap-2 h-11 px-8 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Sparkles size={20} />
                            Analisar com IA
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Analyzing */}
            {currentStep === 2 && (
                <div className="bg-white rounded-2xl p-12 border border-gray-100">
                    <div className="max-w-md mx-auto text-center">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 size={40} className="text-purple-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Analisando Documentos...</h2>
                        <p className="text-gray-600 mb-8">
                            A IA está processando os documentos e gerando o laudo técnico. Isso pode levar alguns segundos.
                        </p>

                        {/* Progress Items */}
                        <div className="space-y-4 text-left">
                            {[
                                { label: 'Extraindo dados da escritura', done: true },
                                { label: 'Identificando características do imóvel', done: true },
                                { label: 'Buscando comparáveis de mercado', done: isAnalyzing },
                                { label: 'Calculando valor de mercado', done: false },
                                { label: 'Gerando laudo NBR 14653', done: false },
                            ].map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    {item.done ? (
                                        <CheckCircle size={20} className="text-green-600" />
                                    ) : (
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                                    )}
                                    <span className={item.done ? 'text-gray-900' : 'text-gray-500'}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && laudoData && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-8 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Laudo Gerado</h2>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
                            >
                                <Edit3 size={16} />
                                {isEditing ? 'Visualizar' : 'Editar'}
                            </button>
                        </div>

                        {/* Protocol */}
                        <div className="mb-8 pb-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Protocolo</p>
                                    <p className="text-2xl font-bold text-purple-700">{laudoData.protocol}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600 mb-1">Data</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {new Date().toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Property Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                                    Dados do Imóvel
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-600">Endereço</p>
                                            <p className="text-sm font-medium text-gray-900">{laudoData.property.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Home size={18} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-600">Tipo</p>
                                            <p className="text-sm font-medium text-gray-900">{laudoData.property.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Ruler size={18} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-600">Área Privativa</p>
                                            <p className="text-sm font-medium text-gray-900">{laudoData.property.area} m²</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Building2 size={18} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-600">Características</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {laudoData.property.bedrooms} quartos • {laudoData.property.bathrooms} banheiros • {laudoData.property.parking} vagas
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                                    Cliente
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <User size={18} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-600">Nome</p>
                                            <p className="text-sm font-medium text-gray-900">{laudoData.client.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <FileText size={18} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-600">CPF</p>
                                            <p className="text-sm font-medium text-gray-900">{laudoData.client.cpf}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Evaluation Result */}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
                            <h3 className="text-sm font-medium text-purple-100 mb-4">Valor de Mercado Estimado</h3>
                            <p className="text-4xl font-bold mb-2">{formatCurrency(laudoData.evaluation.value)}</p>
                            <p className="text-sm text-purple-100 mb-4">
                                Intervalo: {formatCurrency(laudoData.evaluation.valueMin)} - {formatCurrency(laudoData.evaluation.valueMax)}
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-400">
                                <div>
                                    <p className="text-xs text-purple-200 mb-1">Valor/m²</p>
                                    <p className="text-xl font-bold">{formatCurrency(laudoData.evaluation.valuePerSqm)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-purple-200 mb-1">Método</p>
                                    <p className="text-sm font-medium">{laudoData.evaluation.method}</p>
                                </div>
                            </div>
                        </div>

                        {/* Comparables */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                                Imóveis Comparáveis
                            </h3>
                            <div className="space-y-3">
                                {laudoData.comparables.map((comp, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{comp.address}</p>
                                            <p className="text-xs text-gray-600">{comp.area} m²</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">{formatCurrency(comp.value)}</p>
                                            <p className="text-xs text-gray-600">{formatCurrency(comp.valuePerSqm)}/m²</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Conclusion */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                                Conclusão
                            </h3>
                            {isEditing ? (
                                <textarea
                                    value={laudoData.conclusion}
                                    onChange={(e) => setLaudoData({ ...laudoData, conclusion: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            ) : (
                                <p className="text-sm text-gray-700 leading-relaxed">{laudoData.conclusion}</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setCurrentStep(4)}
                            className="flex-1 h-11 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                        >
                            Exportar PDF
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 h-11 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E] flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            Salvar no Sistema
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Export (placeholder) */}
            {currentStep === 4 && (
                <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                    <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Laudo Pronto!</h2>
                    <p className="text-gray-600 mb-8">O laudo foi gerado com sucesso e está pronto para download.</p>
                    <div className="flex gap-4 justify-center">
                        <button className="flex items-center gap-2 h-11 px-6 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700">
                            <Download size={20} />
                            Download PDF
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E]"
                        >
                            <Save size={20} />
                            Salvar e Voltar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
