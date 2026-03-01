import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder'
function getSupabase() { return createClient(supabaseUrl, supabaseKey) }

// Default user_id for single-tenant settings (no auth required)
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000'

export async function GET() {
    try {
        const supabase = getSupabase()
        // Try to fetch existing settings
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('Error fetching settings:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Convert from snake_case to camelCase
        const formattedSettings = settings ? {
            companyName: settings.company_name || '',
            companyEmail: settings.company_email || '',
            companyPhone: settings.company_phone || '',
            companyAddress: settings.company_address || '',
            emailNotifications: settings.email_notifications ?? true,
            pushNotifications: settings.push_notifications ?? true,
            weeklyReport: settings.weekly_report ?? true,
            leadAlerts: settings.lead_alerts ?? true,
            theme: settings.theme || 'dark',
            language: settings.language || 'pt-BR',
            twoFactorAuth: settings.two_factor_auth ?? false,
            sessionTimeout: settings.session_timeout?.toString() || '30',
            googleAnalytics: settings.google_analytics || '',
            facebookPixel: settings.facebook_pixel || '',
            whatsappApi: settings.whatsapp_api || '',
        } : {}

        return NextResponse.json({ settings: formattedSettings })
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = getSupabase()
        const data = await request.json()

        const payload = {
            user_id: DEFAULT_USER_ID,
            company_name: data.companyName || null,
            company_email: data.companyEmail || null,
            company_phone: data.companyPhone || null,
            company_address: data.companyAddress || null,
            email_notifications: data.emailNotifications ?? true,
            push_notifications: data.pushNotifications ?? true,
            weekly_report: data.weeklyReport ?? true,
            lead_alerts: data.leadAlerts ?? true,
            theme: data.theme || 'dark',
            language: data.language || 'pt-BR',
            two_factor_auth: data.twoFactorAuth ?? false,
            session_timeout: data.sessionTimeout !== undefined ? parseInt(data.sessionTimeout) : 30,
            google_analytics: data.googleAnalytics || null,
            facebook_pixel: data.facebookPixel || null,
            whatsapp_api: data.whatsappApi || null,
            updated_at: new Date().toISOString(),
        }

        // Check if settings row exists
        const { data: existing } = await supabase
            .from('settings')
            .select('id')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()

        let result
        if (existing) {
            // Update existing row
            const { data: updated, error } = await supabase
                .from('settings')
                .update(payload)
                .eq('id', existing.id)
                .select()
                .single()

            if (error) {
                console.error('Error updating settings:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            result = updated
        } else {
            // Insert new row
            const { data: inserted, error } = await supabase
                .from('settings')
                .insert(payload)
                .select()
                .single()

            if (error) {
                console.error('Error inserting settings:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            result = inserted
        }

        revalidatePath('/', 'layout')

        return NextResponse.json({ success: true, settings: result })
    } catch (error) {
        console.error('Error in API /settings:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
