'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, KPICard } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CardSkeleton } from '@/components/ui/EmptyState'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  MessageSquare,
  Edit,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  History,
  Info
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

// Mock logic for interactions - normally would fetch from lead_interactions table
const mockInteractions = [
  {
    id: '1',
    type: 'email',
    subject: 'Portfólio Premium Enviado',
    description: 'Enviado catálogo digital de ativos internacionais (DAMAC/Kempinski).',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    created_by: 'IA Agent',
  },
  {
    id: '2',
    type: 'call',
    subject: 'Qualificação Ativa',
    description: 'Lead demonstrou forte interesse em investimentos em Dubai. Perfil High-Net-Worth.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_by: 'Equipe IMI',
  },
  {
    id: '3',
    type: 'whatsapp',
    subject: 'Tabela de Preços - Reserva Atlantis',
    description: 'Documentação enviada via WhatsApp. Cliente visualizou.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    created_by: 'Sales Desk',
  },
  {
    id: '4',
    type: 'note',
    subject: 'Entrada no Pipeline',
    description: 'Lead capturado via Landing Page "Inteligência Imobiliária".',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    created_by: 'Sistema Web',
  },
]

export default function LeadDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<any>(null)
  const [interactions, setInteractions] = useState(mockInteractions)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showInteractionModal, setShowInteractionModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const [interactionForm, setInteractionForm] = useState({
    type: 'note',
    subject: '',
    description: '',
  })

  useEffect(() => {
    async function fetchLead() {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select(`
            *,
            developments (
              id,
              name,
              neighborhood,
              city
            )
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error
        setLead(data)
        setNewStatus(data.status)
      } catch (err: any) {
        toast.error('Erro ao carregar dossiê do lead.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchLead()
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-imi-50 rounded-2xl" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-imi-50 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 h-96 bg-imi-50 rounded-2xl" />
          <div className="col-span-2 h-96 bg-imi-50 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!lead) return <div className="p-12 text-center text-imi-500">Lead não encontrado.</div>

  // Status config
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      new: { variant: 'info', label: 'Prospecção', icon: AlertCircle },
      contacted: { variant: 'warning', label: 'Em Contato', icon: MessageSquare },
      qualified: { variant: 'primary', label: 'Qualificado', icon: CheckCircle },
      proposal: { variant: 'success', label: 'Proposta', icon: DollarSign },
      won: { variant: 'success', label: 'Ativado (Venda)', icon: CheckCircle },
      lost: { variant: 'danger', label: 'Descartado', icon: XCircle },
    }
    return configs[status] || configs.new
  }

  const statusConfig = getStatusConfig(lead.status)
  const StatusIcon = statusConfig.icon

  const handleUpdateStatus = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (error) throw error

      setLead((prev: any) => ({ ...prev, status: newStatus }))
      toast.success('Fase do lead atualizada para ' + newStatus)
      setShowStatusModal(false)
    } catch (error) {
      toast.error('Falha ao atualizar status.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddInteraction = () => {
    if (!interactionForm.subject.trim()) return

    const newInteraction = {
      id: Date.now().toString(),
      type: interactionForm.type,
      subject: interactionForm.subject,
      description: interactionForm.description,
      created_at: new Date().toISOString(),
      created_by: 'Backoffice User',
    }

    setInteractions([newInteraction, ...interactions])
    setInteractionForm({ type: 'note', subject: '', description: '' })
    toast.success('Interação registrada na timeline.')
    setShowInteractionModal(false)
  }

  const getInteractionIcon = (type: string) => {
    const icons: Record<string, any> = {
      email: Mail,
      call: Phone,
      whatsapp: MessageSquare,
      meeting: Calendar,
      note: Edit,
    }
    return icons[type] || Edit
  }

  const budgetText = (lead.budget_min || lead.budget_max)
    ? `R$ ${(lead.budget_min / 1000 || 0).toFixed(0)}k - ${(lead.budget_max / 1000 || 0).toFixed(0)}k`
    : 'Não informado'

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.name}
        subtitle={`ID da Operação: ${lead.id.slice(0, 8).toUpperCase()}`}
        breadcrumbs={[
          { name: 'Dashboard', href: '/backoffice/backoffice/dashboard' },
          { name: 'Leads', href: '/backoffice/backoffice/leads' },
          { name: 'Dossiê do Cliente' },
        ]}
        action={
          <div className="flex items-center gap-4">
            <Badge variant={statusConfig.variant} size="lg" dot className="bg-white px-4 py-2 border shadow-sm">
              <span className="font-black uppercase tracking-widest text-[10px]">{statusConfig.label}</span>
            </Badge>
            <Button
              variant="outline"
              icon={<Edit size={18} />}
              onClick={() => setShowStatusModal(true)}
              className="bg-white h-12"
            >
              Mudar Fase
            </Button>
            <Button
              icon={<Zap size={18} />}
              onClick={() => setShowInteractionModal(true)}
              className="h-12 shadow-glow"
            >
              Logar Atividade
            </Button>
          </div>
        }
      />

      {/* Analytics Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          label="Health Score"
          value={lead.score || 70}
          icon={<TrendingUp />}
          variant={(lead.score || 70) >= 80 ? 'success' : (lead.score || 70) >= 50 ? 'warning' : 'danger'}
          className="shadow-elevated"
        />

        <KPICard
          label="Canais de Atribuição"
          value={lead.source || 'Tráfego Orgânico'}
          icon={<Zap />}
          variant="primary"
          className="shadow-elevated"
        />

        <KPICard
          label="Janela de Ticket"
          value={budgetText}
          icon={<DollarSign />}
          variant="info"
          className="shadow-elevated"
        />

        <KPICard
          label="Interesse High-End"
          value={lead.interest_type || 'Sob Consulta'}
          icon={<Building2 />}
          variant="primary"
          className="bg-imi-950 text-white border-imi-800 shadow-glow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Data Intelligence */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="shadow-elevated border-imi-50 overflow-hidden">
            <CardHeader title="Perfis & Contatos" className="bg-imi-50/50" />
            <CardBody className="p-8">
              <div className="space-y-8">
                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-imi-50 flex items-center justify-center text-imi-400 group-hover:bg-accent-500 group-hover:text-white transition-all duration-500">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">Titular do Lead</p>
                    <p className="text-sm font-black text-imi-900 group-hover:translate-x-1 transition-transform">{lead.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-imi-50 flex items-center justify-center text-imi-400 group-hover:bg-accent-500 group-hover:text-white transition-all duration-500">
                    <Mail size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">Canal de E-mail</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-sm font-black text-accent-600 hover:text-accent-700 break-all"
                    >
                      {lead.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-imi-50 flex items-center justify-center text-imi-400 group-hover:bg-accent-500 group-hover:text-white transition-all duration-500">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">Terminal Móvel</p>
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-sm font-black text-accent-600 hover:text-accent-700"
                    >
                      {lead.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-imi-50 flex items-center justify-center text-imi-400 group-hover:bg-accent-500 group-hover:text-white transition-all duration-500">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-imi-400 uppercase tracking-widest mb-1">Geoloc de Interesse</p>
                    <p className="text-sm font-black text-imi-900 leading-tight">
                      {lead.preferred_location || 'Região Metropolitana'}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Asset Strategy */}
          {lead.developments && (
            <Card className="shadow-elevated border-accent-100 bg-accent-50/10">
              <CardHeader title="Ativo de Interesse" className="bg-accent-50/50" />
              <CardBody className="p-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-3xl bg-accent-500 flex items-center justify-center text-white shadow-glow">
                    <Building2 size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-accent-600 uppercase tracking-widest mb-1">Empreendimento</p>
                    <p className="text-lg font-black text-imi-950 uppercase tracking-tighter leading-none">
                      {lead.developments.name}
                    </p>
                    <p className="text-xs font-bold text-imi-500 mt-1">
                      {lead.developments.neighborhood}, {lead.developments.city}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => router.push(`/backoffice/backoffice/imoveis/${lead.development_id}`)}
                  className="mt-6 border-t border-accent-100 rounded-none pt-4 text-accent-700 font-black uppercase tracking-widest text-[10px]"
                >
                  Acessar Dossiê do Ativo
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Qualitative Data */}
          <Card className="shadow-elevated border-imi-50">
            <CardHeader title="Briefing Inicial" icon={<Info size={16} />} />
            <CardBody className="p-8">
              <div className="p-6 bg-imi-50/50 rounded-2xl border border-imi-100/50 italic">
                <p className="text-sm font-medium text-imi-700 leading-relaxed">
                  "{lead.message || 'Sem observações iniciais registradas.'}"
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Interaction Pulse */}
        <div className="lg:col-span-2">
          <Card className="shadow-elevated border-imi-50 min-h-[600px]">
            <CardHeader
              title="Pulse de Atividades & CRM"
              subtitle={`Histórico de ${interactions.length} eventos documentados`}
              className="bg-imi-50/50"
              icon={<History size={18} className="text-imi-400" />}
            />
            <CardBody className="p-8">
              <div className="relative space-y-12 before:absolute before:inset-y-0 before:left-[23px] before:w-[2px] before:bg-imi-100">
                {interactions.map((interaction, index) => {
                  const Icon = getInteractionIcon(interaction.type)
                  return (
                    <div key={interaction.id} className="relative flex items-start gap-8 group">
                      <div className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 border-4 border-white
                        ${index === 0 ? 'bg-accent-500 text-white shadow-glow animate-bounce-subtle' : 'bg-imi-50 text-imi-400 group-hover:bg-imi-950 group-hover:text-white'}
                      `}>
                        <Icon size={20} strokeWidth={index === 0 ? 3 : 2} />
                      </div>
                      <div className="flex-1 min-w-0 bg-white group-hover:bg-imi-50/50 p-6 rounded-3xl border border-transparent group-hover:border-imi-100 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-base font-black text-imi-900 group-hover:text-accent-600 transition-colors uppercase tracking-tight">
                              {interaction.subject}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="neutral" size="sm" className="bg-imi-100 text-[9px] font-black">{interaction.type}</Badge>
                              <span className="text-[10px] font-bold text-imi-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(interaction.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-imi-50 px-3 py-1 rounded-full border border-imi-100/50">
                            <div className="w-5 h-5 rounded-full bg-imi-200 flex items-center justify-center text-[9px] font-black">
                              {interaction.created_by.charAt(0)}
                            </div>
                            <span className="text-[10px] font-black text-imi-600 uppercase tracking-tighter">{interaction.created_by}</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-imi-600 leading-relaxed">
                          {interaction.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal: Status Engine */}
      <Modal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        size="sm"
      >
        <ModalHeader title="Workflow de Status" />
        <ModalBody className="p-8">
          <Select
            label="Novo Estágio do Pipeline"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="h-14 font-black uppercase text-xs tracking-widest"
            options={[
              { value: 'new', label: 'Prospecção / Novo' },
              { value: 'contacted', label: 'Em Contato / Tentativa' },
              { value: 'qualified', label: 'Lead Qualificado (MQL)' },
              { value: 'proposal', label: 'Proposta Elaborada' },
              { value: 'won', label: 'Convertido / Venda' },
              { value: 'lost', label: 'Lead Perdido / Arquivo' },
            ]}
          />
        </ModalBody>
        <ModalFooter className="p-8 bg-imi-50/50">
          <Button variant="outline" onClick={() => setShowStatusModal(false)} className="h-12 px-8">
            Cancelar
          </Button>
          <Button onClick={handleUpdateStatus} loading={isUpdating} className="h-12 px-12 shadow-glow">
            Efetivar Fase
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal: Activity Logger */}
      <Modal
        open={showInteractionModal}
        onClose={() => setShowInteractionModal(false)}
      >
        <ModalHeader title="Logar Nova Operação / CRM" />
        <ModalBody className="p-8 space-y-8">
          <Select
            label="Arquitetura de Contato"
            value={interactionForm.type}
            onChange={(e) =>
              setInteractionForm((prev) => ({ ...prev, type: e.target.value }))
            }
            className="h-14 font-black uppercase text-xs tracking-widest"
            options={[
              { value: 'note', label: 'Internal Note / Registro' },
              { value: 'call', label: 'Ligação / Telefone' },
              { value: 'email', label: 'Email Outreach' },
              { value: 'whatsapp', label: 'WhatsApp Messenger' },
              { value: 'meeting', label: 'Reunião Presencial / Tour' },
            ]}
          />

          <Input
            label="Título da Atividade *"
            value={interactionForm.subject}
            onChange={(e) =>
              setInteractionForm((prev) => ({ ...prev, subject: e.target.value }))
            }
            placeholder="Ex: Proposta apresentada no showroom"
            className="h-14 italic"
          />

          <Textarea
            label="Evidências / Detalhes Estratégicos"
            value={interactionForm.description}
            onChange={(e) =>
              setInteractionForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            rows={5}
            placeholder="Descreva o desfecho desta interação..."
            className="bg-imi-50/20"
          />
        </ModalBody>
        <ModalFooter className="p-8 bg-imi-50/50">
          <Button
            variant="outline"
            onClick={() => setShowInteractionModal(false)}
            className="h-12 px-8"
          >
            Descartar
          </Button>
          <Button
            onClick={handleAddInteraction}
            disabled={!interactionForm.subject.trim()}
            icon={<Send size={18} />}
            className="h-12 px-12 shadow-glow"
          >
            Registrar Pulse
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
