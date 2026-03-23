import { NextRequest, NextResponse } from 'next/server'

// Legacy route — redirect to canonical /l/ tracking route
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params
    // Redirect to the canonical tracking route
    const url = new URL(`/l/${code}`, req.url)
    // Pass through any query params
    req.nextUrl.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value)
    })
    return NextResponse.redirect(url, 301)
}
