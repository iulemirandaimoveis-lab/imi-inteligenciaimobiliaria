'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Loader2, FileText, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import type { BankAccount } from './BankAccountsPanel'

interface Props {
    account: BankAccount
    onClose: () => void
    onImported: () => void
}

export default function ImportStatementModal({ account, onClose, onImported }: Props) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState('')
    const [content, setContent] = useState('')
    const [warnings, setWarnings] = useState<string[]>([])
    const [busy, setBusy] = useState(false)

    const handleFile = (file: File) => {
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = () => setContent(String(reader.result || ''))
        reader.readAsText(file, 'utf-8')
    }

    const submit = async () => {
        if (!content) {
            toast.error('Selecione um arquivo CSV do extrato')
            return
        }
        setBusy(true)
        setWarnings([])
        try {
            const res = await fetch('/api/finance/bank-transactions/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bank_account_id: account.id, csv_content: content }),
            })
            const json = await res.json()
            if (res.ok) {
                toast.success(`${json.inserted} lançamento(s) importado(s)`)
                if (json.warnings?.length) setWarnings(json.warnings)
                else onImported()
            } else {
                toast.error(json.error || 'Erro ao importar CSV')
            }
        } catch {
            toast.error('Erro de conexão')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full rounded-2xl overflow-hidden"
                style={{ maxWidth: 460, background: T.surface, border: `1px solid ${T.border}` }}
            >
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <div>
                        <p className="text-sm font-bold" style={{ color: T.text }}>Importar extrato — {account.label}</p>
                        <p className="text-[11px]" style={{ color: T.textMuted }}>CSV com colunas Data, Descrição, Valor (exportado do internet banking)</p>
                    </div>
                    <button onClick={onClose} className="p-1" style={{ color: T.textMuted }}><X size={18} /></button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 rounded-xl py-8 transition-all active:scale-[0.98]"
                        style={{ border: `1.5px dashed ${T.border}`, background: T.borderLight }}
                    >
                        <FileText size={22} style={{ color: T.textGold }} />
                        <span className="text-[12px] font-semibold" style={{ color: T.text }}>
                            {fileName || 'Clique para selecionar o arquivo .csv'}
                        </span>
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                    />

                    {warnings.length > 0 && (
                        <div className="rounded-lg p-3 text-[11px] space-y-1" style={{ background: T.errorBg, color: T.error }}>
                            <div className="flex items-center gap-1.5 font-bold"><AlertTriangle size={12} /> Linhas ignoradas</div>
                            {warnings.slice(0, 8).map((w, i) => <p key={i}>{w}</p>)}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 h-11 rounded-lg text-[12px] font-bold uppercase tracking-wider"
                            style={{ background: 'transparent', color: T.textMuted, border: `1px solid ${T.border}` }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={submit}
                            disabled={busy || !content}
                            className="flex-1 h-11 rounded-lg text-[12px] font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2"
                            style={{ background: T.textGold, color: '#050B14', opacity: busy || !content ? 0.6 : 1 }}
                        >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            Importar
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
