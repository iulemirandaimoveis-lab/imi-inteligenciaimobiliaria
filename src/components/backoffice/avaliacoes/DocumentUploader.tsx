'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
    Upload,
    FileText,
    X,
    CheckCircle,
    AlertCircle,
    File,
    Image as ImageIcon,
    Loader2
} from 'lucide-react'
import { uploadFile } from '@/lib/supabase-storage'
import { toast } from 'sonner'

export interface UploadedFile {
    id: string
    name: string
    url: string
    path: string
    type: 'pdf' | 'image' | 'document'
    size: number
    uploadedAt: string
}

interface DocumentUploaderProps {
    evaluationId?: string
    onFilesUploaded: (files: UploadedFile[]) => void
    maxFiles?: number
    allowedTypes?: string[]
}

export default function DocumentUploader({
    evaluationId,
    onFilesUploaded,
    maxFiles = 10,
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}: DocumentUploaderProps) {
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (files.length + acceptedFiles.length > maxFiles) {
            toast.error(`Máximo de ${maxFiles} arquivos permitidos`)
            return
        }

        setUploading(true)
        const uploadedFiles: UploadedFile[] = []

        for (const file of acceptedFiles) {
            try {
                setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

                // Determinar tipo
                const fileType = file.type.includes('pdf') ? 'pdf' :
                    file.type.includes('image') ? 'image' :
                        'document'

                // Upload para Supabase Storage
                const result = await uploadFile(
                    file,
                    'media',
                    `evaluations/${evaluationId || 'temp'}/documents`
                )

                if (result.error) {
                    toast.error(`Erro ao enviar ${file.name}: ${result.error}`)
                    continue
                }

                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))

                const uploadedFile: UploadedFile = {
                    id: `${Date.now()}-${Math.random()}`,
                    name: file.name,
                    url: result.url,
                    path: result.path,
                    type: fileType,
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                }

                uploadedFiles.push(uploadedFile)
                toast.success(`${file.name} enviado com sucesso!`)

            } catch (error) {
                console.error(`Erro ao enviar ${file.name}:`, error)
                toast.error(`Erro ao enviar ${file.name}`)
            }
        }

        if (uploadedFiles.length > 0) {
            const newFiles = [...files, ...uploadedFiles]
            setFiles(newFiles)
            onFilesUploaded(newFiles)
        }

        setUploading(false)
        setUploadProgress({})

    }, [files, maxFiles, evaluationId, onFilesUploaded])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
        maxFiles,
        disabled: uploading
    })

    const removeFile = (fileId: string) => {
        const newFiles = files.filter(f => f.id !== fileId)
        setFiles(newFiles)
        onFilesUploaded(newFiles)
        toast.success('Arquivo removido')
    }

    const getFileIcon = (type: UploadedFile['type']) => {
        switch (type) {
            case 'pdf':
                return FileText
            case 'image':
                return ImageIcon
            default:
                return File
        }
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive
                        ? 'border-accent-500 bg-accent-50'
                        : uploading
                            ? 'border-imi-200 bg-imi-50 cursor-not-allowed'
                            : 'border-imi-300 hover:border-accent-400 hover:bg-accent-50/50'
                    }`}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-4">
                    {uploading ? (
                        <>
                            <Loader2 size={48} className="text-accent-500 animate-spin" />
                            <div>
                                <p className="text-lg font-medium text-accent-700 mb-2">
                                    Enviando documentos...
                                </p>
                                {Object.entries(uploadProgress).map(([name, progress]) => (
                                    <div key={name} className="text-sm text-imi-600 mb-2">
                                        {name}: {Math.round(progress)}%
                                        <div className="w-full h-2 bg-imi-200 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-accent-500 transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : isDragActive ? (
                        <>
                            <Upload size={48} className="text-accent-500" />
                            <div>
                                <p className="text-lg font-medium text-accent-700 mb-2">
                                    Solte os arquivos aqui
                                </p>
                                <p className="text-sm text-imi-600">
                                    Vamos processar automaticamente
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <Upload size={48} className="text-imi-400" />
                            <div>
                                <p className="text-lg font-medium text-imi-900 mb-2">
                                    Arraste arquivos ou clique para selecionar
                                </p>
                                <p className="text-sm text-imi-600 mb-1">
                                    PDFs, Imagens (JPG, PNG), Word (DOCX)
                                </p>
                                <p className="text-xs text-imi-500">
                                    Máximo: {maxFiles} arquivos • 10MB cada
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Lista de Arquivos */}
            {files.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-imi-900">
                            Documentos Anexados ({files.length})
                        </h4>
                        {files.length > 0 && (
                            <div className="text-xs text-imi-500">
                                Total: {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {files.map((file) => {
                            const Icon = getFileIcon(file.type)

                            return (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-4 p-4 bg-white border border-imi-100 rounded-xl hover:shadow-md transition-all group"
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${file.type === 'pdf' ? 'bg-red-50' :
                                            file.type === 'image' ? 'bg-blue-50' :
                                                'bg-gray-50'
                                        }`}>
                                        <Icon size={24} className={
                                            file.type === 'pdf' ? 'text-red-600' :
                                                file.type === 'image' ? 'text-blue-600' :
                                                    'text-gray-600'
                                        } />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-medium text-imi-900 truncate">
                                                {file.name}
                                            </h5>
                                            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-imi-500">
                                            <span>{formatFileSize(file.size)}</span>
                                            <span>•</span>
                                            <span>{new Date(file.uploadedAt).toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-9 px-4 rounded-lg bg-imi-50 text-imi-700 hover:bg-imi-100 transition-colors flex items-center gap-2 text-sm font-medium"
                                        >
                                            Ver
                                        </a>
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="w-9 h-9 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center justify-center"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Instruções */}
            {files.length === 0 && !uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex gap-3">
                        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700 space-y-2">
                            <p className="font-medium">Documentos recomendados para avaliação:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-600">
                                <li>Matrícula do imóvel (PDF)</li>
                                <li>Fotos do imóvel (JPG/PNG)</li>
                                <li>Plantas e projetos (PDF/Imagem)</li>
                                <li>Documentos de propriedade (PDF)</li>
                                <li>Laudos anteriores (PDF)</li>
                            </ul>
                            <p className="mt-3 text-xs">
                                💡 Quanto mais documentação, melhor será a análise da IA
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
