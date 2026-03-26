import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import type { WhatsAppInstance } from "@/types/crm"

export const dynamic = "force-dynamic"

// ============================================================
// GET /api/whatsapp/instance — List all WhatsApp instances
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

    const { data: instances, error } = await supabaseAdmin
      .from("whatsapp_instances")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar instancias" },
        { status: 500 }
      )
    }

    // For each instance, try to check live status via Evolution API
    const enriched = await Promise.all(
      (instances || []).map(async (inst: WhatsAppInstance) => {
        let live_status: string | undefined

        if (inst.evolution_api_url && inst.evolution_api_key) {
          try {
            const statusRes = await fetch(
              `${inst.evolution_api_url}/instance/connectionState/${inst.instance_name}`,
              {
                method: "GET",
                headers: {
                  apikey: inst.evolution_api_key,
                },
                signal: AbortSignal.timeout(5000),
              }
            )
            if (statusRes.ok) {
              const statusData = await statusRes.json()
              live_status = statusData?.instance?.state || statusData?.state || "unknown"
            }
          } catch {
            // Evolution API unreachable — keep live_status undefined
          }
        }

        // Strip sensitive fields before returning
        const { evolution_api_key: _key, ...safe } = inst
        return { ...safe, live_status }
      })
    )

    return NextResponse.json({ instances: enriched })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// ============================================================
// POST /api/whatsapp/instance — Create new WhatsApp instance
// ============================================================
export async function POST(request: Request) {
  try {
    const ip = getClientIP(request)
    const rl = await rateLimit(ip, { limit: 10, windowMs: 60_000 })
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
    const { instance_name, evolution_api_url, evolution_api_key } = body

    if (!instance_name || !evolution_api_url || !evolution_api_key) {
      return NextResponse.json(
        {
          error:
            "instance_name, evolution_api_url e evolution_api_key sao obrigatorios",
        },
        { status: 400 }
      )
    }

    // Check for duplicate instance name
    const { data: existing } = await supabaseAdmin
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name", instance_name)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "Ja existe uma instancia com esse nome" },
        { status: 409 }
      )
    }

    // If Evolution API URL is configured, attempt to create instance there
    let evolution_instance_id: string | null = null
    let evolution_error: string | null = null

    try {
      const createRes = await fetch(
        `${evolution_api_url}/instance/create`,
        {
          method: "POST",
          headers: {
            apikey: evolution_api_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instanceName: instance_name,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
          }),
          signal: AbortSignal.timeout(15000),
        }
      )

      if (createRes.ok) {
        const createData = await createRes.json()
        evolution_instance_id =
          createData?.instance?.instanceName ||
          createData?.instance?.instanceId ||
          null
      } else {
        const errData = await createRes.json().catch(() => ({}))
        evolution_error =
          errData?.message || `Evolution API responded with ${createRes.status}`
      }
    } catch (err) {
      evolution_error =
        err instanceof Error ? err.message : "Evolution API unreachable"
    }

    // Check if there are other instances — first one is default
    const { count } = await supabaseAdmin
      .from("whatsapp_instances")
      .select("id", { count: "exact", head: true })

    const isFirst = (count || 0) === 0

    // Save to Supabase
    const { data: instance, error: insertError } = await supabaseAdmin
      .from("whatsapp_instances")
      .insert({
        instance_name,
        instance_id: evolution_instance_id,
        status: evolution_instance_id ? "qr_pending" : "disconnected",
        evolution_api_url,
        evolution_api_key,
        is_default: isFirst,
        session_data: {},
      })
      .select(
        "id, instance_name, instance_id, phone_number, status, qr_code, evolution_api_url, webhook_url, is_default, session_data, created_at, updated_at"
      )
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: "Erro ao salvar instancia" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      instance,
      evolution_error,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
