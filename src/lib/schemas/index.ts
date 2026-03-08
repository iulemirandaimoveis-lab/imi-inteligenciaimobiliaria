/**
 * Zod validation schemas for all API POST/PUT routes
 * Zod v3.25.76 is already installed — just import and use
 */
import { z } from 'zod'

// ─── LEADS ──────────────────────────────────────────────────────────────────

export const leadSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    source: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional(),
    interest_type: z.string().optional(),
    interest_location: z.string().optional(),
    budget_min: z.number().nonnegative().optional().nullable(),
    budget_max: z.number().nonnegative().optional().nullable(),
    notes: z.string().optional(),
    development_id: z.string().uuid().optional().nullable(),
    status: z.string().optional(),
    ai_score: z.number().min(0).max(100).optional(),
    ai_priority: z.enum(['high', 'medium', 'low']).optional(),
})

export const leadUpdateSchema = leadSchema.partial().extend({
    id: z.string().uuid('ID inválido'),
})

// ─── CAMPANHAS ──────────────────────────────────────────────────────────────

// Keep base object separate so .partial() can be called (ZodEffects doesn't support .partial())
const campanhaBaseObject = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    channel: z.string().optional(),
    platform: z.string().optional(),
    status: z.string().optional(),
    budget: z.number().nonnegative().optional().nullable(),
    daily_budget: z.number().nonnegative().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    objective: z.string().optional().nullable(),
    utm_source: z.string().optional().nullable(),
    utm_medium: z.string().optional().nullable(),
    utm_campaign: z.string().optional().nullable(),
})

export const campanhaSchema = campanhaBaseObject.refine(data => data.channel || data.platform, {
    message: 'channel ou platform é obrigatório',
    path: ['channel'],
})

export const campanhaUpdateSchema = z.object({
    id: z.string().uuid('ID inválido'),
}).merge(campanhaBaseObject.partial())

// ─── CONTRATOS ───────────────────────────────────────────────────────────────

export const contratoSchema = z.object({
    titulo: z.string().min(2, 'Título obrigatório'),
    tipo_contrato: z.enum([
        'compra_venda', 'locacao', 'consultoria', 'prestacao_servicos', 'outro'
    ]).default('compra_venda'),
    partes: z.record(z.any()).optional().default({}),
    status: z.string().optional().default('rascunho'),
    observacoes: z.string().optional(),
})

export const contratoUpdateSchema = contratoSchema.partial().extend({
    id: z.string().uuid('ID inválido'),
})

// ─── CONSULTORIAS ────────────────────────────────────────────────────────────

export const consultoriaSchema = z.object({
    // Dados do cliente
    cliente_nome: z.string().min(2, 'Nome obrigatório'),
    cliente_email: z.string().email().optional().or(z.literal('')),
    cliente_telefone: z.string().optional(),
    cliente_tipo: z.enum(['PF', 'PJ']).default('PF'),
    // Escopo
    tipo: z.string().optional(),
    descricao: z.string().optional(),
    objetivo: z.string().optional(),
    // Localização
    cidade: z.string().optional(),
    estado: z.string().optional(),
    // Honorários
    honorarios: z.number().nonnegative().optional().nullable(),
    forma_pagamento: z.string().optional(),
    honorarios_status: z.string().optional().default('pendente'),
    // Prazos
    data_inicio: z.string().optional().nullable(),
    data_prev_conclusao: z.string().optional().nullable(),
    // Extras
    observacoes: z.string().optional(),
    status: z.string().optional().default('ativo'),
})

export const consultoriaUpdateSchema = consultoriaSchema.partial().extend({
    id: z.string().uuid('ID inválido'),
})

// ─── CONTEUDOS ───────────────────────────────────────────────────────────────

export const conteudoSchema = z.object({
    titulo: z.string().min(2, 'Título obrigatório'),
    tipo: z.string().optional(),
    canal: z.string().optional(),
    status: z.enum(['rascunho', 'revisao', 'publicado', 'arquivado']).optional().default('rascunho'),
    conteudo: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
})

export const conteudoUpdateSchema = conteudoSchema.partial().extend({
    id: z.string().uuid('ID inválido'),
})

// ─── AVALIACOES ──────────────────────────────────────────────────────────────

