'use client'

import Link from 'next/link'

export default function BackofficeNotFound() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 64px)', padding: 40,
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 480,
        background: 'var(--n800, #0B1928)',
        border: '1px solid var(--bdr, rgba(255,255,255,0.06))',
        borderRadius: 20, padding: '48px 40px',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, var(--n600, #142840), var(--n700, #0F2035))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', border: '1px solid var(--bdr)',
        }}>
          <span style={{ fontSize: 28 }}>&#128679;</span>
        </div>

        <div style={{
          fontFamily: 'var(--fu, Outfit, sans-serif)',
          fontSize: 10, fontWeight: 700, letterSpacing: 3,
          textTransform: 'uppercase', color: 'var(--gold, #C8A44A)',
          marginBottom: 12,
        }}>
          EM BREVE
        </div>

        <h2 style={{
          fontFamily: 'var(--fd, Playfair Display, serif)',
          fontSize: 24, fontWeight: 600,
          color: 'var(--t1, #E8E4DC)', marginBottom: 12,
          letterSpacing: -0.5,
        }}>
          Pagina em desenvolvimento
        </h2>

        <p style={{
          fontFamily: 'var(--fu, Outfit, sans-serif)',
          fontSize: 14, color: 'var(--t2, #94A0B2)',
          lineHeight: 1.6, marginBottom: 32,
        }}>
          Esta funcionalidade esta sendo preparada e estara disponivel em breve.
          Acompanhe as atualizacoes pelo painel.
        </p>

        <Link href="/backoffice/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px',
          background: 'var(--n600, #142840)',
          color: 'var(--t1, #E8E4DC)',
          border: '1px solid var(--bdr)',
          borderBottom: '2px solid var(--gold, #C8A44A)',
          borderRadius: 10, fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--fu, Outfit, sans-serif)',
          letterSpacing: 0.5, textTransform: 'uppercase',
          textDecoration: 'none', transition: 'all 0.2s',
        }}>
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
