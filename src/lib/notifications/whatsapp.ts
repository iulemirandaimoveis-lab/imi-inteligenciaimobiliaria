import 'server-only'

/**
 * OpenWA WhatsApp gateway client.
 *
 * OpenWA (github.com/rmyndharis/OpenWA) é um gateway self-hosted (Docker/NestJS)
 * que envia mensagens via automação do WhatsApp Web. ⚠️ Usa método NÃO oficial —
 * o número pode ser banido pela Meta. Configurável e best-effort: se as variáveis
 * de ambiente não estiverem definidas, vira no-op (nunca quebra o fluxo da app).
 *
 * Env:
 *   OPENWA_BASE_URL   — ex: https://wa.seudominio.com  (porta padrão 2785)
 *   OPENWA_API_KEY    — chave da API (header X-API-Key)
 *   OPENWA_SESSION    — id da sessão/instância (default: 'default')
 *   OPENWA_DEFAULT_DDI— DDI padrão para números sem código de país (default: '55')
 */

export interface WhatsAppResult {
  ok: boolean
  skipped?: boolean
  error?: string
}

/**
 * Normaliza um telefone para o formato chatId do WhatsApp (`<digits>@c.us`).
 * - Remove tudo que não é dígito.
 * - Se não tiver código de país (≤ 11 dígitos, padrão BR), prefixa o DDI.
 * Retorna null quando não há dígitos suficientes para um número válido.
 */
export function toChatId(phone: string | null | undefined, defaultDdi = '55'): string | null {
  if (!phone) return null
  let digits = String(phone).replace(/\D/g, '')
  if (digits.length < 8) return null
  // Remove zeros à esquerda (ex.: discagem nacional).
  digits = digits.replace(/^0+/, '')
  // Número nacional BR (10–11 dígitos) sem DDI → prefixa o DDI padrão.
  if (digits.length <= 11) digits = `${defaultDdi}${digits}`
  return `${digits}@c.us`
}

interface Config {
  baseUrl: string
  apiKey: string
  session: string
  defaultDdi: string
}

function readConfig(): Config | null {
  const baseUrl = process.env.OPENWA_BASE_URL
  const apiKey = process.env.OPENWA_API_KEY
  if (!baseUrl || !apiKey) return null
  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    apiKey,
    session: process.env.OPENWA_SESSION || 'default',
    defaultDdi: process.env.OPENWA_DEFAULT_DDI || '55',
  }
}

/**
 * Envia uma mensagem de texto via OpenWA. Best-effort: nunca lança.
 */
export async function sendWhatsAppText(phone: string | null | undefined, text: string): Promise<WhatsAppResult> {
  const cfg = readConfig()
  if (!cfg) return { ok: false, skipped: true, error: 'OpenWA não configurado.' }

  const chatId = toChatId(phone, cfg.defaultDdi)
  if (!chatId) return { ok: false, skipped: true, error: 'Telefone inválido/ausente.' }

  try {
    const res = await fetch(
      `${cfg.baseUrl}/api/sessions/${encodeURIComponent(cfg.session)}/messages/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.apiKey },
        body: JSON.stringify({ chatId, text }),
        // Não deixa o request da app pendurado se o gateway estiver lento/fora.
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `OpenWA ${res.status}: ${body.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao enviar WhatsApp.' }
  }
}

/** Dispara várias mensagens em paralelo, best-effort. */
export async function sendWhatsAppBatch(
  messages: Array<{ phone: string | null | undefined; text: string }>
): Promise<WhatsAppResult[]> {
  return Promise.all(messages.map((m) => sendWhatsAppText(m.phone, m.text)))
}

/**
 * Envia um arquivo (por URL) via OpenWA — usado para anexar os documentos da
 * proposta na notificação ao corretor. Best-effort: nunca lança. Mesmo que o
 * gateway não suporte send-file, o fluxo segue (os links vão também no texto).
 */
export async function sendWhatsAppFile(
  phone: string | null | undefined,
  file: { url: string; filename?: string; caption?: string },
): Promise<WhatsAppResult> {
  const cfg = readConfig()
  if (!cfg) return { ok: false, skipped: true, error: 'OpenWA não configurado.' }
  if (!file.url) return { ok: false, skipped: true, error: 'URL do arquivo ausente.' }

  const chatId = toChatId(phone, cfg.defaultDdi)
  if (!chatId) return { ok: false, skipped: true, error: 'Telefone inválido/ausente.' }

  try {
    const res = await fetch(
      `${cfg.baseUrl}/api/sessions/${encodeURIComponent(cfg.session)}/messages/send-file`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.apiKey },
        body: JSON.stringify({
          chatId,
          file: { url: file.url, filename: file.filename },
          caption: file.caption,
        }),
        signal: AbortSignal.timeout(12000),
      }
    )
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `OpenWA ${res.status}: ${body.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao enviar arquivo.' }
  }
}

/** True quando o gateway está configurado (para gating de UI/health). */
export function isWhatsAppConfigured(): boolean {
  return readConfig() !== null
}
