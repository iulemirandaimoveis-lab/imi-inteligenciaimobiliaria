// Parte 2.3 — Abstração de provedor de assinatura eletrônica.
// Permite trocar Clicksign <-> DocuSign por env, sem alterar a aplicação.

export type SignatureProviderId = 'clicksign' | 'docusign';

/** Credenciais por provedor (vindas do backoffice/integrations ou de env). */
export interface ClicksignConfig {
  apiToken?: string;
  baseUrl?: string;
  webhookSecret?: string;
}
export interface DocusignConfig {
  baseUri?: string;
  accountId?: string;
  accessToken?: string;
  webhookSecret?: string;
}
export interface ResolvedSignatureConfig {
  /** Provedor ativo. */
  provider: SignatureProviderId;
  clicksign?: ClicksignConfig;
  docusign?: DocusignConfig;
}

export interface SignerInput {
  name: string;
  email: string;
  phone?: string;
}

export interface CreateEnvelopeInput {
  /** Nome do documento exibido ao signatário. */
  documentName: string;
  /** PDF a assinar — informe URL pública OU conteúdo base64. */
  pdfUrl?: string;
  pdfBase64?: string;
  signers: SignerInput[];
  /** Dados livres p/ rastreio (proposalId, etc.). */
  metadata?: Record<string, unknown>;
}

export interface CreateEnvelopeResult {
  envelopeId: string;
  /** Link de assinatura do primeiro signatário, quando o provedor retorna. */
  signUrl?: string;
}

/** Estado normalizado, independente de provedor. */
export type SignatureEventType =
  | 'enviada'
  | 'assinada'
  | 'recusada'
  | 'expirada'
  | 'desconhecido';

export interface NormalizedSignatureEvent {
  envelopeId: string;
  type: SignatureEventType;
  signedPdfUrl?: string;
  raw: unknown;
}

export interface WebhookRequest {
  headers: Record<string, string | undefined>;
  rawBody: string;
}

export interface SignatureProvider {
  readonly id: SignatureProviderId;
  /** Cria o envelope/documento e dispara a solicitação de assinatura. */
  createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult>;
  /** Consulta o estado atual do envelope. */
  getStatus(envelopeId: string): Promise<{ type: SignatureEventType; signedPdfUrl?: string }>;
  /** Cancela o envelope (best-effort). */
  cancel(envelopeId: string): Promise<void>;
  /** Valida a autenticidade do webhook (assinatura HMAC / secret). */
  verifyWebhook(req: WebhookRequest): boolean;
  /** Converte o payload do webhook no evento normalizado. */
  parseWebhook(payload: unknown): NormalizedSignatureEvent | null;
}

export class SignatureNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`SIGNATURE_NOT_CONFIGURED: credenciais ausentes para "${provider}".`);
    this.name = 'SignatureNotConfiguredError';
  }
}
