
import { createClient } from '@/lib/supabase/client'

let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
    if (!_supabase) _supabase = createClient()
    return _supabase
}

export async function uploadMedia(file: File, folder: string = 'properties', bucket: string = 'media') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await getSupabase().storage
        .from(bucket)
        .upload(filePath, file)

    if (error) throw error

    // Get Public URL
    const { data: { publicUrl } } = getSupabase().storage
        .from(bucket)
        .getPublicUrl(filePath)

    return publicUrl
}

export async function uploadMultipleMedia(files: FileList | File[], folder: string = 'properties', bucket: string = 'media') {
    const uploadPromises = Array.from(files).map(file => uploadMedia(file, folder, bucket))
    return Promise.all(uploadPromises)
}
