import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, apiSuccess, apiError } from '@/lib/rate-limit'
import { AppError, ValidationError } from '@/lib/errors'

export async function POST(request: NextRequest) {
    try {
        // Enforce Rate Limit: 3 requests per IP per minute
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anon'
        const rl = rateLimit(ip, { limit: 3, windowMs: 60000 })

        if (!rl.success) {
            throw new AppError('Excesso de tentativas. Tente novamente em alguns minutos.', 429, 'RATE_LIMIT_EXCEEDED')
        }

        const data = await request.json()
        const supabase = await createClient()

        // Validate required fields
        const requiredFields = ['name', 'phone']
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new ValidationError(`Campo obrigatório ausente: ${field}`)
            }
        }

        // Store in Supabase 'leads' table
        const { error } = await supabase.from('leads').insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            origin: 'website-contact', // Identifying the origin
            message: data.message,
            interest: data.interest || 'Geral', // Optional interest
            status: 'new'
        })

        if (error) {
            console.error('Supabase insert error (Contact):', error)
            throw new AppError('Falha ao registrar lead no Supabase', 500, 'DATABASE_ERROR', error)
        }

        return apiSuccess({ message: 'Mensagem recebida com sucesso' }, 201)
    } catch (error) {
        return apiError(error)
    }
}
