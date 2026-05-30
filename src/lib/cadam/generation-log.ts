import { createClient } from '@/lib/supabase/server'

export interface GenerationLogEntry {
  id?: string
  generation_id: string
  requested_by: string
  project_type: string
  prompt_length: number
  template_id?: string
  development_id?: string
  status: 'started' | 'completed' | 'failed'
  warnings?: string[]
  error_message?: string
  created_at?: string
}

export async function logCadGeneration(entry: GenerationLogEntry): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('cadam_generation_logs').insert({
      generation_id: entry.generation_id,
      requested_by: entry.requested_by,
      project_type: entry.project_type,
      prompt_length: entry.prompt_length,
      template_id: entry.template_id ?? null,
      development_id: entry.development_id ?? null,
      status: entry.status,
      warnings: entry.warnings ?? [],
      error_message: entry.error_message ?? null,
    })
  } catch {
    // Log failure is non-fatal — generation continues
  }
}
