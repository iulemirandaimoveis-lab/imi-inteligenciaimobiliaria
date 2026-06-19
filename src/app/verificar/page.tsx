import { Metadata } from 'next'
import { AVALIADOR } from '@/config/avaliador'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Verificação de Laudo — IMI',
  description: 'Validação de autenticidade de laudos de avaliação imobiliária emitidos pela IMI.',
  robots: { index: false },
}

interface LaudoData {
  numero_laudo: string
  qr_hash: string
  emitido_em: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
  tipo_imovel: string
  solicitante: string | null
  valor_estimado: number | null
  finalidade: string | null
  metodologia: string | null
  status: string
  grau_fundamentacao: string | null
  tipo_laudo: string | null
}

const TIPO_LAUDO_LABELS: Record<string, string> = {
  ptam: 'PTAM – Parecer Técnico de Avaliação Mercadológica',
  laudo_tecnico: 'Laudo Técnico de Avaliação',
  laudo_judicial: 'Laudo de Avaliação Judicial',
  resumo_executivo: 'Resumo Executivo de Avaliação',
  relatorio_comercial: 'Relatório Comercial de Avaliação',
}

async function fetchLaudo(
  hash: string | null,
  numero: string | null
): Promise<{ valid: boolean; laudo?: LaudoData; error?: string }> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'
  const param = hash ? `hash=${encodeURIComponent(hash)}` : `laudo=${encodeURIComponent(numero!)}`
  try {
    const res = await fetch(`${siteUrl}/api/verificar?${param}`, { cache: 'no-store' })
    return res.json()
  } catch {
    return { valid: false, error: 'Erro ao verificar laudo' }
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0,
  }).format(v)
}

