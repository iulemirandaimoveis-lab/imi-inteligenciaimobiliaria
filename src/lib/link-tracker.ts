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
const DEDUP_WINDOW_MINUTES = 30;

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

  // 4. Verificar deduplicação (mesmo fingerprint + link nos últimos 30 min)
  let isUnique = true;
  if (!parsed.is_bot) {
    const windowStart = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from('link_clicks')
      .select('id')
      .eq('link_id', link.id)
      .eq('session_fingerprint', fingerprint)
      .gte('clicked_at', windowStart)
      .limit(1);

    if (existing && existing.length > 0) {
      isUnique = false;
    }
  }

  // 5. Insert click into link_clicks
  const clickInsert = supabaseAdmin
    .from('link_clicks')
    .insert({
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
      is_unique: isUnique,
    })
    .select('id')
    .single();

  // Only insert into link_events for unique clicks (avoid duplicating events)
  const eventInsert = isUnique && !parsed.is_bot
    ? supabaseAdmin.from('link_events').insert({
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
      })
    : null;

  const incrementRpc = isUnique && !parsed.is_bot
    ? supabaseAdmin.rpc('increment_link_clicks', { link_id: link.id })
    : null;

  const [clickResult] = await Promise.allSettled([
    clickInsert,
    ...(eventInsert ? [eventInsert] : []),
    ...(incrementRpc ? [incrementRpc] : []),
  ]);

  const click = clickResult.status === 'fulfilled' ? clickResult.value.data : null;
  if (clickResult.status === 'rejected' || (clickResult.status === 'fulfilled' && clickResult.value.error)) {
    const err = clickResult.status === 'rejected' ? clickResult.reason : clickResult.value.error;
    console.error('[LinkTracker] Erro ao registrar clique:', err);
    return {
      destination_url: destinationUrl,
      click_id: '',
      is_bot: parsed.is_bot,
      link_id: link.id,
    };
  }

  return {
    destination_url: destinationUrl,
    click_id: click?.id || '',
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
