'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { tokens as T } from '../ui/tokens'
import { Button, Eyebrow, Spinner } from '../ui/primitives'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const nextPath = params.get('next') || '/users/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauth, setOauth] = useState<'google' | 'azure' | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.')
        return
      }
      if (data.session) {
        router.push(nextPath)
        router.refresh()
      }
    } catch {
      setError('Erro técnico ao processar o login.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'google' | 'azure') {
    setError('')
    setOauth(provider)
    try {
      const redirectTo = `${window.location.origin}/users/auth/callback?next=${encodeURIComponent(nextPath)}`
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, scopes: provider === 'azure' ? 'email openid profile' : undefined },
      })
      if (oauthError) {
        setError('Não foi possível iniciar o login federado.')
        setOauth(null)
      }
    } catch {
      setError('Não foi possível iniciar o login federado.')
      setOauth(null)
    }
  }

  const inputWrap: CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
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
    transition: `border-color ${T.dur} ${T.ease}, box-shadow ${T.dur} ${T.ease}`,
  }
  const iconStyle: CSSProperties = {
    position: 'absolute',
    left: 14,
    color: T.t3,
    pointerEvents: 'none',
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.goldBorder
    e.currentTarget.style.boxShadow = `0 0 0 3px ${T.goldSoft}`
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.glassBorder
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      {/* Brand (mobile shows here; desktop hero carries it) */}
      <div style={{ marginBottom: 32 }}>
        <Eyebrow style={{ color: T.gold }}>Acesso ao Console</Eyebrow>
        <h2
          style={{
            fontFamily: T.fSerif,
            fontWeight: 500,
            fontSize: 28,
            color: T.t1,
            margin: '10px 0 6px',
            letterSpacing: '-0.01em',
          }}
        >
          Bem-vindo de volta
        </h2>
        <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>
          Entre para acessar a operação comercial.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="imi-email" style={labelStyle}>
            E-mail
          </label>
          <div style={inputWrap}>
            <Mail size={16} style={iconStyle} aria-hidden />
            <input
              id="imi-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@iulemirandaimoveis.com.br"
              required
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
        </div>

        <div>
          <label htmlFor="imi-password" style={labelStyle}>
            Senha
          </label>
          <div style={inputWrap}>
            <Lock size={16} style={iconStyle} aria-hidden />
            <input
              id="imi-password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              style={{
                position: 'absolute',
                right: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: T.t3,
                display: 'flex',
                padding: 4,
              }}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember + forgot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontFamily: T.fSans,
              fontSize: 12.5,
              color: T.t2,
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: T.gold, cursor: 'pointer' }}
            />
            Lembrar acesso
          </label>
          <Link
            href="/users/forgot"
            style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.gold, textDecoration: 'none' }}
          >
            Esqueci a senha
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '11px 14px',
              borderRadius: T.rMd,
              background: T.redSoft,
              border: `1px solid ${T.redBorder}`,
            }}
          >
            <p style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.red, margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        )}

        <Button type="submit" variant="primary" loading={loading}>
          Entrar
        </Button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
        <span style={{ flex: 1, height: 1, background: T.glassBorder }} />
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, letterSpacing: '0.06em' }}>ou continue com</span>
        <span style={{ flex: 1, height: 1, background: T.glassBorder }} />
      </div>

      {/* Federated */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Button variant="secondary" type="button" loading={oauth === 'google'} onClick={() => handleOAuth('google')}>
          {oauth !== 'google' && <GoogleMark />} Google
        </Button>
        <Button variant="secondary" type="button" loading={oauth === 'azure'} onClick={() => handleOAuth('azure')}>
          {oauth !== 'azure' && <MicrosoftMark />} Microsoft
        </Button>
      </div>

      <p
        style={{
          fontFamily: T.fSans,
          fontSize: 11,
          color: T.t4,
          textAlign: 'center',
          marginTop: 36,
          letterSpacing: '0.04em',
        }}
      >
        Powered by IMI Intelligence Platform
      </p>
    </div>
  )
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: T.fSans,
  fontSize: 12,
  fontWeight: 500,
  color: T.t2,
  marginBottom: 7,
}

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

function MicrosoftMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M1 1h10.2v10.2H1z" />
      <path fill="#7FBA00" d="M12.8 1H23v10.2H12.8z" />
      <path fill="#00A4EF" d="M1 12.8h10.2V23H1z" />
      <path fill="#FFB900" d="M12.8 12.8H23V23H12.8z" />
    </svg>
  )
}
