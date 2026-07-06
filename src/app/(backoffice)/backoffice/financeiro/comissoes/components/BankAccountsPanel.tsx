'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Landmark, Plug, PlugZap, RefreshCw, Upload, CheckCircle2,
    AlertTriangle, Loader2, Wifi,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import ImportStatementModal from './ImportStatementModal'

export interface BankAccount {
    id: string
    label: string
    holder_type: 'pf' | 'pj'
    holder_name: string | null
    bank_name: string | null
    agencia: string | null
    conta: string | null
    provider: 'manual' | 'btg_empresas_api'
    env_prefix: string | null
    connection_status: 'not_connected' | 'connected' | 'error'
    last_sync_at: string | null
    last_sync_error: string | null
    active: boolean
}

const STATUS_CFG: Record<BankAccount['connection_status'], { label: string; color: string; bg: string; icon: typeof Wifi }> = {
    connected: { label: 'Conectado', color: T.success, bg: T.successBg, icon: CheckCircle2 },
    not_connected: { label: 'Não conectado', color: T.textMuted, bg: T.borderLight, icon: Plug },
    error: { label: 'Erro na conexão', color: T.error, bg: T.errorBg, icon: AlertTriangle },
}

export default function BankAccountsPanel({ accounts, onChanged }: { accounts: BankAccount[]; onChanged: () => void }) {
    const [busyId, setBusyId] = useState<string | null>(null)
    const [importFor, setImportFor] = useState<BankAccount | null>(null)

    const testConnection = async (acc: BankAccount) => {
        setBusyId(acc.id)
        try {
            const res = await fetch(`/api/finance/bank-accounts/${acc.id}/test-connection`, { method: 'POST' })
            const json = await res.json()
            if (json.ok) toast.success(json.message || 'Conexão validada')
            else toast.error(json.error || 'Falha ao testar conexão')
        } catch {
            toast.error('Erro de conexão')
        } finally {
            setBusyId(null)
            onChanged()
        }
    }

    const syncNow = async (acc: BankAccount) => {
        setBusyId(acc.id)
        try {
            const res = await fetch(`/api/finance/bank-accounts/${acc.id}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: 30 }),
            })
            const json = await res.json()
            if (res.ok) toast.success(`${json.inserted} novo(s) lançamento(s) sincronizado(s)`)
            else toast.error(json.error || 'Falha ao sincronizar')
        } catch {
            toast.error('Erro de conexão')
        } finally {
            setBusyId(null)
            onChanged()
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc, i) => {
                const sc = STATUS_CFG[acc.connection_status]
                const StatusIcon = sc.icon
                const isBusy = busyId === acc.id
                return (
                    <motion.div
                        key={acc.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-2xl overflow-hidden flex flex-col h-full"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: T.borderLight }}>
                                    <Landmark size={15} style={{ color: T.textGold }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{acc.label}</p>
                                    <p className="text-[11px] truncate" style={{ color: T.textMuted }}>
                                        {acc.holder_type.toUpperCase()} · {acc.bank_name || 'BTG Pactual'}
                                        {acc.agencia && acc.conta ? ` · Ag ${acc.agencia} / Cc ${acc.conta}` : ''}
                                    </p>
                                </div>
                            </div>
                            <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                                style={{ color: sc.color, background: sc.bg }}
                            >
                                <StatusIcon size={10} /> {sc.label}
                            </span>
                        </div>

                        <div className="flex flex-col flex-1 p-4 gap-3">
                            <p className="text-[12px]" style={{ color: T.textMuted }}>
                                {acc.provider === 'btg_empresas_api'
                                    ? 'Conector: BTG Empresas API (OAuth2)'
                                    : 'Conector: importação manual de extrato (CSV)'}
                            </p>
                            {acc.last_sync_at && (
                                <p className="text-[11px]" style={{ color: T.textMuted }}>
                                    Última sincronização: {new Date(acc.last_sync_at).toLocaleString('pt-BR')}
                                </p>
                            )}
                            {acc.last_sync_error && (
                                <p className="text-[11px] rounded-md px-2 py-1.5" style={{ color: T.error, background: T.errorBg }}>
                                    {acc.last_sync_error}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-2 mt-auto pt-1">
                                {acc.provider === 'btg_empresas_api' ? (
                                    <>
                                        <button
                                            onClick={() => testConnection(acc)}
                                            disabled={isBusy}
                                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                                            style={{ background: T.borderLight, color: T.text, opacity: isBusy ? 0.6 : 1 }}
                                        >
                                            {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Wifi size={13} />}
                                            Testar
                                        </button>
                                        <a
                                            href={`/api/finance/bank-accounts/${acc.id}/authorize`}
                                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                                            style={{ background: T.textGold, color: '#050B14' }}
                                        >
                                            <PlugZap size={13} /> Conectar
                                        </a>
                                        <button
                                            onClick={() => syncNow(acc)}
                                            disabled={isBusy}
                                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                                            style={{ background: T.borderLight, color: T.text, opacity: isBusy ? 0.6 : 1 }}
                                        >
                                            {isBusy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                                            Sincronizar
                                        </button>
                                    </>
                                ) : null}
                                <button
                                    onClick={() => setImportFor(acc)}
                                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                                    style={{ background: 'transparent', color: T.text, border: `1px solid ${T.border}` }}
                                >
                                    <Upload size={13} /> Importar extrato (CSV)
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )
            })}

            {importFor && (
                <ImportStatementModal
                    account={importFor}
                    onClose={() => setImportFor(null)}
                    onImported={() => { setImportFor(null); onChanged() }}
                />
            )}
        </div>
    )
}
