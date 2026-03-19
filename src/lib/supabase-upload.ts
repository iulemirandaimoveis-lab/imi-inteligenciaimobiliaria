import { createClient } from '@/lib/supabase/client'
/**
 * Uploads a file to Supabase Storage in the 'media' bucket
 * @param file The file to upload
 * @param folder The folder inside the bucket (e.g., 'developments', 'profiles')
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    // 1. Upload to bucket 'media'
    const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        })
    if (uploadError) {
        throw uploadError
    }
    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName)
    return publicUrl
}
