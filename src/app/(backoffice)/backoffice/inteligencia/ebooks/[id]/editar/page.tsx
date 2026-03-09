'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

export default function EditarEbookPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        title: '',
        subtitle: '',
        description: '',
        cover_image: '',
        back_cover_image: '',
        amazon_url: '',
        slug: '',
        is_published: false,
        sort_order: 0,
    })

    useEffect(() => {
        async function load() {
            const supabase = createClient()
            const { data } = await supabase.from('ebooks').select('*').eq('id', id).single()
            if (data) {
                setForm({
                    title: data.title ?? '',
                    subtitle: data.subtitle ?? '',
                    description: data.description ?? '',
                    cover_image: data.cover_image ?? '',
                    back_cover_image: data.back_cover_image ?? '',
                    amazon_url: data.amazon_url ?? '',
                    slug: data.slug ?? '',
                    is_published: data.is_published ?? false,
                    sort_order: data.sort_order ?? 0,
                })
            }
            setLoading(false)
        }
        load()
    }, [id])

    function set(field: string, value: string | boolean | number) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const supabase = createClient()
        const { error } = await supabase.from('ebooks').update({
            title: form.title,
            subtitle: form.subtitle || null,
            description: form.description || null,
            cover_image: form.cover_image || null,
            back_cover_image: form.back_cover_image || null,
            amazon_url: form.amazon_url || null,
            slug: form.slug || null,
            is_published: form.is_published,
            sort_order: Number(form.sort_order),
            updated_at: new Date().toISOString(),
        }).eq('id', id)
        setSaving(false)
        if (!error) router.push('/backoffice/inteligencia/ebooks')
        else alert('Erro ao salvar: ' + error.message)
    }

    const inputClass = "w-full h-10 px-3 rounded-xl text-sm outline-none transition-all"
    const inputStyle = {
        background: 'var(--bo-elevated)',
        border: '1px solid var(--bo-border)',
        color: 'var(--bo-text)',
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin" size={22} style={{ color: 'var(--bo-text-muted)' }} />
        </div>
    )

    return (
        <div className="p-6 lg:p-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/backoffice/inteligencia/ebooks"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bo-hover)]"
                    style={{ background: 'var(--bo-icon-bg)' }}
                >
                    <ArrowLeft size={15} style={{ color: 'var(--bo-text-muted)' }} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--bo-text)', fontFamily: "'Playfair Display', serif" }}>
                        Editar Ebook
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>{form.title}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-6 rounded-2xl space-y-5" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--bo-text)' }}>Informações Básicas</h2>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Título *</label>
                        <input required type="text" value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Subtítulo</label>
                        <input type="text" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Descrição</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all resize-none" style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Slug</label>
                        <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} className={inputClass} style={inputStyle} />
                    </div>
                </div>

                <div className="p-6 rounded-2xl space-y-5" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--bo-text)' }}>Mídia & Links</h2>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>URL da Capa</label>
                        <input type="url" value={form.cover_image} onChange={e => set('cover_image', e.target.value)} className={inputClass} style={inputStyle} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>URL Contracapa</label>
                        <input type="url" value={form.back_cover_image} onChange={e => set('back_cover_image', e.target.value)} className={inputClass} style={inputStyle} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Link Amazon</label>
                        <input type="url" value={form.amazon_url} onChange={e => set('amazon_url', e.target.value)} className={inputClass} style={inputStyle} placeholder="https://amazon.com.br/dp/..." />
                    </div>
                </div>

                <div className="p-6 rounded-2xl space-y-5" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--bo-text)' }}>Publicação</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--bo-text)' }}>Publicar na biblioteca</p>
                            <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>Exibe no site público</p>
                        </div>
                        <button type="button" onClick={() => set('is_published', !form.is_published)} className="w-10 h-5 rounded-full relative transition-colors" style={{ background: form.is_published ? 'var(--accent-500)' : 'var(--bo-border)' }}>
                            <span className="absolute top-0.5 w-4 h-4 rounded-full shadow transition-all" style={{ left: form.is_published ? '22px' : '2px', background: '#E8EDF2' }} />
                        </button>
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Ordem de exibição</label>
                        <input type="number" min={0} value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} className={inputClass} style={inputStyle} />
                    </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                    <Link href="/backoffice/inteligencia/ebooks" className="h-9 px-5 rounded-xl text-sm font-medium transition-colors" style={{ color: 'var(--bo-text-muted)', background: 'var(--bo-icon-bg)' }}>Cancelar</Link>
                    <button type="submit" disabled={saving} className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ background: 'var(--accent-500)' }}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    )
}
