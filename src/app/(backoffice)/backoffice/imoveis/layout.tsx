import { ImoveisSubNav } from './SubNav'

export default function ImoveisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ImoveisSubNav />
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  )
}
