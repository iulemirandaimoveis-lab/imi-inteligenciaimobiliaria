'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Loader2, Copy, CheckCircle2, QrCode,
    Zap, Clock, Info, RefreshCw,
} from 'lucide-react'

interface PixCharge {
    id: string
    txid: string
    amount: number
    description?: string
    pixCopyPaste: string
    qrCodeBase64: string
    provider: string
    expiresAt: string | null
    status: string
}

interface PixChargeModalProps {
    transactionId: string
    amount: number
    description?: string
    onClose: () => void
    onConfirmed?: () => void
}

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function PixChargeModal({
    transactionId,
    amount,
    description,
    onClose,
    onConfirmed,
}: PixChargeModalProps) {
    const [step, setStep] = useState<'form' | 'qr' | 'confirmed'>('form')
    const [loading, setLoading] = useState(false)
    const [charge, setCharge] = useState<PixCharge | null>(null)
    const [copied, setCopied] = useState(false)
    const [polling, setPolling] = useState(false)
    const [debtorName, setDebtorName] = useState('')
    const [error, setError] = useState('')

    // Generate charge
    const generate = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    description: description || `Cobrança #${transactionId.slice(-6).toUpperCase()}`,
                    transactionId,
                    debtorName: debtorName.trim() || undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao gerar cobrança')
            setCharge(data.charge)
            setStep('qr')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao gerar Pix')
        } finally {
            setLoading(false)
        }
    }

    // Poll status every 5 seconds while on QR screen
    useEffect(() => {
        if (step !== 'qr' || !charge) return
        const iv = setInterval(async () => {
            try {
                const res = await fetch(`/api/pix?id=${charge.id}`)
                const data = await res.json()
                const updated = data.data?.[0]
                if (updated?.status === 'received') {
                    clearInterval(iv)
                    setStep('confirmed')
                    onConfirmed?.()
                }
            } catch { /* ignore */ }
        }, 5000)
        setPolling(true)
        return () => { clearInterval(iv); setPolling(false) }
    }, [step, charge, onConfirmed])

    const copyPix = async () => {
        if (!charge?.pixCopyPaste) return
        await navigator.clipboard.writeText(charge.pixCopyPaste)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
    }

    const providerLabel =
        charge?.provider === 'abacatepay' ? 'AbacatePay'
        : charge?.provider === 'asaas' ? 'Asaas'
        : 'Gerado localmente'

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                style={{
                    width: '100%', maxWidth: '420px',
                    background: 'var(--bo-card)',
                    border: '1px solid var(--bo-border)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--bo-border)',
                    background: 'var(--bo-elevated)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,178,127,0.15)', border: '1px solid rgba(0,178,127,0.25)',
                        }}>
                            <Zap size={16} style={{ color: '#00B27F' }} />
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bo-text)' }}>Cobrança Pix</p>
                            <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)' }}>
                                {step === 'form' ? 'Gerar QR Code' : step === 'qr' ? 'Aguardando pagamento' : 'Pagamento confirmado!'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--bo-text-muted)' }}>
                        <X size={18} />
                    </button>
                </div>

                <AnimatePresence mode="wait">

                    {/* STEP: FORM */}
                    {step === 'form' && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                        >
                            {/* Amount display */}
                            <div style={{
                                padding: '16px', borderRadius: '14px', textAlign: 'center',
                                background: 'rgba(0,178,127,0.08)', border: '1px solid rgba(0,178,127,0.18)',
                            }}>
                                <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                    Valor a cobrar
                                </p>
                                <p style={{ fontSize: '28px', fontWeight: 800, color: '#00B27F' }}>
                                    {formatCurrency(amount)}
                                </p>
                                {description && (
                                    <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)', marginTop: '4px' }}>{description}</p>
                                )}
                            </div>

                            {/* Debtor name (optional) */}
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Nome do pagador (opcional)
                                </label>
                                <input
                                    value={debtorName}
                                    onChange={e => setDebtorName(e.target.value)}
                                    placeholder="Ex: João da Silva"
                                    style={{
                                        width: '100%', height: '44px', padding: '0 12px',
                                        borderRadius: '10px', fontSize: '13px',
                                        color: 'var(--bo-text)',
                                        background: 'var(--bo-surface)',
                                        border: '1px solid var(--bo-border)',
                                        outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            {/* Info */}
                            <div style={{
                                display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '10px',
                                background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
                                alignItems: 'flex-start',
                            }}>
                                <Info size={13} style={{ color: 'var(--bo-text-muted)', flexShrink: 0, marginTop: '1px' }} />
                                <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', lineHeight: '1.5' }}>
                                    O QR Code expira em <strong style={{ color: 'var(--bo-text)' }}>24 horas</strong>.
                                    Após o pagamento, o lançamento será marcado como pago automaticamente.
                                </p>
                            </div>

                            {error && (
                                <p style={{ fontSize: '12px', color: 'var(--s-hot)', textAlign: 'center' }}>{error}</p>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={onClose}
                                    style={{
                                        flex: 1, height: '44px', borderRadius: '12px',
                                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                        background: 'var(--bo-surface)', color: 'var(--bo-text-muted)',
                                        border: '1px solid var(--bo-border)',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={generate}
                                    disabled={loading}
                                    style={{
                                        flex: 2, height: '44px', borderRadius: '12px',
                                        fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                        color: '#fff',
                                        background: 'linear-gradient(135deg, #00B27F 0%, #00D9A0 100%)',
                                        border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: loading ? 0.75 : 1,
                                    }}
                                >
                                    {loading ? (
                                        <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                                    ) : (
                                        <><QrCode size={15} /> Gerar QR Code</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP: QR CODE */}
                    {step === 'qr' && charge && (
                        <motion.div
                            key="qr"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}
                        >
                            {/* QR Image */}
                            <div style={{
                                padding: '14px', borderRadius: '16px',
                                background: '#FFFFFF',
                                border: '2px solid rgba(0,178,127,0.25)',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                            }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`data:image/png;base64,${charge.qrCodeBase64}`}
                                    alt="QR Code Pix"
                                    width={220}
                                    height={220}
                                    style={{ display: 'block', borderRadius: '8px' }}
                                />
                            </div>

                            {/* Amount + status */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '22px', fontWeight: 800, color: '#00B27F' }}>
                                    {formatCurrency(charge.amount)}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                                    <div style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: '#00B27F', animation: 'pulse 1.5s ease-in-out infinite',
                                    }} />
                                    <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', fontWeight: 600 }}>
                                        Aguardando pagamento{polling ? '...' : ''}
                                    </p>
                                    {polling && <RefreshCw size={10} style={{ color: 'var(--bo-text-muted)', animation: 'spin 2s linear infinite' }} />}
                                </div>
                            </div>

                            {/* Expiry */}
                            {charge.expiresAt && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 12px', borderRadius: '8px',
                                    background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
                                }}>
                                    <Clock size={11} style={{ color: 'var(--bo-text-muted)' }} />
                                    <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)' }}>
                                        Expira em {new Date(charge.expiresAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            )}

                            {/* Copy Pix */}
                            <button
                                onClick={copyPix}
                                style={{
                                    width: '100%', height: '44px', borderRadius: '12px',
                                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                    color: copied ? '#00B27F' : 'var(--bo-text)',
                                    background: copied ? 'rgba(0,178,127,0.1)' : 'var(--bo-elevated)',
                                    border: `1px solid ${copied ? 'rgba(0,178,127,0.35)' : 'var(--bo-border)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {copied ? (
                                    <><CheckCircle2 size={15} /> Copiado!</>
                                ) : (
                                    <><Copy size={15} /> Copiar Pix Copia e Cola</>
                                )}
                            </button>

                            {/* Provider badge */}
                            <p style={{ fontSize: '10px', color: 'var(--bo-text-dim)', textAlign: 'center' }}>
                                Provedor: {providerLabel} · TXID: {charge.txid.slice(0, 12)}…
                            </p>
                        </motion.div>
                    )}

                    {/* STEP: CONFIRMED */}
                    {step === 'confirmed' && (
                        <motion.div
                            key="confirmed"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}
                        >
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                style={{
                                    width: '72px', height: '72px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(0,178,127,0.15)', border: '2px solid rgba(0,178,127,0.4)',
                                }}
                            >
                                <CheckCircle2 size={36} style={{ color: '#00B27F' }} />
                            </motion.div>
                            <div>
                                <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--bo-text)', marginBottom: '6px' }}>
                                    Pagamento Recebido!
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)' }}>
                                    {charge ? formatCurrency(charge.amount) : ''} confirmado via Pix
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    height: '44px', padding: '0 32px', borderRadius: '12px',
                                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                    color: '#fff',
                                    background: 'linear-gradient(135deg, #00B27F 0%, #00D9A0 100%)',
                                    border: 'none',
                                }}
                            >
                                Fechar
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
