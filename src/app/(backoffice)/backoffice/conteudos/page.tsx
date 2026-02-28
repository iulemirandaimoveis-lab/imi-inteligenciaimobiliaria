'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, KPICard } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plus,
  FileText,
  Calendar,
  Instagram,
  Facebook,
  Linkedin,
  Mail,
  Sparkles,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react'

// Mock data
const mockContent = [
  {
    id: '1',
    title: 'Guia Completo: Investir em Imóveis na Boa Viagem',
    type: 'blog',
    platform: 'website',
    status: 'published',
    scheduled_date: '2024-02-10',
    author: 'IA + Ana Paula',
    engagement: { views: 1247, likes: 89, shares: 23 },
  },
  {
    id: '2',
    title: 'Tour Virtual: Reserva Atlantis',
    type: 'video',
    platform: 'instagram',
    status: 'scheduled',
    scheduled_date: '2024-02-15',
    author: 'IA + Carlos Silva',
    engagement: { views: 0, likes: 0, shares: 0 },
  },
  {
    id: '3',
    title: 'Newsletter Fevereiro: Mercado Imobiliário PE',
    type: 'email',
    platform: 'email',
    status: 'draft',
    scheduled_date: '2024-02-20',
    author: 'IA',
    engagement: { views: 0, likes: 0, shares: 0 },
  },
  {
    id: '4',
    title: 'Post LinkedIn: Family Office Internacional',
    type: 'social',
    platform: 'linkedin',
    status: 'published',
    scheduled_date: '2024-02-08',
    author: 'IA + Marina Costa',
    engagement: { views: 3420, likes: 156, shares: 34 },
  },
]

// Calendar view data
const mockCalendar = [
  { date: '2024-02-15', count: 3, items: ['Instagram Post', 'Blog Article', 'Email'] },
  { date: '2024-02-16', count: 1, items: ['Facebook Ad'] },
  { date: '2024-02-18', count: 2, items: ['LinkedIn Post', 'Newsletter'] },
  { date: '2024-02-20', count: 4, items: ['Blog', 'Instagram', 'Twitter', 'Email'] },
  { date: '2024-02-22', count: 1, items: ['YouTube Video'] },
]

