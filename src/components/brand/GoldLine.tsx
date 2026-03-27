interface GoldLineProps {
  className?: string
  opacity?: number
}
export default function GoldLine({ className = '', opacity = 0.4 }: GoldLineProps) {
  return (
    <div
      className={className}
      style={{
        height: 2,
        background: `linear-gradient(90deg, transparent, rgba(200,164,74,${opacity}), transparent)`,
        borderRadius: 1,
      }}
    />
  )
}
