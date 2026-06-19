import QRCode from 'qrcode'
import { createHash } from 'crypto'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'

export function generateQrHash(data: {
  id: string
  numero_laudo: string
  endereco: string
  created_at: string
}): string {
  const payload = [data.id, data.numero_laudo, data.endereco, data.created_at].join('|')
  return createHash('sha256').update(payload).digest('hex').slice(0, 32)
}

export function buildVerificacaoUrl(hash: string): string {
  return `${SITE_URL}/verificar?hash=${hash}`
}

export async function generateQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    width: 160,
    margin: 1,
    color: { dark: '#050B14', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
  })
}

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#050B14', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
    type: 'image/png',
  })
}
