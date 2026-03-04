'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, FileText, Video, Link as LinkIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { uploadFile, deleteFile } from '@/lib/supabase-storage'

interface MediaUploaderProps {
    propertyId: string
    images: string[]
    floorPlans: string[]
    videos: string[]
    virtualTourUrl: string | null
    brochureUrl: string | null
    onUpdate: (data: {
        gallery_images?: string[]
        floor_plans?: string[]
        videos?: string[]
        virtual_tour_url?: string | null
        brochure_url?: string | null
    }) => Promise<void>
}

export default function MediaUploader({
    propertyId,
    images,
    floorPlans,
    videos,
    virtualTourUrl,
    brochureUrl,
    onUpdate,
}: MediaUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<string>('')
    const [tourUrl, setTourUrl] = useState(virtualTourUrl || '')
    const [activeTab, setActiveTab] = useState<'images' | 'plans' | 'videos' | 'tour'>('images')

    const imageInputRef = useRef<HTMLInputElement>(null)
    const planInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'plans') {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setIsUploading(true)
        setUploadProgress(`Enviando ${files.length} arquivo(s)...`)

        try {
            const uploadedUrls: string[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                setUploadProgress(`Enviando ${i + 1}/${files.length}...`)

                const timestamp = Date.now()
                const fileName = `${propertyId}/${type}/${timestamp}-${file.name.replace(/\s+/g, '-')}`

                const { url, error } = await uploadFile(file, 'media', `developments/${propertyId}/${type}`)

                if (error) throw error
                if (url) uploadedUrls.push(url)
            }

            const currentList = type === 'images' ? images : floorPlans
            const newList = [...currentList, ...uploadedUrls]

            await onUpdate(
                type === 'images'
                    ? { gallery_images: newList }
                    : { floor_plans: newList }
            )

            setUploadProgress('Upload concluído!')
            setTimeout(() => setUploadProgress(''), 2000)
        } catch (err: any) {
            alert('Erro ao fazer upload: ' + err.message)
        } finally {
            setIsUploading(false)
            if (imageInputRef.current) imageInputRef.current.value = ''
            if (planInputRef.current) planInputRef.current.value = ''
        }
    }

    async function handleRemoveImage(url: string, type: 'images' | 'plans') {
        if (!confirm('Tem certeza que deseja remover esta imagem?')) return

        try {
            const path = url.split('/').pop()
            if (path) await deleteFile(`${propertyId}/${type}/${path}`, 'media')

            const currentList = type === 'images' ? images : floorPlans
            const newList = currentList.filter(img => img !== url)

            await onUpdate(
                type === 'images'
                    ? { gallery_images: newList }
                    : { floor_plans: newList }
            )
        } catch (err: any) {
            alert('Erro ao remover imagem: ' + err.message)
        }
    }

    async function handleSaveTourUrl() {
        try {
            await onUpdate({ virtual_tour_url: tourUrl || null })
            alert('URL do tour virtual salva!')
        } catch (err: any) {
            alert('Erro ao salvar URL: ' + err.message)
        }
    }

    const tabs = [
        { id: 'images', label: 'Galeria', icon: ImageIcon, count: images.length },
        { id: 'plans', label: 'Plantas', icon: FileText, count: floorPlans.length },
        { id: 'videos', label: 'Vídeos', icon: Video, count: videos.length },
        { id: 'tour', label: 'Tour Virtual', icon: LinkIcon, count: virtualTourUrl ? 1 : 0 },
    ]

    return (
        <div className="bg-white rounded-xl border border-slate-200">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-imi-900 border-b-2 border-imi-900'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.count > 0 && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Conteúdo */}
            <div className="p-6">
                {/* Galeria de Imagens */}
                {activeTab === 'images' && (
                    <div className="space-y-6">
                        <div>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleImageUpload(e, 'images')}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => imageInputRef.current?.click()}
                                disabled={isUploading}
                                fullWidth
                            >
                                <Upload className="w-5 h-5 mr-3" />
                                {isUploading ? uploadProgress : 'Adicionar Fotos à Galeria'}
                            </Button>
                            <p className="text-center text-xs text-slate-400 mt-2">
                                Formatos aceitos: JPG, PNG, WEBP. Tamanho máx: 5MB.
                            </p>
                        </div>

                        {images.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-xl">
                                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                <p className="text-sm text-slate-400">Nenhuma foto enviada para este empreendimento</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((img, index) => (
                                    <div key={img} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                                        <img
                                            src={img}
                                            alt={`Imagem ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => handleRemoveImage(img, 'images')}
                                                className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Plantas */}
                {activeTab === 'plans' && (
                    <div className="space-y-6">
                        <div>
                            <input
                                ref={planInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleImageUpload(e, 'plans')}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => planInputRef.current?.click()}
                                disabled={isUploading}
                                fullWidth
                            >
                                <FileText className="w-5 h-5 mr-3" />
                                {isUploading ? uploadProgress : 'Adicionar Plantas Humanizadas'}
                            </Button>
                        </div>

                        {floorPlans.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-xl">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                <p className="text-sm text-slate-400">Nenhuma planta técnica ou humanizada disponível</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                {floorPlans.map((plan, index) => (
                                    <div key={plan} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 bg-white">
                                        <img
                                            src={plan}
                                            alt={`Planta ${index + 1}`}
                                            className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => handleRemoveImage(plan, 'plans')}
                                                className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Vídeos */}
                {activeTab === 'videos' && (
                    <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-100">
                        <Video className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                        <h4 className="text-slate-900 font-bold mb-1">Upload de Vídeos</h4>
                        <p className="text-sm text-slate-400">Integração com YouTube e Vimeo em breve.</p>
                    </div>
                )}

                {/* Tour Virtual */}
                {activeTab === 'tour' && (
                    <div className="space-y-6">
                        <div className="bg-imi-50 p-6 rounded-xl border border-imi-100">
                            <h4 className="text-sm font-bold text-imi-900 uppercase tracking-widest mb-4">Tour Virtual 360°</h4>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Input
                                        label="Link do Matterport, Kuula ou similar"
                                        value={tourUrl}
                                        onChange={(e) => setTourUrl(e.target.value)}
                                        placeholder="https://my.matterport.com/show/?m=..."
                                    />
                                </div>
                                <div className="flex items-end mb-1">
                                    <Button onClick={handleSaveTourUrl} className="h-11">
                                        Vincular
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {virtualTourUrl ? (
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
                                <div className="absolute inset-0 flex items-center justify-center text-white flex-col gap-4">
                                    <LinkIcon className="w-12 h-12 text-imi-400" />
                                    <div className="text-center">
                                        <p className="font-bold">Tour Virtual Vinculado</p>
                                        <a
                                            href={virtualTourUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-imi-300 hover:text-imi-200 underline mt-1"
                                        >
                                            Clique para testar o acesso
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
                                <LinkIcon className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                <p className="text-sm text-slate-400">Nenhum tour interativo disponível para este empreendimento</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
