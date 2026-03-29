'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValid = password.length >= 8 && password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao definir senha')
        return
      }

      router.push('/backoffice/dashboard')
    } catch {
      setError('Erro de conexao')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base, #060D16)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'var(--fu, Outfit, sans-serif)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--n800, #0B1928)',
        border: '1px solid var(--bdr, rgba(255,255,255,0.06))',
        borderRadius: 16, padding: 40,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--fd, Playfair Display, serif)', fontSize: 28, fontWeight: 700, color: 'var(--t1, #E8E4DC)', letterSpacing: -1 }}>
            I<span style={{ color: 'var(--gold, #C8A44A)' }}>|</span>M
          </div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: 'var(--t3, #556170)', textTransform: 'uppercase', marginTop: 4 }}>
            INTELIGENCIA IMOBILIARIA
          </div>
        </div>

        <h2 style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 600, color: 'var(--t1)', textAlign: 'center', marginBottom: 8 }}>
          Defina sua senha
        </h2>
        <p style={{ fontSize: 13, color: 'var(--t2, #94A0B2)', textAlign: 'center', marginBottom: 32, lineHeight: 1.5 }}>
          Este e seu primeiro acesso ou sua senha foi resetada. Escolha uma senha segura para continuar.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t2)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Nova senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              style={{ width: '100%', padding: '12px 16px', background: 'var(--n900, #060D16)', border: '1px solid var(--bdr)', borderRadius: 8, color: 'var(--t1)', fontSize: 14, fontFamily: 'var(--fu)', outline: 'none' }}
              required minLength={8} autoFocus
            />
            {password.length > 0 && password.length < 8 && (
              <span style={{ fontSize: 11, color: '#F87171', marginTop: 4, display: 'block' }}>
                Minimo 8 caracteres ({8 - password.length} faltando)
              </span>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t2)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Confirmar senha
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              style={{ width: '100%', padding: '12px 16px', background: 'var(--n900, #060D16)', border: `1px solid ${confirm && confirm !== password ? '#F87171' : 'var(--bdr)'}`, borderRadius: 8, color: 'var(--t1)', fontSize: 14, fontFamily: 'var(--fu)', outline: 'none' }}
              required minLength={8}
            />
            {confirm && confirm !== password && (
              <span style={{ fontSize: 11, color: '#F87171', marginTop: 4, display: 'block' }}>Senhas nao coincidem</span>
            )}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#F87171', fontSize: 12, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={!isValid || loading} style={{
            width: '100%', padding: '14px 0',
            background: isValid ? 'var(--n600, #142840)' : 'var(--n700, #0F2035)',
            color: isValid ? 'var(--t1)' : 'var(--t3)',
            border: '1px solid var(--bdr)',
            borderBottom: isValid ? '2px solid var(--gold, #C8A44A)' : '1px solid var(--bdr)',
            borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'var(--fu)',
            letterSpacing: 1, textTransform: 'uppercase',
            cursor: isValid ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
          }}>
            {loading ? 'Salvando...' : 'Definir senha e entrar'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: 'var(--t4, #3A4552)', textAlign: 'center', marginTop: 24, lineHeight: 1.5 }}>
          Sua senha e pessoal e intransferivel. Em caso de problemas, contate o administrador.
        </p>
      </div>
    </div>
  )
}
