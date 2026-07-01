import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWhatsAppBatch, sendWhatsAppText, sendWhatsAppFile } from './whatsapp'

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

/** Usuários por papel (BROKER, TEAM_MANAGER, …), opcionalmente escopados a um projeto. */
async function usersByRoles(roleKeys: string[], projectId?: string): Promise<Recipient[]> {
  try {
    let q = supabaseAdmin
      .schema('imi')
      .from('user_roles')
      .select('project_id, roles!inner ( key ), users!inner ( full_name, phone )')
      .in('roles.key', roleKeys)
    if (projectId) q = q.or(`project_id.eq.${projectId},project_id.is.null`)
    const { data } = await q
    const seen = new Set<string>()
    return (data ?? [])
      .map((r: any) => ({ name: r.users?.full_name ?? null, phone: r.users?.phone ?? null }))
      .filter((r: Recipient) => {
        if (!r.phone || seen.has(r.phone)) return false
        seen.add(r.phone)
        return true
      })
  } catch {
    return []
  }
}

/** Lista padrão de documentação / contrato / entrada enviada ao cliente ao reservar. */
export function negotiationChecklistText(input: {
  clientName: string
  projectName?: string | null
  unitLabel?: string | null
  downPayment?: number | null
}): string {
  const linha = [input.unitLabel, input.projectName].filter(Boolean).join(' · ')
  return (
    `Olá, ${input.clientName}! ✅ Recebemos a sua proposta` +
    (linha ? ` para *${linha}*` : '') +
    `.\n\n` +
    `Seu(s) lote(s) entra(m) agora em *NEGOCIAÇÃO*. Para concluir a reserva, precisamos de:\n\n` +
    `📄 *Documentação*\n` +
    `• RG e CPF (comprador e cônjuge)\n` +
    `• Comprovante de residência atualizado\n` +
    `• Comprovante de renda\n` +
    `• Certidão de estado civil\n\n` +
    `📝 *Contrato*\n` +
    `• Contrato de Promessa de Compra e Venda (enviaremos para assinatura digital)\n\n` +
    `💳 *Entrada / Sinal*\n` +
    `• Valor: ${money(input.downPayment)}\n` +
    `• Pagamento via PIX ou transferência (dados no contrato)\n\n` +
    `Assim que recebermos a documentação, o contrato assinado e o pagamento da entrada, ` +
    `o(s) lote(s) é(são) confirmado(s) como *VENDIDO(S)*. Um corretor entrará em contato. 🤝`
  )
}

/**
 * Fluxo público: cliente preencheu a proposta a partir do mapa.
 *  • Confirmação ao CLIENTE (OpenWA) com a relação de documentação/contrato/entrada.
 *  • Notifica o responsável do empreendimento + gestor(es) da equipe + corretores.
 * Best-effort: nunca lança no caminho da request.
 */
export async function notifyLotProposal(input: {
  projectId?: string | null
  projectName?: string | null
  clientName: string
  clientPhone?: string | null
  unitLabel?: string | null
  totalAmount?: number | null
  downPayment?: number | null
  lotCount?: number | null
  /** Documentos anexados pelo cliente (URLs assinadas do bucket de propostas). */
  documents?: Array<{ name: string; url: string }> | null
}): Promise<{ clientNotified: boolean; teamNotified: number }> {
  let clientNotified = false
  let teamNotified = 0
  try {
    // 1) Confirmação ao cliente (relação de documentos / contrato / entrada).
    if (input.clientPhone) {
      const res = await sendWhatsAppText(
        input.clientPhone,
        negotiationChecklistText({
          clientName: input.clientName,
          projectName: input.projectName,
          unitLabel: input.unitLabel,
          downPayment: input.downPayment,
        })
      )
      clientNotified = res.ok
    }

    // 2) Time interno: responsável do produto + gestor(es) + corretores.
    const [approvers, managers, brokers] = await Promise.all([
      input.projectId ? projectApprovers(input.projectId) : Promise.resolve([]),
      usersByRoles(['TEAM_MANAGER'], input.projectId ?? undefined),
      usersByRoles(['BROKER'], input.projectId ?? undefined),
    ])

    const docs = (input.documents ?? []).filter((d) => d?.url)
    const docsBlock =
      docs.length > 0
        ? `\n\n📎 *Documentos anexados (${docs.length})*\n` +
          docs.map((d, i) => `${i + 1}. ${d.name}\n${d.url}`).join('\n')
        : ''

    const unidade = [input.unitLabel, input.projectName].filter(Boolean).join(' · ')
    const teamText =
      `🟡 *Novo lote em NEGOCIAÇÃO*\n` +
      `Cliente: ${input.clientName}\n` +
      (input.clientPhone ? `Contato: ${input.clientPhone}\n` : '') +
      (unidade ? `Unidade: ${unidade}\n` : '') +
      (input.lotCount ? `Lotes: ${input.lotCount}\n` : '') +
      `Valor: ${money(input.totalAmount)}\n` +
      (docs.length > 0 ? `Documentos: ${docs.length} anexo(s)\n` : '') +
      `\nProposta preenchida pelo cliente no site. Acesse o IMI Console.` +
      docsBlock

    const recipients = new Map<string, string>()
    for (const r of [...approvers, ...managers, ...brokers]) {
      if (r.phone) recipients.set(r.phone, teamText)
    }
    if (recipients.size > 0) {
      await sendWhatsAppBatch(Array.from(recipients, ([phone, text]) => ({ phone, text })))
      teamNotified = recipients.size

      // Anexa os arquivos em si (best-effort) — além dos links no texto acima.
      if (docs.length > 0) {
        await Promise.all(
          Array.from(recipients.keys()).flatMap((phone) =>
            docs.map((d) =>
              sendWhatsAppFile(phone, {
                url: d.url,
                filename: d.name,
                caption: `Documento — proposta de ${input.clientName}`,
              }),
            ),
          ),
        )
      }
    }
  } catch {
    // swallow — best-effort
  }
  return { clientNotified, teamNotified }
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
