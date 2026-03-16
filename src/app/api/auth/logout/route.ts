import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
    try {
        const supabase = await createClient()
        await supabase.auth.signOut()

        const response = NextResponse.json({ success: true })

        // Clear legacy auth-token cookie if it exists
        response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Error in POST /api/auth/logout:', error)
        return NextResponse.json({ success: true }) // Still return success — user should be logged out regardless
    }
}
