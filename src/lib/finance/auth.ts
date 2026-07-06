import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'

const FINANCE_ADMIN_ROLES = ['admin', 'super_admin']
const FINANCE_MANAGER_ROLES = ['admin', 'super_admin', 'broker_manager']

async function getProfileRole(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).maybeSingle()
  return (data?.role as string | undefined) ?? null
}

/** Admin only — gerencia contas bancárias, credenciais e conexões (ação de maior risco). */
export async function isFinanceAdmin(userId: string): Promise<boolean> {
  const role = await getProfileRole(userId)
  return !!role && FINANCE_ADMIN_ROLES.includes(role)
}

/** Admin + gerente de corretores — opera a conciliação do dia a dia. */
export async function isFinanceManager(userId: string): Promise<boolean> {
  const role = await getProfileRole(userId)
  return !!role && FINANCE_MANAGER_ROLES.includes(role)
}
