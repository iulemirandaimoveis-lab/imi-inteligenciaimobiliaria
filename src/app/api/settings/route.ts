import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Convert from snake_case to camelCase
        const formattedSettings = settings ? {
            companyName: settings.company_name,
            companyEmail: settings.company_email,
            companyPhone: settings.company_phone,
            companyAddress: settings.company_address,
            emailNotifications: settings.email_notifications,
            pushNotifications: settings.push_notifications,
            weeklyReport: settings.weekly_report,
            leadAlerts: settings.lead_alerts,
            theme: settings.theme,
            language: settings.language,
            twoFactorAuth: settings.two_factor_auth,
            sessionTimeout: settings.session_timeout?.toString() || '30',
            googleAnalytics: settings.google_analytics,
            facebookPixel: settings.facebook_pixel,
            whatsappApi: settings.whatsapp_api,
        } : null;

        return NextResponse.json({ settings: formattedSettings || {} });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: updated, error } = await supabase
            .from('settings')
            .upsert({
                user_id: user.id,
                company_name: data.companyName,
                company_email: data.companyEmail,
                company_phone: data.companyPhone,
                company_address: data.companyAddress,
                email_notifications: data.emailNotifications,
                push_notifications: data.pushNotifications,
                weekly_report: data.weeklyReport,
                lead_alerts: data.leadAlerts,
                theme: data.theme,
                language: data.language,
                two_factor_auth: data.twoFactorAuth,
                session_timeout: data.sessionTimeout !== undefined ? parseInt(data.sessionTimeout) : 30,
                google_analytics: data.googleAnalytics,
                facebook_pixel: data.facebookPixel,
                whatsapp_api: data.whatsappApi,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('Error saving settings:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, settings: updated });
    } catch (error) {
        console.error('Error in API /settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
