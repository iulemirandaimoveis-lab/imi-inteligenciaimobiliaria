'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle, QrCode, Smartphone, FileText, Copy, ExternalLink,
  Edit2, CheckCheck, Clock, Wifi, WifiOff, ArrowRight, Zap, Users,
} from 'lucide-react'
import Link from 'next/link'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'

// ─── DS3 Style Helpers ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--r-xl, 4px)',
  boxShadow: 'var(--shadow-xs)',
}

const elevated: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--r-lg, 4px)',
}

const label: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-tertiary)',
  display: 'block',
  marginBottom: 8,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  id: string
  title: string
  preview: string
  variables: string[]
}

interface RecentConversation {
  id: string
  name: string
  initials: string
  lastMsg: string
  time: string
  unread: number
  color: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: 'boas-vindas',
    title: 'Boas-vindas ao Lead',
    preview: 'Olá {nome}, obrigado pelo interesse no {imovel}. Sou {corretor} e estou aqui para ajudá-lo...',
    variables: ['{nome}', '{imovel}', '{corretor}'],
  },
  {
    id: 'followup-48h',
    title: 'Follow-up 48h',
    preview: 'Olá {nome}, ainda tem interesse em conhecer o {imovel}? Tenho novidades que podem te interessar...',
    variables: ['{nome}', '{imovel}'],
  },
  {
    id: 'confirmacao-visita',
    title: 'Confirmação de Visita',
    preview: 'Confirmamos sua visita para {data} às {hora} no {imovel}. Nosso endereço é {endereco}...',
    variables: ['{data}', '{hora}', '{imovel}', '{endereco}'],
  },
  {
    id: 'proposta-enviada',
    title: 'Proposta Enviada',
    preview: 'Olá {nome}, sua proposta para {imovel} foi enviada com sucesso. O valor proposto foi {valor}...',
    variables: ['{nome}', '{imovel}', '{valor}'],
  },
]

const CONVERSATIONS: RecentConversation[] = [
  {
    id: '1',
    name: 'Carlos Menezes',
    initials: 'CM',
    lastMsg: 'Quando posso agendar a visita?',
    time: '10:32',
    unread: 2,
    color: '#3B82F6',
  },
  {
    id: '2',
    name: 'Ana Beatriz Lima',
    initials: 'AB',
    lastMsg: 'Perfeito! Vejo vocês amanhã então.',
    time: 'Ontem',
    unread: 0,
    color: '#8B5CF6',
  },
  {
    id: '3',
    name: 'Roberto Ferreira',
    initials: 'RF',
    lastMsg: 'Preciso de mais informações sobre financiamento.',
    time: 'Seg',
    unread: 1,
    color: '#F59E0B',
  },
]

