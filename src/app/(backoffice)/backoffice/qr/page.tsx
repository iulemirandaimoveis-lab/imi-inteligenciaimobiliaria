import { redirect } from 'next/navigation'

// Legacy QR page — redireciona para o módulo real de tracking
export default function QRLegacyRedirect() {
    redirect('/backoffice/tracking/qr')
}
