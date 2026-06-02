'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, X, FileImage, ExternalLink } from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'

interface FloorPlanUploadProps {
    value: string
    onChange: (url: string) => void
}

export function FloorPlanUpload({ value, onChange }: FloorPlanUploadProps) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    const inputStyle = {
        width: '100%',
        height: 42,
        padding: '0 12px',
        borderRadius: 8,
        background: T.elevated,
        border: `1px solid ${T.border}`,
        color: T.text,
        fontFamily: 'var(--font-outfit, sans-serif)',
        fontSize: 13,
        outline: 'none',
    } as React.CSSProperties

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setError('')
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload?folder=floor-plans&bucket=media', {
                method: 'POST',
                body: formData,
            })
            const json = await res.json()
            if (!res.ok || !json.success) {
                setError(json.error || 'Erro ao enviar arquivo')
            } else {
                onChange(json.data.url)
            }
        } catch {
            setError('Erro de rede ao enviar arquivo')
        } finally {
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Upload button row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        height: 42,
                        padding: '0 16px',
                        borderRadius: 8,
                        background: T.elevated,
                        border: `1px solid ${T.border}`,
                        color: uploading ? T.textMuted : T.text,
                        fontFamily: 'var(--font-outfit, sans-serif)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                        opacity: uploading ? 0.6 : 1,
                    }}
                >
                    {uploading
                        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Upload size={14} />
                    }
                    {uploading ? 'Enviando...' : 'Enviar arquivo'}
                </button>

                <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>ou</span>

                <input
                    style={inputStyle}
                    type="url"
                    placeholder="URL da planta (https://...)"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />

                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        title="Remover"
                        style={{
                            flexShrink: 0,
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: 'transparent',
                            border: `1px solid rgba(239,68,68,0.3)`,
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Preview when URL is set */}
            {value && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(61,111,255,0.06)',
                    border: '1px solid rgba(61,111,255,0.18)',
                }}>
                    <FileImage size={14} style={{ color: T.accent, flexShrink: 0 }} />
                    <span style={{
                        fontFamily: 'var(--font-outfit, sans-serif)',
                        fontSize: 12,
                        color: T.textDim,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {value.split('/').pop() || 'planta'}
                    </span>
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: T.accent, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    >
                        <ExternalLink size={13} />
                    </a>
                </div>
            )}

            {error && (
                <p style={{ fontSize: 11, color: '#EF4444', margin: 0 }}>{error}</p>
            )}

            <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                Aceita JPG, PNG, WebP ou PDF — máximo 50MB
            </p>

            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFile}
            />
            <style suppressHydrationWarning>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
