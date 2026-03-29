// =============================================================================
// IMI LINK TRACKER — USER AGENT PARSER & BOT DETECTION
// =============================================================================
// Leve, sem dependências externas. Roda em Edge Runtime (Vercel).
// =============================================================================

import type { DeviceType } from '@/types/link-tracker';

// --- Bot Detection -----------------------------------------------------------

const BOT_PATTERNS = [
  // Crawlers de preview de mensageiros (principal causa de contagem dupla)
  'whatsapp', 'telegrambot', 'facebookexternalhit', 'facebot',
  'twitterbot', 'linkedinbot', 'slackbot', 'discordbot',
  'skypeuripreview', 'viber', 'line/',
  // Crawlers de busca
  'googlebot', 'bingbot', 'yandexbot', 'baiduspider',
  'duckduckbot', 'sogou', 'exabot', 'ia_archiver', 'applebot',
  // Crawlers genéricos
  'bot', 'spider', 'crawl', 'scrapy',
  'httpclient', 'python-requests', 'python-urllib',
  'curl/', 'wget/', 'headlesschrome', 'phantomjs',
  'puppeteer', 'lighthouse', 'pagespeed', 'gtmetrix',
  // Prefetch / prerender
  'prefetch', 'prerender', 'preview',
];

export function isBot(userAgent: string): boolean {
  if (!userAgent) return true;
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

// --- Device Type Detection ---------------------------------------------------

export function getDeviceType(userAgent: string): DeviceType {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();

  if (
    ua.includes('ipad') || ua.includes('tablet') ||
    (ua.includes('android') && !ua.includes('mobile')) ||
    ua.includes('kindle') || ua.includes('silk')
  ) return 'tablet';

  if (
    ua.includes('mobile') || ua.includes('iphone') || ua.includes('ipod') ||
    ua.includes('android') || ua.includes('blackberry') ||
    ua.includes('windows phone') || ua.includes('opera mini') || ua.includes('opera mobi')
  ) return 'mobile';

  if (
    ua.includes('windows') || ua.includes('macintosh') ||
    ua.includes('linux') || ua.includes('x11') || ua.includes('cros')
  ) return 'desktop';

  return 'unknown';
}

// --- OS Detection ------------------------------------------------------------

export function getOS(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  const ua = userAgent;

  const iosMatch = ua.match(/OS (\d+[._]\d+)/);
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod'))
    return `iOS ${iosMatch ? iosMatch[1].replace('_', '.') : ''}`.trim();

  const androidMatch = ua.match(/Android (\d+\.?\d*)/);
  if (androidMatch) return `Android ${androidMatch[1]}`;

  if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
  if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
  if (ua.includes('Windows NT 6.1')) return 'Windows 7';
  if (ua.includes('Windows')) return 'Windows';

  const macMatch = ua.match(/Mac OS X (\d+[._]\d+)/);
  if (macMatch) return `macOS ${macMatch[1].replace(/_/g, '.')}`;
  if (ua.includes('Macintosh')) return 'macOS';

  if (ua.includes('Ubuntu')) return 'Ubuntu';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('CrOS')) return 'ChromeOS';

  return 'Unknown';
}

// --- Browser Detection -------------------------------------------------------

export function getBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  const ua = userAgent;

  const edgeMatch = ua.match(/Edg\/(\d+)/);
  if (edgeMatch) return `Edge ${edgeMatch[1]}`;

  const operaMatch = ua.match(/OPR\/(\d+)/) || ua.match(/Opera\/(\d+)/);
  if (operaMatch) return `Opera ${operaMatch[1]}`;

  const samsungMatch = ua.match(/SamsungBrowser\/(\d+)/);
  if (samsungMatch) return `Samsung Internet ${samsungMatch[1]}`;

  const ucMatch = ua.match(/UCBrowser\/(\d+)/);
  if (ucMatch) return `UC Browser ${ucMatch[1]}`;

  const ffMatch = ua.match(/Firefox\/(\d+)/);
  if (ffMatch) return `Firefox ${ffMatch[1]}`;

  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch && !ua.includes('Chromium')) return `Chrome ${chromeMatch[1]}`;

  const safariMatch = ua.match(/Version\/(\d+)/);
  if (ua.includes('Safari') && safariMatch) return `Safari ${safariMatch[1]}`;

  if (ua.includes('wv') || ua.includes('WebView')) return 'WebView';

  return 'Unknown';
}

// --- Função consolidada ------------------------------------------------------

export interface ParsedUserAgent {
  device_type: DeviceType;
  os: string;
  browser: string;
  is_bot: boolean;
  raw: string;
}

export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  const ua = userAgent || '';
  return {
    device_type: getDeviceType(ua),
    os: getOS(ua),
    browser: getBrowser(ua),
    is_bot: isBot(ua),
    raw: ua,
  };
}
