'use client'

import { useState, useRef } from 'react'

import { ArrowUpTrayIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface ImageUploadProps {
    images: { url: string; alt: string }[]
    onChange: (images: { url: string; alt: string }[]) => void
    maxFiles?: number
}

export default function ImageUpload({ images, onChange, maxFiles = 10 }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFiles(e.dataTransfer.files)
        }
    }

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            await handleFiles(e.target.files)
        }
    }

    const handleFiles = async (files: FileList) => {
        setIsUploading(true)
        const newImages = [...images]
        const bucketName = 'properties'

        for (let i = 0; i < files.length; i++) {
            if (newImages.length >= maxFiles) break;

            const file = files[i]
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            try {
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, file)

                if (uploadError) {
                    throw uploadError
                }

                const { data } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath)

                newImages.push({
                    url: data.publicUrl,
                    alt: file.name.split('.')[0]
                })

            } catch (error: any) {
                console.error('Error uploading file:', error)

                const errorMessage = error.message || JSON.stringify(error)

                // Specific error for missing bucket
                if (errorMessage.includes('bucket not found') || error.error?.includes('Bucket not found') || error.statusCode === '404') {
                    alert('CONFIGURAÇÃO PENDENTE: O bucket "properties" não foi encontrado no Supabase.\n\nPor favor, crie o bucket "properties" no painel do Supabase como "Public".')
                } else if (errorMessage.includes('security check') || error.statusCode === '403') {
                    alert('ERRO DE PERMISSÃO: Verifique as políticas (RLS) do Storage no Supabase.\n\nCertifique-se que o bucket "properties" é PÚBLICO e permite INSERT e SELECT.')
                } else {
                    alert(`Erro ao fazer upload da imagem: ${errorMessage}\n\nTente novamente ou contate o suporte.`)
                }
            }
        }

        onChange(newImages)
        setIsUploading(false)
    }

    const removeImage = (index: number) => {
        const newImages = [...images]
        newImages.splice(index, 1)
        onChange(newImages)
    }

    return (
        <div className="w-full">
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img, index) => (
                    <div key={index} className="relative aspect-square group rounded-xl overflow-hidden border border-imi-200 bg-imi-100">
                        <Image
                            src={img.url}
                            alt={img.alt}
                            fill
                            className="object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {images.length < maxFiles && (
                    <div
                        className={`
                            relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
                            ${dragActive ? 'border-accent-500 bg-accent-50' : 'border-imi-300 hover:border-accent-400 hover:bg-imi-50'}
                            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleChange}
                            className="hidden"
                        />

                        {isUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
                        ) : (
                            <>
                                <ArrowUpTrayIcon className="w-8 h-8 text-imi-400 mb-2" />
                                <span className="text-sm font-medium text-imi-500 text-center px-2">
                                    Click or Drag
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <p className="text-xs text-imi-500">
                Suporta JPG, PNG, WebP (Max 5MB). Arraste e solte para adicionar.
            </p>
        </div>
    )
}
