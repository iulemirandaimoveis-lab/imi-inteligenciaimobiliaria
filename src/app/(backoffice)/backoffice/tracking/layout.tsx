import { TrackingSubNav } from './SubNav'

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TrackingSubNav />
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  )
}
