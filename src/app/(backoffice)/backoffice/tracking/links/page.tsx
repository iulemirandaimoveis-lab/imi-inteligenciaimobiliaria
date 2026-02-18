'use client'

import { useState, useEffect } from 'react'
import PageHeader from '../../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
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
  Link2,
  Plus,
  Copy,
  QrCode,
  ExternalLink,
  Trash2,
  Download,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'
import { useDevelopments } from '@/hooks/use-developments'
import { toast } from 'sonner'

const supabase = createClient()

// UTM Sources
const utmSources = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'direct', label: 'Direto' },
  { value: 'referral', label: 'Referência' },
]

// UTM Mediums
const utmMediums = [
  { value: 'cpc', label: 'CPC (Custo por Clique)' },
  { value: 'organic', label: 'Orgânico' },
  { value: 'social', label: 'Social' },
  { value: 'email', label: 'Email' },
  { value: 'referral', label: 'Referência' },
  { value: 'banner', label: 'Banner' },
  { value: 'story', label: 'Story' },
  { value: 'post', label: 'Post' },
]

// Mock existing links (depois virá do Supabase)
const mockLinks = [
  {
    id: '1',
    campaign_name: 'Instagram Stories - Setembro',
    url: 'https://iulemirandaimoveis.com.br/pt/imoveis/reserva-atlantis?utm_source=instagram&utm_medium=story&utm_campaign=set-2024',
    short_url: 'imi.co/ra-ig-set',
    clicks: 847,
    created_at: '2024-09-01',
  },
  {
    id: '2',
    campaign_name: 'Facebook Ads - Jardins',
    url: 'https://iulemirandaimoveis.com.br/pt/imoveis/villa-jardins?utm_source=facebook&utm_medium=cpc&utm_campaign=fb-jardins',
    short_url: 'imi.co/vj-fb',
    clicks: 623,
    created_at: '2024-08-28',
  },
]

