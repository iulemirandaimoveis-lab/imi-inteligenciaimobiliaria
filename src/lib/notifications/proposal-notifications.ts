import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWhatsAppBatch, sendWhatsAppText } from './whatsapp'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const money = (v: number | null | undefined) => (v != null && Number.isFinite(v) ? BRL.format(v) : 'a combinar')

interface Recipient {
  name: string | null
  phone: string | null
}

/** Donos/gestores do produto (responsável do produto) com telefone. */
async function projectApprovers(projectId: string): Promise<Recipient[]> {
  try {
    const { data } = await supabaseAdmin
      .schema('imi')
      .from('project_users')
      .select('relation, users ( full_name, phone )')
      .eq('project_id', projectId)
      .in('relation', ['owner', 'manager'])
    return (data ?? [])
      .map((r: any) => ({ name: r.users?.full_name ?? null, phone: r.users?.phone ?? null }))
      .filter((r: Recipient) => r.phone)
  } catch {
    return []
  }
}

async function userContact(userId: string): Promise<Recipient | null> {
  try {
    const { data } = await supabaseAdmin
      .schema('imi')
      .from('users')
      .select('full_name, phone')
      .eq('id', userId)
      .maybeSingle()
    if (!data) return null
    return { name: data.full_name ?? null, phone: data.phone ?? null }
  } catch {
    return null
  }
}

/**
 * Notifica o responsável do produto quando uma proposta é enviada.
 * Best-effort: nunca lança no caminho da request.
 */
export async function notifyProposalSubmitted(input: {
  projectId: string
  projectName?: string | null
  clientName: string
  brokerName?: string | null
  unitLabel?: string | null
  totalAmount?: number | null
}): Promise<void> {
  try {
    const approvers = await projectApprovers(input.projectId)
    if (approvers.length === 0) return
    const linha = [input.unitLabel, input.projectName].filter(Boolean).join(' · ')
    const text =
      `🟡 *Nova proposta para aprovação*\n` +
      `Cliente: ${input.clientName}\n` +
      (linha ? `Unidade: ${linha}\n` : '') +
      `Valor: ${money(input.totalAmount)}\n` +
      (input.brokerName ? `Corretor: ${input.brokerName}\n` : '') +
      `\nAcesse o IMI Console para analisar.`
    await sendWhatsAppBatch(approvers.map((a) => ({ phone: a.phone, text })))
  } catch {
    // swallow — notificação é best-effort
  }
}

/**
 * Notifica o corretor quando sua proposta é aprovada ou rejeitada.
 */
export async function notifyProposalDecision(input: {
  brokerId: string
  clientName: string
  projectName?: string | null
  decision: 'approved' | 'rejected'
  note?: string | null
}): Promise<void> {
  try {
    const broker = await userContact(input.brokerId)
    if (!broker?.phone) return
    const head =
      input.decision === 'approved'
        ? `🟢 *Proposta APROVADA*`
        : `🔴 *Proposta rejeitada*`
    const text =
      `${head}\n` +
      `Cliente: ${input.clientName}\n` +
      (input.projectName ? `Empreendimento: ${input.projectName}\n` : '') +
      (input.note ? `\nObservação: ${input.note}\n` : '') +
      `\nAcesse o IMI Console para os próximos passos.`
    await sendWhatsAppText(broker.phone, text)
  } catch {
    // swallow
  }
}
