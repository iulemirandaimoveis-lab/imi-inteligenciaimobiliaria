import {
  SignatureProvider, CreateEnvelopeInput, CreateEnvelopeResult,
  SignatureEventType, NormalizedSignatureEvent, WebhookRequest,
  SignatureNotConfiguredError, DocusignConfig,
} from './types';

/**
 * Adaptador DocuSign (eSignature REST API v2.1).
 * Env: DOCUSIGN_BASE_URI (ex: https://demo.docusign.net/restapi),
 *      DOCUSIGN_ACCOUNT_ID, DOCUSIGN_ACCESS_TOKEN (OAuth JWT),
 *      DOCUSIGN_WEBHOOK_SECRET (HMAC do Connect, header X-DocuSign-Signature-1).
 */
export class DocusignProvider implements SignatureProvider {
  readonly id = 'docusign' as const;
  private baseUri?: string;
  private accountId?: string;
  private token?: string;
  private webhookSecret: string;

  constructor(cfg: DocusignConfig = {}) {
    this.baseUri = cfg.baseUri || process.env.DOCUSIGN_BASE_URI;
    this.accountId = cfg.accountId || process.env.DOCUSIGN_ACCOUNT_ID;
    this.token = cfg.accessToken || process.env.DOCUSIGN_ACCESS_TOKEN;
    this.webhookSecret = cfg.webhookSecret || process.env.DOCUSIGN_WEBHOOK_SECRET || '';
  }

  private ensure() {
    if (!this.baseUri || !this.accountId || !this.token) throw new SignatureNotConfiguredError('docusign');
  }

  private async api(path: string, init: RequestInit) {
    const res = await fetch(`${this.baseUri}/v2.1/accounts/${this.accountId}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`DOCUSIGN_API_ERROR ${res.status}: ${body.slice(0, 300)}`);
    }
    return res.json();
  }

  async createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult> {
    this.ensure();
    if (!input.pdfBase64 && !input.pdfUrl) throw new Error('PDF (base64 ou url) é obrigatório.');
    const documentBase64 = input.pdfBase64 ?? (await fetchPdfAsBase64(input.pdfUrl!));

    const signers = input.signers.map((s, i) => ({
      email: s.email,
      name: s.name,
      recipientId: String(i + 1),
      routingOrder: String(i + 1),
      // aba de assinatura padrão (âncora textual "/sn1/")
      tabs: { signHereTabs: [{ anchorString: '/sn1/', anchorUnits: 'pixels', anchorXOffset: '20', anchorYOffset: '10' }] },
    }));

    const env = await this.api('/envelopes', {
      method: 'POST',
      body: JSON.stringify({
        emailSubject: input.documentName,
        status: 'sent',
        documents: [{
          documentBase64,
          name: `${input.documentName}.pdf`,
          fileExtension: 'pdf',
          documentId: '1',
        }],
        recipients: { signers },
      }),
    });

    return { envelopeId: env.envelopeId };
  }

  async getStatus(envelopeId: string): Promise<{ type: SignatureEventType; signedPdfUrl?: string }> {
    this.ensure();
    const env = await this.api(`/envelopes/${envelopeId}`, { method: 'GET' });
    return { type: mapDocusignStatus(env?.status ?? '') };
  }

  async cancel(envelopeId: string): Promise<void> {
    this.ensure();
    await this.api(`/envelopes/${envelopeId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'voided', voidedReason: 'Cancelado pela imobiliária' }),
    }).catch(() => {});
  }

  verifyWebhook(req: WebhookRequest): boolean {
    if (!this.webhookSecret) return true;
    // DocuSign Connect HMAC: base64(HMAC-SHA256(secret, rawBody)) em X-DocuSign-Signature-1
    const sig = req.headers['x-docusign-signature-1'] || req.headers['X-DocuSign-Signature-1'];
    if (!sig) return false;
    const crypto = require('crypto') as typeof import('crypto');
    const digest = crypto.createHmac('sha256', this.webhookSecret).update(req.rawBody, 'utf8').digest('base64');
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
    } catch {
      return false;
    }
  }

  parseWebhook(payload: unknown): NormalizedSignatureEvent | null {
    // Suporta o formato JSON do DocuSign Connect (envelope-level).
    const p = payload as { data?: { envelopeId?: string; envelopeSummary?: { status?: string } }; status?: string; envelopeId?: string };
    const envelopeId = p?.data?.envelopeId ?? p?.envelopeId;
    const status = p?.data?.envelopeSummary?.status ?? p?.status;
    if (!envelopeId) return null;
    return { envelopeId, type: mapDocusignStatus(status ?? ''), raw: payload };
  }
}

function mapDocusignStatus(status: string): SignatureEventType {
  switch (status?.toLowerCase()) {
    case 'completed': return 'assinada';
    case 'sent':
    case 'delivered': return 'enviada';
    case 'declined': return 'recusada';
    case 'voided': return 'recusada';
    case 'expired': return 'expirada';
    default: return 'desconhecido';
  }
}

async function fetchPdfAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar PDF: ${res.status}`);
  return Buffer.from(await res.arrayBuffer()).toString('base64');
}
