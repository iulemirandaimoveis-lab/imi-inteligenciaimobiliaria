export default function InteligenciaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {children}
    </div>
  )
}
