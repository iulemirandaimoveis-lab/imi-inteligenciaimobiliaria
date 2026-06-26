import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getImiSession } from '@/lib/imi-auth/server'
import { LoginHero } from '@/features/users/login/LoginHero'
import { LoginForm } from '@/features/users/login/LoginForm'
import { Spinner } from '@/features/users/ui/primitives'
import { tokens as T } from '@/features/users/ui/tokens'

export const dynamic = 'force-dynamic'

export default async function UsersLoginPage() {
  // Already authenticated → straight to the console.
  const session = await getImiSession()
  if (session) redirect('/users/dashboard')

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: '1fr',
      }}
    >
      <div className="imi-login-grid">
        {/* Left — institutional hero (desktop only) */}
        <section
          className="imi-login-hero"
          style={{
            position: 'relative',
            background: `linear-gradient(160deg, ${T.bgElevated}, ${T.bgDeep})`,
            borderRight: `1px solid ${T.glassBorder}`,
          }}
        >
          <LoginHero />
        </section>

        {/* Right — login card */}
        <section
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            background: T.bg,
          }}
        >
          <Suspense fallback={<Spinner />}>
            <LoginForm />
          </Suspense>
        </section>
      </div>

      <style>{`
        .imi-login-grid { display: grid; grid-template-columns: 1fr; min-height: 100dvh; }
        .imi-login-hero { display: none; }
        @media (min-width: 1024px) {
          .imi-login-grid { grid-template-columns: 1.05fr 1fr; }
          .imi-login-hero { display: block; }
        }
      `}</style>
    </main>
  )
}
