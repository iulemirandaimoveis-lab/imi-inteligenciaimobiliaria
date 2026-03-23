export const TYPE_LABELS: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    penthouse: 'Cobertura',
    studio: 'Studio',
    loft: 'Loft',
    land: 'Terreno',
    commercial: 'Comercial',
    villa: 'Villa',
    flat: 'Flat',
    garden: 'Garden',
    duplex: 'Duplex',
    triplex: 'Triplex',
}

export function translateType(type: string): string {
    return TYPE_LABELS[type?.toLowerCase()] || type || 'Imovel'
}
