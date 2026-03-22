'use client'

import { useState } from 'react'
import { Save, Globe, Bell, Database, Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { T, inputStyle } from '../../../lib/theme'
import { PageIntelHeader } from '../../../components/ui'

interface InvestSettings {
  defaultMarket: string
  currency: string
  defaultHorizon: number
  defaultAppreciation: number
  defaultFinancingRate: number
  defaultDownPayment: number
  autoLeadCapture: boolean
  emailNotifications: boolean
  slackNotifications: boolean
  publicSimulator: boolean
  pdfBranding: boolean
  bcbApiKey: string
  webhookUrl: string
}

const initialSettings: InvestSettings = {
  defaultMarket: 'brasil',
  currency: 'BRL',
  defaultHorizon: 10,
  defaultAppreciation: 5,
  defaultFinancingRate: 10.5,
  defaultDownPayment: 20,
  autoLeadCapture: true,
  emailNotifications: true,
  slackNotifications: false,
  publicSimulator: true,
  pdfBranding: true,
  bcbApiKey: '',
  webhookUrl: '',
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<InvestSettings>(initialSettings)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof InvestSettings, val: string | number | boolean) =>
    setSettings(prev => ({ ...prev, [key]: val }))

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/invest/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      toast.success('Configurações salvas')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const fieldStyle: React.CSSProperties = {
    ...inputStyle,
    fontFamily: T.font.sans,
  }

  const numFieldStyle: React.CSSProperties = {
    ...inputStyle,
    fontFamily: T.font.data,
  }

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    position: 'relative',
    display: 'inline-flex',
    height: 20,
    width: 36,
    alignItems: 'center',
    borderRadius: 9999,
    cursor: 'pointer',
    transition: `all ${T.transition.fast}`,
    background: active ? T.accent : T.hover,
    border: 'none',
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <PageIntelHeader
        moduleLabel="INVEST · CONFIG"
        title="Configurações Invest"
        subtitle="Parametros padrao e integracoes do modulo de investimento"
        actions={
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: T.accent, color: T.textInverse }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        }
      />

      {/* Default Parameters */}
      <div
        className="rounded-lg p-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: T.text }}>
          <Globe className="w-4 h-4" style={{ color: T.accent }} />
          Parametros Padrao
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: T.textMuted }}>Mercado Padrao</label>
            <select value={settings.defaultMarket} onChange={e => set('defaultMarket', e.target.value)} style={fieldStyle}>
              <option value="brasil">Brasil</option>
              <option value="eua">EUA (Florida)</option>
              <option value="dubai">Dubai</option>
              <option value="portugal">Portugal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: T.textMuted }}>Moeda</label>
            <select value={settings.currency} onChange={e => set('currency', e.target.value)} style={fieldStyle}>
              <option value="BRL">BRL - Real</option>
              <option value="USD">USD - Dolar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="AED">AED - Dirham</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: T.textMuted }}>Horizonte (anos)</label>
            <input type="number" value={settings.defaultHorizon} onChange={e => set('defaultHorizon', +e.target.value)} style={numFieldStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: T.textMuted }}>Valorizacao Anual (%)</label>
            <input type="number" value={settings.defaultAppreciation} onChange={e => set('defaultAppreciation', +e.target.value)} step="0.5" style={numFieldStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: T.textMuted }}>Taxa Financiamento (% a.a.)</label>
            <input type="number" value={settings.defaultFinancingRate} onChange={e => set('defaultFinancingRate', +e.target.value)} step="0.1" style={numFieldStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: T.textMuted }}>Entrada Padrao (%)</label>
            <input type="number" value={settings.defaultDownPayment} onChange={e => set('defaultDownPayment', +e.target.value)} style={numFieldStyle} />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div
        className="rounded-lg p-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: T.text }}>
          <Zap className="w-4 h-4" style={{ color: T.accent }} />
          Funcionalidades
        </h3>
        <div className="space-y-4">
          {[
            { key: 'autoLeadCapture' as const, label: 'Captura Automatica de Leads', desc: 'Criar leads automaticamente quando visitantes completam simulacoes' },
            { key: 'publicSimulator' as const, label: 'Simulador Publico', desc: 'Disponibilizar simulador de investimento no site publico' },
            { key: 'pdfBranding' as const, label: 'Branding nos PDFs', desc: 'Incluir logo e identidade visual nos relatorios gerados' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="text-sm" style={{ color: T.text }}>{item.label}</div>
                <div className="text-xs" style={{ color: T.textDim }}>{item.desc}</div>
              </div>
              <button
                onClick={() => set(item.key, !settings[item.key])}
                style={toggleStyle(settings[item.key] as boolean)}
              >
                <span
                  style={{
                    display: 'inline-block',
                    height: 14,
                    width: 14,
                    borderRadius: 9999,
                    background: 'white',
                    transition: `transform ${T.transition.fast}`,
                    transform: settings[item.key] ? 'translateX(16px)' : 'translateX(2px)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div
        className="rounded-lg p-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: T.text }}>
          <Bell className="w-4 h-4" style={{ color: T.accent }} />
          Notificacoes
        </h3>
        <div className="space-y-4">
          {[
            { key: 'emailNotifications' as const, label: 'Email', desc: 'Receber alertas de novos leads e simulacoes por email' },
            { key: 'slackNotifications' as const, label: 'Slack', desc: 'Enviar notificacoes para canal do Slack' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="text-sm" style={{ color: T.text }}>{item.label}</div>
                <div className="text-xs" style={{ color: T.textDim }}>{item.desc}</div>
              </div>
              <button
                onClick={() => set(item.key, !settings[item.key])}
                style={toggleStyle(settings[item.key] as boolean)}
              >
                <span
                  style={{
                    display: 'inline-block',
                    height: 14,
                    width: 14,
                    borderRadius: 9999,
                    background: 'white',
                    transition: `transform ${T.transition.fast}`,
                    transform: settings[item.key] ? 'translateX(16px)' : 'translateX(2px)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div
        className="rounded-lg p-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: T.text }}>
          <Database className="w-4 h-4" style={{ color: T.accent }} />
          Integracoes
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: T.textMuted }}>BCB API Key (opcional)</label>
            <input
              type="password"
              value={settings.bcbApiKey}
              onChange={e => set('bcbApiKey', e.target.value)}
              placeholder="Chave para acesso avancado ao BCB"
              style={fieldStyle}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: T.textMuted }}>Webhook URL (opcional)</label>
            <input
              type="url"
              value={settings.webhookUrl}
              onChange={e => set('webhookUrl', e.target.value)}
              placeholder="https://..."
              style={fieldStyle}
            />
            <p className="text-xs mt-1" style={{ color: T.textDim }}>
              Receber eventos de simulacoes e leads via webhook
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
