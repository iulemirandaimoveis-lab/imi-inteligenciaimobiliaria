// =============================================================================
// IMI LINK TRACKER — QR CODE GENERATOR
// =============================================================================
// Gera QR Codes com branding IMI (cores da marca).
// Usa a lib 'qrcode' (Node.js, server-side).
// =============================================================================

import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getTrackedUrl } from './link-tracker';
import type { QRCodeOptions, GeneratedQRCode } from '@/types/link-tracker';

// --- Defaults da marca IMI ---------------------------------------------------

const IMI_DEFAULTS: Required<QRCodeOptions> = {
  size: 512,
  margin: 2,
  dark_color: '#07070A',   // --imi-black
  light_color: '#F0EFE8',  // --imi-white
  logo: false,
  format: 'png',
};

// --- Gerar QR Code como Data URL ---------------------------------------------

export async function generateQRCodeDataUrl(
  shortCode: string,
  options?: QRCodeOptions
): Promise<string> {
  const opts = { ...IMI_DEFAULTS, ...options };
  const url = getTrackedUrl(shortCode);

  return QRCode.toDataURL(url, {
    width: opts.size,
    margin: opts.margin,
    color: { dark: opts.dark_color, light: opts.light_color },
    errorCorrectionLevel: opts.logo ? 'H' : 'M',
    type: 'image/png',
  });
}

// --- Gerar QR Code como Buffer (para upload) ---------------------------------

export async function generateQRCodeBuffer(
  shortCode: string,
  options?: QRCodeOptions
): Promise<Buffer> {
  const opts = { ...IMI_DEFAULTS, ...options };
  const url = getTrackedUrl(shortCode);

  return QRCode.toBuffer(url, {
    width: opts.size,
    margin: opts.margin,
    color: { dark: opts.dark_color, light: opts.light_color },
    errorCorrectionLevel: opts.logo ? 'H' : 'M',
    type: 'png',
  });
}

// --- Gerar QR Code como SVG String -------------------------------------------

export async function generateQRCodeSVG(
  shortCode: string,
  options?: QRCodeOptions
): Promise<string> {
  const opts = { ...IMI_DEFAULTS, ...options };
  const url = getTrackedUrl(shortCode);

  return QRCode.toString(url, {
    type: 'svg',
    width: opts.size,
    margin: opts.margin,
    color: { dark: opts.dark_color, light: opts.light_color },
    errorCorrectionLevel: 'M',
  });
}

// --- Gerar e fazer upload pro Supabase Storage --------------------------------

export async function generateAndUploadQRCode(
  linkId: string,
  shortCode: string,
  options?: QRCodeOptions
): Promise<GeneratedQRCode> {
  const buffer = await generateQRCodeBuffer(shortCode, options);
  const dataUrl = await generateQRCodeDataUrl(shortCode, options);

  const filePath = `qrcodes/${shortCode}.png`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('tracker-assets')
    .upload(filePath, buffer, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    console.error('[QRCode] Erro no upload:', uploadError);
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from('tracker-assets')
    .getPublicUrl(filePath);

  return {
    link_id: linkId,
    short_code: shortCode,
    qr_data_url: dataUrl,
    qr_storage_url: publicUrl.publicUrl,
    destination_url: getTrackedUrl(shortCode),
  };
}

// --- Gerar QR Code com variações (para material impresso) --------------------

export async function generateQRCodeVariants(shortCode: string) {
  const [dark, light, gold] = await Promise.all([
    generateQRCodeDataUrl(shortCode, { dark_color: '#07070A', light_color: '#FFFFFF' }),
    generateQRCodeDataUrl(shortCode, { dark_color: '#F0EFE8', light_color: '#07070A' }),
    generateQRCodeDataUrl(shortCode, { dark_color: '#C4A265', light_color: '#07070A' }),
  ]);

  return { dark, light, gold };
}
