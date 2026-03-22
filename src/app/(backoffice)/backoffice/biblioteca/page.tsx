'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { PageIntelHeader, KPICard, FilterTabs, type FilterTab } from '@/app/(backoffice)/components/ui'
import { T } from '@/app/(backoffice)/lib/theme'
import {
  BookOpen, Search, Loader2, Library, GraduationCap,
  Building2, TrendingUp, Shield, Cpu, Award, Scale,
} from 'lucide-react'
import { toast } from 'sonner'

/* ── Types ───────────────────────────────────────────────── */

interface Book {
  slug: string
  title: string
  subtitle?: string
  category: string
  chapters: number
}

/* ── Category config ─────────────────────────────────────── */

const CATEGORIES: Record<string, { label: string; icon: any; accent: string }> = {
  all:           { label: 'Todos',         icon: Library,      accent: T.accent },
  avaliacao:     { label: 'Avaliacao',     icon: Scale,        accent: '#10B981' },
  investimento:  { label: 'Investimento',  icon: TrendingUp,   accent: '#3B82F6' },
  patrimonial:   { label: 'Patrimonial',   icon: Shield,       accent: '#8B5CF6' },
  tecnologia:    { label: 'Tecnologia',    icon: Cpu,          accent: '#F59E0B' },
  profissional:  { label: 'Profissional',  icon: Award,        accent: '#EC4899' },
  bonus:         { label: 'Bonus',         icon: GraduationCap, accent: '#14B8A6' },
  geral:         { label: 'Geral',         icon: BookOpen,     accent: '#6366F1' },
}

/* ── Component ───────────────────────────────────────────── */

export default function BibliotecaPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  /* Fetch book index */
  useEffect(() => {
    fetch('/books/index.json')
      .then(r => r.json())
      .then(setBooks)
      .catch(() => toast.error('Erro ao carregar biblioteca'))
      .finally(() => setLoading(false))
  }, [])

  /* Build filter tabs */
  const filterTabs: FilterTab[] = useMemo(() => {
    const counts: Record<string, number> = {}
    books.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1 })
    return Object.entries(CATEGORIES).map(([id, cat]) => ({
      id,
      label: cat.label,
      count: id === 'all' ? books.length : (counts[id] || 0),
    }))
  }, [books])

  /* Filtered books */
  const filtered = useMemo(() => {
    let result = books
    if (activeCategory !== 'all') {
      result = result.filter(b => b.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(q))
      )
    }
    return result
  }, [books, activeCategory, search])

  /* Total chapters */
  const totalChapters = useMemo(
    () => books.reduce((sum, b) => sum + b.chapters, 0),
    [books],
  )

  const uniqueCategories = useMemo(
    () => new Set(books.map(b => b.category)).size,
    [books],
  )

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="BIBLIOTECA . CONHECIMENTO"
        title="Biblioteca IMI"
        subtitle="34 livros exclusivos sobre mercado imobiliario"
        breadcrumbs={[
          { label: 'Dashboard', href: '/backoffice/dashboard' },
          { label: 'Biblioteca' },
        ]}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total Livros"  value={books.length || 34} icon={<BookOpen size={16} />} accent="gold" />
        <KPICard label="Capitulos"     value={`${totalChapters || 330}+`} icon={<Library size={16} />} accent="info" />
        <KPICard label="Categorias"    value={uniqueCategories || 6} icon={<Building2 size={16} />} accent="success" />
        <KPICard label="Autor"         value="Iule Miranda" icon={<GraduationCap size={16} />} accent="gold" size="sm" />
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: T.textDim }}
          />
          <input
            type="text"
            placeholder="Buscar livro por titulo ou tema..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>

        <FilterTabs
          tabs={filterTabs}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3" style={{ color: T.textDim }} />
          <p className="text-sm font-medium" style={{ color: T.textMuted }}>
            Nenhum livro encontrado
          </p>
          <p className="text-xs mt-1" style={{ color: T.textDim }}>
            Tente ajustar os filtros ou a busca
          </p>
        </div>
      )}

      {/* Book grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(book => {
            const cat = CATEGORIES[book.category] || CATEGORIES.geral
            const CategoryIcon = cat.icon
            const categoryColor = cat.accent

            return (
              <Link
                key={book.slug}
                href={`/backoffice/biblioteca/${book.slug}`}
                className="group rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
              >
                {/* Top accent bar */}
                <div className="h-1.5" style={{ background: categoryColor }} />

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${categoryColor}15` }}
                    >
                      <CategoryIcon size={18} style={{ color: categoryColor }} />
                    </div>
                    <div className="min-w-0">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: categoryColor }}
                      >
                        {cat.label}
                      </span>
                      <h3
                        className="text-sm font-bold mt-0.5 line-clamp-2 group-hover:text-[var(--accent-400)] transition-colors"
                        style={{ color: T.text }}
                      >
                        {book.title}
                      </h3>
                    </div>
                  </div>

                  {book.subtitle && (
                    <p className="text-xs line-clamp-2 mb-3" style={{ color: T.textMuted }}>
                      {book.subtitle}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono" style={{ color: T.textDim }}>
                      {book.chapters} capitulos
                    </span>
                    <span
                      className="text-xs font-semibold group-hover:translate-x-1 transition-transform"
                      style={{ color: T.accent }}
                    >
                      Ler &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
