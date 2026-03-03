import { createClient } from '@supabase/supabase-js';

// Cliente Supabase Service Role para operações privilegiadas (bypass RLS se necessário)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface CreateLeadData {
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    status?: string;
    message?: string;
    consultationType?: string;
    cityInterest?: string;
    investmentProfile?: string;
    budgetRange?: string;
}

export async function createLead(data: CreateLeadData) {
    try {
        console.log('Creating lead:', data.email);

        // 1. Obter Tenant ID (IMI)
        // Cachear isso seria ideal, mas por enquanto vamos buscar
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .limit(1)
            .single();

        if (!tenant) {
            throw new Error('No tenant found active system.');
        }

        const tenantId = tenant.id;

        // 2. Verificar se Lead já existe
        let leadId: string;

        // Tenta buscar por email
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('email', data.email)
            .maybeSingle();

        if (existingLead) {
            leadId = existingLead.id;
            console.log('Lead exists, updating:', leadId);

            // Atualizar dados de contato se necessário
            await supabase.from('leads').update({
                name: data.name,
                phone: data.phone,
                last_contact_at: new Date().toISOString()
            }).eq('id', leadId);
        } else {
            // Criar novo Lead
            const { data: newLead, error: createError } = await supabase
                .from('leads')
                .insert({
                    tenant_id: tenantId,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    source: data.source || 'website_consultation',
                    status: 'new', // new, contacted, qualified
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (createError) throw createError;
            leadId = newLead.id;
            console.log('New lead created:', leadId);
        }

        // 3. Registrar Consulta (Consultation)
        if (data.consultationType) {
            await supabase.from('consultations').insert({
                tenant_id: tenantId,
                name: data.name, // Redundante mas exigido pela tabela legada
                email: data.email,
                phone: data.phone,
                consultation_type: data.consultationType,
                city_interest: data.cityInterest,
                investment_profile: data.investmentProfile,
                budget_range: data.budgetRange,
                message: data.message,
                status: 'pending',
                created_at: new Date().toISOString()
            });
        }

        // 4. Registrar Interação no CRM (Lead Interactions)
        await supabase.from('lead_interactions').insert({
            lead_id: leadId,
            interaction_type: 'site_visit', // ou 'form_submission' se tiver no enum
            direction: 'inbound',
            subject: 'Solicitação de Consultoria',
            notes: `Tipo: ${data.consultationType}. Mensagem: ${data.message}`,
            created_at: new Date().toISOString()
        });

        return { success: true, leadId };

    } catch (error: any) {
        console.error('Error in createLead service:', error);
        return { success: false, error: error.message };
    }
}
