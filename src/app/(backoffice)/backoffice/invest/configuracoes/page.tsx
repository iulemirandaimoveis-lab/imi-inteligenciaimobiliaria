'use client'

import { useState } from 'react'
import { Settings, Save, Globe, DollarSign, Bell, Shield, Database, Zap } from 'lucide-react'

const dmMono = { fontFamily: "'DM Mono', monospace" }

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
  const [saved, setSaved] = useState(false)

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
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-[6px] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C8A44A]/50"
  const inputBg = { background: 'rgba(255,255,255,0.05)' }
  const labelCls = "block text-xs text-white/50 mb-1.5"

  const toggleCls = (active: boolean) =>
    `relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${active ? 'bg-[#C8A44A]' : 'bg-white/10'}`

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
            <Settings className="w-6 h-6 text-[#C8A44A]" />
            Configuracoes Invest
          </h1>
          <p className="text-sm text-white/50 mt-1">Parametros padrao e integracoes do modulo de investimento</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#0B1928]"
          style={{ background: '#C8A44A' }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {/* Default Parameters */}
      <div className="rounded-lg border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#C8A44A]" />
          Parametros Padrao
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Mercado Padrao</label>
            <select value={settings.defaultMarket} onChange={e => set('defaultMarket', e.target.value)} className={inputCls} style={inputBg}>
              <option value="brasil">Brasil</option>
              <option value="eua">EUA (Florida)</option>
              <option value="dubai">Dubai</option>
              <option value="portugal">Portugal</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Moeda</label>
            <select value={settings.currency} onChange={e => set('currency', e.target.value)} className={inputCls} style={inputBg}>
              <option value="BRL">BRL - Real</option>
              <option value="USD">USD - Dolar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="AED">AED - Dirham</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Horizonte (anos)</label>
            <input type="number" value={settings.defaultHorizon} onChange={e => set('defaultHorizon', +e.target.value)} className={inputCls} style={{ ...inputBg, ...dmMono }} />
          </div>
          <div>
            <label className={labelCls}>Valorizacao Anual (%)</label>
            <input type="number" value={settings.defaultAppreciation} onChange={e => set('defaultAppreciation', +e.target.value)} step="0.5" className={inputCls} style={{ ...inputBg, ...dmMono }} />
          </div>
          <div>
            <label className={labelCls}>Taxa Financiamento (% a.a.)</label>
            <input type="number" value={settings.defaultFinancingRate} onChange={e => set('defaultFinancingRate', +e.target.value)} step="0.1" className={inputCls} style={{ ...inputBg, ...dmMono }} />
          </div>
          <div>
            <label className={labelCls}>Entrada Padrao (%)</label>
            <input type="number" value={settings.defaultDownPayment} onChange={e => set('defaultDownPayment', +e.target.value)} className={inputCls} style={{ ...inputBg, ...dmMono }} />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="rounded-lg border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#C8A44A]" />
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
                <div className="text-sm text-white">{item.label}</div>
                <div className="text-xs text-white/40">{item.desc}</div>
              </div>
              <button
                onClick={() => set(item.key, !settings[item.key])}
                className={toggleCls(settings[item.key] as boolean)}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-lg border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#C8A44A]" />
          Notificacoes
        </h3>
        <div className="space-y-4">
          {[
            { key: 'emailNotifications' as const, label: 'Email', desc: 'Receber alertas de novos leads e simulacoes por email' },
            { key: 'slackNotifications' as const, label: 'Slack', desc: 'Enviar notificacoes para canal do Slack' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">{item.label}</div>
                <div className="text-xs text-white/40">{item.desc}</div>
              </div>
              <button
                onClick={() => set(item.key, !settings[item.key])}
                className={toggleCls(settings[item.key] as boolean)}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className="rounded-lg border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#C8A44A]" />
          Integracoes
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>BCB API Key (opcional)</label>
            <input
              type="password"
              value={settings.bcbApiKey}
              onChange={e => set('bcbApiKey', e.target.value)}
              placeholder="Chave para acesso avancado ao BCB"
              className={inputCls}
              style={inputBg}
            />
          </div>
          <div>
            <label className={labelCls}>Webhook URL (opcional)</label>
            <input
              type="url"
              value={settings.webhookUrl}
              onChange={e => set('webhookUrl', e.target.value)}
              placeholder="https://..."
              className={inputCls}
              style={inputBg}
            />
            <p className="text-xs text-white/30 mt-1">Receber eventos de simulacoes e leads via webhook</p>
          </div>
        </div>
      </div>
    </div>
  )
}
