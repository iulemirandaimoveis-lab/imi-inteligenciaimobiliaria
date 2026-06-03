import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSignatureProvider } from './index';
import {
  ResolvedSignatureConfig, SignatureProvider, SignatureProviderId,
  ClicksignConfig, DocusignConfig,
} from './types';

/** key_name padrão de cada provedor de assinatura na tabela `integrations`. */
export const SIGNATURE_KEYS: Record<SignatureProviderId, string> = {
  clicksign: 'clicksign_signature',
  docusign: 'docusign_signature',
};

interface IntegrationRow {
  key_name: string;
  provider: string;
  category: string;
  secret_value: string | null;
  is_active: boolean | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Carrega a configuração de assinatura do backoffice (tabela `integrations`,
 * category='signature') com fallback para variáveis de ambiente.
 * Lê via service_role (server-only) — segredos nunca trafegam pelo cliente.
 */
export async function loadSignatureConfig(
  forProvider?: SignatureProviderId,
): Promise<ResolvedSignatureConfig> {
  let rows: IntegrationRow[] = [];
  try {
    const { data } = await supabaseAdmin
      .from('integrations')
      .select('key_name, provider, category, secret_value, is_active, metadata')
      .eq('category', 'signature');
    rows = (data as IntegrationRow[] | null) ?? [];
  } catch {
    rows = [];
  }

  const ck = rows.find(r => r.provider === 'clicksign');
  const ds = rows.find(r => r.provider === 'docusign');

  const clicksign: ClicksignConfig | undefined = ck
    ? {
        apiToken: ck.secret_value ?? undefined,
        baseUrl: (ck.metadata?.baseUrl as string) ?? undefined,
        webhookSecret: (ck.metadata?.webhookSecret as string) ?? undefined,
      }
    : undefined;

  const docusign: DocusignConfig | undefined = ds
    ? {
        accessToken: ds.secret_value ?? undefined,
        baseUri: (ds.metadata?.baseUri as string) ?? undefined,
        accountId: (ds.metadata?.accountId as string) ?? undefined,
        webhookSecret: (ds.metadata?.webhookSecret as string) ?? undefined,
      }
    : undefined;

  // Provedor ativo: explícito > marcado is_active no banco > env > clicksign
  const activeRow = rows.find(r => r.is_active);
  const provider: SignatureProviderId =
    forProvider ||
    (activeRow?.provider as SignatureProviderId) ||
    (process.env.SIGNATURE_PROVIDER as SignatureProviderId) ||
    'clicksign';

  return { provider, clicksign, docusign };
}

/** Atalho: carrega config + instancia o provedor pronto para uso. */
export async function resolveSignatureProvider(
  forProvider?: SignatureProviderId,
): Promise<SignatureProvider> {
  return getSignatureProvider(await loadSignatureConfig(forProvider));
}
