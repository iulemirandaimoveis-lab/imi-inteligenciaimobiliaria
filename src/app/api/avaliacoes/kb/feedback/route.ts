import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/avaliacoes/kb/feedback
 * Records user feedback on KB topic quality, adjusting confidence scores.
 *
 * Body: { topic_id: string, vote: 'up' | 'down', correction?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { topic_id, vote, correction } = await req.json()

    if (!topic_id || !vote || !['up', 'down'].includes(vote)) {
      return NextResponse.json({ error: 'topic_id e vote (up|down) são obrigatórios' }, { status: 400 })
    }

    // Update vote counts
    const column = vote === 'up' ? 'upvotes' : 'downvotes'
    const { data: topic } = await supabaseAdmin
      .from('avaliacoes_kb_topics')
      .select('upvotes, downvotes, usage_count')
      .eq('id', topic_id)
      .single()

    if (!topic) {
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 })
    }

    const newUpvotes = (topic.upvotes || 0) + (vote === 'up' ? 1 : 0)
    const newDownvotes = (topic.downvotes || 0) + (vote === 'down' ? 1 : 0)
    const totalVotes = newUpvotes + newDownvotes

    // Recalculate confidence: Wilson score lower bound (simplified)
    const confidence = totalVotes > 0
      ? Math.max(0.1, Math.min(1.0, (newUpvotes + 1) / (totalVotes + 2)))
      : 0.5

    const updates: Record<string, unknown> = {
      [column]: (topic[column as keyof typeof topic] || 0) + 1,
      confidence,
    }

    // If user provided a correction, append to content
    if (correction && typeof correction === 'string' && correction.trim()) {
      const { data: fullTopic } = await supabaseAdmin
        .from('avaliacoes_kb_topics')
        .select('content')
        .eq('id', topic_id)
        .single()

      if (fullTopic) {
        updates.content = `${fullTopic.content}\n\n---\n**Correção (${new Date().toLocaleDateString('pt-BR')}):** ${correction.trim()}`
      }
    }

    await supabaseAdmin
      .from('avaliacoes_kb_topics')
      .update(updates)
      .eq('id', topic_id)

    return NextResponse.json({ success: true, confidence })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 })
  }
}
