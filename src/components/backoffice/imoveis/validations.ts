import { z } from 'zod'

export const propertySchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
    slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
    description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
    developer_id: z.string().uuid('Selecione uma construtora válida'),
    type: z.enum(['apartment', 'house', 'penthouse', 'studio', 'land', 'commercial', 'resort']),
    status: z.enum(['active', 'inactive', 'pending', 'sold']),
    status_commercial: z.enum(['draft', 'published', 'campaign', 'private', 'sold']),

    address: z.string().min(5, 'Endereço obrigatório'),
    neighborhood: z.string().min(2, 'Bairro obrigatório'),
    city: z.string().min(2, 'Cidade obrigatória'),
    state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)'),
    country: z.string().min(2, 'País obrigatório').default('Brasil'),
    region: z.enum(['paraiba', 'pernambuco', 'sao-paulo', 'dubai', 'usa', 'other']),
    zipcode: z.string().optional().or(z.literal('')),

    price_from: z.number().positive('Preço deve ser maior que zero'),
    price_to: z.number().positive().nullable(),

    bedrooms: z.number().int().min(0).nullable(),
    bathrooms: z.number().int().min(0).nullable(),
    parking_spaces: z.number().int().min(0).nullable(),
    area_from: z.number().positive().nullable(),
    area_to: z.number().positive().nullable(),
    units: z.number().int().positive('Número de unidades deve ser maior que zero'),
    floors: z.number().int().positive().nullable(),

    delivery: z.string().nullable(),
    launch_date: z.string().nullable(),

    featured: z.boolean(),
    image: z.string().optional().or(z.literal('')),
    gallery_images: z.array(z.string()).optional().default([]),
    floor_plans: z.array(z.string()).optional().default([]),
    target_audience: z.string().optional().nullable(),
    selling_points: z.array(z.string()).optional().nullable(),
}).refine(
    (data) => !data.price_to || data.price_to >= data.price_from,
    {
        message: 'Preço máximo deve ser maior ou igual ao preço mínimo',
        path: ['price_to'],
    }
).refine(
    (data) => !data.area_to || !data.area_from || data.area_to >= data.area_from,
    {
        message: 'Área máxima deve ser maior ou igual à área mínima',
        path: ['area_to'],
    }
)

export const propertyUnitSchema = z.object({
    unit_number: z.string().min(1, 'Número da unidade obrigatório'),
    floor: z.number().int().min(0, 'Andar inválido'),
    type: z.string().min(1, 'Tipo obrigatório'),
    bedrooms: z.number().int().min(0),
    bathrooms: z.number().int().min(0),
    area: z.number().positive('Área deve ser maior que zero'),
    price: z.number().positive('Preço deve ser maior que zero'),
    status: z.enum(['available', 'reserved', 'sold']),
})

export const propertyEventSchema = z.object({
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: z.string().nullable(),
    event_date: z.string().min(1, 'Data do evento obrigatória'),
    location: z.string().nullable(),
    max_attendees: z.number().int().positive().nullable(),
    status: z.enum(['scheduled', 'completed', 'cancelled']),
})

export type PropertyFormData = z.infer<typeof propertySchema>
export type PropertyUnitFormData = z.infer<typeof propertyUnitSchema>
export type PropertyEventFormData = z.infer<typeof propertyEventSchema>
