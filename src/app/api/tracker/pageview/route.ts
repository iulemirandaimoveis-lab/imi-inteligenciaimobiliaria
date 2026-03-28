// /api/tracker/pageview — Registrar engajamento na página de destino
// Não requer auth (chamado via Beacon API pelo EngagementTracker)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rl = await rateLimit(`pageview:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const body = await request.json();
    const { click_id, page_url, time_on_page_seconds, scroll_depth_percent, cta_clicked, whatsapp_clicked, form_submitted } = body;

    if (!click_id || typeof click_id !== 'string' || click_id.length > 100) {
      return NextResponse.json({ error: 'click_id inválido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('page_views')
      .upsert({
        click_id,
        page_url: String(page_url || '').slice(0, 500),
        time_on_page_seconds: Math.min(Math.max(Number(time_on_page_seconds) || 0, 0), 86400),
        scroll_depth_percent: Math.min(Math.max(Number(scroll_depth_percent) || 0, 0), 100),
        cta_clicked: !!cta_clicked,
        whatsapp_clicked: !!whatsapp_clicked,
        form_submitted: !!form_submitted,
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
