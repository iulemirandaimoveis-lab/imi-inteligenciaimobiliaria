import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDevelopmentBySlug } from '@/lib/lotmap/engine'
import ManagerDashboard from '@/features/lotmap/components/ManagerDashboard'

interface Props {
  params: Promise<{ lang: string; slug: string }>
}

const BG   = '#05080F';
const T1   = '#E8E4DC';
const T3   = '#4F5B6B';
const GOLD = '#C8A44A';

export default async function DashboardPage({ params }: Props) {
  const { lang, slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${lang}/login?redirect=/${lang}/empreendimentos/${slug}/dashboard`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    redirect(`/${lang}/empreendimentos/${slug}`)
  }

  // Look up development config — try engine registry first, then DB
  const engineConfig = getDevelopmentBySlug(slug)

  const { data: dev } = await supabase
    .from('developments')
    .select('id, title, slug')
    .eq('slug', slug)
    .single()

  if (!dev && !engineConfig) {
    redirect(`/${lang}/empreendimentos`)
  }

  const devId   = engineConfig?.id ?? dev?.id ?? ''
  const devName = engineConfig?.name ?? dev?.title ?? slug

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(5,8,15,0.94)',
        backdropFilter: 'blur(28px)',
        borderBottom: '1px solid rgba(200,164,74,0.12)',
        boxShadow: '0 1px 0 rgba(200,164,74,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 60, padding: '0 20px' }}>
          <a
            href={`/${lang}/empreendimentos/${slug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
              color: T3, textDecoration: 'none', fontSize: 18,
            }}
            aria-label="Voltar"
          >
            ‹
          </a>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T1, letterSpacing: '-0.2px' }}>Dashboard</div>
            <div style={{ fontSize: 11, color: T3, letterSpacing: '0.2px' }}>{devName}</div>
          </div>
          <a
            href={`/${lang}/empreendimentos/${slug}/mapa`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 14px', borderRadius: 9,
              background: 'rgba(200,164,74,0.10)',
              border: '1px solid rgba(200,164,74,0.28)',
              color: GOLD, fontSize: 11, fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Ver Mapa
          </a>
        </div>
      </div>

      {/* Dashboard content */}
      <div style={{ padding: '20px 16px 80px', maxWidth: 600, margin: '0 auto' }}>
        <ManagerDashboard developmentId={devId} developmentName={devName} />
      </div>
    </div>
  )
}
