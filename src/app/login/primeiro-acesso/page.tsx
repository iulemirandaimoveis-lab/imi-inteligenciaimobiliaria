'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function PrimeiroAcessoPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [tempPassword, setTempPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')

    const isValid = !!email && !!tempPassword && newPassword.length >= 8 && newPassword === confirmPassword

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!isValid) return
        setError('')
        setSuccess('')
        setLoading(true)
        try {
            const res = await fetch('/api/auth/first-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    temp_password: tempPassword,
                    new_password: newPassword,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Não foi possível concluir o primeiro acesso.')
                return
            }
            setSuccess('Senha cadastrada com sucesso. Faça login com sua nova senha.')
            setTimeout(() => router.push('/login'), 1200)
        } catch {
            setError('Erro de conexão ao processar primeiro acesso.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050B14' }}>
            <div className="w-full max-w-md rounded-2xl p-6 border" style={{ background: '#0A1624', borderColor: 'rgba(200,164,74,.2)' }}>
                <Link href="/login" className="inline-flex items-center gap-2 text-xs mb-4" style={{ color: '#C8A44A' }}>
                    <ArrowLeft size={14} /> Voltar ao login
                </Link>
                <h1 className="text-xl font-semibold mb-1" style={{ color: '#E8E4DC' }}>Primeiro acesso</h1>
                <p className="text-xs mb-5" style={{ color: '#4F5B6B' }}>
                    Use o e-mail e a senha provisória recebida do administrador para definir sua senha.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm border"
                        style={{ background: 'rgba(20,36,64,.4)', borderColor: 'rgba(200,164,74,.2)', color: '#E8E4DC' }}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Senha provisória"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm border"
                        style={{ background: 'rgba(20,36,64,.4)', borderColor: 'rgba(200,164,74,.2)', color: '#E8E4DC' }}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Nova senha (mínimo 8 caracteres)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm border"
                        style={{ background: 'rgba(20,36,64,.4)', borderColor: 'rgba(200,164,74,.2)', color: '#E8E4DC' }}
                        required
                        minLength={8}
                    />
                    <input
                        type="password"
                        placeholder="Confirmar nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm border"
                        style={{ background: 'rgba(20,36,64,.4)', borderColor: 'rgba(200,164,74,.2)', color: '#E8E4DC' }}
                        required
                        minLength={8}
                    />

                    {error && <p className="text-xs" style={{ color: '#F87171' }}>{error}</p>}
                    {success && <p className="text-xs" style={{ color: '#86EFAC' }}>{success}</p>}

                    <button
                        type="submit"
                        disabled={!isValid || loading}
                        className="w-full py-2 rounded-md text-sm font-semibold disabled:opacity-60"
                        style={{ background: '#142840', color: '#E8E4DC', borderBottom: '2px solid #C8A44A' }}
                    >
                        {loading ? 'Salvando...' : 'Cadastrar senha do primeiro acesso'}
                    </button>
                </form>
            </div>
        </div>
    )
}
