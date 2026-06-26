import { Suspense } from 'react'
import { ForgotForm } from '@/features/users/login/ForgotForm'
import { Spinner } from '@/features/users/ui/primitives'

export const dynamic = 'force-dynamic'

export default function ForgotPage() {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <Suspense fallback={<Spinner />}>
        <ForgotForm />
      </Suspense>
    </main>
  )
}
