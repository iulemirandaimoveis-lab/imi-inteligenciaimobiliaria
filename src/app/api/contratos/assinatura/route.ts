// src/app/api/contratos/assinatura/route.ts
// ── Assinatura Digital: Gov.br (ICP-Brasil) + ClickSign ───────
// Interface unificada — detecta provider pelo config ativo

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// ════════════════════════════════════════════════════════════
// GOV.BR — Assinatura Digital ICP-Brasil
// Documentação: https://www.gov.br/governodigital/pt-br/assinatura-eletronica
// Fluxo: OAuth 2.0 → redirect → callback → assina documento
// ════════════════════════════════════════════════════════════

class GovBrProvider {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private env: 'staging' | 'production'
  private baseUrl: string

  constructor() {
    this.clientId     = process.env.GOVBR_CLIENT_ID || ''
    this.clientSecret = process.env.GOVBR_CLIENT_SECRET || ''
    this.redirectUri  = process.env.GOVBR_REDIRECT_URI || ''
    this.env          = (process.env.GOVBR_ENVIRONMENT as any) || 'staging'
    this.baseUrl      = this.env === 'production'
      ? 'https://sso.acesso.gov.br'
      : 'https://sso.staging.acesso.gov.br'
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.redirectUri)
  }

  // Gera URL de autorização OAuth para redirecionar o signatário
  gerarUrlAutorizacao(contratoId: string, signatarioCpf?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: 'openid+profile+email+phone+govbr_empresa+govbr_confiabilidades',
      redirect_uri: this.redirectUri,
      nonce: `imi-${contratoId}-${Date.now()}`,
      state: Buffer.from(JSON.stringify({ contrato_id: contratoId })).toString('base64'),
    })

    if (signatarioCpf) {
      params.append('login_hint', signatarioCpf)
    }

    return `${this.baseUrl}/authorize?${params.toString()}`
  }

  // Troca código OAuth por token de acesso
  async trocarCodigo(code: string): Promise<{ access_token: string; sub: string }> {
    const res = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }).toString(),
    })

    if (!res.ok) throw new Error(`Gov.br token error: ${await res.text()}`)
    return res.json()
  }

  // Assina documento com o token do usuário (via API Gov.br Assinatura)
  async assinarDocumento(accessToken: string, documentoBase64: string, contratoNumero: string) {
    // API de assinatura Gov.br: https://api.assinatura.iti.br
    const apiUrl = this.env === 'production'
      ? 'https://api.assinatura.iti.br/api/v1/sign'
      : 'https://api.assinatura.staging.iti.br/api/v1/sign'

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: documentoBase64,
        name: contratoNumero,
        format: 'pades', // PDF com assinatura embutida
        policy: 'AD_RT', // Política com timestamp
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gov.br assinar error: ${err}`)
    }

    return res.json()
  }
}

// ════════════════════════════════════════════════════════════
// CLICKSIGN — Assinatura Eletrônica
// Documentação: https://developers.clicksign.com/docs
// ════════════════════════════════════════════════════════════

class ClickSignProvider {
  private token: string
  private env: 'sandbox' | 'production'
  private baseUrl: string

  constructor() {
    this.token   = process.env.CLICKSIGN_ACCESS_TOKEN || ''
    this.env     = (process.env.CLICKSIGN_ENVIRONMENT as any) || 'sandbox'
    this.baseUrl = this.env === 'production'
      ? 'https://app.clicksign.com'
      : 'https://sandbox.clicksign.com'
  }

  isConfigured(): boolean {
    return !!this.token
  }

  private async request(path: string, method: string, body?: any) {
    const url = `${this.baseUrl}${path}?access_token=${this.token}`
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`ClickSign error ${res.status}: ${err}`)
    }
    return res.json()
  }

  async criarEnvelope(
    pdfBase64: string,
    filename: string,
    numero: string,
    signatarios: Array<{
      nome: string
      email: string
      telefone?: string
      papel: string
      auth?: ('email' | 'sms' | 'whatsapp' | 'pix')[]
    }>
  ) {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 30)

    // 1. Cria documento
    const docData = await this.request('/api/v1/documents', 'POST', {
      document: {
        path: `/IMI/${filename}`,
        content_base64: `data:application/pdf;base64,${pdfBase64}`,
        deadline_at: deadline.toISOString(),
        auto_close: true,
        locale: 'pt-BR',
        sequence_enabled: false,
        remind_interval: 3,
        message: `Contrato IMI Atlantis ${numero} — revise e assine digitalmente.`,
      },
    })

    const documentKey = docData.document?.key
    if (!documentKey) throw new Error('ClickSign: documento sem key')

    // 2. Adiciona signatários
    const signerKeys: string[] = []
    for (const sig of signatarios) {
      const signerData = await this.request('/api/v1/signers', 'POST', {
        signer: {
          email: sig.email,
          phone_number: sig.telefone?.replace(/\D/g, ''),
          name: sig.nome,
          has_documentation: false,
          delivery: 'email',
          auth_methods: sig.auth || ['email', 'whatsapp'],
        },
      })

      const signerKey = signerData.signer?.key
      if (signerKey) {
        await this.request('/api/v1/lists', 'POST', {
          list: {
            document_key: documentKey,
            signer_key: signerKey,
            sign_as: sig.papel === 'testemunha' ? 'witness' : 'sign',
            refusable: true,
          },
        })
        signerKeys.push(signerKey)
      }
    }

    // 3. Notifica por email
    await this.request(`/api/v1/notify_by_email?document_key=${documentKey}`, 'PATCH')

    return {
      document_key: documentKey,
      signer_keys: signerKeys,
      clicksign_url: `${this.baseUrl}/documents/${documentKey}`,
    }
  }

  async consultarStatus(documentKey: string) {
    const data = await this.request(`/api/v1/documents/${documentKey}`, 'GET')
    const doc = data.document
    return {
      status: doc.status,
      all_signed: doc.status === 'closed',
      signers: doc.signers?.map((s: any) => ({
        name: s.name,
        email: s.email,
        signed: s.signed,
        signed_at: s.signed_at,
      })),
      pdf_signed_url: doc.downloads?.signed_file_url,
    }
  }

  async cancelar(documentKey: string) {
    return this.request(`/api/v1/documents/${documentKey}/cancel`, 'PATCH')
  }
}

// ════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL — detecta provider ativo
// ════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { action, provider: requestedProvider, ...payload } = await req.json()

    const govbr     = new GovBrProvider()
    const clicksign = new ClickSignProvider()

    // Detecta qual provider usar
    const provider = requestedProvider ||
      (clicksign.isConfigured() ? 'clicksign' :
        govbr.isConfigured() ? 'govbr' : null)

    if (!provider) {
      return NextResponse.json({
        error: 'Nenhuma plataforma de assinatura digital configurada.',
        providers_disponíveis: ['govbr', 'clicksign'],
        instrucao: 'Configure as credenciais em Backoffice → Integrações → Assinatura Digital',
      }, { status: 503 })
    }

    // ── ACTIONS GOV.BR ──────────────────────────────────────
    if (provider === 'govbr') {
      if (!govbr.isConfigured()) {
        return NextResponse.json({
          error: 'Gov.br não configurado',
          instrucao: 'Configure GOVBR_CLIENT_ID, GOVBR_CLIENT_SECRET e GOVBR_REDIRECT_URI em Integrações',
        }, { status: 503 })
      }

      switch (action) {
        case 'gerar_url_autorizacao': {
          const { contrato_id, signatario_cpf } = payload
          const url = govbr.gerarUrlAutorizacao(contrato_id, signatario_cpf)
          return NextResponse.json({ success: true, url_autorizacao: url, provider: 'govbr' })
        }

        case 'trocar_codigo': {
          const { code } = payload
          const tokens = await govbr.trocarCodigo(code)
          return NextResponse.json({ success: true, access_token: tokens.access_token, sub: tokens.sub })
        }

        case 'assinar': {
          const { access_token, documento_base64, contrato_numero } = payload
          const resultado = await govbr.assinarDocumento(access_token, documento_base64, contrato_numero)
          return NextResponse.json({ success: true, resultado, provider: 'govbr' })
        }

        default:
          return NextResponse.json({ error: `Ação '${action}' não reconhecida para Gov.br` }, { status: 400 })
      }
    }

    // ── ACTIONS CLICKSIGN ───────────────────────────────────
    if (provider === 'clicksign') {
      if (!clicksign.isConfigured()) {
        return NextResponse.json({
          error: 'ClickSign não configurado',
          instrucao: 'Configure CLICKSIGN_ACCESS_TOKEN em Integrações → Assinatura Digital',
        }, { status: 503 })
      }

      switch (action) {
        case 'criar_envelope': {
          const { pdf_base64, filename, numero, signatarios } = payload
          const resultado = await clicksign.criarEnvelope(pdf_base64, filename, numero, signatarios)
          return NextResponse.json({ success: true, ...resultado, provider: 'clicksign' })
        }

        case 'status': {
          const { document_key } = payload
          const status = await clicksign.consultarStatus(document_key)
          return NextResponse.json({ success: true, ...status, provider: 'clicksign' })
        }

        case 'cancelar': {
          const { document_key } = payload
          await clicksign.cancelar(document_key)
          return NextResponse.json({ success: true, message: 'Documento cancelado', provider: 'clicksign' })
        }

        default:
          return NextResponse.json({ error: `Ação '${action}' não reconhecida para ClickSign` }, { status: 400 })
      }
    }

    return NextResponse.json({ error: `Provider '${provider}' não suportado` }, { status: 400 })

  } catch (error: any) {
    console.error('assinatura error:', error)
    return NextResponse.json({ error: error.message || 'Erro na assinatura digital' }, { status: 500 })
  }
}

// ── Webhook Gov.br / ClickSign ─────────────────────────────
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'IMI Digital Signature Webhook',
    providers: ['govbr', 'clicksign'],
    timestamp: new Date().toISOString(),
  })
}
