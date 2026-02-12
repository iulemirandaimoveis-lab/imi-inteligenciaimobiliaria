import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({
        status: 'deployed',
        service: 'imi-backoffice',
        version: '2.3',
        timestamp: new Date().toISOString(),
        repo: 'imi-atlantis',
        check: 'OK'
    })
}
