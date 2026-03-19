'use client'
import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Plus } from 'lucide-react'
import { uploadMultipleMedia } from '@/lib/supabase/storage'
import Image from 'next/image'
interface MediaUploaderProps {
    label: string
    value: string | string[]
    onChange: (value: string | string[]) => void
    multiple?: boolean
    folder?: string
}
export default function MediaUploader({ label, value, onChange, multiple = false, folder = 'properties' }: MediaUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const values = Array.isArray(value) ? value : (value ? [value] : [])
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return
        setIsUploading(true)
        try {
            const urls = await uploadMultipleMedia(files, folder)
            if (multiple) {
                onChange([...values, ...urls])
            } else {
                onChange(urls[0])
            }
        } catch (err) {
            alert('Erro ao fazer upload das imagens.')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }
    function removeImage(index: number) {
        if (multiple) {
            const newValues = values.filter((_, i) => i !== index)
            onChange(newValues)
        } else {
            onChange('')
        }
    }
    return (
        <div className="space-y-4">
            <label className="text-sm font-bold text-imi-900 uppercase tracking-widest">{label}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {values.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 bg-slate-50">
                        <Image
                            src={url}
                            alt={`${label} ${index + 1}`}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
                {(multiple || values.length === 0) && (
                    <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-accent-500 hover:bg-accent-50 transition-all flex flex-col items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
                                <span className="text-[10px] font-bold text-accent-600 uppercase tracking-widest">Enviando...</span>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-accent-100 transition-colors">
                                    <Plus className="w-5 h-5 text-slate-400 group-hover:text-accent-600" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-accent-600 uppercase tracking-widest">Adicionar</span>
                            </>
                        )}
                    </button>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple={multiple}
                accept="image/*"
                className="hidden"
            />
        </div>
    )
}
