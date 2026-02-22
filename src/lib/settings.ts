import { createClient } from '@/lib/supabase/server';

export interface GlobalSettings {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    theme: string;
    googleAnalytics: string;
    facebookPixel: string;
    whatsappApi: string;
}

export const defaultSettings: GlobalSettings = {
    companyName: 'IMI – Inteligência Imobiliária',
    companyEmail: 'contato@iulemirandaimoveis.com.br',
    companyPhone: '(81) 99999-9999',
    companyAddress: 'Av. Boa Viagem, 3500 - Boa Viagem, Recife - PE',
    theme: 'light',
    googleAnalytics: '',
    facebookPixel: '',
    whatsappApi: '',
};

export async function getGlobalSettings(): Promise<GlobalSettings> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (error || !data) {
            return defaultSettings;
        }

        return {
            companyName: data.company_name || defaultSettings.companyName,
            companyEmail: data.company_email || defaultSettings.companyEmail,
            companyPhone: data.company_phone || defaultSettings.companyPhone,
            companyAddress: data.company_address || defaultSettings.companyAddress,
            theme: data.theme || defaultSettings.theme,
            googleAnalytics: data.google_analytics || defaultSettings.googleAnalytics,
            facebookPixel: data.facebook_pixel || defaultSettings.facebookPixel,
            whatsappApi: data.whatsapp_api || defaultSettings.whatsappApi,
        };
    } catch (e) {
        return defaultSettings;
    }
}