export default function ConteudosPage() {
  const router = useRouter()
  const [content, setContent] = useState(mockContent)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [statusFilter, setStatusFilter] = useState('all')

  const stats = {
    total: content.length,
    published: content.filter((c) => c.status === 'published').length,
    scheduled: content.filter((c) => c.status === 'scheduled').length,
    draft: content.filter((c) => c.status === 'draft').length,
    totalViews: content.reduce((acc, c) => acc + c.engagement.views, 0),
    totalEngagement: content.reduce(
      (acc, c) => acc + c.engagement.likes + c.engagement.shares,
      0
    ),
  }

  const filteredContent = content.filter((item) => {
    if (statusFilter === 'all') return true
    return item.status === statusFilter
  })

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: 'neutral', label: 'Rascunho', icon: Edit },
      scheduled: { variant: 'warning', label: 'Agendado', icon: Clock },
      published: { variant: 'success', label: 'Publicado', icon: CheckCircle },
      archived: { variant: 'neutral', label: 'Arquivado', icon: XCircle },
    }
    return configs[status] || configs.draft
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, any> = {
      instagram: Instagram,
      facebook: Facebook,
      linkedin: Linkedin,
      email: Mail,
      website: FileText,
    }
    return icons[platform] || FileText
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Marketing Intelligence & Conteúdo"
        subtitle="Editorial & Omnichannel Engine | Powered by IA"
        breadcrumbs={[
          { label: 'Dashboard', href: '/backoffice/dashboard' },
          { label: 'Estratégia de Conteúdo' },
        ]}
        action={
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              icon={<Sparkles size={18} />}
              onClick={() => router.push('/backoffice/conteudos/ia')}
            >
              Consultar IA
            </Button>
            <Button
              icon={<Plus size={18} />}
              onClick={() => router.push('/backoffice/conteudos/novo')}
              className="shadow-glow"
            >
              Novo Artigo
            </Button>
          </div>
        }
      />

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Total Editorial"
          value={stats.total}
          icon={<FileText />}
          variant="primary"
        />
        <KPICard
          label="Reach (Alcance)"
          value={`${(stats.totalViews / 1000).toFixed(1)}k`}
          change={{ value: 12.5, label: 'impressões orgânicas', trend: 'up' }}
          icon={<TrendingUp />}
          variant="success"
        />
        <KPICard
          label="Pipeline Agendado"
          value={stats.scheduled}
          icon={<Clock />}
          variant="warning"
        />
        <KPICard
          label="Interações Omnichannel"
          value={stats.totalEngagement}
          icon={<BarChart3 />}
          variant="primary"
          className="bg-imi-950 text-white border-imi-800"
        />
      </div>

      {/* View Selector */}
      <Card className="shadow-elevated border-imi-50">
        <CardBody className="p-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={view === 'list' ? 'primary' : 'ghost'}
              onClick={() => setView('list')}
              icon={<FileText size={16} />}
            >
              Visão Lista
            </Button>
            <Button
              variant={view === 'calendar' ? 'primary' : 'ghost'}
              onClick={() => setView('calendar')}
              icon={<Calendar size={16} />}
            >
              Editorial Calendar
            </Button>
          </div>
          <Select
            className="w-48"
            options={[
              { value: 'all', label: 'Todos os Status' },
              { value: 'draft', label: 'Rascunhos' },
              { value: 'scheduled', label: 'Agendados' },
              { value: 'published', label: 'Publicados' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Main Content Area */}
      {view === 'list' ? (
        <>
          {filteredContent.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem conteúdo disponível"
              description="Utilize a IA para gerar novos insights agora."
              action={{
                label: 'Gerar com IA',
                onClick: () => router.push('/backoffice/conteudos/ia'),
                icon: <Sparkles />,
              }}
            />
          ) : (
            <Card className="shadow-elevated border-imi-50 overflow-hidden">
              <TableContainer className="border-none shadow-none">
                <Table>
                  <TableHeader className="bg-imi-50/50">
                    <TableRow>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest">Ativo Editorial</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest">Tipologia</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest">Plataforma</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-center">Data</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-center">Analytics</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item) => {
                      const statusConfig = getStatusConfig(item.status)
                      const StatusIcon = statusConfig.icon
                      const PlatformIcon = getPlatformIcon(item.platform)

                      return (
                        <TableRow key={item.id} className="hover:bg-imi-50/30 transition-colors">
                          <TableCell className="py-6">
                            <div className="flex items-center gap-4 group">
                              <div className="p-2 rounded-lg bg-imi-50 group-hover:bg-[#1A1A2E] group-hover:text-white transition-colors">
                                {item.author.startsWith('IA') ? <Sparkles size={16} /> : <FileText size={16} />}
                              </div>
                              <span className="font-black text-imi-950 uppercase tracking-tighter max-w-[300px] truncate block">
                                {item.title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <Badge variant="neutral" size="sm" className="bg-imi-50 px-2 font-black uppercase text-[9px]">{item.type}</Badge>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center gap-2">
                              <PlatformIcon size={14} className="text-[#3B82F6]" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-imi-500">{item.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <Badge
                              variant={statusConfig.variant}
                              icon={<StatusIcon size={12} />}
                              className="bg-white"
                            >
                              <span className="font-black text-[9px] uppercase tracking-widest">{statusConfig.label}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="py-6 text-center">
                            <span className="text-[10px] font-black text-imi-400">
                              {new Date(item.scheduled_date).toLocaleDateString('pt-BR')}
                            </span>
                          </TableCell>
                          <TableCell className="py-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs font-black text-imi-950 leading-none">{item.engagement.views} <span className="text-[9px] font-bold text-imi-400 uppercase">Views</span></span>
                              <span className="text-[9px] font-bold text-[#3B82F6] uppercase tracking-widest">
                                {item.engagement.likes + item.engagement.shares} Engagem.
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Eye size={18} />}
                              onClick={() =>
                                router.push(`/backoffice/conteudos/${item.id}`)
                              }
                            >
                              Dashboard
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </>
      ) : (
        <Card className="shadow-elevated border-imi-50 overflow-visible">
          <CardHeader
            title="Editorial Planner"
            subtitle="Mapeamento cronológico de publicações"
            className="bg-imi-50/50"
          />
          <CardBody className="p-4 sm:p-8 overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 sm:gap-4 min-w-0">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] font-black text-imi-400 pt-2 tracking-[0.3em] mb-4"
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: 35 }).map((_, index) => {
                const dayData = mockCalendar.find((d) => {
                  const date = new Date(d.date)
                  return date.getDate() === index + 1
                })

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[140px] p-4 border rounded-[2rem] transition-all duration-500
                      ${dayData
                        ? 'border-accent-200 bg-accent-50/30 cursor-pointer hover:bg-accent-100/50 scale-[1.02] shadow-sm'
                        : 'border-imi-100 bg-white hover:border-imi-200'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-sm font-black ${dayData ? 'text-[#3B82F6]' : 'text-imi-900'}`}>
                        {index + 1}
                      </span>
                      {dayData && <Zap size={14} className="text-[#3B82F6] animate-pulse" />}
                    </div>
                    {dayData && (
                      <div className="space-y-3">
                        <Badge variant="primary" size="sm" className="bg-[#1A1A2E] text-white font-black text-[8px] uppercase tracking-tighter">
                          {dayData.count} Operações
                        </Badge>
                        <div className="space-y-1">
                          {dayData.items.slice(0, 2).map((item, i) => (
                            <div
                              key={i}
                              className="text-[9px] font-black text-imi-600 uppercase tracking-tight truncate pl-1 border-l-2 border-accent-300"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                        {dayData.count > 2 && (
                          <div className="text-[8px] font-black text-[#0F0F1E] bg-accent-100/50 px-2 py-0.5 rounded-full inline-block">
                            + {dayData.count - 2} Items
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Footer Strategist */}
      <Card className="bg-imi-950 border-imi-800 shadow-glow">
        <CardBody className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles size={20} className="text-[#3B82F6]" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Content AI Strategist</h3>
              </div>
              <p className="text-sm font-medium text-imi-400">Gere conteúdo de alta conversão otimizado para Real Estate & Family Office.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
              <Button
                variant="outline"
                icon={<Instagram size={18} />}
                onClick={() => router.push('/backoffice/conteudos/ia?type=instagram')}
                className="border-white/10 text-white hover:bg-white/10 uppercase font-black text-[10px] tracking-widest h-12"
              >
                Post Social
              </Button>
              <Button
                variant="outline"
                icon={<Mail size={18} />}
                onClick={() => router.push('/backoffice/conteudos/ia?type=email')}
                className="border-white/10 text-white hover:bg-white/10 uppercase font-black text-[10px] tracking-widest h-12"
              >
                Newsletter
              </Button>
              <Button
                variant="outline"
                icon={<FileText size={18} />}
                onClick={() => router.push('/backoffice/conteudos/ia?type=blog')}
                className="border-white/10 text-white hover:bg-white/10 uppercase font-black text-[10px] tracking-widest h-12"
              >
                Artigo SEO
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