export const avaliacaoSchema = z.object({
    tipo_imovel: z.string().min(1, 'Tipo do imóvel obrigatório'),
    endereco: z.string().min(3, 'Endereço obrigatório'),
    bairro: z.string().min(2, 'Bairro obrigatório'),
    cidade: z.string().default('Recife'),
    estado: z.string().default('PE'),
    cliente_nome: z.string().min(2, 'Nome do cliente obrigatório'),
    finalidade: z.string().min(1, 'Finalidade obrigatória'),
    metodologia: z.string().default('comparativo'),
    honorarios: z.number().nonnegative().optional().nullable(),
    status: z.string().optional().default('aguardando_docs'),
    // Optional fields
    complemento: z.string().optional(),
    cep: z.string().optional(),
    area_privativa: z.number().nonnegative().optional().nullable(),
    area_total: z.number().nonnegative().optional().nullable(),
    quartos: z.number().int().nonnegative().optional().nullable(),
    banheiros: z.number().int().nonnegative().optional().nullable(),
    vagas: z.number().int().nonnegative().optional().nullable(),
    cliente_email: z.string().email().optional().or(z.literal('')),
    cliente_telefone: z.string().optional(),
    observacoes: z.string().optional(),
    prazo_entrega: z.string().optional().nullable(),
})

export const avaliacaoUpdateSchema = avaliacaoSchema.partial().extend({
    id: z.string().uuid('ID inválido'),
})

// ─── PLAYBOOKS ───────────────────────────────────────────────────────────────

export const playbookSchema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    description: z.string().optional(),
    category: z.string().default('geral'),
    steps: z.array(z.any()).default([]),
    is_active: z.boolean().optional().default(true),
    estimated_time: z.string().optional(),
    norm_reference: z.string().optional(),
    icon: z.string().optional().default('📋'),
})

export const playbookUpdateSchema = playbookSchema.partial().extend({
    id: z.string().uuid('ID inválido'),
})

// ─── FINANCEIRO ──────────────────────────────────────────────────────────────

export const transactionSchema = z.object({
    type: z.enum(['receita', 'despesa']),
    category: z.string().min(1, 'Categoria obrigatória'),
    description: z.string().min(2, 'Descrição obrigatória'),
    amount: z.number().positive('Valor deve ser positivo'),
    date: z.string().min(1, 'Data obrigatória'),
    status: z.enum(['pago', 'pendente', 'cancelado']).default('pendente'),
    notes: z.string().optional(),
    related_entity_type: z.string().optional(),
    related_entity_id: z.string().uuid().optional().nullable(),
})

export const transactionUpdateSchema = transactionSchema.partial().extend({
    id: z.string().uuid('ID inválido'),
})

// ─── AUTOMACOES ──────────────────────────────────────────────────────────────

export const automacaoSchema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    description: z.string().optional(),
    trigger_type: z.string().default('manual'),
    config: z.record(z.any()).optional().default({}),
    is_active: z.boolean().optional().default(true),
})

// ─── PROJETOS ────────────────────────────────────────────────────────────────

export const projetoSchema = z.object({
    nome: z.string().min(2, 'Nome obrigatório'),
    tipo: z.string().optional(),
    descricao: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().default('PE'),
    status: z.string().default('estruturacao'),
    fase: z.string().optional(),
    unidades: z.number().int().nonnegative().optional().default(0),
    unidades_vendidas: z.number().int().nonnegative().optional().default(0),
    area_total_m2: z.number().nonnegative().optional().nullable(),
    vgv: z.number().nonnegative().optional().default(0),
    imagem_url: z.string().url().optional().nullable(),
    data_lancamento: z.string().optional().nullable(),
    data_entrega_prev: z.string().optional().nullable(),
})

// ─── QR GENERATE ─────────────────────────────────────────────────────────────

export const qrGenerateSchema = z.object({
    development_id: z.string().uuid('development_id inválido'),
    campaign_name: z.string().optional(),
    utm_source: z.string().min(1, 'utm_source obrigatório'),
    utm_medium: z.string().min(1, 'utm_medium obrigatório'),
    utm_campaign: z.string().min(1, 'utm_campaign obrigatório'),
    utm_content: z.string().optional(),
    custom_slug: z.string().optional(),
})

// ─── HELPER ──────────────────────────────────────────────────────────────────

/**
 * Parse and validate request body with Zod schema
 * Returns { success, data, error } — use success to check result
 */
export async function parseBody<T>(
    request: Request,
    schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: object }> {
    try {
        const body = await request.json()
        const result = schema.safeParse(body)
        if (!result.success) {
            return { success: false, error: result.error.flatten() }
        }
        return { success: true, data: result.data }
    } catch {
        return { success: false, error: { message: 'Corpo da requisição inválido' } }
    }
}
