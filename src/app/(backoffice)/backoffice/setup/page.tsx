'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Bell, Smartphone, ChevronRight, Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

const STEPS = [
  { id: 1, label: 'Perfil' },
  { id: 2, label: 'Notificações' },
  { id: 3, label: 'Instalar App' },
]

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }

      setUserId(user.id)

      const { data: profile } = await supabase.from('profiles')
        .select('name, phone, avatar_url')
        .eq('id', user.id)
        .single()

      const hasProfile = !!(profile?.phone || profile?.avatar_url)

      if (user.user_metadata?.setup_complete || hasProfile) {
        // Already set up — mark complete and go to dashboard
        await supabase.auth.updateUser({ data: { setup_complete: true } })
        router.replace('/backoffice/dashboard')
        return
      }

      setName(profile?.name || user.user_metadata?.name || '')
      setPhone(profile?.phone || '')
      setAvatarUrl(profile?.avatar_url || '')
    })

    // Detect iOS and standalone
    const ua = navigator.userAgent
    setIsIOS(/iPhone|iPad|iPod/i.test(ua))
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Notification current state
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') setNotifStatus('granted')
      else if (Notification.permission === 'denied') setNotifStatus('denied')
    }

    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => setSwReg(reg)).catch(() => {})
    }

    // Listen for install prompt
    const onInstall = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onInstall)
    return () => window.removeEventListener('beforeinstallprompt', onInstall)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleNextStep1() {
    if (!name.trim()) { toast.error('Informe seu nome'); return }
    if (!phone.trim()) { toast.error('Informe seu WhatsApp'); return }
    setStep(2)
  }

  async function handleEnableNotifications() {
    if (typeof Notification === 'undefined') { setStep(3); return }
    try {
      const permission = await Notification.requestPermission()
      setNotifStatus(permission === 'granted' ? 'granted' : 'denied')
      if (permission === 'granted' && swReg && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        const sub = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) as unknown as BufferSource,
        })
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
        toast.success('Notificações ativadas!')
      }
    } catch {
      // permission denied or error
    }
    setStep(3)
  }

  async function handleInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') toast.success('IMI instalado com sucesso!')
    setInstallEvent(null)
  }

  async function handleComplete() {
    setSaving(true)
    try {
      // Upload avatar if changed
      let finalAvatarUrl = avatarUrl
      if (avatarFile && userId) {
        const ext = avatarFile.name.split('.').pop()
        const path = `avatars/${userId}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          finalAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
        }
      }

      // Save profile
      await supabase.from('profiles').update({
        name: name.trim(),
        phone: phone.trim(),
        avatar_url: finalAvatarUrl || null,
        must_reset_password: false,
        updated_at: new Date().toISOString(),
      }).eq('id', userId)

      // Update auth metadata
      await supabase.auth.updateUser({
        data: { name: name.trim(), setup_complete: true },
      })

      router.push('/backoffice/dashboard')
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  const gold = '#C8A44A'
  const surface = 'rgba(14,26,46,0.95)'
  const border = 'rgba(200,164,74,0.2)'
  const textMuted = '#5A6E84'

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4" style={{ background: '#050B14' }}>
      {/* Progress */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                style={{
                  background: step > s.id ? 'var(--success, #6bb87b)' : step === s.id ? gold : 'rgba(72,101,129,0.2)',
                  color: step >= s.id ? '#050B14' : textMuted,
                  border: step === s.id ? `2px solid ${gold}` : 'none',
                }}
              >
                {step > s.id ? <Check size={13} /> : s.id}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: step >= s.id ? '#E8E4DC' : textMuted }}>{s.label}</span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px" style={{ background: step > s.id ? 'var(--success, #6bb87b)' : 'rgba(72,101,129,0.2)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: surface, border: `1px solid ${border}` }}>

        {/* ── Step 1: Perfil ── */}
        {step === 1 && (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-xl font-semibold" style={{ color: '#E8E4DC' }}>Bem-vindo ao IMI!</h1>
              <p className="text-sm" style={{ color: textMuted }}>Configure seu perfil para começar</p>
            </div>

            {/* Avatar */}
            <div className="flex justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all hover:opacity-80"
                style={{ borderColor: gold, background: 'rgba(200,164,74,0.08)' }}
              >
                {avatarPreview || avatarUrl
                  ? <img src={avatarPreview || avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold" style={{ color: gold }}>{name.charAt(0) || '?'}</span>
                }
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-center py-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <Camera size={14} style={{ color: '#E8E4DC' }} />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: textMuted }}>Seu nome completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full h-11 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(20,36,64,0.4)', border: `1px solid ${border}`, color: '#E8E4DC' }}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: textMuted }}>WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full h-11 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(20,36,64,0.4)', border: `1px solid ${border}`, color: '#E8E4DC' }}
              />
            </div>

            <button
              onClick={handleNextStep1}
              className="w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ background: gold, color: '#050B14' }}
            >
              Avançar <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* ── Step 2: Notificações ── */}
        {step === 2 && (
          <>
            <div className="text-center space-y-3 py-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(200,164,74,0.1)', border: `1px solid ${border}` }}>
                <Bell size={28} style={{ color: gold }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#E8E4DC' }}>Fique por dentro de tudo</h2>
                <p className="text-sm mt-1" style={{ color: textMuted }}>
                  Receba alertas de novos leads, visitas agendadas e mensagens em tempo real — igual às notificações do Chrome que você já conhece.
                </p>
              </div>
            </div>

            {/* Notification preview (similar to the Chrome notification in the image) */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)` }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded" style={{ background: gold }} />
                <span className="text-[11px] font-semibold" style={{ color: '#E8E4DC' }}>IMI – Inteligência Imobiliária</span>
              </div>
              <p className="text-xs font-medium" style={{ color: '#E8E4DC' }}>🏠 Novo lead recebido</p>
              <p className="text-[11px]" style={{ color: textMuted }}>Carlos Santos tem interesse no Apto 302 · Agora</p>
            </div>

            {notifStatus === 'denied' && (
              <p className="text-xs text-center" style={{ color: '#F87171' }}>
                Notificações bloqueadas. Habilite nas configurações do navegador para receber alertas.
              </p>
            )}

            {notifStatus !== 'granted' ? (
              <button
                onClick={handleEnableNotifications}
                className="w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110"
                style={{ background: gold, color: '#050B14' }}
              >
                <Bell size={15} /> Ativar Notificações
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2" style={{ color: 'var(--success, #6bb87b)' }}>
                <Check size={16} /> <span className="text-sm font-medium">Notificações ativadas!</span>
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              className="w-full text-xs text-center transition-all hover:opacity-70"
              style={{ color: textMuted }}
            >
              {notifStatus === 'granted' ? 'Continuar' : 'Agora não →'}
            </button>
          </>
        )}

        {/* ── Step 3: Instalar App ── */}
        {step === 3 && (
          <>
            <div className="text-center space-y-3 py-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(200,164,74,0.1)', border: `1px solid ${border}` }}>
                <Smartphone size={28} style={{ color: gold }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#E8E4DC' }}>Tenha o IMI sempre à mão</h2>
                <p className="text-sm mt-1" style={{ color: textMuted }}>
                  Instale o app na tela inicial do seu celular para acesso rápido sem precisar abrir o navegador.
                </p>
              </div>
            </div>

            {!isStandalone && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)` }}>
                {installEvent ? (
                  <button
                    onClick={handleInstall}
                    className="w-full h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110"
                    style={{ background: gold, color: '#050B14' }}
                  >
                    <Smartphone size={15} /> Instalar App
                  </button>
                ) : isIOS ? (
                  <div className="space-y-2 text-xs" style={{ color: '#E8E4DC' }}>
                    <p className="font-semibold" style={{ color: gold }}>Como instalar no iPhone/iPad:</p>
                    <p>1. Toque no botão <strong>Compartilhar</strong> (□↑) na barra do Safari</p>
                    <p>2. Role e toque em <strong>Adicionar à Tela de Início</strong></p>
                    <p>3. Toque em <strong>Adicionar</strong> no canto superior direito</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs" style={{ color: '#E8E4DC' }}>
                    <p className="font-semibold" style={{ color: gold }}>Como instalar no Android:</p>
                    <p>1. Toque no menu <strong>⋮</strong> do Chrome</p>
                    <p>2. Toque em <strong>Adicionar à tela inicial</strong></p>
                    <p>3. Confirme tocando em <strong>Adicionar</strong></p>
                  </div>
                )}
              </div>
            )}

            {isStandalone && (
              <div className="flex items-center justify-center gap-2 py-2" style={{ color: 'var(--success, #6bb87b)' }}>
                <Check size={16} /> <span className="text-sm font-medium">App já instalado!</span>
              </div>
            )}

            <button
              onClick={handleComplete}
              disabled={saving}
              className="w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: gold, color: '#050B14' }}
            >
              {saving ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : 'Concluir e Entrar →'}
            </button>
          </>
        )}
      </div>

      {/* Skip */}
      {step < 3 && (
        <button
          onClick={async () => {
            if (step === 1 && name.trim()) {
              setSaving(true)
              await supabase.auth.updateUser({ data: { setup_complete: true } })
              router.push('/backoffice/dashboard')
            } else {
              setStep(s => s + 1)
            }
          }}
          className="mt-4 text-xs transition-all hover:opacity-70"
          style={{ color: textMuted }}
        >
          Pular por agora →
        </button>
      )}
    </div>
  )
}
