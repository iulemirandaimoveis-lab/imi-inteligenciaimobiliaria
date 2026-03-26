import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import type { WhatsAppInstance } from "@/types/crm"

export const dynamic = "force-dynamic"

// ============================================================
// POST /api/whatsapp/send — Send text message via WhatsApp
// ============================================================
export async function POST(request: Request) {
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
    const { lead_id, message, instance_id } = body

    if (!lead_id || !message) {
      return NextResponse.json(
        { error: "lead_id e message sao obrigatorios" },
        { status: 400 }
      )
    }

    // Look up the lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, phone, phone_normalized, whatsapp_jid, whatsapp_instance_id, name")
      .eq("id", lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead nao encontrado" },
        { status: 404 }
      )
    }

    const phone = lead.phone_normalized || lead.phone
    if (!phone) {
      return NextResponse.json(
        { error: "Lead nao possui telefone cadastrado" },
        { status: 400 }
      )
    }

    // Normalize phone number
    let normalizedPhone = phone.replace(/\D/g, "")
    if (normalizedPhone.startsWith("0"))
      normalizedPhone = "55" + normalizedPhone.slice(1)
    if (!normalizedPhone.startsWith("55"))
      normalizedPhone = "55" + normalizedPhone

    const remoteJid = lead.whatsapp_jid || `${normalizedPhone}@s.whatsapp.net`

    // Find the WhatsApp instance to use
    const targetInstanceId = instance_id || lead.whatsapp_instance_id
    let instance: WhatsAppInstance | null = null

    if (targetInstanceId) {
      const { data } = await supabaseAdmin
        .from("whatsapp_instances")
        .select("*")
        .eq("id", targetInstanceId)
        .single()
      instance = data
    }

    // Fallback: use default instance
    if (!instance) {
      const { data } = await supabaseAdmin
        .from("whatsapp_instances")
        .select("*")
        .eq("is_default", true)
        .single()
      instance = data
    }

    // If still no instance, fallback to any available
    if (!instance) {
      const { data } = await supabaseAdmin
        .from("whatsapp_instances")
        .select("*")
        .eq("status", "connected")
        .limit(1)
        .single()
      instance = data
    }

    // Try to send via Evolution API if we have a configured instance
    let sendStatus: "sent" | "pending" | "failed" = "pending"
    let externalMessageId: string | null = null
    let sendError: string | null = null

    if (instance?.evolution_api_url && instance?.evolution_api_key) {
      try {
        const sendRes = await fetch(
          `${instance.evolution_api_url}/message/sendText/${instance.instance_name}`,
          {
            method: "POST",
            headers: {
              apikey: instance.evolution_api_key,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              number: normalizedPhone,
              text: message,
            }),
            signal: AbortSignal.timeout(15000),
          }
        )

        if (sendRes.ok) {
          const sendData = await sendRes.json()
          externalMessageId = sendData?.key?.id || null
          sendStatus = "sent"
        } else {
          const errData = await sendRes.json().catch(() => ({}))
          sendError = errData?.message || `Evolution API error: ${sendRes.status}`
          sendStatus = "failed"
        }
      } catch (err) {
        sendError =
          err instanceof Error ? err.message : "Evolution API unreachable"
        sendStatus = "failed"
      }
    } else {
      // No instance configured — save as pending for later delivery
      sendStatus = "pending"
      sendError = "Nenhuma instancia WhatsApp configurada — mensagem salva como pendente"
    }

    // Save message to whatsapp_messages table
    const { data: savedMessage, error: msgError } = await supabaseAdmin
      .from("whatsapp_messages")
      .insert({
        lead_id,
        instance_id: instance?.id || null,
        remote_jid: remoteJid,
        message_id: externalMessageId,
        direction: "outbound",
        content_type: "text",
        body: message,
        status: sendStatus,
        is_ai_generated: false,
        ai_entities_extracted: {},
        context: {},
      })
      .select("id, status, message_id, created_at")
      .single()

    if (msgError) {
      return NextResponse.json(
        { error: "Mensagem enviada mas erro ao salvar no banco" },
        { status: 500 }
      )
    }

    // Update lead tracking fields
    await supabaseAdmin
      .from("leads")
      .update({
        last_message_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString(),
        total_messages: (lead as any).total_messages
          ? (lead as any).total_messages + 1
          : 1,
        total_outbound_messages: (lead as any).total_outbound_messages
          ? (lead as any).total_outbound_messages + 1
          : 1,
        whatsapp_jid: remoteJid,
        whatsapp_instance_id: instance?.id || lead.whatsapp_instance_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead_id)

    return NextResponse.json({
      success: sendStatus === "sent",
      status: sendStatus,
      message: savedMessage,
      error: sendError,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
