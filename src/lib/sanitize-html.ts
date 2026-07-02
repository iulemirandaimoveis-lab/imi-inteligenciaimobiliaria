import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizador único de HTML de origem não-confiável (banco/usuário) — T-07/F-06.
 *
 * Substitui os sanitizadores caseiros por regex (bypassáveis: `<svg><script>`,
 * tags malformadas, entidades HTML em `javascript:`, etc.). Usa DOMPurify
 * (isomorphic — funciona no server e no client), que remove scripts, handlers
 * `on*`, `javascript:`/`data:text/html` e demais vetores, preservando HTML de
 * formatação (títulos, listas, tabelas, código, citações).
 *
 * Regra do projeto: TODO `dangerouslySetInnerHTML` com HTML de banco/usuário
 * deve passar por aqui. JSON-LD estático (schema SEO) é exceção — não é HTML.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  // Perfil HTML (sem SVG/MathML). DOMPurify já remove <script>, handlers on*,
  // javascript:/data:text/html. Mantemos `style` para não regredir a formatação
  // existente do conteúdo (o valor do style é higienizado pelo próprio DOMPurify).
  return DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })
}

export default sanitizeHtml
