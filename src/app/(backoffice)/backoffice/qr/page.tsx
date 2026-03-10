'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/** Legacy QR page redirects to the real tracking module */
export default function QRLegacyRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/backoffice/tracking/qr')
    }, [router])
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--bo-text-muted)' }} />
        </div>
    )
}
