'use client'

import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'

export default function GlobalToaster() {
    const pathname = usePathname()
    const isBackofficeRoute = pathname?.startsWith('/backoffice')

    if (isBackofficeRoute) return null

    return (
        <Toaster
            position="top-center"
            closeButton
            theme="dark"
            toastOptions={{
                duration: 4000,
                style: {
                    background: 'var(--imi-navy-900, #0B1120)',
                    border: '1px solid var(--imi-gold-700, #8A6820)',
                    borderLeft: '3px solid var(--imi-gold-500, #B8943A)',
                    color: 'var(--imi-gold-100, #F4EACC)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    borderRadius: '14px',
                    boxShadow: '0 10px 25px -5px rgba(11, 17, 32, 0.5), 0 0 15px -3px rgba(200, 164, 74, 0.1)',
                },
            }}
        />
    )
}