export default function TrackingLinksPage() {
  const [showGenerator, setShowGenerator] = useState(false)
  const [links, setLinks] = useState(mockLinks)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { developments } = useDevelopments()

  const devOptions = developments?.map((d: any) => ({
    value: d.id,
    label: d.name
  })) || []

  // Form state
  const [formData, setFormData] = useState({
    development_id: '',
    campaign_name: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    custom_slug: '',
  })

  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    const selectedDev = developments?.find(
      (d: any) => d.id === formData.development_id
    )

    // Normalizar slug do empreendimento
    const devSlug = selectedDev?.slug || selectedDev?.name.toLowerCase().replace(/\s+/g, '-') || 'empreendimento'
    const baseUrl = `https://www.iulemirandaimoveis.com.br/pt/imoveis/${devSlug}`

    const params = new URLSearchParams()
    if (formData.utm_source) params.set('utm_source', formData.utm_source)
    if (formData.utm_medium) params.set('utm_medium', formData.utm_medium)
    if (formData.utm_campaign) params.set('utm_campaign', formData.utm_campaign)
    if (formData.utm_content) params.set('utm_content', formData.utm_content)

    const fullUrl = `${baseUrl}?${params.toString()}`
    setGeneratedLink(fullUrl)

    // Gerar QR Code
    try {
      const qr = await QRCode.toDataURL(fullUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#0A0A0A',
          light: '#FFFFFF',
        },
      })
      setQrCodeUrl(qr)
      toast.success('Link UTM e QR Code gerados com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
      toast.error('Ocorreu um erro ao gerar o QR Code.')
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Link copiado para a área de transferência!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.download = `qrcode-${formData.campaign_name || 'link'}.png`
    link.href = qrCodeUrl
    link.click()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciador de Links Rastreáveis"
        subtitle="Construção de URLs UTM e geração de QR Codes para campanhas"
        breadcrumbs={[
          { name: 'Dashboard', href: '/backoffice/dashboard' },
          { name: 'Tracking', href: '/backoffice/tracking' },
          { name: 'Links' },
        ]}
        action={
          <Button
            variant={showGenerator ? 'outline' : 'primary'}
            icon={showGenerator ? <X size={20} /> : <Plus size={20} />}
            onClick={() => setShowGenerator(!showGenerator)}
          >
            {showGenerator ? 'Fechar Gerador' : 'Criar Link UTM'}
          </Button>
        }
      />

      {/* Link Generator */}
      {showGenerator && (
        <Card className="animate-in slide-in-from-top duration-300">
          <CardHeader
            title="Sessão: Engenharia de Link"
            subtitle="Configure os parâmetros UTM para rastreamento preciso de conversões"
          />
          <CardBody>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select
                  label="Empreendimento Alvo"
                  name="development_id"
                  value={formData.development_id}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Selecione o ativo imobiliário' },
                    ...devOptions,
                  ]}
                />

                <Input
                  label="Nome Interno da Campanha"
                  name="campaign_name"
                  value={formData.campaign_name}
                  onChange={handleChange}
                  placeholder="Ex: Lançamento Verão - Stories 01"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select
                  label="Origem (utm_source)"
                  name="utm_source"
                  value={formData.utm_source}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Selecione a fonte do tráfego' },
                    ...utmSources,
                  ]}
                  hint="Canal onde o link será veiculado"
                />

                <Select
                  label="Mídia (utm_medium)"
                  name="utm_medium"
                  value={formData.utm_medium}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Selecione o formato da mídia' },
                    ...utmMediums,
                  ]}
                  hint="Ex: Story, Banner, CPC, Bio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Nome da Campanha (utm_campaign)"
                  name="utm_campaign"
                  value={formData.utm_campaign}
                  onChange={handleChange}
                  placeholder="Ex: blackfriday-2024"
                  hint="Identificador da campanha no Analytics"
                />

                <Input
                  label="Conteúdo (utm_content)"
                  name="utm_content"
                  value={formData.utm_content}
                  onChange={handleChange}
                  placeholder="Ex: variant-a"
                  hint="Diferencie anúncios ou versões (Teste A/B)"
                />
              </div>

              <Input
                label="Slug Personalizado (Encurtador)"
                name="custom_slug"
                value={formData.custom_slug}
                onChange={handleChange}
                placeholder="Ex: reserva-oferta"
                hint="Cria um redirecionamento simplificado: imi.co/reserva-oferta"
              />
            </div>
          </CardBody>

          <CardFooter className="bg-imi-50/50">
            <Button
              variant="ghost"
              onClick={() => {
                setShowGenerator(false)
                setGeneratedLink(null)
                setQrCodeUrl(null)
              }}
              className="text-imi-500"
            >
              Cancelar Operação
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={
                !formData.development_id ||
                !formData.campaign_name ||
                !formData.utm_source ||
                !formData.utm_medium
              }
              icon={<Link2 size={20} />}
              className="px-12 shadow-glow"
            >
              Gerar Ativos de Tracking
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Generated Link Preview */}
      {generatedLink && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in duration-500">
          {/* Full Link Card */}
          <Card className="border-accent-100 ring-4 ring-accent-50/50">
            <CardHeader
              title="URL Rastreável Gerada"
              subtitle="Utilize este link em seus botões e anúncios"
            />
            <CardBody>
              <div className="space-y-6">
                <div className="p-6 bg-imi-950 rounded-2xl border border-imi-800 shadow-inner overflow-hidden">
                  <p className="text-[10px] font-black text-accent-500 uppercase tracking-widest mb-3">Target URL com UTM</p>
                  <p className="text-sm text-white break-all font-mono leading-relaxed">
                    {generatedLink}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    fullWidth
                    icon={copiedId === 'full' ? <Check size={20} /> : <Copy size={20} />}
                    onClick={() => handleCopy(generatedLink, 'full')}
                    className="h-14"
                  >
                    {copiedId === 'full' ? 'Link Copiado!' : 'Copiar URL UTM'}
                  </Button>
                  <Button
                    variant="outline"
                    icon={<ExternalLink size={20} />}
                    onClick={() => window.open(generatedLink, '_blank')}
                    className="h-14 w-14 p-0 shrink-0"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* QR Code Card */}
          <Card className="border-purple-100 shadow-elevated">
            <CardHeader
              title="QR Code Institucional"
              subtitle="Alta resolução para materiais impressos ou PDV"
            />
            <CardBody>
              {qrCodeUrl && (
                <div className="space-y-6">
                  <div className="flex justify-center p-6 bg-white border-2 border-dashed border-imi-100 rounded-2xl">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code Campanha"
                      className="w-[180px] h-[180px] object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    fullWidth
                    icon={<Download size={20} />}
                    onClick={handleDownloadQR}
                    className="h-14 border-imi-200 text-imi-600"
                  >
                    Baixar QR Code (PNG)
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Existing Links Table */}
      <Card>
        <CardHeader
          title="Histórico de Links Gerados"
          subtitle={`${links.length} URLs em circulação no ecossistema`}
        />
        <CardBody>
          {links.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="Base de Links Vazia"
              description="Ainda não existem links rastreados. Inicie uma nova campanha para monitorar leads."
              action={{
                label: 'Criar Novo Link',
                onClick: () => setShowGenerator(true),
                icon: <Plus size={18} />,
              }}
              className="bg-imi-50/50 border-dashed border-2"
            />
          ) : (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificador da Campanha</TableHead>
                    <TableHead>Short Link</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Data de Emissão</TableHead>
                    <TableHead className="text-right">Ações de Gestão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id} hover>
                      <TableCell>
                        <span className="font-bold text-imi-900">
                          {link.campaign_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-black text-accent-700 bg-accent-50 px-2 py-1 rounded-md border border-accent-100">
                          {link.short_url}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary" size="sm" dot>{link.clicks} cliques</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-imi-500">
                          {new Date(link.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={
                              copiedId === link.id ? (
                                <Check size={16} />
                              ) : (
                                <Copy size={16} />
                              )
                            }
                            onClick={() => handleCopy(link.url, link.id)}
                            className="text-imi-400"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ExternalLink size={16} />}
                            onClick={() => window.open(link.url, '_blank')}
                            className="text-imi-400"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            className="text-red-300 hover:text-red-500 hover:bg-red-50"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
}
