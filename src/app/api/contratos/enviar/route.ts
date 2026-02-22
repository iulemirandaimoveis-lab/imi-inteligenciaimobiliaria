// src/app/api/contratos/enviar/route.ts
// ── Envio: Email (Resend/SMTP) + WhatsApp (Evolution/Z-API) ──

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// ── Templates multiidioma ──────────────────────────────────────
const getTpl = (idioma: string) => ({
  pt: {
    subject: (n: string, t: string) => `📄 Contrato ${n} — ${t} | IMI Atlantis`,
    email: (n: string, t: string, url: string, by: string) => `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#C49D5B,#8B5E1F);padding:24px;border-radius:12px 12px 0 0;text-align:center">
    <span style="color:white;font-size:22px;font-weight:900">IMI</span>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:12px">Inteligência Imobiliária</p>
  </div>
  <div style="background:#0F1117;padding:32px;border-radius:0 0 12px 12px;color:#F0F2F5">
    <p>Olá,</p>
    <p style="color:#8B93A7">Segue o contrato <strong style="color:#C49D5B">${n}</strong> — <em>${t}</em>, preparado por <strong>${by}</strong>.</p>
    <div style="margin:24px 0;text-align:center">
      <a href="${url}" style="background:linear-gradient(135deg,#C49D5B,#8B5E1F);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600">📄 Visualizar e Assinar</a>
    </div>
    <p style="color:#4E5669;font-size:12px">Em caso de dúvidas, responda este email.</p>
    <hr style="border:1px solid rgba(255,255,255,0.08);margin:20px 0"/>
    <p style="color:#4E5669;font-size:10px;text-align:center">IMI — Inteligência Imobiliária · CRECI 17933</p>
  </div>
</div>`,
    whatsapp: (n: string, t: string, url: string, by: string) =>
      `📄 *IMI — Contrato Gerado*\n\n` +
      `Olá! Segue o contrato *${n}* referente a *${t}*.\n` +
      `Preparado por: ${by}\n` +
      `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n` +
      `🔗 Visualizar e assinar:\n${url}\n\n` +
      `_IMI Inteligência Imobiliária_`,
  },
  en: {
    subject: (n: string, t: string) => `📄 Contract ${n} — ${t} | IMI Atlantis`,
    email: (n: string, t: string, url: string, by: string) => `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#0F1117;padding:32px;border-radius:12px;color:#F0F2F5">
  <h2 style="color:#C49D5B">IMI — Contract Ready</h2>
  <p>Contract <strong>${n}</strong> — <em>${t}</em> prepared by <strong>${by}</strong>.</p>
  <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#C49D5B,#8B5E1F);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;margin:16px 0">View & Sign Contract</a>
</div>`,
    whatsapp: (n: string, t: string, url: string, by: string) =>
      `📄 *IMI — Contract Ready*\n\n` +
      `Contract *${n}* — *${t}* prepared by ${by}.\n\n` +
      `🔗 View & Sign:\n${url}\n\n` +
      `_IMI Real Estate Intelligence_`,
  },
  es: {
    subject: (n: string, t: string) => `📄 Contrato ${n} — ${t} | IMI Atlantis`,
    email: (n: string, t: string, url: string, by: string) => `<div style="font-family:sans-serif;padding:24px;background:#0F1117;color:#F0F2F5;border-radius:12px"><h2 style="color:#C49D5B">IMI — Contrato Listo</h2><p>Contrato <strong>${n}</strong> — ${t} preparado por ${by}.</p><a href="${url}" style="background:linear-gradient(135deg,#C49D5B,#8B5E1F);color:white;padding:12px 28px;border-radius:8px;text-decoration:none">Ver y Firmar</a></div>`,
    whatsapp: (n: string, t: string, url: string, by: string) =>
      `📄 *IMI — Contrato Listo*\n\nContrato *${n}* — ${t} preparado por ${by}.\n\n🔗 Ver y firmar:\n${url}\n\n_IMI Inteligencia Inmobiliaria_`,
  },
  ar: {
    subject: (n: string, t: string) => `📄 عقد ${n} — ${t} | IMI Atlantis`,
    email: (n: string, t: string, url: string, by: string) => `<div dir="rtl" style="font-family:sans-serif;padding:24px;background:#0F1117;color:#F0F2F5;border-radius:12px"><h2 style="color:#C49D5B">IMI — العقد جاهز</h2><p>تم إعداد العقد <strong>${n}</strong> — ${t} بواسطة ${by}.</p><a href="${url}" style="background:linear-gradient(135deg,#C49D5B,#8B5E1F);color:white;padding:12px 28px;border-radius:8px;text-decoration:none">عرض والتوقيع</a></div>`,
    whatsapp: (n: string, t: string, url: string, by: string) =>
      `📄 *IMI — العقد جاهز*\n\nتم إعداد العقد *${n}* — ${t} بواسطة ${by}.\n\n🔗 عرض والتوقيع:\n${url}\n\n_IMI للذكاء العقاري_`,
  },
  ja: {
    subject: (n: string, t: string) => `📄 契約書 ${n} — ${t} | IMI Atlantis`,
    email: (n: string, t: string, url: string, by: string) => `<div style="font-family:sans-serif;padding:24px;background:#0F1117;color:#F0F2F5;border-radius:12px"><h2 style="color:#C49D5B">IMI — 契約書の準備完了</h2><p>契約書 <strong>${n}</strong> — ${t} が${by}によって作成されました。</p><a href="${url}" style="background:linear-gradient(135deg,#C49D5B,#8B5E1F);color:white;padding:12px 28px;border-radius:8px;text-decoration:none">確認・署名する</a></div>`,
    whatsapp: (n: string, t: string, url: string, by: string) =>
      `📄 *IMI — 契約書が完成しました*\n\n契約書 *${n}* — ${t} が${by}によって作成されました。\n\n🔗 確認・署名:\n${url}\n\n_IMI 不動産インテリジェンス_`,
  },
})[idioma] || ({
  subject: (n: string, t: string) => `📄 Contrato ${n} | IMI`,
  email: (n: string, t: string, url: string, by: string) => `<p>${t} por ${by}: <a href="${url}">${url}</a></p>`,
  whatsapp: (n: string, t: string, url: string, _by: string) => `${t}: ${url}`,
} as any)