const SETUP_STEPS = [
  'Abra o WhatsApp no celular',
  'Toque em Menu ⋮ > Aparelhos conectados',
  'Toque em Conectar um aparelho',
  'Escaneie o QR code com a câmera',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [connected, setConnected] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <PageIntelHeader
        moduleLabel="COMUNICAÇÃO"
        title="WhatsApp Business"
        subtitle="Gerencie conversas, templates e automações via WhatsApp"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '4px 10px',
              borderRadius: 'var(--r-full)',
              background: 'rgba(184,148,58,0.12)',
              color: 'var(--imi-gold-500)',
              border: '1px solid rgba(184,148,58,0.30)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono)',
            }}>
              API · Em Breve
            </span>
            <button
              onClick={() => setConnected(c => !c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                height: 38, padding: '0 16px',
                borderRadius: 'var(--r-md)',
                background: connected ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'var(--bg-elevated)',
                border: connected ? '1px solid color-mix(in srgb, var(--success) 35%, transparent)' : '1px solid var(--border-default)',
                color: connected ? 'var(--success)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {connected ? 'Conectado' : 'Desconectado'}
            </button>
          </div>
        }
      />

      {/* ── Top 2-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 20 }}>

        {/* ── Connection Status Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...card, padding: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Conexão do Dispositivo
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3, fontFamily: 'var(--font-sans)' }}>
                Escaneie o QR code para vincular seu número
              </p>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--r-md)',
              background: connected ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Smartphone size={15} style={{ color: connected ? 'var(--success)' : 'var(--text-tertiary)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* QR Code Placeholder */}
            <div style={{
              width: 200, height: 200, flexShrink: 0,
              borderRadius: 'var(--r-lg)',
              background: 'var(--bg-elevated)',
              border: '2px dashed var(--border-default)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <QrCode size={56} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
              <p style={{
                fontSize: 11, color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)', textAlign: 'center',
                lineHeight: 1.4, padding: '0 16px',
              }}>
                QR Code aparece após<br />ativar a integração
              </p>
            </div>

            {/* Steps */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <p style={{ ...label, marginBottom: 12 }}>Como conectar</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SETUP_STEPS.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                      background: 'rgba(184,148,58,0.12)',
                      border: '1.5px solid rgba(184,148,58,0.30)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        color: 'var(--imi-gold-500)',
                      }}>
                        {i + 1}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 13, color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-sans)', margin: 0,
                      lineHeight: 1.5, paddingTop: 2,
                    }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 16, padding: '10px 12px',
                borderRadius: 'var(--r-md)',
                background: 'color-mix(in srgb, var(--success) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--success) 18%, transparent)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCheck size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', margin: 0, lineHeight: 1.4 }}>
                  A sessão fica ativa por até 14 dias sem reconectar
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Conversas Recentes ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{ ...card, padding: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Conversas Recentes
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3, fontFamily: 'var(--font-sans)' }}>
                Últimas interações com leads e clientes
              </p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 'var(--r-full)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            }}>
              <Users size={12} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                3 ativos
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CONVERSATIONS.map((conv, i) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                style={{
                  ...elevated,
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: 4, flexShrink: 0,
                  background: conv.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
                    color: '#fff',
                  }}>
                    {conv.initials}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)', margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {conv.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {conv.unread > 0 && (
                        <span style={{
                          minWidth: 18, height: 18, borderRadius: 4,
                          background: 'var(--success)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                          color: '#fff', padding: '0 5px',
                        }}>
                          {conv.unread}
                        </span>
                      )}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {conv.time}
                      </span>
                    </div>
                  </div>
                  <p style={{
                    fontSize: 12, color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-sans)', margin: '2px 0 0',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {conv.lastMsg}
                  </p>
                </div>

                {/* Action */}
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  height: 30, padding: '0 10px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500,
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'all 150ms ease',
                }}>
                  <MessageCircle size={11} />
                  Ver Conversa
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Templates Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ ...card, padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Templates de Mensagem
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3, fontFamily: 'var(--font-sans)' }}>
              Mensagens pré-aprovadas para automação de comunicação
            </p>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 10px',
            borderRadius: 'var(--r-full)',
            background: 'rgba(184,148,58,0.10)',
            color: 'var(--imi-gold-500)',
            border: '1px solid rgba(184,148,58,0.25)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            fontFamily: 'var(--font-mono)',
          }}>
            {TEMPLATES.length} templates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
          {TEMPLATES.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              style={{
                ...elevated,
                padding: 16,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 'var(--r-md)',
                    background: 'rgba(37,211,102,0.10)',
                    border: '1px solid rgba(37,211,102,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FileText size={14} style={{ color: '#25D366' }} />
                  </div>
                  <p style={{
                    fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)', margin: 0,
                  }}>
                    {tpl.title}
                  </p>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '3px 8px',
                  borderRadius: 'var(--r-full)',
                  background: 'rgba(184,148,58,0.10)',
                  color: 'var(--imi-gold-500)',
                  border: '1px solid rgba(184,148,58,0.22)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontFamily: 'var(--font-mono)', flexShrink: 0,
                }}>
                  Em Breve
                </span>
              </div>

              {/* Preview */}
              <p style={{
                fontSize: 12, color: 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)', margin: 0,
                lineHeight: 1.55,
                padding: '8px 10px',
                background: 'var(--bg-muted)',
                borderRadius: 'var(--r-md)',
                borderLeft: '2px solid rgba(37,211,102,0.40)',
              }}>
                {tpl.preview}
              </p>

              {/* Variables */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {tpl.variables.map(v => (
                  <span key={v} style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4,
                    background: 'var(--bg-muted)',
                    color: 'var(--imi-gold-500)',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    {v}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 30, padding: '0 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    opacity: 0.75,
                  }}
                  title="Disponível após integração Meta API"
                >
                  <Edit2 size={11} />
                  Editar
                </button>
                <button
                  onClick={() => handleCopy(tpl.id, tpl.preview)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 30, padding: '0 12px',
                    borderRadius: 'var(--r-md)',
                    background: copiedId === tpl.id ? 'color-mix(in srgb, var(--success) 10%, transparent)' : 'var(--bg-muted)',
                    border: copiedId === tpl.id ? '1px solid color-mix(in srgb, var(--success) 30%, transparent)' : '1px solid var(--border-subtle)',
                    color: copiedId === tpl.id ? 'var(--success)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <Copy size={11} />
                  {copiedId === tpl.id ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── CTA: Meta Business API ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{
          ...card,
          padding: 24,
          background: 'linear-gradient(135deg, rgba(184,148,58,0.07) 0%, var(--bg-surface) 100%)',
          border: '1px solid rgba(184,148,58,0.22)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--r-xl)',
            background: 'rgba(184,148,58,0.12)',
            border: '1.5px solid rgba(184,148,58,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Zap size={22} style={{ color: 'var(--imi-gold-500)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{
              fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700,
              color: 'var(--text-primary)', margin: 0,
            }}>
              Conecte via Meta Business API para automação completa
            </p>
            <p style={{
              fontSize: 13, color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)', margin: '4px 0 0', lineHeight: 1.5,
            }}>
              Envio em massa, templates aprovados pelo Meta, webhooks em tempo real e integração com o CRM de leads.
            </p>
          </div>
          <Link
            href="/backoffice/integracoes"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              height: 42, padding: '0 20px',
              borderRadius: 'var(--r-md)',
              background: 'var(--imi-gold-500)',
              color: '#fff', textDecoration: 'none',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              flexShrink: 0,
              transition: 'opacity 180ms ease',
            }}
          >
            Ver Integrações
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 10, marginTop: 18 }}>
          {[
            { icon: MessageCircle, label: 'Envio em Massa', desc: 'Disparo segmentado para leads e clientes' },
            { icon: Clock, label: 'Automação 24h', desc: 'Respostas automáticas via IA integrada' },
            { icon: ExternalLink, label: 'Meta Business', desc: 'Histórico unificado no painel Meta' },
          ].map(feat => (
            <div key={feat.label} style={{
              ...elevated,
              padding: '12px 14px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 'var(--r-md)',
                background: 'rgba(184,148,58,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <feat.icon size={14} style={{ color: 'var(--imi-gold-500)' }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                  {feat.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', margin: '2px 0 0', lineHeight: 1.4 }}>
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
