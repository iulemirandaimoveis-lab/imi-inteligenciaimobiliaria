#!/usr/bin/env node
/**
 * imi-auth-seed-users.mjs — Seed the initial IMI Console users.
 *
 * Creates auth.users (via the service role), their matching imi.users rows,
 * role assignments scoped to Alto Bellevue, project memberships and broker
 * profiles. Idempotent: re-running updates instead of duplicating.
 *
 * Prerequisites:
 *   - Run the migration first: supabase/migrations/20260626_imi_auth_ecosystem.sql
 *   - Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/seed/imi-auth-seed-users.mjs
 *   node scripts/seed/imi-auth-seed-users.mjs --password 'Temp#2026'   # set a temp password
 *
 * Initial password defaults to a random per-user value printed at the end so
 * NOTHING is hardcoded into the frontend. Users reset via /users/forgot.
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SERVICE_KEY) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const fixedPasswordArg = (() => {
  const i = process.argv.indexOf('--password')
  return i !== -1 ? process.argv[i + 1] : null
})()

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const imi = admin.schema('imi')

const EMAIL_DOMAIN = 'iulemirandaimoveis.com.br'

/** slug helper for deterministic emails */
const emailFor = (name) =>
  `${name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/(^\.|\.$)/g, '')}@${EMAIL_DOMAIN}`

const TEAM_NAME = 'Alto Bellevue Premium Team'

// Initial roster (NOT hardcoded in the frontend — DB seed only).
// `roles` is an array → a user can hold multiple RBAC roles.
// `teamRole` drives imi.team_members; `relation` drives imi.project_users.
const ROSTER = [
  { name: 'Mateus', roles: ['TEAM_MANAGER'], relation: 'manager', teamRole: 'manager' },
  { name: 'Catel', roles: ['PROJECT_OWNER'], relation: 'owner', teamRole: 'owner' },
  // Iule Miranda holds three roles and is a super admin (full backoffice access).
  {
    name: 'Iule Miranda',
    roles: ['BROKER', 'BACKOFFICE_ADMIN', 'SUPER_ADMIN'],
    relation: 'broker',
    teamRole: 'member',
    isSuper: true,
  },
  { name: 'João', roles: ['BROKER'], relation: 'broker', teamRole: 'member' },
  { name: 'Allysson', roles: ['BROKER'], relation: 'broker', teamRole: 'member' },
  { name: 'Anderson', roles: ['BROKER'], relation: 'broker', teamRole: 'member' },
  { name: 'Fernandes', roles: ['BROKER'], relation: 'broker', teamRole: 'member' },
  { name: 'Paulo', roles: ['BROKER'], relation: 'broker', teamRole: 'member' },
  { name: 'Lucas', roles: ['BROKER'], relation: 'broker', teamRole: 'member' },
  { name: 'Douglas', roles: ['BROKER'], relation: 'broker', teamRole: 'member' },
  { name: 'Gustavo', roles: ['BROKER'], relation: 'broker', teamRole: 'member' },
]

async function getAuthUserByEmail(email) {
  // listUsers is paginated; for a small roster one page is enough.
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  return data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function ensureAuthUser(email, fullName) {
  const existing = await getAuthUserByEmail(email)
  if (existing) return { id: existing.id, password: null }

  // Provisional password — only to bootstrap FIRST ACCESS. The user sets their
  // real password at /users/primeiro-acesso (mirrors the backoffice flow).
  const password = fixedPasswordArg || `Imi#${randomBytes(6).toString('hex')}`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, imi_console: true, needs_password_setup: true },
  })
  if (error) throw error
  return { id: data.user.id, password }
}

