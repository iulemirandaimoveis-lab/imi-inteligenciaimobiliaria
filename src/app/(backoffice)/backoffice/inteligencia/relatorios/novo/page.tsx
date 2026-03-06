'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['Panorama Anual', 'Dossiê de Bairro', 'Análise Comparativa', 'Estudo de Viabilidade', 'Laudo Técnico']

export default function NovoRelatorioPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        title: '',
        summary: '',
        pdf_url: '',
        published_at: '',
        category: '',
        is_published: false,
        slug: '',
    })

    function set(field: string, value: string | boolean) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    function autoSlug(title: string) {
        return title.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim().replace(/\s+/g, '-')
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const supabase = createClient()
        const { error } = await supabase.from('market_reports').insert({
            title: form.title,
            summary: form.summary || null,
            pdf_url: form.pdf_url || null,
            published_at: form.published_at || null,
            category: form.category || null,
            is_published: form.is_published,
            slug: form.slug || autoSlug(form.title),
        })
        setSaving(false)
        if (!error) router.push('/backoffice/inteligencia/relatorios')
        else alert('Erro ao salvar: ' + error.message)
    }

    const inputClass = "w-full h-10 px-3 rounded-xl text-sm outline-none transition-all"
    const inputStyle = { background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', color: 'var(--bo-text)' }

    return (
        <div className="p-6 lg:p-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/backoffice/inteligencia/relatorios" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bo-hover)]" style={{ background: 'var(--bo-icon-bg)' }}>
                    <ArrowLeft size={15} style={{ color: 'var(--bo-text-muted)' }} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--bo-text)', fontFamily: "'Playfair Display', serif" }}>Novo Relatório</h1>
                    <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>Adicionar estudo técnico de mercado</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-6 rounded-2xl space-y-5" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--bo-text)' }}>Informações</h2>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Título *</label>
                        <input required type="text" value={form.title} onChange={e => { set('title', e.target.value); if (!form.slug) set('slug', autoSlug(e.target.value)) }} className={inputClass} style={inputStyle} placeholder="Ex: Panorama do Alto Padrão 2024" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Categoria</label>
                        <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass} style={inputStyle}>
                            <option value="">Selecionar categoria</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Resumo</label>
                        <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all resize-none" style={inputStyle} placeholder="Descrição do conteúdo do relatório..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>URL do PDF</label>
                        <input type="url" value={form.pdf_url} onChange={e => set('pdf_url', e.target.value)} className={inputClass} style={inputStyle} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Data de Publicação</label>
                        <input type="date" value={form.published_at} onChange={e => set('published_at', e.target.value)} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Slug</label>
                        <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} style={inputStyle} placeholder="panorama-alto-padrao-2024" />
                    </div>
                </div>

                <div className="p-6 rounded-2xl" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--bo-text)' }}>Publicar</p>
                            <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>Exibe na página pública de relatórios</p>
                        </div>
                        <button type="button" onClick={() => set('is_published', !form.is_published)} className="w-10 h-5 rounded-full relative transition-colors" style={{ background: form.is_published ? 'var(--accent-500)' : 'var(--bo-border)' }}>
                            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: form.is_published ? '22px' : '2px' }} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                    <Link href="/backoffice/inteligencia/relatorios" className="h-9 px-5 rounded-xl text-sm font-medium" style={{ color: 'var(--bo-text-muted)', background: 'var(--bo-icon-bg)' }}>Cancelar</Link>
                    <button type="submit" disabled={saving} className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))' }}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    )
}
