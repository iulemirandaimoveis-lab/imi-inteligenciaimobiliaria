import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── AbacatePay API ──────────────────────────────────────────────────────────
const ABACATE_BASE = 'https://api.abacatepay.com/v1'

function getToken(): string | null {
    return process.env.ABACATEPAY_TOKEN ?? null
}

// ─── GET /api/abacate-pay — Check connection status ──────────────────────────
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const token = getToken()
        if (!token) {
            return NextResponse.json({
                connected: false,
                message: 'ABACATEPAY_TOKEN não configurado',
            })
        }

        // Verify connection by listing billings (simple health check)
        const res = await fetch(`${ABACATE_BASE}/store/get`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        })
        const data = await res.json()

        if (data.error) {
            return NextResponse.json({ connected: false, message: data.error })
        }

        return NextResponse.json({
            connected: true,
            store: data.data,
        })
    } catch (err) {
        console.error('[abacate-pay] GET error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erro ao conectar AbacatePay' },
            { status: 500 }
        )
    }
}

// ─── POST /api/abacate-pay — Create billing link (PIX + CARD) ─────────────────
// Body: { amount: number (BRL), description: string, transactionId?: string,
//         customer?: { name, email, taxId, cellphone }, methods?: ('PIX'|'CARD')[] }
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const token = getToken()
        if (!token) {
            return NextResponse.json(
                { error: 'ABACATEPAY_TOKEN não configurado nas variáveis de ambiente' },
                { status: 400 }
            )
        }

        const body = await req.json()
        const {
            amount,
            description,
            transactionId,
            customer,
            methods = ['PIX'],
        } = body

        if (!amount || Number(amount) <= 0) {
            return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
        }

        const amountInCents = Math.round(Number(amount) * 100)

        // Build AbacatePay billing payload
        const payload: Record<string, unknown> = {
            frequency: 'ONE_TIME',
            methods: methods as string[],
            products: [
                {
                    externalId: transactionId ?? `txn-${Date.now()}`,
                    name: description || 'Pagamento IMI',
                    description: description || 'Cobrança via IMI Inteligência Imobiliária',
                    quantity: 1,
                    price: amountInCents,
                },
            ],
            returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.iulemirandaimoveis.com.br'}/backoffice/financeiro`,
            completionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.iulemirandaimoveis.com.br'}/backoffice/financeiro?pago=1`,
        }

        if (customer) {
            // Inline customer creation
            payload.customer = {
                name: customer.name,
                email: customer.email ?? undefined,
                cellphone: customer.cellphone ?? undefined,
                taxId: customer.taxId ?? undefined,
            }
        }

        const res = await fetch(`${ABACATE_BASE}/billing/create`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const data = await res.json()
        if (data.error) throw new Error(`AbacatePay billing error: ${data.error}`)
        if (!data.data?.id) throw new Error(`AbacatePay: resposta inválida — ${JSON.stringify(data)}`)

        const billing = data.data

        return NextResponse.json({
            billing: {
                id: billing.id as string,
                url: billing.url as string,
                amount: billing.amount as number, // centavos
                status: billing.status as string,
                devMode: billing.devMode as boolean,
                methods: billing.methods as string[],
            },
        })
    } catch (err) {
        console.error('[abacate-pay] POST error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erro interno AbacatePay' },
            { status: 500 }
        )
    }
}
