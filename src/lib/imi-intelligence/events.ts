import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * IMI Intelligence — Event Engine.
 *
 * Append-only, typed events feed the analytics layer (metrics, timeline,
 * insights, ranking, predictions, realtime activity). Emitting is best-effort
 * and never throws into the request path.
 *
 * Event-driven by design and prepared for a future migration to a dedicated
 * streaming/warehouse stack (Kafka / ClickHouse / Spark): each event is
 * immutable with a typed `type`, a JSONB payload and an `occurred_at`.
 */
export const EVENT_TYPES = {
  LeadCreated: 'LeadCreated',
  ProposalCreated: 'ProposalCreated',
  ProposalApproved: 'ProposalApproved',
  ProposalRejected: 'ProposalRejected',
  LotReserved: 'LotReserved',
  LotSold: 'LotSold',
  BrokerLogin: 'BrokerLogin',
  BrokerActivity: 'BrokerActivity',
  PropertyView: 'PropertyView',
  ClientInteraction: 'ClientInteraction',
} as const

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]

export interface EmitEventInput {
  type: EventType
  projectId?: string | null
  actorUserId?: string | null
  entity?: string
  entityId?: string
  amount?: number | null
  payload?: Record<string, unknown>
}

/**
 * Emit an event into imi.events via the SECURITY DEFINER RPC. Returns the new
 * event id, or null on failure (best-effort — analytics must never break the
 * action that produced the event).
 */
export async function emitEvent(input: EmitEventInput): Promise<number | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.schema('imi').rpc('emit_event', {
      p_event_type: input.type,
      p_project_id: input.projectId ?? null,
      p_actor: input.actorUserId ?? null,
      p_entity: input.entity ?? null,
      p_entity_id: input.entityId ?? null,
      p_amount: input.amount ?? null,
      p_payload: input.payload ?? {},
    })
    if (error) return null
    return (data as number) ?? null
  } catch {
    return null
  }
}

/**
 * On a confirmed sale, emit LotSold and compute the broker commission ledger
 * entry in one call (wraps imi.compute_commission). Returns the commission id.
 */
export async function recordSale(opts: {
  projectId: string
  brokerUserId: string
  saleAmount: number
  unitReference: string
}): Promise<string | null> {
  try {
    const supabase = await createClient()
    await emitEvent({
      type: EVENT_TYPES.LotSold,
      projectId: opts.projectId,
      actorUserId: opts.brokerUserId,
      entity: 'lot',
      entityId: opts.unitReference,
      amount: opts.saleAmount,
    })
    const { data, error } = await supabase.schema('imi').rpc('compute_commission', {
      p_user_id: opts.brokerUserId,
      p_project_id: opts.projectId,
      p_sale_amount: opts.saleAmount,
      p_sale_reference: opts.unitReference,
      p_status: 'forecast',
    })
    if (error) return null
    return (data as string) ?? null
  } catch {
    return null
  }
}
