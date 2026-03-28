// =============================================================================
// IMI LINK TRACKER — TIPOS
// =============================================================================

// --- Tracked Links -----------------------------------------------------------

export type LinkChannel = 'whatsapp' | 'instagram' | 'email' | 'qrcode' | 'linkedin' | 'sms' | 'website' | 'other';

export interface TrackedLink {
  id: string;
  short_code: string;
  destination_url: string;
  corretor_id: string;
  property_id: string | null;
  campaign: string | null;
  channel: LinkChannel;
  title: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  click_count: number;
  unique_click_count: number;
}

export interface CreateTrackedLinkInput {
  destination_url: string;
  corretor_id: string;
  property_id?: string;
  campaign?: string;
  channel: LinkChannel;
  title?: string;
  expires_at?: string;
}

// --- Clicks ------------------------------------------------------------------

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

export interface LinkClick {
  id: string;
  link_id: string;
  clicked_at: string;
  ip_hash: string;
  user_agent: string;
  device_type: DeviceType;
  os: string;
  browser: string;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer: string | null;
  is_bot: boolean;
  session_fingerprint: string;
  is_unique: boolean;
}

// --- Page Views (engajamento pós-clique) ------------------------------------

export interface PageView {
  id: string;
  click_id: string;
  page_url: string;
  time_on_page_seconds: number;
  scroll_depth_percent: number;
  cta_clicked: boolean;
  whatsapp_clicked: boolean;
  form_submitted: boolean;
  created_at: string;
}

// --- Analytics DTOs ----------------------------------------------------------

export interface LinkAnalytics {
  link_id: string;
  short_code: string;
  title: string | null;
  destination_url: string;
  channel: LinkChannel;
  total_clicks: number;
  unique_clicks: number;
  bot_clicks: number;
  top_devices: { device_type: DeviceType; count: number }[];
  top_cities: { city: string; count: number }[];
  top_os: { os: string; count: number }[];
  clicks_by_hour: { hour: number; count: number }[];
  clicks_by_day: { date: string; count: number }[];
  avg_time_on_page: number | null;
  avg_scroll_depth: number | null;
  cta_click_rate: number | null;
  whatsapp_click_rate: number | null;
}

export interface RecentClick {
  click_id: string;
  link_title: string | null;
  short_code: string;
  city: string | null;
  country: string | null;
  device_type: DeviceType;
  os: string;
  browser: string;
  clicked_at: string;
  is_unique: boolean;
}

// --- Notificação Realtime ----------------------------------------------------

export interface ClickNotificationPayload {
  click_id: string;
  link_id: string;
  short_code: string;
  link_title: string | null;
  destination_url: string;
  city: string | null;
  country: string | null;
  device_type: DeviceType;
  os: string;
  browser: string;
  clicked_at: string;
  is_unique: boolean;
  corretor_id: string;
}

// --- QR Code -----------------------------------------------------------------

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  dark_color?: string;
  light_color?: string;
  logo?: boolean;
  format?: 'png' | 'svg';
}

export interface GeneratedQRCode {
  link_id: string;
  short_code: string;
  qr_data_url: string;
  qr_storage_url: string;
  destination_url: string;
}
