import { Suspense } from 'react'
import { FirstAccessForm } from '@/features/users/login/FirstAccessForm'
import { Spinner } from '@/features/users/ui/primitives'

export const dynamic = 'force-dynamic'

export default function PrimeiroAcessoPage() {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <Suspense fallback={<Spinner />}>
        <FirstAccessForm />
      </Suspense>
    </main>
  )
}
