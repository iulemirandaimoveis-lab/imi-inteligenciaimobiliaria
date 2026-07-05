#!/usr/bin/env node
/**
 * Emissão de chave da Partner API v1 (D-15).
 *
 * A chave completa é exibida UMA ÚNICA VEZ, aqui, na sua máquina — o banco
 * guarda apenas o hash SHA-256. Rode localmente com o service role no env
 * (nunca em CI, nunca em chat):
 *
 *   node scripts/partner/create-partner-key.mjs \
 *     --name "Mano Imóveis" \
 *     --scopes developments:read,lots:read,maps:read,prices:read
 *
 * Env necessário: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (lidos do ambiente ou de .env.local).
 */

import { createHash, randomBytes } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'

const VALID_SCOPES = new Set(['developments:read', 'lots:read', 'maps:read', 'prices:read'])

function loadEnvLocal() {
    if (!existsSync('.env.local')) return
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
}

function arg(flag) {
    const i = process.argv.indexOf(flag)
    return i >= 0 ? process.argv[i + 1] : undefined
}

async function main() {
    loadEnvLocal()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        console.error('✗ Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente ou .env.local')
        process.exit(1)
    }

    const name = arg('--name')
    const scopesRaw = arg('--scopes') || 'developments:read,lots:read,maps:read'
    if (!name) {
        console.error('✗ Uso: node scripts/partner/create-partner-key.mjs --name "Parceiro" [--scopes a,b,c]')
        process.exit(1)
    }
    const scopes = scopesRaw.split(',').map((s) => s.trim()).filter(Boolean)
    const invalid = scopes.filter((s) => !VALID_SCOPES.has(s))
    if (invalid.length) {
        console.error(`✗ Escopos inválidos: ${invalid.join(', ')}. Válidos: ${[...VALID_SCOPES].join(', ')}`)
        process.exit(1)
    }

    const secret = `imi_pk_${randomBytes(32).toString('base64url')}`
    const keyHash = createHash('sha256').update(secret).digest('hex')
    const keyPrefix = secret.slice(0, 15) // "imi_pk_" + 8 chars — identificação em logs

    const res = await fetch(`${url}/rest/v1/partner_api_keys`, {
        method: 'POST',
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
        },
        body: JSON.stringify({ partner_name: name, key_hash: keyHash, key_prefix: keyPrefix, scopes }),
    })
    if (!res.ok) {
        console.error(`✗ Falha ao criar chave (HTTP ${res.status}):`, await res.text())
        process.exit(1)
    }
    const [row] = await res.json()

    console.log('')
    console.log('✓ Chave criada para:', name)
    console.log('  id:      ', row.id)
    console.log('  prefixo: ', keyPrefix)
    console.log('  escopos: ', scopes.join(', '))
    console.log('')
    console.log('  ⚠️  CHAVE (exibida UMA única vez — envie ao parceiro por canal seguro):')
    console.log('')
    console.log(`  ${secret}`)
    console.log('')
    console.log('  Uso: curl -H "Authorization: Bearer <CHAVE>" https://www.iulemirandaimoveis.com.br/api/v1/developments')
    console.log('  Revogar: UPDATE partner_api_keys SET active=false, revoked_at=now() WHERE id = \'' + row.id + '\';')
}

main().catch((err) => {
    console.error('✗ Erro inesperado:', err)
    process.exit(1)
})
