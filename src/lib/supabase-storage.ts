'use client'
// lib/supabase-storage.ts
// Sistema completo de upload de imagens para Supabase Storage
import { createClient } from '@/lib/supabase/client'
import React from 'react'
let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
    if (!_supabase) _supabase = createClient()
    return _supabase
}
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
        // Upload via API route (uses supabaseAdmin to bypass storage RLS)
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(`/api/upload?folder=${encodeURIComponent(folder)}&bucket=${encodeURIComponent(bucket)}`, {
            method: 'POST',
            body: formData,
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
            throw new Error(json.error || 'Erro ao fazer upload')
        }
        if (onProgress) {
            onProgress({
                loaded: file.size,
                total: file.size,
                percentage: 100
            })
        }
        return {
            url: json.data.url,
            path: json.data.fileName,
        }
    } catch (error: unknown) {
        return {
            url: '',
            path: '',
            error: error instanceof Error ? error.message : 'Erro ao fazer upload'
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
    } catch (_error: unknown) {
        // Fallback: upload sem otimização
        return await uploadFile(file, bucket, folder)
    }
}
// ── Enhanced multi-image status ─────────────────────────────
export type ImageUploadStatus = 'pending' | 'compressing' | 'uploading' | 'done' | 'error' | 'retrying'
export interface ImageUploadFileStatus {
    index: number
    fileName: string
    status: ImageUploadStatus
    percent: number
    error?: string
    url?: string
}
/**
 * Upload múltiplo de IMAGENS com compressão automática, concurrency pool e retry.
 * Resolve o problema de upload de 20+ fotos: comprime antes de enviar (1920×1080 JPEG 0.85)
 * e limita a 3 uploads simultâneos para evitar timeout/rate-limit.
 */
export async function uploadMultipleImages(
    files: File[],
    options: {
        bucket?: string
        folder?: string
        maxWidth?: number
        maxHeight?: number
        quality?: number
        concurrency?: number
        maxRetries?: number
        onFileStatus?: (status: ImageUploadFileStatus) => void
    } = {}
): Promise<UploadResult[]> {
    const {
        bucket = 'media',
        folder = 'images',
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85,
        concurrency = 3,
        maxRetries = 2,
        onFileStatus,
    } = options
    const results: UploadResult[] = new Array(files.length)
    let nextIndex = 0
    const notify = (index: number, status: ImageUploadStatus, percent: number, error?: string, url?: string) => {
        onFileStatus?.({
            index,
            fileName: files[index].name,
            status,
            percent,
            error,
            url,
        })
    }
    // Worker que processa um arquivo de cada vez
    const worker = async () => {
        while (nextIndex < files.length) {
            const i = nextIndex++
            const file = files[i]
            let lastError = ''
            let success = false
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    if (attempt > 0) {
                        notify(i, 'retrying', 0)
                        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1))) // 1s, 2s backoff
                    }
                    // Compress if it's an image
                    if (file.type.startsWith('image/')) {
                        notify(i, 'compressing', 10)
                        const result = await uploadImage(file, { bucket, folder, maxWidth, maxHeight, quality })
                        if (result.error) {
                            throw new Error(result.error)
                        }
                        notify(i, 'done', 100, undefined, result.url)
                        results[i] = result
                        success = true
                        break
                    } else {
                        // Non-image files: direct upload
                        notify(i, 'uploading', 30)
                        const result = await uploadFile(file, bucket, folder)
                        if (result.error) {
                            throw new Error(result.error)
                        }
                        notify(i, 'done', 100, undefined, result.url)
                        results[i] = result
                        success = true
                        break
                    }
                } catch (err: unknown) {
                    lastError = err instanceof Error ? err.message : 'Erro no upload'
                }
            }
            if (!success) {
                notify(i, 'error', 0, lastError)
                results[i] = { url: '', path: '', error: lastError }
            }
        }
    }
    // Start N concurrent workers
    const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker())
    await Promise.all(workers)
    return results
}
/**
 * Deletar arquivo do Storage
 */
export async function deleteFile(
    path: string,
    bucket: string = 'media'
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await getSupabase().storage
            .from(bucket)
            .remove([path])
        if (error) {
            throw error
        }
        return { success: true }
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao deletar arquivo'
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
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro no upload'
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
