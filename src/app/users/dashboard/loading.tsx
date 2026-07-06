import { tokens as T } from '@/features/users/ui/tokens'
import { GlassCard, Skeleton } from '@/features/users/ui/primitives'

/**
 * Skeleton do dashboard — mesma malha de grid da página real para o
 * conteúdo "assentar" sem saltos de layout quando os dados chegam.
 */
export default function DashboardLoading() {
  return (
    <div
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding:
          'clamp(20px, 4vw, 28px) calc(clamp(16px, 3vw, 24px) + env(safe-area-inset-right, 0px)) calc(64px + env(safe-area-inset-bottom, 0px)) calc(clamp(16px, 3vw, 24px) + env(safe-area-inset-left, 0px))',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Skeleton width={148} height={10} />
        <Skeleton width={260} height={32} radius={10} style={{ margin: '12px 0 8px' }} />
        <Skeleton width={120} height={12} />
      </div>

      {/* KPI row */}
      <div className="imi-skel-kpis" style={{ marginBottom: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassCard key={i} padding={18} style={{ borderRadius: T.rMd }}>
            <Skeleton width="60%" height={10} style={{ marginBottom: 14 }} />
            <Skeleton width="45%" height={24} radius={8} />
          </GlassCard>
        ))}
      </div>

      {/* Cards */}
      <div className="imi-skel-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <GlassCard key={i} className={i < 3 ? 'imi-skel-span-2' : 'imi-skel-span-3'} padding={20}>
            <Skeleton width="40%" height={13} style={{ marginBottom: 18 }} />
            <Skeleton height={12} style={{ marginBottom: 10 }} />
            <Skeleton height={12} width="86%" style={{ marginBottom: 10 }} />
            <Skeleton height={12} width="72%" style={{ marginBottom: 10 }} />
            <Skeleton height={12} width="90%" />
          </GlassCard>
        ))}
      </div>

      <style>{`
        .imi-skel-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .imi-skel-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 720px) {
          .imi-skel-kpis { grid-template-columns: repeat(3, 1fr); }
          .imi-skel-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 1080px) {
          .imi-skel-kpis { grid-template-columns: repeat(6, 1fr); }
          .imi-skel-grid { grid-template-columns: repeat(6, 1fr); }
          .imi-skel-span-2 { grid-column: span 2; }
          .imi-skel-span-3 { grid-column: span 3; }
        }
      `}</style>
    </div>
  )
}
