import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import type {
  Lead,
  LeadPipelineStage,
  PipelineColumn,
  PipelineView,
} from "@/types/crm"
import { PIPELINE_STAGES } from "@/types/crm"

export const dynamic = "force-dynamic"

// All valid pipeline stages for validation
const VALID_STAGES = PIPELINE_STAGES.map((s) => s.key)

// ============================================================
// GET /api/leads/pipeline — Pipeline view grouped by stage
// ============================================================
export async function GET(request: Request) {
  try {
    const ip = getClientIP(request)
    const rl = await rateLimit(ip, { limit: 30, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", remaining: rl.remaining },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Optional filters
    const { searchParams } = new URL(request.url)
    const assignedTo = searchParams.get("assigned_to")
    const temperature = searchParams.get("temperature")

    // Build query — fetch active leads only
    let query = supabaseAdmin
      .from("leads")
      .select(
        "id, name, email, phone, avatar_url, source, pipeline_stage, temperature, score, assigned_to, tags, last_message_at, last_contact_at, total_messages, days_in_pipeline, conversion_value, next_followup_at, created_at, updated_at"
      )
      .eq("is_archived", false)
      .order("score", { ascending: false })

    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo)
    }
    if (temperature) {
      query = query.eq("temperature", temperature)
    }

    const { data: leads, error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar leads do pipeline" },
        { status: 500 }
      )
    }

    // Group by stage
    const pipeline = {} as Record<LeadPipelineStage, PipelineColumn>

    // Initialize all stages (even empty ones)
    for (const stage of VALID_STAGES) {
      pipeline[stage] = {
        stage,
        leads: [],
        count: 0,
        total_value: 0,
      }
    }

    // Populate
    for (const lead of (leads || []) as Lead[]) {
      const stage = lead.pipeline_stage
      if (pipeline[stage]) {
        pipeline[stage].leads.push(lead)
        pipeline[stage].count += 1
        pipeline[stage].total_value += lead.conversion_value || 0
      }
    }

    const result: PipelineView = {
      pipeline,
      total_leads: (leads || []).length,
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// ============================================================
// PATCH /api/leads/pipeline — Move lead to new stage
// ============================================================
export async function PATCH(request: Request) {
  try {
    const ip = getClientIP(request)
    const rl = await rateLimit(ip, { limit: 30, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", remaining: rl.remaining },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { lead_id, new_stage, reason } = body

    if (!lead_id || !new_stage) {
      return NextResponse.json(
        { error: "lead_id e new_stage sao obrigatorios" },
        { status: 400 }
      )
    }

    // Validate stage
    if (!VALID_STAGES.includes(new_stage as LeadPipelineStage)) {
      return NextResponse.json(
        { error: `Stage invalido. Validos: ${VALID_STAGES.join(", ")}` },
        { status: 400 }
      )
    }

    // Fetch current lead to get the current stage
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, pipeline_stage, conversion_value")
      .eq("id", lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead nao encontrado" },
        { status: 404 }
      )
    }

    const fromStage = lead.pipeline_stage as LeadPipelineStage

    // No-op if already in the target stage
    if (fromStage === new_stage) {
      return NextResponse.json({
        success: true,
        message: "Lead ja esta nesse estagio",
      })
    }

    // Update lead stage
    const updatePayload: Record<string, any> = {
      pipeline_stage: new_stage,
      updated_at: new Date().toISOString(),
    }

    // If moving to closed stages, set converted_at or lost_reason
    if (new_stage === "fechado_ganho") {
      updatePayload.converted_at = new Date().toISOString()
    }
    if (new_stage === "fechado_perdido" && reason) {
      updatePayload.lost_reason = reason
    }

    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update(updatePayload)
      .eq("id", lead_id)

    if (updateError) {
      return NextResponse.json(
        { error: "Erro ao atualizar estagio do lead" },
        { status: 500 }
      )
    }

    // Insert into pipeline_stage_history
    const { error: historyError } = await supabaseAdmin
      .from("pipeline_stage_history")
      .insert({
        lead_id,
        from_stage: fromStage,
        to_stage: new_stage,
        moved_by: user.id,
        reason: reason || null,
      })

    if (historyError) {
      // Non-fatal — log but don't fail the request
      console.error("Erro ao salvar historico de pipeline:", historyError)
    }

    return NextResponse.json({
      success: true,
      from_stage: fromStage,
      to_stage: new_stage,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
