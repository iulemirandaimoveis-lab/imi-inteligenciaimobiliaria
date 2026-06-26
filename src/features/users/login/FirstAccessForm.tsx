'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, CheckCircle2 } from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { Button, Eyebrow } from '../ui/primitives'

export function FirstAccessForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [temp, setTemp] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < 8) return setError('A nova senha deve ter no mínimo 8 caracteres.')
    if (next !== confirm) return setError('As senhas não coincidem.')
    setLoading(true)
    try {
      const res = await fetch('/api/users/auth/first-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, temp_password: temp, new_password: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível concluir o primeiro acesso.')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/users/login'), 1800)
    } catch {
      setError('Erro técnico. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    height: 48,
    padding: '0 14px 0 42px',
    borderRadius: T.rMd,
    fontSize: 14,
    fontFamily: T.fSans,
    color: T.t1,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${T.glassBorder}`,
    outline: 'none',
    caretColor: T.gold,
    boxSizing: 'border-box',
  }
  const icon: CSSProperties = { position: 'absolute', left: 14, color: T.t3 }
  const label: CSSProperties = { display: 'block', fontFamily: T.fSans, fontSize: 12, fontWeight: 500, color: T.t2, marginBottom: 7 }

  if (done) {
    return (
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <CheckCircle2 size={40} color={T.green} style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 24, color: T.t1, margin: '0 0 8px' }}>Acesso configurado</h2>
        <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>Sua senha foi definida. Redirecionando para o login…</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Link href="/users/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.fSans, fontSize: 12.5, color: T.t3, textDecoration: 'none', marginBottom: 28 }}>
        <ArrowLeft size={14} /> Voltar ao login
      </Link>

      <Eyebrow style={{ color: T.gold }}>Primeiro acesso</Eyebrow>
      <h2 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 28, color: T.t1, margin: '10px 0 6px' }}>Defina sua senha</h2>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: '0 0 28px' }}>
        Use o e-mail e a senha provisória recebidos para criar sua senha definitiva.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={label}>E-mail</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail size={16} style={icon} aria-hidden />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@iulemirandaimoveis.com.br" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={label}>Senha provisória</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <KeyRound size={16} style={icon} aria-hidden />
            <input type="password" required value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="recebida do administrador" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={label}>Nova senha</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={16} style={icon} aria-hidden />
            <input type={show ? 'text' : 'password'} required value={next} onChange={(e) => setNext(e.target.value)} placeholder="mín. 8 caracteres" style={{ ...inputStyle, paddingRight: 44 }} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar' : 'Mostrar'} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: T.t3, display: 'flex', padding: 4 }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label style={label}>Confirmar nova senha</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={16} style={icon} aria-hidden />
            <input type={show ? 'text' : 'password'} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="repita a nova senha" style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{ padding: '11px 14px', borderRadius: T.rMd, background: T.redSoft, border: `1px solid ${T.redBorder}` }}>
            <p style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.red, margin: 0 }}>{error}</p>
          </div>
        )}

        <Button type="submit" variant="primary" loading={loading}>
          Definir senha e acessar
        </Button>
      </form>
    </div>
  )
}
