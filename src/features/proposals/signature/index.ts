import { SignatureProvider, SignatureProviderId, ResolvedSignatureConfig } from './types';
import { ClicksignProvider } from './clicksign';
import { DocusignProvider } from './docusign';

export * from './types';
export { resolveSignatureProvider, loadSignatureConfig } from './config';

/**
 * Fábrica pura (sem IO) do provedor de assinatura a partir de uma config já
 * resolvida. Use `resolveSignatureProvider()` (config.ts) nas rotas — ela
 * carrega as credenciais do backoffice (tabela integrations) com fallback p/ env.
 */
export function getSignatureProvider(cfg: ResolvedSignatureConfig): SignatureProvider {
  const id: SignatureProviderId = cfg.provider || 'clicksign';
  if (id === 'docusign') return new DocusignProvider(cfg.docusign ?? {});
  return new ClicksignProvider(cfg.clicksign ?? {});
}
