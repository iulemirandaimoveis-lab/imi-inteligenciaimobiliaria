import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date().toISOString().split('T')[0]

    // Try to fetch from ai_tasks table if it exists
    const { data, error } = await supabase
      .from('ai_tasks')
      .select('agent_type, status, created_at')
      .gte('created_at', `${today}T00:00:00`)

    if (error || !data) {
      return NextResponse.json({ agents: [] })
    }

    // Aggregate tasks by agent
    const agentMap: Record<string, { tasksToday: number; status: string }> = {}
    for (const task of data) {
      const key = task.agent_type || 'unknown'
      if (!agentMap[key]) agentMap[key] = { tasksToday: 0, status: 'active' }
      agentMap[key].tasksToday++
    }

    return NextResponse.json({ agents: agentMap })
  } catch {
    return NextResponse.json({ agents: [] })
  }
}
