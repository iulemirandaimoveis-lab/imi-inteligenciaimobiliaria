'use client'

import { useState } from 'react'

interface Props {
  userId: string
  userName: string
}

export function ResetPasswordButton({ userId, userName }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ temp_password?: string; error?: string } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleReset() {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setResult({ error: data.error })
      } else {
        setResult({ temp_password: data.temp_password })
      }
    } catch {
      setResult({ error: 'Erro de conexao' })
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <div>
      {!showConfirm && !result?.temp_password && (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          style={{
            padding: '8px 16px', background: 'transparent',
            color: 'var(--t2, #94A0B2)',
            border: '1px solid var(--bdr, rgba(255,255,255,0.06))',
            borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: 'var(--fu, Outfit)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
          }}
        >
          Resetar Senha
        </button>
      )}

      {showConfirm && (
        <div style={{ padding: 16, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.20)', borderRadius: 12, marginTop: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 12 }}>
            Resetar a senha de <strong>{userName}</strong>?
          </p>
          <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 16, lineHeight: 1.5 }}>
            Uma senha temporaria sera gerada. Voce precisara comunicar a senha ao corretor. No proximo login, ele sera obrigado a definir uma nova senha.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleReset} disabled={loading} style={{
              padding: '8px 16px', background: 'var(--n600, #142840)', color: 'var(--t1)',
              border: '1px solid var(--bdr)', borderBottom: '2px solid var(--gold, #C8A44A)',
              borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'var(--fu)',
              cursor: 'pointer', letterSpacing: 0.5, textTransform: 'uppercase', opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Resetando...' : 'Confirmar Reset'}
            </button>
            <button onClick={() => setShowConfirm(false)} style={{
              padding: '8px 16px', background: 'transparent', color: 'var(--t3)',
              border: '1px solid var(--bdr)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--fu)', cursor: 'pointer',
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {result?.temp_password && (
        <div style={{ padding: 16, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.20)', borderRadius: 12, marginTop: 8 }}>
          <p style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600, marginBottom: 8 }}>Senha resetada com sucesso</p>
          <p style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 12 }}>Comunique esta senha temporaria ao corretor:</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--n900, #060D16)', borderRadius: 8, border: '1px solid var(--bdr)' }}>
            <code style={{ fontFamily: 'var(--fm, JetBrains Mono)', fontSize: 20, fontWeight: 600, color: 'var(--gold)', letterSpacing: 4, flex: 1 }}>
              {result.temp_password}
            </code>
            <button onClick={() => { navigator.clipboard.writeText(result.temp_password!) }} style={{
              padding: '6px 12px', background: 'var(--n700)', border: '1px solid var(--bdr)',
              borderRadius: 6, color: 'var(--t2)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--fu)',
            }}>
              Copiar
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'var(--t4)', marginTop: 12, lineHeight: 1.5 }}>
            O corretor sera obrigado a definir uma nova senha no proximo login. Esta senha temporaria nao sera exibida novamente.
          </p>
        </div>
      )}

      {result?.error && (
        <div style={{ padding: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)', borderRadius: 8, color: '#F87171', fontSize: 12, marginTop: 8 }}>
          {result.error}
        </div>
      )}
    </div>
  )
}
