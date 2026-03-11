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

      case 'meta_ads': {
        const token   = values.meta_access_token || process.env.META_ACCESS_TOKEN
        const adAccId = values.meta_ad_account || process.env.META_AD_ACCOUNT_ID
        if (!token) return NextResponse.json({ success: false, message: 'Access Token não informado' })
        // Test by calling Meta Graph API /me endpoint
        const res = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`,
        ).catch(() => null)
        if (!res) return NextResponse.json({ success: false, message: 'Não foi possível conectar ao Meta Graph API' })
        if (res.ok) {
          const d = await res.json()
          const label = adAccId ? ` · Conta: ${adAccId}` : ''
          return NextResponse.json({ success: true, message: `Meta Ads conectado! Conta: ${d.name || d.id}${label}` })
        }
        const err = await res.json().catch(() => ({}))
        return NextResponse.json({ success: false, message: err?.error?.message || 'Access Token inválido ou expirado' })
      }

      case 'google_analytics': {
        // GA4 — validate by checking if measurement ID / property ID looks correct
        const propertyId = values.ga4_measurement_id || values.ga_property_id || process.env.GA_PROPERTY_ID
        if (!propertyId) return NextResponse.json({ success: false, message: 'Property ID não informado' })
        const clean = String(propertyId).replace(/\D/g, '')
        // Also accept G-XXXXXXXXXX format
        const isGFormat = String(propertyId).toUpperCase().startsWith('G-')
        if (!isGFormat && (!clean || clean.length < 6)) return NextResponse.json({ success: false, message: 'Measurement ID inválido (formato esperado: G-XXXXXXXXXX)' })
        return NextResponse.json({ success: true, message: `GA4 configurado com Measurement ID ${propertyId}. Confirme no Google Analytics → Administração → Fluxos de dados.` })
      }

      case 'abacatepay': {
        const key = values.abacatepay_api_key || process.env.ABACATEPAY_API_KEY
        if (!key) return NextResponse.json({ success: false, message: 'API Key não informada' })
        const res = await fetch('https://api.abacatepay.com/v1/billing/list', {
          headers: { 'Authorization': `Bearer ${key}` },
        }).catch(() => null)
        if (!res) return NextResponse.json({ success: false, message: 'Não foi possível conectar ao AbacatePay' })
        return NextResponse.json(res.ok || res.status === 404
          ? { success: true, message: 'AbacatePay conectado com sucesso!' }
          : { success: false, message: 'API Key inválida' })
      }

      case 'supabase_storage': {
        return NextResponse.json({
          success: true,
          message: 'Supabase Storage é o armazenamento nativo do projeto — sempre ativo.',
        })
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
