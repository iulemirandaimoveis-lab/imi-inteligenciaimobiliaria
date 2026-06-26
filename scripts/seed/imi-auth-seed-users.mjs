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

// Initial roster (NOT hardcoded in the frontend — DB seed only).
const ROSTER = [
  { name: 'Mateus', role: 'TEAM_MANAGER', relation: 'manager' },
  { name: 'Catel', role: 'PROJECT_OWNER', relation: 'owner' },
  { name: 'Iule Miranda', role: 'BROKER', relation: 'broker', isSuper: true },
  { name: 'João', role: 'BROKER', relation: 'broker' },
  { name: 'Allysson', role: 'BROKER', relation: 'broker' },
  { name: 'Anderson', role: 'BROKER', relation: 'broker' },
  { name: 'Fernandes', role: 'BROKER', relation: 'broker' },
  { name: 'Paulo', role: 'BROKER', relation: 'broker' },
  { name: 'Lucas', role: 'BROKER', relation: 'broker' },
  { name: 'Douglas', role: 'BROKER', relation: 'broker' },
  { name: 'Gustavo', role: 'BROKER', relation: 'broker' },
]

async function getAuthUserByEmail(email) {
  // listUsers is paginated; for a small roster one page is enough.
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  return data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function ensureAuthUser(email, fullName) {
  const existing = await getAuthUserByEmail(email)
  if (existing) return { id: existing.id, password: null }

  const password = fixedPasswordArg || `Imi#${randomBytes(6).toString('hex')}`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, imi_console: true },
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

  const credentials = []

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
          status: 'active',
          is_super: Boolean(person.isSuper),
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

    // user_roles (scoped to project for non-global roles)
    const scoped = person.role !== 'SUPER_ADMIN' && person.role !== 'BACKOFFICE_ADMIN'
    if (roleId[person.role]) {
      await imi.from('user_roles').upsert(
        { user_id: userId, role_id: roleId[person.role], project_id: scoped ? project.id : null },
        { onConflict: 'user_id,role_id,project_id' }
      )
    }

    // project_users
    await imi.from('project_users').upsert(
      { project_id: project.id, user_id: userId, relation: person.relation },
      { onConflict: 'project_id,user_id' }
    )

    // broker_profiles for brokers
    if (person.role === 'BROKER') {
      await imi.from('broker_profiles').upsert({ user_id: userId }, { onConflict: 'user_id' })
    }

    if (password) credentials.push({ name: person.name, email, password })
    console.log(`  ✓ ${person.name.padEnd(16)} ${person.role.padEnd(16)} ${email}`)
  }

  console.log('\n✓ Seed complete.')
  if (credentials.length) {
    console.log('\n  Temporary credentials (share securely, users should reset via /users/forgot):')
    for (const c of credentials) console.log(`    ${c.email}  →  ${c.password}`)
  } else {
    console.log('  (All users already existed — no new passwords generated.)')
  }
}

main().catch((e) => {
  console.error('✗ Seed failed:', e)
  process.exit(1)
})
