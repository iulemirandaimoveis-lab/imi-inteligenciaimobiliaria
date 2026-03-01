'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Shield, Key } from 'lucide-react'

export default function NovoUsuarioPage() {
    const router = useRouter()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('EDITOR') // Mapped to the enum in DB
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/backoffice/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar o usuário')
            }

            // Success! redirect back to list
            router.push('/backoffice/settings/usuarios')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/backoffice/settings/usuarios"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Novo Usuário</h1>
                    <p className="text-sm text-gray-600 mt-1">Adicionar um novo usuário ao sistema</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
                <form onSubmit={handleCreate} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 w-full h-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                    placeholder="Nome do usuário"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">E-mail</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 w-full h-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                    placeholder="usuario@dominio.com"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Senha Inicial</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 w-full h-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nível de Acesso (Papel)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Shield className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    required
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="pl-10 w-full h-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68] bg-white"
                                >
                                    <option value="ADMIN">Administrador (Acesso total)</option>
                                    <option value="EDITOR">Corretor / Editor (Gestão de leads/imóveis)</option>
                                    <option value="VIEWER">Avaliador / Viewer (Apenas leitura)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => router.back()}
                            className="px-6 h-11 border border-gray-200 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 h-11 bg-[#16162A] text-white font-medium rounded-xl hover:bg-[#0F0F1E] transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Adicionando...' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    )
}
