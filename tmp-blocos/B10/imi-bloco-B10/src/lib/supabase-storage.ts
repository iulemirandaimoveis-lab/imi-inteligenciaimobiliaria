'use client'

// lib/supabase-storage.ts
// Sistema completo de upload de imagens para Supabase Storage
import { createClient } from '@/lib/supabase/client'
import React from 'react'

const supabase = createClient()

export interface UploadResult {
    url: string
    path: string
    error?: string
}

export interface UploadProgress {
    loaded: number
    total: number
    percentage: number
}

/**
 * Upload de arquivo único para Supabase Storage
 */
export async function uploadFile(
    file: File,
    bucket: string = 'media',
    folder: string = 'uploads',
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
    try {
        // Validar arquivo
        if (!file) {
            throw new Error('Nenhum arquivo fornecido')
        }

        // Validar tipo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Tipo de arquivo não permitido')
        }

        // Validar tamanho (50MB max)
        const maxSize = 50 * 1024 * 1024 // 50MB
        if (file.size > maxSize) {
            throw new Error('Arquivo muito grande. Máximo: 50MB')
        }

        // Gerar nome único
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        // Extrair extensão segura
        const originalName = file.name
        const extension = originalName.substring(originalName.lastIndexOf('.') + 1)
        const fileName = `${timestamp}-${randomString}.${extension}`
        const filePath = `${folder}/${fileName}`

        // Upload
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            throw error
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        if (onProgress) {
            onProgress({
                loaded: file.size,
                total: file.size,
                percentage: 100
            })
        }

        return {
            url: urlData.publicUrl,
            path: filePath
        }
    } catch (error: any) {
        console.error('Erro no upload:', error)
        return {
            url: '',
            path: '',
            error: error.message || 'Erro ao fazer upload'
        }
    }
}

/**
 * Upload múltiplo de arquivos
 */
export async function uploadMultipleFiles(
    files: File[],
    bucket: string = 'media',
    folder: string = 'uploads',
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // Wrapper para passar o progresso com index
        const progressCallback = onProgress
            ? (progress: UploadProgress) => onProgress(i, progress)
            : undefined

        const result = await uploadFile(
            file,
            bucket,
            folder,
            progressCallback
        )
        results.push(result)
    }

    return results
}

/**
 * Upload de imagem com redimensionamento automático
 */
export async function uploadImage(
    file: File,
    options: {
        bucket?: string
        folder?: string
        maxWidth?: number
        maxHeight?: number
        quality?: number
    } = {}
): Promise<UploadResult> {
    const {
        bucket = 'media',
        folder = 'images',
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85
    } = options

    try {
        // Criar bitmap da imagem
        const imgBitmap = await createImageBitmap(file)

        // Calcular novas dimensões mantendo aspect ratio
        let width = imgBitmap.width
        let height = imgBitmap.height

        if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
        }

        if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
        }

        // Usar OffscreenCanvas se disponível (melhor performance em Web Workers)
        // Fallback para elemento canvas do DOM
        let blob: Blob | null = null

        if (typeof OffscreenCanvas !== 'undefined') {
            const canvas = new OffscreenCanvas(width, height)
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(imgBitmap, 0, 0, width, height)
                blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
            }
        } else {
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(imgBitmap, 0, 0, width, height)
                blob = await new Promise<Blob | null>((resolve) =>
                    canvas.toBlob(resolve, 'image/jpeg', quality)
                )
            }
        }

        if (!blob) throw new Error('Falha ao processar imagem')

        // Criar novo File otimizado
        const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: 'image/jpeg',
            lastModified: Date.now()
        })

        // Upload
        return await uploadFile(optimizedFile, bucket, folder)
    } catch (error: any) {
        console.warn('Falha na otimização de imagem, fazendo upload do original:', error)
        // Fallback: upload sem otimização
        return await uploadFile(file, bucket, folder)
    }
}

/**
 * Deletar arquivo do Storage
 */
export async function deleteFile(
    path: string,
    bucket: string = 'media'
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path])

        if (error) {
            throw error
        }

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao deletar arquivo:', error)
        return {
            success: false,
            error: error.message || 'Erro ao deletar arquivo'
        }
    }
}

/**
 * Hook React para upload de arquivos
 */
export function useFileUpload() {
    const [uploading, setUploading] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [error, setError] = React.useState<string | null>(null)

    const upload = async (
        file: File,
        options?: {
            bucket?: string
            folder?: string
            optimize?: boolean
        }
    ): Promise<UploadResult | null> => {
        setUploading(true)
        setError(null)
        setProgress(0)

        try {
            let result: UploadResult

            if (options?.optimize && file.type.startsWith('image/')) {
                result = await uploadImage(file, {
                    bucket: options.bucket,
                    folder: options.folder
                })
            } else {
                result = await uploadFile(
                    file,
                    options?.bucket,
                    options?.folder,
                    (prog) => setProgress(prog.percentage)
                )
            }

            if (result.error) {
                throw new Error(result.error)
            }

            return result
        } catch (err: any) {
            const msg = err.message || 'Erro no upload'
            setError(msg)
            return { url: '', path: '', error: msg }
        } finally {
            setUploading(false)
            setProgress(100) // Ensure complete state
        }
    }

    return {
        upload,
        uploading,
        progress,
        error
    }
}
