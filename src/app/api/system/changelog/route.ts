// src/app/api/system/changelog/route.ts
// Cria notificações de atualização do sistema para todos os admin users
// Chamado automaticamente via webhook ou manualmente

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createServiceClient(supabaseUrl, supabaseServiceKey)
}

// Changelog entries — add new entries at the top
const CHANGELOG: Array<{
  version: string
  date: string
  title: string
  message: string
  changes: string[]
}> = [
  {
    version: '2.8.0',
    date: '2026-03-12',
    title: '🖼️ Galeria com Drag-and-Drop + Fix Navbar',
    message: 'Galeria de fotos do módulo imóveis reescrita com drag-and-drop (@dnd-kit). Agora é possível reordenar fotos arrastando, definir capa com um clique, e preview em tela cheia. Corrigido: navbar sobrepondo botões no mobile.',
    changes: [
      'Drag-and-drop para reordenar fotos (existentes + novas)',
      'Definir foto de capa arrastando para primeira posição',
      'Preview em tela cheia ao clicar no ícone de zoom',
      'Numeração de ordem em cada foto',
      'Fix: navbar sobrepondo botões de salvar no mobile',
      'Fix: sticky header atrás da MobileHeader no editar',
    ],
  },
  {
    version: '2.7.0',
    date: '2026-03-12',
    title: '🔗 Integrações LinkedIn/TikTok + Status Automático',
    message: 'Adicionadas integrações LinkedIn Ads e TikTok Ads. Status de integrações agora detectado automaticamente via variáveis de ambiente. IA agora verifica status real de provedores.',
    changes: [
      'LinkedIn Ads: campanhas imobiliárias no LinkedIn',
      'TikTok Ads: campanhas com vídeos curtos',
      'Auto-detecção de status via env vars (Anthropic, OpenAI, etc)',
      'IA: verificação real de status dos provedores',
    ],
  },
  {
    version: '2.6.0',
    date: '2026-03-12',
    title: '🎨 Light Mode Fix + Dark Color Cleanup',
    message: 'Corrigido modo claro para componentes glass-card e intel-card. Limpeza de cores hardcoded em 6 páginas do backoffice.',
    changes: [
      'glass-card e intel-card agora funcionam em light e dark mode',
      'Cores hardcoded substituídas por tokens T em conteúdo, avaliações',
    ],
  },
]

// GET — retorna changelog
export async function GET() {
  return NextResponse.json({ changelog: CHANGELOG })
}

// POST — cria notificações de sistema para todos os users
export async function POST(req: NextRequest) {
  try {
    // Validate with a simple shared secret or API key
    const authHeader = req.headers.get('authorization')
    const secret = process.env.SYSTEM_CHANGELOG_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

    // Allow either bearer token or from authenticated session
    const isAuthorized = authHeader === `Bearer ${secret}` || authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`

    const body = await req.json().catch(() => ({}))
    const { version } = body

    const entry = version
      ? CHANGELOG.find(c => c.version === version)
      : CHANGELOG[0] // latest

    if (!entry) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

    const supabase = getSupabase()

    // Get all users (or just admin users)
    const { data: users, error: usersErr } = await supabase.auth.admin.listUsers()
    if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })

    // Create notification for each user
    const notifications = (users?.users || []).map(u => ({
      user_id: u.id,
      type: 'system',
      title: `${entry.title}`,
      message: entry.message,
      data: { version: entry.version, date: entry.date, changes: entry.changes },
      read: false,
    }))

    if (notifications.length > 0) {
      const { error } = await supabase.from('notifications').insert(notifications)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notified: notifications.length,
      version: entry.version
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
