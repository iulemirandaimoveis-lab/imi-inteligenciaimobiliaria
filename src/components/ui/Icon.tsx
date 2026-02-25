/**
 * Material Symbols Outlined Icon Component
 * Uses Google Fonts Material Symbols
 */

interface IconProps {
    name: string
    className?: string
    size?: number
    filled?: boolean
}

export default function Icon({ name, className = '', size, filled = false }: IconProps) {
    return (
        <span
            className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
            style={size ? { fontSize: `${size}px` } : undefined}
        >
            {name}
        </span>
    )
}
