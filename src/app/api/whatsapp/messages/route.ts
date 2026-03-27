import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { rateLimit, getClientIP } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

// ============================================================
// GET /api/whatsapp/messages — Fetch messages for a lead
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req)
    const rl = await rateLimit(ip, { limit: 60, windowMs: 60_000 })
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

    const leadId = req.nextUrl.searchParams.get("lead_id")
    const limit = Math.min(
      Number(req.nextUrl.searchParams.get("limit") || "100"),
      500
    )
    const offset = Number(req.nextUrl.searchParams.get("offset") || "0")

    if (!leadId) {
      return NextResponse.json(
        { error: "lead_id is required" },
        { status: 400 }
      )
    }

    const { data: messages, error } = await supabaseAdmin
      .from("whatsapp_messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar mensagens" },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: messages || [] })
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
