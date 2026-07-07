import 'server-only'

/**
 * Jitsi Meet — provedor de vídeo chamada zero-config para o CTA "Vídeo chamada
 * com o corretor". Diferente do Daily.co, o Jitsi NÃO precisa de chave de API:
 * a sala é só uma URL com um nome aleatório e longo (difícil de adivinhar). Por
 * isso é o provedor padrão que faz a vídeo chamada funcionar de imediato, mesmo
 * sem nenhuma integração paga configurada.
 *
 * Env (opcional):
 *   JITSI_BASE_URL — instância Jitsi a usar (default: https://meet.jit.si).
 *                    Aponte para uma instância self-hosted/JaaS se quiser evitar
 *                    o servidor público e ter controle total.
 */

export interface JitsiRoom {
  url: string
  name: string
}

function readBaseUrl(): string {
  const raw = process.env.JITSI_BASE_URL || 'https://meet.jit.si'
  return raw.replace(/\/+$/, '')
}

/**
 * Gera uma sala Jitsi efêmera. O nome é aleatório e longo para que a sala não
 * seja adivinhável — quem tem o link entra, sem cadastro. Nunca lança nem faz
 * requisição de rede: é só a composição da URL.
 */
export function createJitsiRoom(opts: { namePrefix?: string } = {}): JitsiRoom {
  const prefix = (opts.namePrefix || 'IMI').replace(/[^a-zA-Z0-9]/g, '') || 'IMI'
  const rand = crypto.randomUUID().replace(/-/g, '')
  const name = `${prefix}${rand}`
  return { url: `${readBaseUrl()}/${name}`, name }
}
