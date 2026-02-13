'use client'

import React, { useState } from 'react'
import {
    Image as ImageIcon,
    Video,
    FileImage,
    X,
    Trash2,
    Eye,
    MoveUp,
    Building2
} from 'lucide-react'
import { uploadImage, uploadFile, deleteFile } from '@/lib/supabase-storage'
import { toast } from 'sonner'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Interfaces
interface MediaUploaderProps {
    type: 'gallery' | 'videos' | 'floorplans' | 'logo'
    label: string
    description?: string
    value: string[]
    onChange: (urls: string[]) => void
    maxFiles?: number
    entityId?: string // Renamed from developmentId to be generic
    entityType?: 'development' | 'developer' // New prop
}

interface SortableImageProps {
    id: string
    url: string
    onDelete: (id: string) => void
    onView: (url: string) => void
}

// Subcomponente SortableImage
function SortableImage({ id, url, onDelete, onView }: SortableImageProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative aspect-video bg-gray-50 dark:bg-card-dark rounded-xl overflow-hidden border-2 transition-all ${isDragging ? 'border-primary shadow-lg scale-105' : 'border-gray-100 dark:border-white/5 hover:border-primary/50'}`}
            {...attributes}
            {...listeners}
        >
            <img
                src={url}
                alt="Media"
                className="w-full h-full object-cover"
            />

            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onView(url)
                        }}
                        className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                        title="Visualizar"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onDelete(id)
                        }}
                        className="p-2 rounded-lg bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-600 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Badge de índice */}
            <div className="absolute top-2 left-2 pointer-events-none">
                <div className="w-6 h-6 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white border border-white/10">
                    {parseInt(id) + 1}
                </div>
            </div>
        </div>
    )
}

// Componente Principal
export default function MediaUploader({
    type,
    label,
    description,
    value = [],
    onChange,
    maxFiles = 20,
    entityId,
    entityType = 'development',
    // Backward compatibility props (if any code still uses developmentId)
    ...props
}: MediaUploaderProps & { developmentId?: string }) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Handle backward compatibility
    const actualEntityId = entityId || props.developmentId

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = parseInt(active.id as string)
            const newIndex = parseInt(over.id as string)
            const reordered = arrayMove(value, oldIndex, newIndex)
            onChange(reordered)
            toast.success('Ordem atualizada!')
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])

        if (files.length === 0) return

        if (value.length + files.length > maxFiles) {
            toast.error(`Máximo de ${maxFiles} arquivos permitidos`)
            return
        }

        setUploading(true)
        const uploadedUrls: string[] = []

        // Calcula progresso total baseado no número de arquivos
        const totalFiles = files.length

        for (let i = 0; i < totalFiles; i++) {
            const file = files[i]

            // Atualiza progresso geral (simplificado)
            setProgress(Math.round(((i) / totalFiles) * 100))

            try {
                let result

                // Define a pasta base (pluraliza o entityType para o nome do bucket/pasta)
                const folderName = entityType === 'developer' ? 'developers' : 'developments'
                const folderPath = `${folderName}/${actualEntityId || 'temp'}/${type}`

                if (type === 'videos') {
                    // Upload de vídeo
                    result = await uploadFile(
                        file,
                        'media',
                        folderPath
                    )
                } else {
                    // Upload de imagem (com otimização)
                    result = await uploadImage(file, {
                        folder: folderPath,
                        maxWidth: type === 'floorplans' ? 2000 : 1920,
                        maxHeight: type === 'floorplans' ? 2000 : 1080,
                        quality: 0.85
                    })
                }

                if (result.error) {
                    toast.error(`Erro no arquivo ${file.name}: ${result.error}`)
                } else {
                    uploadedUrls.push(result.url)
                }
            } catch (error) {
                console.error('Erro no upload:', error)
                toast.error(`Erro ao enviar ${file.name}`)
            }
        }

        if (uploadedUrls.length > 0) {
            // Adiciona novos URLs à lista existente
            onChange([...value, ...uploadedUrls])
            toast.success(`${uploadedUrls.length} arquivo(s) enviado(s)!`)
        }

        setUploading(false)
        setProgress(0)

        // Limpar input para permitir selecionar o mesmo arquivo novamente se necessário
        e.target.value = ''
    }

    const handleDelete = async (id: string) => {
        const index = parseInt(id)
        if (confirm('Tem certeza que deseja remover este arquivo?')) {
            const urlToDelete = value[index]

            // Tentar extrair path do URL para deletar do storage
            try {
                const urlObj = new URL(urlToDelete)
                const pathParts = urlObj.pathname.split('/media/')
                if (pathParts.length > 1) {
                    const path = pathParts[1]
                    await deleteFile(path, 'media')
                }
            } catch (err) {
                console.warn('Não foi possível extrair o caminho do arquivo para deleção física (ignorando)', err)
            }

            const newUrls = value.filter((_, i) => i !== index)
            onChange(newUrls)
            toast.success('Arquivo removido!')
        }
    }

    const handleView = (url: string) => {
        setPreviewUrl(url)
    }

    // Determina ícone e tipos aceitos
    let Icon = ImageIcon
    let accept = 'image/*'
    let hint = 'JPG, PNG ou WEBP (máx 10MB)'

    if (type === 'videos') {
        Icon = Video
        accept = 'video/mp4,video/quicktime'
        hint = 'MP4 ou MOV (máx 50MB)'
    } else if (type === 'floorplans') {
        Icon = FileImage
        accept = 'image/*'
        hint = 'Plantas em alta resolução'
    } else if (type === 'logo') {
        Icon = Building2
        accept = 'image/*'
        hint = 'Logo em PNG ou SVG preferencialmente'
    }

    // IDs para DnD (índices como string)
    const items = value.map((_, i) => i.toString())

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                    {description && (
                        <p className="text-xs text-gray-500 mt-1">{description}</p>
                    )}
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10">
                    {value.length} / {maxFiles}
                </div>
            </div>

            {/* Upload Area */}
            {value.length < maxFiles && (
                <label className="block group">
                    <input
                        type="file"
                        multiple
                        accept={accept}
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                    />
                    <div className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all overflow-hidden ${uploading
                        ? 'border-primary/50 bg-primary/5 cursor-wait'
                        : 'border-gray-200 dark:border-white/10 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}>
                        {uploading ? (
                            <div className="flex flex-col items-center justify-center py-2">
                                {/* Spinner circular com progresso */}
                                <div className="relative w-16 h-16 mb-4">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                            className="text-gray-200 dark:text-gray-700"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 28}`}
                                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                                            className="text-primary transition-all duration-300"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
                                        {progress}%
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-primary animate-pulse">Otimizando e enviando...</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Icon size={32} className="text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    Clique ou arraste arquivos
                                </p>
                                <p className="text-xs text-gray-500">
                                    {hint}
                                </p>
                            </>
                        )}
                    </div>
                </label>
            )}

            {/* Gallery Grid (Sortable) */}
            {value.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items}
                        strategy={rectSortingStrategy}
                    >
                        <div className={`grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${type === 'logo' ? 'grid-cols-1 w-full max-w-[300px]' : 'grid-cols-2 lg:grid-cols-4'
                            }`}>
                            {value.map((url, index) => (
                                <SortableImage
                                    key={index} // Usando index como chave estável para o map, mas o ID do sortable é string do index
                                    id={index.toString()}
                                    url={url}
                                    onDelete={handleDelete}
                                    onView={handleView}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Hint de reordenação */}
            {value.length > 1 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
                    <MoveUp size={12} />
                    <span>Arraste para reordenar</span>
                </div>
            )}

            {/* Preview Modal */}
            {previewUrl && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewUrl(null)}
                >
                    <div className="relative max-w-7xl w-full max-h-[90vh] flex flex-col items-center">
                        <button
                            onClick={() => setPreviewUrl(null)}
                            className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {type === 'videos' ? (
                            <video
                                src={previewUrl}
                                controls
                                autoPlay
                                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
