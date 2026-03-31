// =============================================================================
// IMI LINK TRACKER — CORE LIB
// =============================================================================
// Funções server-side para criação de links, deduplicação e tracking.
// Compatível com Vercel Edge Runtime (usa Web Crypto API).
// =============================================================================

import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseUserAgent } from './user-agent';
import type { CreateTrackedLinkInput, TrackedLink } from '@/types/link-tracker';

// --- Constantes --------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br';

// --- Geração de Short Code ---------------------------------------------------

function generateShortCode(length = 7): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

// --- Fingerprint (para deduplicação) -----------------------------------------

async function generateFingerprint(ip: string, userAgent: string, date: string): Promise<string> {
  const data = `${ip}|${userAgent}|${date}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Hash de IP (LGPD compliance) --------------------------------------------

async function hashIP(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT || 'imi-link-tracker-2026';
  const data = `${salt}|${ip}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Criar Link Rastreável ---------------------------------------------------

export async function createTrackedLink(input: CreateTrackedLinkInput): Promise<TrackedLink> {
  let shortCode: string;
  let attempts = 0;
  do {
    shortCode = generateShortCode();
    const { data: existing } = await supabaseAdmin
      .from('tracked_links')
      .select('id')
      .eq('short_code', shortCode)
      .single();
    if (!existing) break;
    attempts++;
  } while (attempts < 5);

  if (attempts >= 5) {
    throw new Error('Falha ao gerar short_code único após 5 tentativas');
  }

  const { data, error } = await supabaseAdmin
    .from('tracked_links')
    .insert({
      short_code: shortCode,
      url: input.destination_url,
      destination_url: input.destination_url,
      corretor_id: input.corretor_id,
      broker_id: input.corretor_id,
      created_by: input.corretor_id,
      development_id: input.property_id || null,
      campaign_name: input.campaign || null,
      channel: input.channel,
      title: input.title || null,
      expires_at: input.expires_at || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar link: ${error.message}`);
  return data as TrackedLink;
}

// --- Resolver Clique (rota de redirect) --------------------------------------

export interface ResolveClickInput {
  shortCode: string;
  ip: string;
  userAgent: string;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
}

export interface ResolveClickResult {
  destination_url: string;
  click_id: string;
  is_bot: boolean;
  link_id: string;
}

export async function resolveClick(input: ResolveClickInput): Promise<ResolveClickResult | null> {
  // 1. Buscar o link (supports both destination_url and url columns)
  const { data: link, error: linkError } = await supabaseAdmin
    .from('tracked_links')
    .select('id, destination_url, url, is_active, expires_at')
    .eq('short_code', input.shortCode)
    .single();

  if (linkError || !link) return null;
  if (link.is_active === false) return null;
  if (link.expires_at && new Date(link.expires_at) < new Date()) return null;

  const destinationUrl = link.destination_url || link.url;
  if (!destinationUrl) return null;

  // 2. Parsear User-Agent
  const parsed = parseUserAgent(input.userAgent);

  // 3. Gerar fingerprint e hash do IP
  const today = new Date().toISOString().split('T')[0];
  const [fingerprint, ipHash] = await Promise.all([
    generateFingerprint(input.ip, input.userAgent, today),
    hashIP(input.ip),
  ]);

  // 4. Insert click with DB-level dedup (UNIQUE INDEX on link_id + session_fingerprint)
  //    ON CONFLICT DO NOTHING prevents race conditions — no check-then-insert needed.
  const { data: clickRow, error: clickErr } = await supabaseAdmin
    .from('link_clicks')
    .upsert(
      {
        link_id: link.id,
        ip_hash: ipHash,
        user_agent: input.userAgent,
        device_type: parsed.device_type,
        os: parsed.os,
        browser: parsed.browser,
        country: input.country,
        region: input.region,
        city: input.city,
        referrer: input.referrer,
        is_bot: parsed.is_bot,
        session_fingerprint: fingerprint,
        is_unique: true,
      },
      { onConflict: 'link_id,session_fingerprint', ignoreDuplicates: true }
    )
    .select('id')
    .maybeSingle();

  // If clickRow is null, the insert was skipped (duplicate) → not unique
  const isUnique = !!clickRow && !clickErr;

  if (clickErr) {
    console.error('[LinkTracker] Erro ao registrar clique:', clickErr);
    return {
      destination_url: destinationUrl,
      click_id: '',
      is_bot: parsed.is_bot,
      link_id: link.id,
    };
  }

  // 5. Only insert event + increment counter for unique non-bot clicks
  if (isUnique && !parsed.is_bot) {
    // Fetch development_id for lead scoring
    const { data: linkFull } = await supabaseAdmin
      .from('tracked_links')
      .select('development_id, broker_id, corretor_id')
      .eq('id', link.id)
      .single();

    await Promise.allSettled([
      supabaseAdmin.from('link_events').insert({
        tracked_link_id: link.id,
        event_type: 'click',
        device_type: parsed.device_type,
        browser: parsed.browser,
        os: parsed.os,
        ip_address: ipHash,
        referrer: input.referrer,
        location: [input.city, input.region, input.country].filter(Boolean).join(', '),
        metadata: {
          city: input.city,
          region: input.region,
          country: input.country,
          is_bot: parsed.is_bot,
          fingerprint,
        },
      }),
      supabaseAdmin.rpc('increment_link_clicks', { link_id: link.id }),
      // Upsert lead score (engagement scoring from spec)
      linkFull?.development_id ? supabaseAdmin
        .from('tracker_lead_scores')
        .upsert({
          visitor_fingerprint: fingerprint,
          development_id: linkFull.development_id,
          broker_id: linkFull.broker_id || linkFull.corretor_id || null,
          current_score: 5, // Base click score — updated on page engagement
          score_category: 'cold',
          score_trend: 'new',
          intent_classification: 'browsing',
          urgency_level: 'low',
          total_sessions: 1,
          total_clicks: 1,
          first_session_at: new Date().toISOString(),
          last_session_at: new Date().toISOString(),
        }, {
          onConflict: 'visitor_fingerprint,development_id',
          ignoreDuplicates: false,
        }) : Promise.resolve(),
    ]);
  }

  return {
    destination_url: destinationUrl,
    click_id: clickRow?.id || '',
    is_bot: parsed.is_bot,
    link_id: link.id,
  };
}

// --- Registrar Page View (engajamento) ---------------------------------------

export interface PageViewInput {
  click_id: string;
  page_url: string;
  time_on_page_seconds: number;
  scroll_depth_percent: number;
  cta_clicked: boolean;
  whatsapp_clicked: boolean;
  form_submitted: boolean;
}

export async function recordPageView(input: PageViewInput): Promise<void> {
  const { error } = await supabaseAdmin.from('page_views').upsert(
    {
      click_id: input.click_id,
      page_url: input.page_url,
      time_on_page_seconds: input.time_on_page_seconds,
      scroll_depth_percent: input.scroll_depth_percent,
      cta_clicked: input.cta_clicked,
      whatsapp_clicked: input.whatsapp_clicked,
      form_submitted: input.form_submitted,
    },
    { onConflict: 'click_id' }
  );

  if (error) console.error('[LinkTracker] Erro ao registrar page view:', error);

  // Update engagement score via SQL function if click has a linked session
  if (input.click_id) {
    const clickedCta = input.cta_clicked || input.whatsapp_clicked || input.form_submitted;
    await supabaseAdmin.rpc('fn_calculate_engagement_score', {
      p_total_seconds: input.time_on_page_seconds,
      p_scroll_depth: input.scroll_depth_percent,
      p_page_count: 1,
      p_clicked_cta: clickedCta,
      p_is_return: false,
      p_visit_number: 1,
    }).then(() => { /* noop */ }, () => { /* noop */ });
  }
}

// --- Buscar Links do Corretor ------------------------------------------------

export async function getCorretorLinks(corretorId: string): Promise<TrackedLink[]> {
  const { data, error } = await supabaseAdmin
    .from('tracked_links')
    .select('*')
    .or(`corretor_id.eq.${corretorId},broker_id.eq.${corretorId},created_by.eq.${corretorId}`)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar links: ${error.message}`);
  return (data || []) as TrackedLink[];
}

// --- Gerar URLs --------------------------------------------------------------

export function getTrackedUrl(shortCode: string): string {
  return `${BASE_URL}/l/${shortCode}`;
}
