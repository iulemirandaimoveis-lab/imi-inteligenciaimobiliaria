'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, Wand2, Video, Instagram, ArrowRight, PenLine, BarChart2, Calendar } from 'lucide-react'

const tools = [
  {
    href: '/backoffice/conteudo/criador',
    icon: Wand2,
    title: 'Criador IA',
    description: 'Gere legendas, scripts de Reels e prompts de imagem com IA para qualquer imóvel.',
    badge: 'Claude AI',
    accent: true,
  },
  {
    href: '/backoffice/conteudo/novo',
    icon: PenLine,
    title: 'Editor de Conteúdo',
    description: 'Crie e edite publicações manualmente com suporte a rich text e mídia.',
    badge: null,
    accent: false,
  },
  {
    href: '/backoffice/conteudo/video',
    icon: Video,
    title: 'Criador de Vídeo',
    description: 'Monte vídeos automáticos de imóveis com fotos, texto e música.',
    badge: 'Beta',
    accent: false,
  },
  {
    href: '/backoffice/campanhas',
    icon: Instagram,
    title: 'Campanhas',
    description: 'Gerencie campanhas de anúncios no Meta Ads, Google Ads e portais.',
    badge: null,
    accent: false,
  },
  {
    href: '/backoffice/relatorios',
    icon: BarChart2,
    title: 'Relatórios de Conteúdo',
    description: 'Analise o desempenho das publicações: alcance, engajamento e conversão.',
    badge: null,
    accent: false,
  },
  {
    href: '/backoffice/automacoes',
    icon: Calendar,
    title: 'Automações de Conteúdo',
    description: 'Configure publicações automáticas e sequências de conteúdo programado.',
    badge: null,
    accent: false,
  },
]

export default function ConteudosPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <FileText size={18} style={{ color: 'var(--imi-gold-500)' }} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Central de Conteúdo
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Crie, gerencie e publique conteúdo para portais imobiliários, redes sociais e site.
        </p>
      </motion.div>

      {/* Tools grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {tools.map((tool, i) => {
          const Icon = tool.icon
          return (
            <motion.div
              key={tool.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
            >
              <Link
                href={tool.href}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    background: tool.accent ? 'rgba(184,148,58,0.06)' : 'var(--bg-surface)',
                    border: `1px solid ${tool.accent ? 'rgba(184,148,58,0.22)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--r-xl)',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'border-color 0.18s, background 0.18s',
                    height: '100%',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(184,148,58,0.4)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = tool.accent ? 'rgba(184,148,58,0.22)' : 'var(--border-default)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '10px',
                      background: tool.accent ? 'rgba(184,148,58,0.12)' : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} style={{ color: tool.accent ? 'var(--imi-gold-500)' : 'var(--text-secondary)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {tool.badge && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                          background: tool.accent ? 'rgba(184,148,58,0.15)' : 'rgba(255,255,255,0.06)',
                          color: tool.accent ? 'var(--imi-gold-500)' : 'var(--text-secondary)',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                          {tool.badge}
                        </span>
                      )}
                      <ArrowRight size={13} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {tool.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {tool.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
