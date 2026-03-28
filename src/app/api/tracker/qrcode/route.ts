// /api/tracker/qrcode — Gerar QR Code para um link rastreável
// Requer auth + ownership do link

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateAndUploadQRCode, generateQRCodeVariants } from '@/lib/qr-code';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { link_id, variants } = body;

    if (!link_id) {
      return NextResponse.json({ error: 'link_id obrigatório' }, { status: 400 });
    }

    const { data: link, error: linkError } = await supabaseAdmin
      .from('tracked_links')
      .select('id, short_code, corretor_id, destination_url')
      .eq('id', link_id)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 });
    }

    if (link.corretor_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const qrCode = await generateAndUploadQRCode(link.id, link.short_code);

    let qrVariants = null;
    if (variants) {
      qrVariants = await generateQRCodeVariants(link.short_code);
    }

    return NextResponse.json({ ...qrCode, variants: qrVariants });
  } catch (error) {
    console.error('[QRCode] Erro:', error);
    return NextResponse.json({ error: 'Erro ao gerar QR code' }, { status: 500 });
  }
}