export default async function VerificarPage({
  searchParams,
}: {
  searchParams: { hash?: string; laudo?: string }
}) {
  const hash = searchParams.hash || null
  const numero = searchParams.laudo || null
  const hasQuery = !!(hash || numero)
  const result = hasQuery ? await fetchLaudo(hash, numero) : null

  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050B14',
      color: '#E8E4DC',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 40, paddingBottom: 20,
          borderBottom: '1px solid rgba(200,164,74,0.25)',
        }}>
          <div>
            <div style={{
              fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700,
              color: '#C8A44A', letterSpacing: 4,
            }}>IMI</div>
            <div style={{ fontSize: 10, color: '#8E99AB', marginTop: 4 }}>
              Inteligência Imobiliária
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#8E99AB', lineHeight: 1.7 }}>
            Verificação de Autenticidade<br />
            <span style={{ color: '#C8A44A' }}>Laudo de Avaliação</span>
          </div>
        </div>

        {/* ── No query ── */}
        {!hasQuery && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#E8E4DC', marginBottom: 8 }}>
              Verificação de Laudo IMI
            </div>
            <div style={{ fontSize: 13, color: '#8E99AB', maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
              Escaneie o QR Code presente no laudo ou informe o número do laudo
              (ex.: <strong style={{ color: '#C8A44A' }}>IMI-2026-000001</strong>)
              para validar sua autenticidade.
            </div>
          </div>
        )}

        {/* ── Invalid ── */}
        {hasQuery && result && !result.valid && (
          <>
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              borderLeft: '4px solid #EF4444', borderRadius: 8, padding: '20px 24px',
              marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>❌</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>
                  LAUDO NÃO ENCONTRADO
                </div>
                <div style={{ fontSize: 12, color: '#8E99AB' }}>
                  O código informado não corresponde a nenhum laudo no sistema IMI.
                  Verifique se digitou corretamente ou escaneie novamente o QR Code.
                </div>
              </div>
            </div>
            <div style={{
              background: '#0A1624', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: 20,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8E99AB', marginBottom: 10 }}>
                Código consultado
              </div>
              <div style={{
                background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.2)',
                borderRadius: 6, padding: '12px 14px',
                fontFamily: 'monospace', fontSize: 12, color: '#C8A44A', wordBreak: 'break-all',
              }}>
                {hash || numero}
              </div>
            </div>
          </>
        )}

        {/* ── Valid ── */}
        {hasQuery && result?.valid && result.laudo && (() => {
          const l = result.laudo
          return (
            <>
              {/* Status banner */}
              <div style={{
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)',
                borderLeft: '4px solid #10B981', borderRadius: 8, padding: '20px 24px',
                marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>✅</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>
                    LAUDO AUTÊNTICO E VERIFICADO
                  </div>
                  <div style={{ fontSize: 12, color: '#8E99AB' }}>
                    Este laudo foi localizado no sistema IMI e seus dados foram confirmados em {now}.
                  </div>
                </div>
              </div>

              {/* Card: Identificação */}
              <div style={{
                background: '#0A1624', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: 24, marginBottom: 14,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8E99AB', marginBottom: 16 }}>
                  Identificação do Laudo
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Número do Laudo</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#C8A44A', letterSpacing: 2, fontFamily: 'monospace' }}>
                    {l.numero_laudo}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Tipo de Documento</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {TIPO_LAUDO_LABELS[l.tipo_laudo ?? ''] || 'Laudo de Avaliação'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Data de Emissão</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{fmtDate(l.emitido_em)}</div>
                  </div>
                  {l.finalidade && (
                    <div>
                      <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Finalidade</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{l.finalidade}</div>
                    </div>
                  )}
                  {l.grau_fundamentacao && (
                    <div>
                      <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Grau NBR 14653</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Grau {l.grau_fundamentacao}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card: Imóvel */}
              <div style={{
                background: '#0A1624', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: 24, marginBottom: 14,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8E99AB', marginBottom: 16 }}>
                  Dados do Imóvel Avaliado
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {l.tipo_imovel && (
                    <div>
                      <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Tipo</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{l.tipo_imovel}</div>
                    </div>
                  )}
                  {l.solicitante && (
                    <div>
                      <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Solicitante</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{l.solicitante}</div>
                    </div>
                  )}
                  {l.endereco && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Endereço</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {[l.endereco, l.bairro, l.cidade, l.estado].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  )}
                  {l.valor_estimado != null && l.valor_estimado > 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Valor de Mercado</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>
                        {fmtBRL(Number(l.valor_estimado))}
                      </div>
                    </div>
                  )}
                  {l.metodologia && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Metodologia</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{l.metodologia}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card: Avaliador */}
              <div style={{
                background: '#0A1624', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: 24, marginBottom: 14,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8E99AB', marginBottom: 16 }}>
                  Avaliador Responsável
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Nome</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{AVALIADOR.nome}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>CRECI</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{AVALIADOR.creci}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>CNAI</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{AVALIADOR.cnai}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Empresa</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{AVALIADOR.empresa}</div>
                  </div>
                </div>
              </div>

              {/* Card: Hash */}
              <div style={{
                background: '#0A1624', border: '1px solid rgba(200,164,74,0.2)',
                borderRadius: 8, padding: 24, marginBottom: 14,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8E99AB', marginBottom: 16 }}>
                  Assinatura Digital & Hash de Verificação
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Hash SHA-256 (32 chars)
                  </div>
                  <div style={{
                    background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.2)',
                    borderRadius: 6, padding: '12px 14px',
                    fontFamily: 'monospace', fontSize: 12, color: '#C8A44A', wordBreak: 'break-all', lineHeight: 1.6,
                  }}>
                    {l.qr_hash}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: '#8E99AB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    URL de Verificação
                  </div>
                  <div style={{
                    background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.2)',
                    borderRadius: 6, padding: '12px 14px',
                    fontFamily: 'monospace', fontSize: 11, color: '#C8A44A', wordBreak: 'break-all',
                  }}>
                    https://www.iulemirandaimoveis.com.br/verificar?hash={l.qr_hash}
                  </div>
                </div>
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14,
                  fontSize: 11, color: '#8E99AB', lineHeight: 1.7,
                }}>
                  <span style={{
                    display: 'inline-block', background: 'rgba(16,185,129,0.12)',
                    color: '#10B981', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 99, padding: '2px 10px', fontSize: 10, fontWeight: 700, marginRight: 8,
                  }}>✓ VÁLIDO</span>
                  O hash acima foi calculado no momento da emissão do laudo e não pode ser
                  alterado retroativamente. Qualquer modificação no documento original tornaria este código inválido.
                </div>
              </div>
            </>
          )
        })()}

        {/* ── Footer ── */}
        <div style={{
          marginTop: 40, paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.8 }}>
            <strong style={{ color: '#C8A44A' }}>IMI — Inteligência Imobiliária</strong><br />
            {AVALIADOR.nome} · CRECI {AVALIADOR.creci} · CNAI {AVALIADOR.cnai}<br />
            {AVALIADOR.empresa} · {AVALIADOR.site}
          </p>
          <p style={{ fontSize: 10, color: '#3A4456', marginTop: 6 }}>
            Laudos emitidos em conformidade com NBR 14653-1, NBR 14653-2 e Resolução COFECI 1.066/2007
          </p>
        </div>
      </div>
    </div>
  )
}
