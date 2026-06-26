'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { tokens as T } from '../ui/tokens'
import { Button, Eyebrow } from '../ui/primitives'

export function ForgotForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/users/auth/callback?next=/users/dashboard`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (resetError) {
        setError('Não foi possível enviar o e-mail de recuperação.')
        return
      }
      setSent(true)
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

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Link
        href="/users/login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: T.fSans,
          fontSize: 12.5,
          color: T.t3,
          textDecoration: 'none',
          marginBottom: 28,
        }}
      >
        <ArrowLeft size={14} /> Voltar ao login
      </Link>

      {sent ? (
        <div style={{ textAlign: 'center' }}>
          <CheckCircle2 size={40} color={T.green} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 24, color: T.t1, margin: '0 0 8px' }}>
            Verifique seu e-mail
          </h2>
          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0, lineHeight: 1.6 }}>
            Se houver uma conta para <strong style={{ color: T.t2 }}>{email}</strong>, enviamos um link para
            redefinir a senha.
          </p>
        </div>
      ) : (
        <>
          <Eyebrow style={{ color: T.gold }}>Recuperação de acesso</Eyebrow>
          <h2 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 28, color: T.t1, margin: '10px 0 6px' }}>
            Esqueceu a senha?
          </h2>
          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: '0 0 28px' }}>
            Informe seu e-mail e enviaremos um link seguro de redefinição.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, color: T.t3 }} aria-hidden />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@iulemirandaimoveis.com.br"
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ padding: '11px 14px', borderRadius: T.rMd, background: T.redSoft, border: `1px solid ${T.redBorder}` }}>
                <p style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.red, margin: 0 }}>{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" loading={loading}>
              Enviar link de recuperação
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
