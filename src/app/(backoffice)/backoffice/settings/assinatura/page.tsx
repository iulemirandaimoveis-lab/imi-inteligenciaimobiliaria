'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileSignature, Save, Loader2, CheckCircle, XCircle, Plug, Star } from 'lucide-react'

type ProviderId = 'clicksign' | 'docusign'

interface ProviderState {
  configured: boolean
  active: boolean
  secretHint: string | null
  metadata: Record<string, string>
  status: string
  lastTestedAt: string | null
}
interface ApiState {
  clicksign: ProviderState
  docusign: ProviderState
  activeProvider: ProviderId | null
}

const card: React.CSSProperties = {
  background: 'var(--bg-surface, #fff)',
  border: '1px solid var(--border-subtle, #e5e7eb)',
  borderRadius: '12px',
}
const input =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-amber-400 outline-none bg-white'

export default function AssinaturaSettingsPage() {
  const [data, setData] = useState<ApiState | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<ProviderId | null>(null)
  const [testingId, setTestingId] = useState<ProviderId | null>(null)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)

  // form fields
  const [ck, setCk] = useState({ secret: '', baseUrl: '', webhookSecret: '' })
  const [ds, setDs] = useState({ secret: '', baseUri: '', accountId: '', webhookSecret: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/integrations/signature')
    if (res.ok) {
      const j: ApiState = await res.json()
      setData(j)
      setCk(s => ({ ...s, baseUrl: j.clicksign.metadata.baseUrl ?? '', webhookSecret: '' }))
      setDs(s => ({
        ...s,
        baseUri: j.docusign.metadata.baseUri ?? '',
        accountId: j.docusign.metadata.accountId ?? '',
        webhookSecret: '',
      }))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function flash(ok: boolean, msg: string) {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function save(provider: ProviderId, makeActive: boolean) {
    setSavingId(provider)
    const payload =
      provider === 'clicksign'
        ? { provider, active: makeActive, secret: ck.secret || undefined, baseUrl: ck.baseUrl, webhookSecret: ck.webhookSecret || undefined }
        : { provider, active: makeActive, secret: ds.secret || undefined, baseUri: ds.baseUri, accountId: ds.accountId, webhookSecret: ds.webhookSecret || undefined }
    const res = await fetch('/api/integrations/signature', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    const j = await res.json()
    setSavingId(null)
    if (res.ok) { flash(true, 'Salvo com sucesso.'); load() }
    else flash(false, j.error ?? 'Falha ao salvar.')
  }

  async function test(provider: ProviderId) {
    setTestingId(provider)
    const res = await fetch('/api/integrations/signature/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider }),
    })
    const j = await res.json()
    setTestingId(null)
    flash(j.ok, j.message ?? (j.ok ? 'OK' : 'Falha'))
    load()
  }

  if (loading) {
    return <div className="p-8 flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Carregando…</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-3">
        <FileSignature className="w-6 h-6" style={{ color: '#C8A44A' }} />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assinatura eletrônica</h1>
          <p className="text-sm text-gray-500">Configure as chaves do Clicksign e do DocuSign. O provedor ativo é usado nas propostas.</p>
        </div>
      </header>

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${toast.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {toast.msg}
        </div>
      )}

      {/* Clicksign */}
      <section style={card} className="p-5">
        <ProviderHeader title="Clicksign" state={data?.clicksign} isActive={data?.activeProvider === 'clicksign'} />
        <div className="grid gap-3 mt-4">
          <Field label="API Token" type="password"
            placeholder={data?.clicksign.secretHint ?? 'cole o token'} value={ck.secret}
            onChange={v => setCk(s => ({ ...s, secret: v }))} hint={data?.clicksign.configured ? 'deixe em branco para manter o atual' : undefined} />
          <Field label="Base URL" value={ck.baseUrl} placeholder="https://app.clicksign.com" onChange={v => setCk(s => ({ ...s, baseUrl: v }))} />
          <Field label="Webhook Secret (HMAC)" type="password" value={ck.webhookSecret} placeholder="opcional" onChange={v => setCk(s => ({ ...s, webhookSecret: v }))} />
        </div>
        <Actions
          onSave={() => save('clicksign', data?.activeProvider === 'clicksign')}
          onActivate={() => save('clicksign', true)}
          onTest={() => test('clicksign')}
          saving={savingId === 'clicksign'} testing={testingId === 'clicksign'}
          isActive={data?.activeProvider === 'clicksign'} configured={!!data?.clicksign.configured} />
      </section>

      {/* DocuSign */}
      <section style={card} className="p-5">
        <ProviderHeader title="DocuSign" state={data?.docusign} isActive={data?.activeProvider === 'docusign'} />
        <div className="grid gap-3 mt-4">
          <Field label="Access Token (OAuth JWT)" type="password"
            placeholder={data?.docusign.secretHint ?? 'cole o token'} value={ds.secret}
            onChange={v => setDs(s => ({ ...s, secret: v }))} hint={data?.docusign.configured ? 'deixe em branco para manter o atual' : undefined} />
          <Field label="Base URI" value={ds.baseUri} placeholder="https://demo.docusign.net/restapi" onChange={v => setDs(s => ({ ...s, baseUri: v }))} />
          <Field label="Account ID" value={ds.accountId} placeholder="xxxxxxxx-xxxx-…" onChange={v => setDs(s => ({ ...s, accountId: v }))} />
          <Field label="Webhook Secret (Connect HMAC)" type="password" value={ds.webhookSecret} placeholder="opcional" onChange={v => setDs(s => ({ ...s, webhookSecret: v }))} />
        </div>
        <Actions
          onSave={() => save('docusign', data?.activeProvider === 'docusign')}
          onActivate={() => save('docusign', true)}
          onTest={() => test('docusign')}
          saving={savingId === 'docusign'} testing={testingId === 'docusign'}
          isActive={data?.activeProvider === 'docusign'} configured={!!data?.docusign.configured} />
      </section>

      <p className="text-xs text-gray-400">
        Webhook do provedor: <code>POST /api/webhooks/signature/clicksign</code> ou <code>/docusign</code>.
        As chaves ficam protegidas por RLS (admin/gestor) e nunca são expostas ao navegador.
      </p>
    </div>
  )
}

function ProviderHeader({ title, state, isActive }: { title: string; state?: ProviderState; isActive: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Plug className="w-4 h-4 text-gray-400" />
        <h2 className="font-bold text-gray-800">{title}</h2>
        {isActive && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            <Star className="w-3 h-3" /> ativo
          </span>
        )}
      </div>
      <span className={`text-[11px] font-semibold ${state?.configured ? 'text-green-600' : 'text-gray-400'}`}>
        {state?.configured ? `configurado · ${state.status}` : 'não configurado'}
      </span>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, hint }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-gray-600">{label}</span>
      <input className={input} type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
    </label>
  )
}

function Actions({ onSave, onActivate, onTest, saving, testing, isActive, configured }:
  { onSave: () => void; onActivate: () => void; onTest: () => void; saving: boolean; testing: boolean; isActive: boolean; configured: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <button onClick={onSave} disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
        style={{ background: '#C8A44A' }}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
      </button>
      {!isActive && (
        <button onClick={onActivate} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50">
          <Star className="w-4 h-4" /> Definir como ativo
        </button>
      )}
      <button onClick={onTest} disabled={testing || !configured}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />} Testar conexão
      </button>
    </div>
  )
}
