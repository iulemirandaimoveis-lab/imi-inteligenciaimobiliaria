'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Edit, Trash2, Calendar, Image as ImageIcon,
  Video, FileText, CheckCircle, Clock, X, Sparkles,
  Zap, Ghost, MoreHorizontal, ChevronRight, Wand2,
  Layout, MessageSquare, Share2, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Toast, { useToast } from '@/components/ui/Toast'
import { uploadMultipleFiles, deleteFile } from '@/lib/supabase/storage'
import Image from 'next/image'

interface Content {
  id: string
  title: string
  type: string
  content: string | { text: string; cta: string }
  cover_image: string | null
  status: string
  tags: string[] | null
  created_at: string
}

export default function ContentPage() {
  const supabase = createClient()
  const { toasts, showToast, removeToast } = useToast()
  const [contents, setContents] = useState<Content[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    type: 'article',
    content: '',
    cover_image: '',
    status: 'draft',
    tags: [] as string[]
  })

  const [aiPrompt, setAiPrompt] = useState('')

  const fetchContents = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContents(data || [])
    } catch (err: any) {
      showToast('Erro ao carregar conteúdos', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, showToast])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim()) { showToast('Título é obrigatório', 'error'); return }

    setIsSaving(true)
    try {
      const slug = formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
      const payload = { ...formData, slug }

      if (editingContent) {
        const { error } = await supabase.from('content').update(payload).eq('id', editingContent.id)
        if (error) throw error
        showToast('Conteúdo atualizado', 'success')
      } else {
        const { error } = await supabase.from('content').insert([payload])
        if (error) throw error
        showToast('Conteúdo criado', 'success')
      }

      setIsModalOpen(false)
      resetForm()
      fetchContents()
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAIGenerate() {
    if (!aiPrompt) { showToast('Diga sobre o que quer escrever', 'error'); return }
    setIsGenerating(true)
    try {
      // Simulando chamada para /api/ai/generate-content
      // Em prod: const res = await fetch('/api/ai/generate-content', { ... })
      const mockResponse = {
        title: `Explorando ${aiPrompt}`,
        content: `A Inteligência Artificial transformou o mercado imobiliário em ${aiPrompt}... Este artigo explora as tendências de luxo e tecnologia para 2026.`,
        tags: ['Luxury', 'IA', 'RealEstate']
      }

      setFormData(prev => ({
        ...prev,
        title: mockResponse.title,
        content: mockResponse.content,
        tags: mockResponse.tags,
        status: 'draft'
      }))
      showToast('IA gerou um rascunho de alta conversão!', 'success')
      setIsAIModalOpen(false)
      setIsModalOpen(true)
    } catch (err) {
      showToast('Erro na geração IA', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir permanentemente?')) return
    try {
      const { error } = await supabase.from('content').delete().eq('id', id)
      if (error) throw error
      showToast('Conteúdo removido', 'success')
      fetchContents()
    } catch (err: any) {
      showToast('Erro ao excluir', 'error')
    }
  }

  function resetForm() {
    setFormData({ title: '', type: 'article', content: '', cover_image: '', status: 'draft', tags: [] })
    setEditingContent(null)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 h-[60vh] justify-center items-center">
        <div className="w-10 h-10 border-4 border-imi-100 border-t-accent-500 rounded-full animate-spin" />
        <p className="text-imi-300 font-bold uppercase tracking-widest text-xs">Sincronizando Conteúdos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <span className="text-[10px] font-black text-imi-400 uppercase tracking-[0.3em]">Laboratório Criativo IA</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-imi-900 font-display tracking-tight">
            Blog & <span className="text-accent-500">Mídia IA</span>
          </h1>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setIsAIModalOpen(true)} variant="outline" className="h-14 px-8 border-purple-100 bg-purple-50 text-purple-700 rounded-2xl group active:scale-95 transition-all">
            <Sparkles className="w-5 h-5 mr-3 text-purple-600 animate-pulse" />
            Gerar com IA
          </Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="h-14 px-8 bg-imi-900 text-white rounded-2xl shadow-elevated group active:scale-95 transition-all">
            <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
            Novo Post
          </Button>
        </div>
      </div>

      {/* Grid de Conteúdos */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {contents.length === 0 ? (
          <div className="lg:col-span-2 text-center py-32 bg-white rounded-[3rem] border border-dashed border-imi-100">
            <Ghost className="mx-auto text-imi-100 mb-6" size={64} />
            <p className="text-imi-400 font-medium">Sua linha do tempo está aguardando conteúdos.</p>
          </div>
        ) : (
          contents.map((content) => (
            <motion.div
              key={content.id}
              variants={itemVariants}
              className="bg-white rounded-[2.5rem] overflow-hidden border border-imi-100 shadow-soft hover:shadow-card-hover transition-all duration-500 group"
            >
              <div className="relative h-64 bg-imi-50 overflow-hidden">
                {content.cover_image ? (
                  <Image src={content.cover_image} alt={content.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-imi-100 italic font-display text-4xl">IMI</div>
                )}
                <div className="absolute top-6 left-6 flex gap-2">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-imi-900 shadow-sm flex items-center gap-2 border border-imi-100">
                    {content.type === 'video' ? <Video size={12} className="text-purple-500" /> : <ImageIcon size={12} className="text-blue-500" />}
                    {content.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${content.status === 'published' ? 'bg-green-500 text-white' : 'bg-imi-900 text-white'}`}>
                    {content.status}
                  </span>
                </div>
              </div>

              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-2xl font-bold text-imi-900 leading-tight group-hover:text-accent-600 transition-colors">{content.title}</h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingContent(content); setFormData({ ...content, content: typeof content.content === 'string' ? content.content : content.content.text, tags: content.tags || [], cover_image: content.cover_image || '' }); setIsModalOpen(true); }} className="w-10 h-10 rounded-xl bg-imi-50 flex items-center justify-center text-imi-400 hover:text-imi-900 transition-all">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(content.id)} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-300 hover:text-red-600 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <p className="text-imi-500 text-sm line-clamp-2 leading-relaxed">
                  {typeof content.content === 'string' ? content.content : content.content?.text}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-imi-50">
                  <div className="flex gap-2">
                    {content.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] text-imi-400 font-bold uppercase tracking-wider">#{tag}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-imi-300 font-black uppercase tracking-[0.2em]">{new Date(content.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Modal Criativo */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-imi-900/40 backdrop-blur-md z-50 flex items-center justify-end p-0 sm:p-4 overflow-hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto"
            >
              <div className="p-10 space-y-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-imi-900 font-display">{editingContent ? 'Refinar' : 'Compor'} Conteúdo</h2>
                  <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-imi-50 flex items-center justify-center text-imi-400">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <Input label="Título Estratégico" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Ex: O Futuro do Morar em 2026" className="h-14 rounded-2xl border-imi-100" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-imi-400 uppercase tracking-widest block">Canal</label>
                        <select value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} className="w-full h-14 bg-white border border-imi-100 rounded-2xl px-6 outline-none focus:ring-2 focus:ring-accent-500/20 transition-all font-bold text-sm">
                          <option value="article">Artigo / Blog</option>
                          <option value="post">Post Social</option>
                          <option value="video">Vídeo Script</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-imi-400 uppercase tracking-widest block">Status</label>
                        <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full h-14 bg-white border border-imi-100 rounded-2xl px-6 outline-none focus:ring-2 focus:ring-accent-500/20 transition-all font-bold text-sm">
                          <option value="draft">Rascunho</option>
                          <option value="published">Publicado</option>
                        </select>
                      </div>
                    </div>

                    <Textarea label="Corpo do Conteúdo" value={formData.content} onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))} rows={10} className="rounded-[2.5rem] border-imi-100 p-8 text-lg leading-relaxed" />
                  </div>

                  <div className="pt-10 flex gap-4">
                    <Button type="submit" disabled={isSaving} className="flex-1 h-16 bg-imi-900 text-white rounded-3xl shadow-elevated font-black text-xs uppercase tracking-widest">
                      {isSaving ? 'Gravando...' : 'Efetivar Conteúdo'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* AI Generator Modal */}
        {isAIModalOpen && (
          <div className="fixed inset-0 bg-imi-900/60 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] -mr-32 -mt-32 rounded-full" />

              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-3xl flex items-center justify-center">
                    <Zap className="text-purple-600" size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-imi-900 font-display">Creative AI</h3>
                    <p className="text-imi-400 text-sm font-medium italic">O que vamos criar para sua audiência hoje?</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-imi-400 uppercase tracking-widest block">Tópico ou Ideia Base</label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Apartamentos de luxo sustentáveis no Bessa..."
                    className="rounded-3xl border-imi-100 h-32 text-lg focus:ring-purple-500/20"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                    className="flex-1 h-16 bg-gradient-to-r from-purple-600 to-imi-900 text-white rounded-3xl shadow-elevated font-black text-xs uppercase tracking-widest group"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" /> : (
                      <>
                        <Wand2 className="mr-3 group-hover:rotate-12 transition-transform" />
                        Gerar Estratégia
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAIModalOpen(false)} className="px-8 border-imi-100 rounded-3xl font-black text-xs uppercase tracking-widest">
                    Fechar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

