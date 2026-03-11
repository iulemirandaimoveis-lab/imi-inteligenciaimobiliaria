// src/app/api/system-checks/route.ts
// Verifica saúde do sistema e retorna alertas de ação necessária
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface SystemCheck {
    id: string
    level: 'critical' | 'warning' | 'info'
    title: string
    message: string
    action_url?: string
    action_label?: string
}

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ checks: [] })

        const checks: SystemCheck[] = []

        // ── 1. ANTHROPIC_API_KEY ─────────────────────────────────────────────
        const anthropicKey = process.env.ANTHROPIC_API_KEY || ''
        if (!anthropicKey) {
            checks.push({
                id: 'anthropic_missing',
                level: 'critical',
                title: 'ANTHROPIC_API_KEY não configurada',
                message: 'O sistema de IA (Claude) está desativado. Configure a chave no Vercel e em Integrações.',
                action_url: '/backoffice/integracoes',
                action_label: 'Configurar agora',
            })
        } else if (
            // Detecta se a chave começa com o prefixo comprometido/exposto em chat
            // (qualquer sk-ant-api03- de menos de 60 caracteres pode ser a chave legada)
            anthropicKey.startsWith('sk-ant-api03-') &&
            process.env.ANTHROPIC_KEY_ROTATION_REQUIRED === 'true'
        ) {
            checks.push({
                id: 'anthropic_rotation_required',
                level: 'critical',
                title: 'Trocar ANTHROPIC_API_KEY — ação urgente',
                message: 'A chave Anthropic atual pode estar comprometida. Revogue-a em console.anthropic.com e configure a nova em Variáveis de Ambiente no Vercel.',
                action_url: '/backoffice/integracoes',
                action_label: 'Ver Integrações',
            })
        }

        // ── 2. SUPABASE configurado? ─────────────────────────────────────────
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
            checks.push({
                id: 'supabase_missing',
                level: 'critical',
                title: 'Supabase não configurado',
                message: 'NEXT_PUBLIC_SUPABASE_URL não definida. O banco de dados está inacessível.',
                action_url: '/backoffice/integracoes',
                action_label: 'Ver Integrações',
            })
        }

        // ── 3. Verifica se tabela developers existe (migrations pendentes) ───
        try {
            const { error: tblErr } = await supabase
                .from('developers')
                .select('id')
                .limit(1)
            if (tblErr && tblErr.message?.includes('does not exist')) {
                checks.push({
                    id: 'migration_050_pending',
                    level: 'critical',
                    title: 'Migration 050 pendente no Supabase',
                    message: 'Tabelas do banco ainda não foram criadas em produção. Execute supabase/migrations/050_create_all_missing_tables.sql no painel do Supabase.',
                    action_url: 'https://supabase.com/dashboard',
                    action_label: 'Abrir Supabase',
                })
            }
        } catch (_) { /* ignora se não conseguir checar */ }

        // ── 4. Sem chave Meta Ads ────────────────────────────────────────────
        if (!process.env.META_ACCESS_TOKEN) {
            checks.push({
                id: 'meta_ads_missing',
                level: 'warning',
                title: 'Meta Ads não configurado',
                message: 'META_ACCESS_TOKEN ausente. Campanhas de anúncios não serão sincronizadas.',
                action_url: '/backoffice/integracoes',
                action_label: 'Configurar',
            })
        }

        return NextResponse.json({ checks })
    } catch (err: any) {
        return NextResponse.json({ checks: [] })
    }
}
