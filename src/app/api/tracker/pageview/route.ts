// /api/tracker/pageview — Registrar engajamento na página de destino
// Não requer auth (chamado via Beacon API pelo EngagementTracker)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { click_id, page_url, time_on_page_seconds, scroll_depth_percent, cta_clicked, whatsapp_clicked, form_submitted } = body;

    if (!click_id) {
      return NextResponse.json({ error: 'click_id obrigatório' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('page_views')
      .upsert({
        click_id,
        page_url: page_url || '',
        time_on_page_seconds: time_on_page_seconds || 0,
        scroll_depth_percent: Math.min(scroll_depth_percent || 0, 100),
        cta_clicked: cta_clicked || false,
        whatsapp_clicked: whatsapp_clicked || false,
        form_submitted: form_submitted || false,
      }, {
        onConflict: 'click_id',
      });

    if (error) {
      console.error('[PageView] Erro:', error);
      return NextResponse.json({ error: 'Erro ao registrar' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
