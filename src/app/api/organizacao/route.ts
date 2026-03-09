import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/organizacao — returns current user's tenant
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find tenant where user is a member
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role, tenants(*)')
      .eq('user_id', user.id)
      .single()

    if (!tenantUser) {
      return NextResponse.json({ tenant: null, role: null })
    }

    // Get AI usage stats
    const { data: aiStats } = await supabase
      .from('ai_requests')
      .select('tokens_used, cost_usd, created_at')
      .eq('tenant_id', tenantUser.tenant_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const totalTokens = aiStats?.reduce((s, r) => s + (r.tokens_used || 0), 0) ?? 0
    const totalCost = aiStats?.reduce((s, r) => s + (r.cost_usd || 0), 0) ?? 0

    return NextResponse.json({
      tenant: tenantUser.tenants,
      role: tenantUser.role,
      aiUsage: { totalTokens, totalCost: totalCost.toFixed(4), requests: aiStats?.length ?? 0 },
    })
  } catch (err) {
    console.error('[api/organizacao GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/organizacao — create tenant + add owner
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, niche, slug } = body

    if (!name || !niche || !slug) {
      return NextResponse.json({ error: 'name, niche e slug são obrigatórios' }, { status: 400 })
    }

    // Create tenant
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .insert({ name, niche, slug, subscription_tier: 'starter', is_active: true })
      .select()
      .single()

    if (tenantErr) {
      if (tenantErr.code === '23505') {
        return NextResponse.json({ error: 'Slug já está em uso' }, { status: 409 })
      }
      throw tenantErr
    }

    // Add owner
    await supabase
      .from('tenant_users')
      .insert({ tenant_id: tenant.id, user_id: user.id, role: 'owner' })

    return NextResponse.json({ tenant }, { status: 201 })
  } catch (err) {
    console.error('[api/organizacao POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PUT /api/organizacao — update tenant settings
export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify owner role
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name, tone_of_voice, target_audience,
      ai_provider, ai_model, ai_temperature, ai_max_tokens,
      brand_colors, brand_fonts, brand_logo_url,
    } = body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (tone_of_voice !== undefined) updates.tone_of_voice = tone_of_voice
    if (target_audience !== undefined) updates.target_audience = target_audience
    if (ai_provider !== undefined) updates.ai_provider = ai_provider
    if (ai_model !== undefined) updates.ai_model = ai_model
    if (ai_temperature !== undefined) updates.ai_temperature = ai_temperature
    if (ai_max_tokens !== undefined) updates.ai_max_tokens = ai_max_tokens
    if (brand_colors !== undefined) updates.brand_colors = brand_colors
    if (brand_fonts !== undefined) updates.brand_fonts = brand_fonts
    if (brand_logo_url !== undefined) updates.brand_logo_url = brand_logo_url

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenantUser.tenant_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ tenant })
  } catch (err) {
    console.error('[api/organizacao PUT]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
