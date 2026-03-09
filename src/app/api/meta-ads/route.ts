import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Meta Graph API ───────────────────────────────────────────────────────────
const META_BASE = 'https://graph.facebook.com/v20.0'

const META_TOKEN = process.env.META_ACCESS_TOKEN
const META_ACCOUNT = process.env.META_AD_ACCOUNT_ID // format: act_XXXXXXXXX

// ─── Type helpers ─────────────────────────────────────────────────────────────
interface MetaCampaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED'
  objective: string
  start_time?: string
  stop_time?: string
  daily_budget?: string    // in cents (Meta returns strings)
  lifetime_budget?: string // in cents
}

interface MetaInsight {
  impressions?: string
  clicks?: string
  spend?: string
  reach?: string
  ctr?: string
  actions?: Array<{ action_type: string; value: string }>
  cost_per_action_type?: Array<{ action_type: string; value: string }>
}

// ─── Meta API fetch helpers ───────────────────────────────────────────────────
async function fetchMetaCampaigns(token: string, adAccountId: string): Promise<MetaCampaign[]> {
  const fields = 'id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget'
  const url = `${META_BASE}/${adAccountId}/campaigns?fields=${fields}&limit=100&access_token=${token}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`Meta API: ${data.error.message}`)
  return (data.data ?? []) as MetaCampaign[]
}

async function fetchCampaignInsights(token: string, campaignId: string): Promise<MetaInsight | null> {
  const fields = 'impressions,clicks,spend,reach,ctr,actions,cost_per_action_type'
  const url = `${META_BASE}/${campaignId}/insights?fields=${fields}&date_preset=lifetime&access_token=${token}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`Meta Insights API: ${data.error.message}`)
  return data.data?.[0] ?? null
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────
function metaStatusToDb(s: string): string {
  if (s === 'ACTIVE') return 'active'
  if (s === 'PAUSED') return 'paused'
  if (s === 'ARCHIVED') return 'archived'
  return 'draft'
}

function metaObjectiveToChannel(objective: string): string {
  const lower = objective.toLowerCase()
  if (lower.includes('instagram')) return 'instagram'
  // Default to facebook for all Meta campaigns
  return 'facebook'
}

function getActionValue(actions: MetaInsight['actions'] | undefined, ...types: string[]): number {
  if (!actions) return 0
  for (const type of types) {
    const match = actions.find(a => a.action_type === type)
    if (match) return Math.round(Number(match.value) || 0)
  }
  return 0
}

function centsToBRL(cents: string | undefined): number | null {
  if (!cents) return null
  const val = Number(cents) / 100
  return isNaN(val) ? null : val
}

// ─── GET /api/meta-ads — Fetch campaigns from Meta (preview) ─────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!META_TOKEN || !META_ACCOUNT) {
      return NextResponse.json({
        connected: false,
        message: 'META_ACCESS_TOKEN e META_AD_ACCOUNT_ID não configurados',
        campaigns: [],
      })
    }

    const campaigns = await fetchMetaCampaigns(META_TOKEN, META_ACCOUNT)
    return NextResponse.json({
      connected: true,
      account: META_ACCOUNT,
      count: campaigns.length,
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: metaStatusToDb(c.status),
        objective: c.objective,
      })),
    })
  } catch (err) {
    console.error('[meta-ads] GET error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao conectar com Meta API' },
      { status: 500 }
    )
  }
}

// ─── POST /api/meta-ads — Sync campaigns to DB ───────────────────────────────
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!META_TOKEN || !META_ACCOUNT) {
      return NextResponse.json({
        error: 'META_ACCESS_TOKEN e META_AD_ACCOUNT_ID não configurados nas variáveis de ambiente',
      }, { status: 400 })
    }

    // 1. Fetch all campaigns from Meta
    const metaCampaigns = await fetchMetaCampaigns(META_TOKEN, META_ACCOUNT)

    let synced = 0
    let errors = 0
    const results: Array<{ id: string; name: string; status: string; action: 'upserted' | 'error' }> = []

    for (const mc of metaCampaigns) {
      try {
        // 2. Fetch insights for this campaign
        const insights = await fetchCampaignInsights(META_TOKEN, mc.id)

        const leads = getActionValue(
          insights?.actions,
          'lead',
          'offsite_conversion.fb_pixel_lead',
          'onsite_conversion.lead_grouped',
        )
        const clicks = Number(insights?.clicks ?? 0)
        const impressions = Number(insights?.impressions ?? 0)
        const spent = Number(insights?.spend ?? 0)
        const ctr = Number(insights?.ctr ?? 0)
        const cpl = insights?.cost_per_action_type?.find(
          a => a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead'
        )
        const costPerLead = cpl ? Number(cpl.value) : (leads > 0 ? spent / leads : null)

        const dbStatus = metaStatusToDb(mc.status)
        const channel = metaObjectiveToChannel(mc.objective)

        // 3. Upsert: match by utm_campaign (= Meta campaign ID) + utm_source = 'meta'
        const { error: upsertErr } = await supabase
          .from('campaigns')
          .upsert({
            created_by: user.id,
            name: mc.name,
            channel,
            status: dbStatus,
            objective: mc.objective,
            start_date: mc.start_time ? mc.start_time.split('T')[0] : null,
            end_date: mc.stop_time ? mc.stop_time.split('T')[0] : null,
            daily_budget: centsToBRL(mc.daily_budget),
            budget: centsToBRL(mc.lifetime_budget) ?? centsToBRL(mc.daily_budget),
            spent,
            impressions,
            clicks,
            leads,
            conversions: leads, // treat leads as conversions for Meta
            cost_per_lead: costPerLead ? Math.round(costPerLead * 100) / 100 : null,
            ctr: Math.round(ctr * 100) / 100,
            utm_source: 'meta',
            utm_campaign: mc.id, // store Meta campaign ID here
          }, {
            onConflict: 'utm_source,utm_campaign',
            ignoreDuplicates: false,
          })

        if (upsertErr) {
          // Fallback: try INSERT OR UPDATE by name
          const { error: fallbackErr } = await supabase
            .from('campaigns')
            .upsert({
              created_by: user.id,
              name: mc.name,
              channel,
              status: dbStatus,
              objective: mc.objective,
              spent, impressions, clicks, leads,
              conversions: leads,
              cost_per_lead: costPerLead ? Math.round(costPerLead * 100) / 100 : null,
              ctr: Math.round(ctr * 100) / 100,
              utm_source: 'meta',
              utm_campaign: mc.id,
            })
          if (fallbackErr) throw fallbackErr
        }

        synced++
        results.push({ id: mc.id, name: mc.name, status: dbStatus, action: 'upserted' })
      } catch (err) {
        errors++
        console.error(`[meta-ads] Campaign ${mc.id} sync error:`, err)
        results.push({ id: mc.id, name: mc.name, status: mc.status, action: 'error' })
      }
    }

    return NextResponse.json({
      success: true,
      total: metaCampaigns.length,
      synced,
      errors,
      syncedAt: new Date().toISOString(),
      results,
    })
  } catch (err) {
    console.error('[meta-ads] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro na sincronização Meta Ads' },
      { status: 500 }
    )
  }
}
