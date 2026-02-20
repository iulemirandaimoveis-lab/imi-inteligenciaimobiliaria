'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Send, Briefcase, Globe, DollarSign, Calendar } from 'lucide-react'

const CITIES = ['Miami', 'Orlando', 'Dubai', 'São Paulo']
const TYPES = ['Investimento para renda', 'Residência internacional', 'Diversificação patrimonial', 'Estruturação holding']

export default function NovaConsultoriaPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        clientName: '', email: '', phone: '',
        city: '', type: '', budget: '', timeline: '', notes: ''
    })
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await new Promise(r => setTimeout(r, 1000))
        setLoading(false)
        setSent(true)
    }

    if (sent) {
        return (
            <div className="max-w-xl mx-auto text-center py-16">
                <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send size={24} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Consulta Registrada</h2>
                <p className="text-[#6C757D] mb-8">A consultoria foi criada e o cliente será contactado.</p>
                <button onClick={() => router.push('/backoffice/consultoria')}
                    className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-semibold text-sm hover:bg-[#C49D5B] transition-colors">
                    Ver Consultorias
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => router.back()}
                    className="p-2 rounded-xl hover:bg-[#F8F9FA] transition-colors text-[#6C757D]">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-[#1A1A1A]">Nova Consultoria</h1>
                    <p className="text-sm text-[#6C757D]">Registrar nova solicitação de consultoria estratégica</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client info */}
                <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6">
                    <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 text-[14px]">
                        <Briefcase size={15} className="text-[#C49D5B]" /> Dados do Cliente
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { key: 'clientName', label: 'Nome completo', placeholder: 'Nome do cliente', type: 'text', required: true },
                            { key: 'email', label: 'Email', placeholder: 'email@exemplo.com', type: 'email', required: true },
                            { key: 'phone', label: 'Telefone', placeholder: '(81) 99999-9999', type: 'tel', required: false },
                        ].map(f => (
                            <div key={f.key} className={f.key === 'clientName' ? 'sm:col-span-2' : ''}>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6C757D] mb-2">{f.label}</label>
                                <input type={f.type} required={f.required} placeholder={f.placeholder}
                                    value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                    className="w-full h-11 px-4 text-sm bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B]/30 focus:border-[#C49D5B] transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Consultoria details */}
                <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6">
                    <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 text-[14px]">
                        <Globe size={15} className="text-[#C49D5B]" /> Detalhes da Consultoria
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6C757D] mb-2">Praça de Interesse</label>
                            <select value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                                className="w-full h-11 px-4 text-sm bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B]/30">
                                <option value="">Selecionar...</option>
                                {CITIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6C757D] mb-2">Tipo de Consultoria</label>
                            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                className="w-full h-11 px-4 text-sm bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B]/30">
                                <option value="">Selecionar...</option>
                                {TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6C757D] mb-2">Budget (USD)</label>
                            <input type="text" placeholder="Ex: $300k – $500k" value={form.budget}
                                onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                                className="w-full h-11 px-4 text-sm bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B]/30" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6C757D] mb-2">Timeline</label>
                            <input type="text" placeholder="Ex: 6 meses" value={form.timeline}
                                onChange={e => setForm(p => ({ ...p, timeline: e.target.value }))}
                                className="w-full h-11 px-4 text-sm bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B]/30" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6C757D] mb-2">Observações</label>
                            <textarea rows={3} value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Informações adicionais sobre o cliente ou sua necessidade..."
                                className="w-full px-4 py-3 text-sm bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B]/30 resize-none" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => router.back()}
                        className="px-6 py-2.5 border border-[#E9ECEF] text-[#6C757D] rounded-xl text-sm font-semibold hover:bg-[#F8F9FA] transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading}
                        className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-semibold hover:bg-[#C49D5B] transition-all disabled:opacity-50 flex items-center gap-2">
                        {loading ? 'Salvando...' : <><Send size={14} /> Criar Consultoria</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
