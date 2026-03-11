// src/app/api/integracoes/test-connection/route.ts
// ── Testa conectividade das integrações ─────────────────────

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function POST(req: NextRequest) {
  try {
    const { integration_id, values } = await req.json()

    switch (integration_id) {

      case 'resend': {
        const key = values.resend_api_key || process.env.RESEND_API_KEY
        if (!key) return NextResponse.json({ success: false, message: 'API Key não informada' })
        const res = await fetch('https://api.resend.com/domains', {
          headers: { 'Authorization': `Bearer ${key}` },
        })
        return NextResponse.json(res.ok
          ? { success: true, message: 'Resend conectado com sucesso!' }
          : { success: false, message: 'API Key inválida' })
      }

      case 'clicksign': {
        const token = values.clicksign_access_token || process.env.CLICKSIGN_ACCESS_TOKEN
        const env   = values.clicksign_environment || process.env.CLICKSIGN_ENVIRONMENT || 'sandbox'
        if (!token) return NextResponse.json({ success: false, message: 'Access Token não informado' })
        const base = env === 'production' ? 'https://app.clicksign.com' : 'https://sandbox.clicksign.com'
        const res  = await fetch(`${base}/api/v1/documents?access_token=${token}&page=1&per_page=1`)
        return NextResponse.json(res.ok
          ? { success: true, message: `ClickSign ${env} conectado!` }
          : { success: false, message: 'Token inválido ou ambiente incorreto' })
      }

      case 'govbr': {
        const clientId = values.govbr_client_id || process.env.GOVBR_CLIENT_ID
        if (!clientId) return NextResponse.json({ success: false, message: 'Client ID não informado' })
        // Só valida se o client_id está preenchido — não há endpoint público de teste
        return NextResponse.json({
          success: true,
          message: 'Gov.br configurado. Teste real requer fluxo OAuth completo — use o ambiente de staging.',
        })
      }

      case 'evolution_api': {
        const url  = values.evolution_api_url || process.env.EVOLUTION_API_URL
        const key  = values.evolution_api_key || process.env.EVOLUTION_API_KEY
        const inst = values.evolution_instance || process.env.EVOLUTION_INSTANCE || 'IMI'
        if (!url || !key) return NextResponse.json({ success: false, message: 'URL e API Key são obrigatórios' })
        const res = await fetch(`${url}/instance/fetchInstances`, {
          headers: { 'apikey': key },
        }).catch(() => null)
        if (!res) return NextResponse.json({ success: false, message: 'Não foi possível conectar ao servidor Evolution' })
        return NextResponse.json(res.ok
          ? { success: true, message: `Evolution API conectada! Instância: ${inst}` }
          : { success: false, message: 'API Key inválida ou servidor inacessível' })
      }

      case 'zapi': {
        const inst     = values.zapi_instance || process.env.ZAPI_INSTANCE
        const token    = values.zapi_token || process.env.ZAPI_TOKEN
        const clientId = values.zapi_client_id || process.env.ZAPI_CLIENT_ID
        if (!inst || !token) return NextResponse.json({ success: false, message: 'Instance ID e Token são obrigatórios' })
        const res = await fetch(`https://api.z-api.io/instances/${inst}/token/${token}/status`, {
          headers: { 'Client-Token': clientId || '' },
        }).catch(() => null)
        if (!res) return NextResponse.json({ success: false, message: 'Não foi possível conectar ao Z-API' })
        const data = await res.json()
        return NextResponse.json(res.ok && data.connected
          ? { success: true, message: 'Z-API conectado! WhatsApp ativo.' }
          : { success: false, message: data.error || 'Instância não encontrada ou WhatsApp desconectado' })
      }

      case 'google_drive': {
        const folderId = values.gdrive_folder_id || process.env.GDRIVE_FOLDER_ID
        const jsonStr  = values.gdrive_service_account_json || process.env.GDRIVE_SERVICE_ACCOUNT_JSON
        if (!folderId) return NextResponse.json({ success: false, message: 'Folder ID não informado' })
        if (!jsonStr)  return NextResponse.json({
          success: true,
          message: 'Folder ID configurado. Service Account JSON necessária para testar acesso completo.',
        })
        try {
          JSON.parse(jsonStr) // valida JSON
          return NextResponse.json({ success: true, message: 'Service Account JSON válido! Configure o Folder ID e teste o upload.' })
        } catch {
          return NextResponse.json({ success: false, message: 'Service Account JSON inválido — verifique o formato' })
        }
      }

      case 'stripe': {
        const key = values.stripe_secret_key || process.env.STRIPE_SECRET_KEY
        if (!key) return NextResponse.json({ success: false, message: 'Secret Key não informada' })
        const res = await fetch('https://api.stripe.com/v1/balance', {
          headers: { 'Authorization': `Bearer ${key}` },
        })
        return NextResponse.json(res.ok
          ? { success: true, message: 'Stripe conectado com sucesso!' }
          : { success: false, message: 'Secret Key inválida' })
      }

      case 'mercadopago': {
        const token = values.mp_access_token || process.env.MP_ACCESS_TOKEN
        if (!token) return NextResponse.json({ success: false, message: 'Access Token não informado' })
        const res = await fetch('https://api.mercadopago.com/v1/account/settlement_report/config', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        return NextResponse.json(res.status !== 401
          ? { success: true, message: 'Mercado Pago conectado!' }
          : { success: false, message: 'Access Token inválido' })
      }

      case 'supabase_storage': {
        return NextResponse.json({
          success: true,
          message: 'Supabase Storage é o armazenamento nativo do projeto — sempre ativo.',
        })
      }

      case 'anthropic_claude': {
        const key = values.anthropic_api_key || process.env.ANTHROPIC_API_KEY
        if (!key) return NextResponse.json({ success: false, message: 'API Key não informada' })
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        }).catch(() => null)
        if (!res) return NextResponse.json({ success: false, message: 'Não foi possível conectar à Anthropic' })
        if (res.ok) {
          const data = await res.json()
          const models = (data.data || []).map((m: any) => m.id).slice(0, 3).join(', ')
          return NextResponse.json({ success: true, message: `Claude conectado! Modelos: ${models || 'disponíveis'}` })
        }
        return NextResponse.json({ success: false, message: 'API Key inválida — verifique em console.anthropic.com' })
      }

      case 'meta_ads': {
        const token   = values.meta_access_token || process.env.META_ACCESS_TOKEN
        const account = values.meta_ad_account   || process.env.META_AD_ACCOUNT_ID
        if (!token) return NextResponse.json({ success: false, message: 'Access Token não informado' })
        const meRes = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${token}`).catch(() => null)
        if (!meRes) return NextResponse.json({ success: false, message: 'Não foi possível conectar à API do Meta' })
        if (!meRes.ok) {
          const err = await meRes.json()
          return NextResponse.json({ success: false, message: err?.error?.message || 'Token inválido ou expirado' })
        }
        const me = await meRes.json()
        let msg = `Meta conectado como "${me.name || me.id}"!`
        if (account) {
          const acctRes = await fetch(`https://graph.facebook.com/v20.0/${account}?fields=name,currency&access_token=${token}`).catch(() => null)
          if (acctRes?.ok) {
            const acct = await acctRes.json()
            msg += ` | Conta: ${acct.name || account} (${acct.currency || ''})`
          }
        }
        return NextResponse.json({ success: true, message: msg })
      }

      case 'openai_gpt': {
        const key = values.openai_api_key || process.env.OPENAI_API_KEY
        if (!key) return NextResponse.json({ success: false, message: 'API Key não informada' })
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` },
        }).catch(() => null)
        if (!res) return NextResponse.json({ success: false, message: 'Não foi possível conectar à OpenAI' })
        if (res.ok) {
          const data = await res.json()
          const gpt4 = (data.data || []).some((m: any) => m.id.includes('gpt-4o'))
          return NextResponse.json({ success: true, message: `OpenAI conectada! ${gpt4 ? 'GPT-4o disponível.' : 'Conta ativa.'}` })
        }
        return NextResponse.json({ success: false, message: 'API Key inválida — verifique em platform.openai.com' })
      }

      case 'google_gemini_ai': {
        const key = values.google_ai_api_key || process.env.GOOGLE_AI_API_KEY
        if (!key) return NextResponse.json({ success: false, message: 'Google AI API Key não informada' })
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`).catch(() => null)
        if (!res) return NextResponse.json({ success: false, message: 'Não foi possível conectar ao Google AI' })
        if (res.ok) {
          const data = await res.json()
          const count = (data.models || []).length
          return NextResponse.json({ success: true, message: `Google Gemini conectado! ${count} modelos disponíveis.` })
        }
        return NextResponse.json({ success: false, message: 'API Key inválida — verifique em aistudio.google.com' })
      }

      case 'groq_ai': {
        const key = values.groq_api_key || process.env.GROQ_API_KEY
        if (!key) return NextResponse.json({ success: false, message: 'API Key não informada' })
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` },
        }).catch(() => null)
        if (!res) return NextResponse.json({ success: false, message: 'Não foi possível conectar ao Groq' })
        if (res.ok) {
          const data = await res.json()
          const count = (data.data || []).length
          return NextResponse.json({ success: true, message: `Groq conectado! ${count} modelos disponíveis.` })
        }
        return NextResponse.json({ success: false, message: 'API Key inválida — verifique em console.groq.com' })
      }

      case 'xai_grok': {
        const key = values.xai_api_key || process.env.XAI_API_KEY
        if (!key) return NextResponse.json({ success: false, message: 'API Key não informada' })
        const res = await fetch('https://api.x.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` },
        }).catch(() => null)
        if (!res) return NextResponse.json({ success: false, message: 'Não foi possível conectar ao xAI' })
        return NextResponse.json(res.ok
          ? { success: true, message: 'xAI Grok conectado!' }
          : { success: false, message: 'API Key inválida' })
      }

      case 'gmail': {
        const gmailUser = values.gmail_user || process.env.GMAIL_USER
        if (!gmailUser) return NextResponse.json({ success: false, message: 'Email da conta não informado' })
        const mode = values.gmail_mode || 'app_password'
        if (mode === 'app_password') {
          const pass = values.gmail_app_password || process.env.GMAIL_APP_PASSWORD
          if (!pass) return NextResponse.json({ success: false, message: 'App Password não informado' })
        } else if (mode === 'oauth2') {
          const clientId     = values.gmail_client_id     || process.env.GMAIL_CLIENT_ID
          const refreshToken = values.gmail_refresh_token || process.env.GMAIL_REFRESH_TOKEN
          if (!clientId || !refreshToken) {
            return NextResponse.json({ success: false, message: 'Client ID e Refresh Token são obrigatórios para OAuth2' })
          }
        }
        return NextResponse.json({ success: true, message: `Gmail configurado para ${gmailUser} (${mode}). Teste de envio disponível em produção.` })
      }

      case 'google_sheets': {
        const jsonStr = values.gsheets_service_account_json || process.env.GSHEETS_SERVICE_ACCOUNT_JSON
        const sheetId = values.gsheets_spreadsheet_id || process.env.GSHEETS_SPREADSHEET_ID
        if (!jsonStr) return NextResponse.json({ success: false, message: 'Service Account JSON não informado' })
        try {
          JSON.parse(jsonStr)
          if (!sheetId) return NextResponse.json({ success: true, message: 'Service Account JSON válido! Informe o ID da planilha para concluir.' })
          return NextResponse.json({ success: true, message: `Google Sheets configurado! Planilha: ${sheetId}` })
        } catch {
          return NextResponse.json({ success: false, message: 'Service Account JSON inválido — verifique o formato' })
        }
      }

      case 'n8n': {
        const n8nUrl = values.n8n_webhook_url || process.env.N8N_WEBHOOK_URL
        if (!n8nUrl) return NextResponse.json({ success: false, message: 'Webhook URL não informada' })
        const res = await fetch(n8nUrl, { method: 'HEAD' }).catch(() => null)
        return NextResponse.json(res
          ? { success: true, message: 'n8n acessível! Webhook URL válida.' }
          : { success: false, message: 'Não foi possível acessar a URL do n8n — verifique se o serviço está ativo' })
      }

      default:
        return NextResponse.json({
          success: true,
          message: `Configuração salva para ${integration_id}. Teste real disponível após deploy.`,
        })
    }

  } catch (error: any) {
    console.error('test-connection error:', error)
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro ao testar conexão',
    }, { status: 500 })
  }
}
