import { Property, PropertyStatus, PropertyType } from '../types'

export const propertyStatusLabels: Record<PropertyStatus, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    sold: 'Vendido',
}

export const propertyStatusColors: Record<PropertyStatus, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-slate-100 text-slate-600',
    pending: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-red-100 text-red-800',
}

export const propertyTypeLabels: Record<PropertyType, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    penthouse: 'Cobertura',
    studio: 'Studio',
    land: 'Terreno',
    commercial: 'Comercial',
    resort: 'Resort/Hotel',
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
    }).format(value)
}

export function formatCurrencyCompact(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value)
}

export function formatArea(area: number): string {
    return `${area.toLocaleString('pt-BR')}m²`
}

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR')
}

export function formatMonth(month: string): string {
    const [year, monthNum] = month.split('-')
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return `${months[parseInt(monthNum) - 1]} ${year}`
}

export function calculatePropertyScore(property: Property): number {
    let score = 50 // Base score

    // Imagem principal (+10)
    if (property.image) score += 10

    // Galeria de imagens (+5 por cada, max 15)
    if (property.gallery_images) {
        score += Math.min(property.gallery_images.length * 5, 15)
    }

    // Plantas (+10)
    if (property.floor_plans && property.floor_plans.length > 0) {
        score += 10
    }

    // Tour virtual (+15)
    if (property.virtual_tour_url) score += 15

    // Descrição completa (+10)
    if (property.description && property.description.length > 100) {
        score += 10
    }

    // Características completas (+5 cada)
    if (property.bedrooms) score += 5
    if (property.bathrooms) score += 5
    if (property.parking_spaces) score += 5
    if (property.area_from) score += 5

    // Construtora vinculada (+10)
    if (property.developer_id) score += 10

    return Math.min(score, 100)
}

export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

export function getPropertyUrl(property: Property): string {
    return `/imoveis/${property.slug}`
}

export function getPropertyShareText(property: Property): string {
    return `Confira este imóvel incrível: ${property.name} - A partir de ${formatCurrency(property.price_from)}`
}
