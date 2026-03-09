import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format currency in BRL
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
}

/**
 * Format price in abbreviated BRL — PropTech style
 * R$ 850.000 → "R$ 850 mil"
 * R$ 1.250.000 → "R$ 1,25 mi"
 * R$ 12.500.000 → "R$ 12,5 mi"
 */
export function fmtShort(value: number | null | undefined): string {
    if (value == null || value === 0) return '—'
    if (value >= 1_000_000) {
        const mi = value / 1_000_000
        const formatted = mi % 1 === 0
            ? mi.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
            : mi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
        return `R$ ${formatted} mi`
    }
    if (value >= 1_000) {
        const mil = value / 1_000
        const formatted = mil % 1 === 0
            ? mil.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
            : mil.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
        return `R$ ${formatted} mil`
    }
    return `R$ ${value.toLocaleString('pt-BR')}`
}

/**
 * Calculate price per square meter
 * Returns formatted string or null if not computable
 */
export function calcPricePerSqm(
    price: number | null | undefined,
    area: number | null | undefined
): string | null {
    if (!price || !area || area === 0) return null
    const ppsqm = price / area
    return `R$ ${Math.round(ppsqm).toLocaleString('pt-BR')}/m²`
}

/**
 * Format number with K/M suffix (for counts)
 * 1500 → "1,5K"
 * 2_300_000 → "2,3M"
 */
export function fmtCount(value: number | null | undefined): string {
    if (value == null) return '—'
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}K`
    }
    return value.toLocaleString('pt-BR')
}

/**
 * Format date relative to now (pt-BR)
 * Returns "há 2 dias", "há 3 horas", etc.
 */
export function fmtRelative(date: string | Date | null | undefined): string {
    if (!date) return '—'
    const d = typeof date === 'string' ? new Date(date) : date
    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    const diffH = Math.floor(diffMin / 60)
    const diffD = Math.floor(diffH / 24)
    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `há ${diffMin} min`
    if (diffH < 24) return `há ${diffH}h`
    if (diffD === 1) return 'ontem'
    if (diffD < 7) return `há ${diffD} dias`
    if (diffD < 30) return `há ${Math.floor(diffD / 7)} sem`
    if (diffD < 365) return `há ${Math.floor(diffD / 30)} meses`
    return `há ${Math.floor(diffD / 365)} ano${Math.floor(diffD / 365) > 1 ? 's' : ''}`
}

/**
 * Generate slug from text
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}
