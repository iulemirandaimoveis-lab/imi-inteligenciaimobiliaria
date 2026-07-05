/**
 * Partner API v1 — respostas GET com ETag + revalidação condicional.
 *
 * Toda resposta é por-chave (Authorization), então o cache é `private`.
 * O ganho de escala vem do 304: parceiros fazem polling com If-None-Match
 * e só pagam o corpo quando algo mudou (ver /api/v1/availability).
 */

import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { PARTNER_API_VERSION } from './auth'

export function jsonWithETag(
    request: NextRequest,
    payload: unknown,
    { maxAge = 60 }: { maxAge?: number } = {},
): NextResponse {
    const body = JSON.stringify(payload)
    const etag = `W/"${createHash('sha1').update(body).digest('hex')}"`
    const headers: Record<string, string> = {
        ETag: etag,
        'Cache-Control': `private, max-age=${maxAge}`,
        'X-IMI-API-Version': PARTNER_API_VERSION,
        'Content-Type': 'application/json',
    }

    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304, headers })
    }
    return new NextResponse(body, { status: 200, headers })
}
