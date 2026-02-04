import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs';

/**
 * GET /api/properties/[id]
 * Busca um imóvel específico
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const property = await prisma.property.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: {
                        accessLogs: true,
                        clientLinks: true
                    }
                }
            }
        })

        if (!property) {
            return NextResponse.json(
                { success: false, error: 'Imóvel não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: property
        })
    } catch (error) {
        console.error('Error fetching property:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar imóvel' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/properties/[id]
 * Atualiza um imóvel
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()

        const {
            title,
            description,
            listPrice,
            area,
            bedrooms,
            bathrooms,
            address,
            city,
            state,
            country,
            zipCode,
            coordinates,
            status,
            featured,
            propertyType,
            location,
            estimatedRent,
            rentalType,
            grossYield,
            netYield,
            images,
            virtualTourUrl,
            documentsUrl,
            slug
        } = body

        // Verifica se imóvel existe
        const existing = await prisma.property.findUnique({
            where: { id: params.id }
        })

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Imóvel não encontrado' },
                { status: 404 }
            )
        }

        // Atualiza o imóvel
        const property = await prisma.property.update({
            where: { id: params.id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(listPrice !== undefined && { listPrice }),
                ...(area !== undefined && { area }),
                ...(bedrooms !== undefined && { bedrooms }),
                ...(bathrooms !== undefined && { bathrooms }),
                ...(address && { address }),
                ...(city && { city }),
                ...(state && { state }),
                ...(country && { country }),
                ...(zipCode && { zipCode }),
                ...(coordinates !== undefined && { coordinates }),
                ...(status && { status }),
                ...(featured !== undefined && { featured }),
                ...(propertyType && { propertyType }),
                ...(location && { location }),
                ...(estimatedRent !== undefined && { estimatedRent }),
                ...(rentalType !== undefined && { rentalType }),
                ...(grossYield !== undefined && { grossYield }),
                ...(netYield !== undefined && { netYield }),
                ...(images && { images }),
                ...(virtualTourUrl !== undefined && { virtualTourUrl }),
                ...(documentsUrl && { documentsUrl }),
                ...(slug !== undefined && { slug })
            }
        })

        return NextResponse.json({
            success: true,
            data: property
        })
    } catch (error) {
        console.error('Error updating property:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar imóvel' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/properties/[id]
 * Deleta um imóvel
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verifica se imóvel existe
        const property = await prisma.property.findUnique({
            where: { id: params.id }
        })

        if (!property) {
            return NextResponse.json(
                { success: false, error: 'Imóvel não encontrado' },
                { status: 404 }
            )
        }

        // Deleta imagens do Supabase Storage se existirem
        if (property.images && property.images.length > 0) {
            try {
                const imagePaths = property.images.map(imgUrl => {
                    const url = new URL(imgUrl)
                    return url.pathname.split('/').pop() || ''
                }).filter(Boolean)

                if (imagePaths.length > 0) {
                    await supabaseAdmin.storage
                        .from('property-images')
                        .remove(imagePaths)
                }
            } catch (storageError) {
                console.error('Error deleting images from storage:', storageError)
                // Continua mesmo se falhar a deleção das imagens
            }
        }

        // Deleta o imóvel (cascade deleta logs)
        await prisma.property.delete({
            where: { id: params.id }
        })

        return NextResponse.json({
            success: true,
            message: 'Imóvel deletado com sucesso'
        })
    } catch (error) {
        console.error('Error deleting property:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar imóvel' },
            { status: 500 }
        )
    }
}
