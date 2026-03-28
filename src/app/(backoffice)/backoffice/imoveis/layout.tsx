import { ImoveisSubNav } from './SubNav'

export default function ImoveisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="hidden lg:block">
        <ImoveisSubNav />
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  )
}