export async function POST(req: NextRequest) {
  try {
    const {
      canal,
      destinatario_email,
      destinatario_telefone,
      contrato_numero,
      contrato_tipo,
      contrato_url,
      criado_por_nome,
      idioma = 'pt',
      mensagem_personalizada,
    } = await req.json()

    if (!canal || !contrato_url) {
      return NextResponse.json({ error: 'canal e contrato_url são obrigatórios' }, { status: 400 })
    }

    const tpl = getTpl(idioma)
    const results: Record<string, any> = {}

    // ── EMAIL ───────────────────────────────────────────────
    if ((canal === 'email' || canal === 'ambos') && destinatario_email) {
      const resendKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'contratos@imi.imb.br'
      const fromName  = process.env.RESEND_FROM_NAME  || 'IMI Inteligência Imobiliária'

      if (!resendKey) {
        results.email = {
          success: false,
          error: 'Resend não configurado',
          instrucao: 'Configure RESEND_API_KEY em Integrações → Email',
        }
      } else {
        const subject = tpl.subject(contrato_numero, contrato_tipo)
        const html = mensagem_personalizada
          ? `<p style="font-family:sans-serif;color:#8B93A7">${mensagem_personalizada}</p><br/>${tpl.email(contrato_numero, contrato_tipo, contrato_url, criado_por_nome)}`
          : tpl.email(contrato_numero, contrato_tipo, contrato_url, criado_por_nome)

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [destinatario_email],
            subject,
            html,
          }),
        })

        const emailData = await emailRes.json()
        results.email = emailRes.ok
          ? { success: true, id: emailData.id }
          : { success: false, error: emailData.message }
      }
    }

    // ── WHATSAPP ────────────────────────────────────────────
    if ((canal === 'whatsapp' || canal === 'ambos') && destinatario_telefone) {
      const evolutionUrl  = process.env.EVOLUTION_API_URL
      const evolutionKey  = process.env.EVOLUTION_API_KEY
      const evolutionInst = process.env.EVOLUTION_INSTANCE || 'IMI'
      const zapiInstance  = process.env.ZAPI_INSTANCE
      const zapiToken     = process.env.ZAPI_TOKEN
      const zapiClientId  = process.env.ZAPI_CLIENT_ID

      const message = mensagem_personalizada
        ? `${mensagem_personalizada}\n\n${tpl.whatsapp(contrato_numero, contrato_tipo, contrato_url, criado_por_nome)}`
        : tpl.whatsapp(contrato_numero, contrato_tipo, contrato_url, criado_por_nome)

      const phone = destinatario_telefone.replace(/\D/g, '')

      if (evolutionUrl && evolutionKey) {
        // Evolution API
        const waRes = await fetch(`${evolutionUrl}/message/sendText/${evolutionInst}`, {
          method: 'POST',
          headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: `55${phone}@s.whatsapp.net`,
            options: { delay: 1200, presence: 'composing' },
            textMessage: { text: message },
          }),
        })
        const waData = await waRes.json()
        results.whatsapp = waRes.ok
          ? { success: true, provider: 'evolution', id: waData.key?.id }
          : { success: false, error: 'Falha Evolution API' }

      } else if (zapiInstance && zapiToken && zapiClientId) {
        // Z-API fallback
        const zapiRes = await fetch(`https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-text`, {
          method: 'POST',
          headers: { 'Client-Token': zapiClientId, 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: `55${phone}`, message }),
        })
        const zapiData = await zapiRes.json()
        results.whatsapp = zapiRes.ok
          ? { success: true, provider: 'zapi', id: zapiData.id }
          : { success: false, error: 'Falha Z-API' }

      } else {
        // Fallback: wa.me link
        const msgEncoded = encodeURIComponent(message)
        results.whatsapp = {
          success: false,
          provider: 'none',
          fallback_url: `https://wa.me/55${phone}?text=${msgEncoded}`,
          instrucao: 'Configure Evolution API ou Z-API em Integrações → WhatsApp',
        }
      }
    }

    return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() })

  } catch (error: any) {
    console.error('enviar-contrato error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao enviar' }, { status: 500 })
  }
}