async function main() {
  console.log('▸ Seeding IMI Console users…\n')

  // Resolve project + roles up front.
  const { data: project, error: projErr } = await imi
    .from('projects')
    .select('id, name')
    .eq('slug', 'alto-bellevue')
    .single()
  if (projErr || !project) {
    console.error('✗ Alto Bellevue project not found. Run the migration first.')
    process.exit(1)
  }

  const { data: roleRows } = await imi.from('roles').select('id, key')
  const roleId = Object.fromEntries((roleRows ?? []).map((r) => [r.key, r.id]))

  // Resolve the Alto Bellevue Premium Team (created by the migration).
  const { data: team } = await imi
    .from('teams')
    .select('id, name')
    .eq('project_id', project.id)
    .eq('name', TEAM_NAME)
    .maybeSingle()
  if (!team) {
    console.error(`✗ Team "${TEAM_NAME}" not found. Run the team/commission migration first.`)
    process.exit(1)
  }

  // Default commission rule for per-broker profiles.
  const { data: rule } = await imi
    .from('commission_rules')
    .select('id')
    .eq('project_id', project.id)
    .order('priority', { ascending: true })
    .limit(1)
    .maybeSingle()

  const GLOBAL_ROLES = new Set(['SUPER_ADMIN', 'BACKOFFICE_ADMIN'])
  const credentials = []
  const summary = []
  let managerUserId = null

  for (const person of ROSTER) {
    const email = emailFor(person.name)
    const { id: authId, password } = await ensureAuthUser(email, person.name)

    // imi.users (upsert by email)
    const { data: userRow, error: userErr } = await imi
      .from('users')
      .upsert(
        {
          auth_user_id: authId,
          email,
          full_name: person.name,
          // 'invited' until the user completes first access; flipped to 'active'
          // by /api/users/auth/first-access.
          status: 'invited',
          is_super: Boolean(person.isSuper),
          metadata: { needs_password_setup: true },
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single()
    if (userErr) {
      console.error(`  ✗ ${person.name}: ${userErr.message}`)
      continue
    }
    const userId = userRow.id

    // user_roles — assign EACH role (multi-role supported). Global roles
    // (SUPER_ADMIN, BACKOFFICE_ADMIN) are unscoped; others scope to the project.
    for (const roleKey of person.roles) {
      if (!roleId[roleKey]) continue
      const scopedProject = GLOBAL_ROLES.has(roleKey) ? null : project.id
      await imi.from('user_roles').upsert(
        { user_id: userId, role_id: roleId[roleKey], project_id: scopedProject },
        { onConflict: 'user_id,role_id,project_id' }
      )
    }

    // project_users
    await imi.from('project_users').upsert(
      { project_id: project.id, user_id: userId, relation: person.relation },
      { onConflict: 'project_id,user_id' }
    )

    // team_members — REAL membership link (team_id, user_id, team_role)
    await imi.from('team_members').upsert(
      { team_id: team.id, user_id: userId, team_role: person.teamRole },
      { onConflict: 'team_id,user_id' }
    )
    if (person.teamRole === 'manager') managerUserId = userId

    // broker_profiles + commission_profile for anyone acting as a broker
    if (person.roles.includes('BROKER')) {
      await imi.from('broker_profiles').upsert(
        { user_id: userId, team_id: team.id },
        { onConflict: 'user_id' }
      )
      await imi.from('commission_profiles').upsert(
        { user_id: userId, project_id: project.id, rule_id: rule?.id ?? null, broker_rate: 60, bonus_rate: 0 },
        { onConflict: 'user_id,project_id' }
      )
    }

    if (password) credentials.push({ name: person.name, email, password })
    summary.push({ name: person.name, email, roles: person.roles.join('+'), team: person.teamRole })
  }

  // Link the team manager_id (Mateus).
  if (managerUserId) {
    await imi.from('teams').update({ manager_id: managerUserId }).eq('id', team.id)
  }

  // ── Confirmation report ──────────────────────────────────────────────────
  console.log('✓ Seed complete — users created/linked:\n')
  console.log('  NAME             ROLES                              TEAM      EMAIL')
  console.log('  ' + '─'.repeat(86))
  for (const s of summary) {
    console.log(
      `  ${s.name.padEnd(16)} ${s.roles.padEnd(34)} ${s.team.padEnd(9)} ${s.email}`
    )
  }
  console.log(`\n  Team: ${TEAM_NAME} · Manager: Mateus · Owner: Catel · ${summary.length} members`)

  if (credentials.length) {
    console.log('\n  Senha provisória de PRIMEIRO ACESSO (compartilhe com segurança).')
    console.log('  Cada usuário define a senha real em /users/primeiro-acesso:')
    for (const c of credentials) console.log(`    ${c.email}  →  ${c.password}`)
  } else {
    console.log('  (Todos os usuários já existiam — nenhuma senha provisória nova gerada.)')
  }
}

main().catch((e) => {
  console.error('✗ Seed failed:', e)
  process.exit(1)
})
