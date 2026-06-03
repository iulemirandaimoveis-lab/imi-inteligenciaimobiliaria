import crypto from 'crypto';
import {
  SignatureProvider, CreateEnvelopeInput, CreateEnvelopeResult,
  SignatureEventType, NormalizedSignatureEvent, WebhookRequest,
  SignatureNotConfiguredError, ClicksignConfig,
} from './types';

/**
 * Adaptador Clicksign (API v1).
 * Env: CLICKSIGN_API_TOKEN, CLICKSIGN_BASE_URL (default produção),
 *      CLICKSIGN_WEBHOOK_SECRET (HMAC-SHA256 do header `Content-Hmac`).
 *
 * Fluxo: cria documento (PDF base64) → cria/seleciona signatário →
 * vincula signatário ao documento → o Clicksign envia o e-mail de assinatura.
 */
export class ClicksignProvider implements SignatureProvider {
  readonly id = 'clicksign' as const;
  private token?: string;
  private base: string;
  private webhookSecret: string;

  // Config explícita (backoffice) tem prioridade; cai para env.
  constructor(cfg: ClicksignConfig = {}) {
    this.token = cfg.apiToken || process.env.CLICKSIGN_API_TOKEN;
    this.base = cfg.baseUrl || process.env.CLICKSIGN_BASE_URL || 'https://app.clicksign.com';
    this.webhookSecret = cfg.webhookSecret || process.env.CLICKSIGN_WEBHOOK_SECRET || '';
  }

  private ensure() {
    if (!this.token) throw new SignatureNotConfiguredError('clicksign');
  }

  private async api(path: string, init: RequestInit) {
    const url = `${this.base}${path}${path.includes('?') ? '&' : '?'}access_token=${this.token}`;
    const res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers || {}) },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`CLICKSIGN_API_ERROR ${res.status}: ${body.slice(0, 300)}`);
    }
    return res.json();
  }

  async createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult> {
    this.ensure();
    if (!input.pdfBase64 && !input.pdfUrl) throw new Error('PDF (base64 ou url) é obrigatório.');

    const contentBase64 = input.pdfBase64 ?? (await fetchPdfAsBase64(input.pdfUrl!));

    // 1. cria documento
    const doc = await this.api('/api/v1/documents', {
      method: 'POST',
      body: JSON.stringify({
        document: {
          path: `/${input.documentName}.pdf`,
          content_base64: `data:application/pdf;base64,${contentBase64}`,
          deadline_at: undefined,
          auto_close: true,
        },
      }),
    });
    const documentKey: string = doc.document.key;

    // 2. cria signatários e vincula
    let firstSignUrl: string | undefined;
    for (const s of input.signers) {
      const signer = await this.api('/api/v1/signers', {
        method: 'POST',
        body: JSON.stringify({
          signer: { email: s.email, name: s.name, phone_number: s.phone, auths: ['email'], delivery: 'email' },
        }),
      });
      const list = await this.api('/api/v1/lists', {
        method: 'POST',
        body: JSON.stringify({
          list: { document_key: documentKey, signer_key: signer.signer.key, sign_as: 'sign' },
        }),
      });
      if (!firstSignUrl && list?.list?.request_signature_key) {
        firstSignUrl = `${this.base}/sign/${list.list.request_signature_key}`;
      }
    }

    return { envelopeId: documentKey, signUrl: firstSignUrl };
  }

  async getStatus(envelopeId: string): Promise<{ type: SignatureEventType; signedPdfUrl?: string }> {
    this.ensure();
    const doc = await this.api(`/api/v1/documents/${envelopeId}`, { method: 'GET' });
    const status: string = doc?.document?.status ?? '';
    return { type: mapClicksignStatus(status), signedPdfUrl: doc?.document?.downloads?.signed_file_url };
  }

  async cancel(envelopeId: string): Promise<void> {
    this.ensure();
    await this.api(`/api/v1/documents/${envelopeId}/cancel`, { method: 'PATCH', body: '{}' }).catch(() => {});
  }

  verifyWebhook(req: WebhookRequest): boolean {
    // Fail-closed: sem segredo HMAC configurado, NÃO confiamos no webhook.
    if (!this.webhookSecret) return false;
    const sig = req.headers['content-hmac'] || req.headers['Content-Hmac'];
    if (!sig) return false;
    const digest = 'sha256=' + crypto.createHmac('sha256', this.webhookSecret).update(req.rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
    } catch {
      return false;
    }
  }

  parseWebhook(payload: unknown): NormalizedSignatureEvent | null {
    const p = payload as { event?: { name?: string; data?: { document?: { key?: string; downloads?: { signed_file_url?: string } } } } };
    const name = p?.event?.name;
    const key = p?.event?.data?.document?.key;
    if (!name || !key) return null;
    const map: Record<string, SignatureEventType> = {
      add_signer: 'enviada',
      sign: 'assinada',
      auto_close: 'assinada',
      document_closed: 'assinada',
      refusal: 'recusada',
      deadline: 'expirada',
      cancel: 'recusada',
    };
    return {
      envelopeId: key,
      type: map[name] ?? 'desconhecido',
      signedPdfUrl: p?.event?.data?.document?.downloads?.signed_file_url,
      raw: payload,
    };
  }
}

function mapClicksignStatus(status: string): SignatureEventType {
  switch (status) {
    case 'closed': return 'assinada';
    case 'running': return 'enviada';
    case 'canceled': return 'recusada';
    default: return 'desconhecido';
  }
}

async function fetchPdfAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar PDF: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString('base64');
}
