#!/bin/bash
# ====================================================================
# IMI ATLANTIS - SCRIPT MASTER DE PÁGINAS
# Cria TODAS as páginas do backoffice - ZERO 404s
# ====================================================================

set -e

echo "🚀 IMI ATLANTIS - Criando TODAS as páginas do backoffice..."
echo ""

BASE_DIR="src/app/(backoffice)/backoffice"
# cd "$(dirname "$0")" # Commented out because we run from root

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ====================================================================
# CRIAR TODAS AS PÁGINAS
# ====================================================================

echo -e "${BLUE}📊 Dashboard${NC}"
mkdir -p "$BASE_DIR/dashboard"
cat > "$BASE_DIR/dashboard/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { LayoutDashboard, TrendingUp, Users, Building2 } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    { label: 'Empreendimentos', value: '24', icon: Building2 },
    { label: 'Leads Ativos', value: '156', icon: Users },
    { label: 'Taxa Conversão', value: '12.5%', icon: TrendingUp },
    { label: 'Ticket Médio', value: 'R$ 485k', icon: LayoutDashboard },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Visão geral de métricas e indicadores de performance."
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <stat.icon size={24} className="text-gray-400" />
            </div>
            <div className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 shadow-soft">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Atividade Recente</h2>
        <p className="text-gray-500">Dashboard completo será implementado na próxima fase.</p>
      </div>
    </div>
  )
}
EOF
echo -e "${GREEN}✅${NC} Dashboard criado"

# ====================================================================
echo -e "${BLUE}🏢 Imóveis (já existe - verificar)${NC}"
# A página principal já existe, criar subpáginas

mkdir -p "$BASE_DIR/imoveis/novo"
cat > "$BASE_DIR/imoveis/novo/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

export default function NovoImovelPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <PageHeader
        title="Novo Empreendimento"
        description="Cadastre um novo empreendimento imobiliário."
        breadcrumbs={[
          { label: 'Imóveis', href: '/backoffice/imoveis' },
          { label: 'Novo' }
        ]}
      />
      <div className="max-w-4xl mx-auto space-y-6">
        <Card title="Informações Básicas" icon={<Building2 size={20} />}>
            <div className="grid grid-cols-1 gap-6 p-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome do Empreendimento</label>
                    <Input placeholder="Ex: Residencial Atlantis" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Cidade</label>
                    <Input />
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Estado</label>
                    <select className="w-full h-11 px-4 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-card-dark focus:ring-2 focus:ring-primary/20 outline-none">
                        <option>PE</option>
                        <option>PB</option>
                        <option>SP</option>
                    </select>
                    </div>
                </div>
            </div>
        </Card>
        
        <div className="flex justify-end gap-4 pt-4">
            <Link href="/backoffice/imoveis">
                <Button variant="outline">Cancelar</Button>
            </Link>
            <Button>Salvar Empreendimento</Button>
        </div>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/imoveis/[id]"
cat > "$BASE_DIR/imoveis/[id]/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Building2 } from 'lucide-react'

export default function ImovelPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Detalhes do Empreendimento"
        breadcrumbs={[
          { label: 'Imóveis', href: '/backoffice/imoveis' },
          { label: 'Detalhes' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Building2 size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Detalhes do Empreendimento</h2>
        <p className="text-gray-500">Visualização detalhada do ID: {params.id}</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/imoveis/[id]/editar"
cat > "$BASE_DIR/imoveis/[id]/editar/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Building2 } from 'lucide-react'

export default function EditarImovelPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Editar Empreendimento"
        breadcrumbs={[
          { label: 'Imóveis', href: '/backoffice/imoveis' },
          { label: 'Empreendimento', href: `/backoffice/imoveis/${params.id}` },
          { label: 'Editar' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Building2 size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Edição de Empreendimento</h2>
        <p className="text-gray-500">Interface de edição do ID: {params.id}</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/imoveis/[id]/unidades"
cat > "$BASE_DIR/imoveis/[id]/unidades/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Home } from 'lucide-react'

export default function UnidadesPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Unidades"
        breadcrumbs={[
          { label: 'Imóveis', href: '/backoffice/imoveis' },
          { label: 'Empreendimento', href: `/backoffice/imoveis/${params.id}` },
          { label: 'Unidades' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Home size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gestão de Unidades</h2>
        <p className="text-gray-500">Controle de disponibilidade e tabela de preços.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/imoveis/[id]/analytics"
cat > "$BASE_DIR/imoveis/[id]/analytics/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Analytics"
        breadcrumbs={[
          { label: 'Imóveis', href: '/backoffice/imoveis' },
          { label: 'Empreendimento', href: `/backoffice/imoveis/${params.id}` },
          { label: 'Analytics' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <BarChart3 size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Performance do Empreendimento</h2>
        <p className="text-gray-500">Métricas detalhadas de visualizações e leads.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

echo -e "${GREEN}✅${NC} Imóveis: 5 páginas criadas"

# ====================================================================
echo -e "${BLUE}🏗️ Construtoras${NC}"

mkdir -p "$BASE_DIR/construtoras"
cat > "$BASE_DIR/construtoras/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import Button from '@/components/ui/Button'
import { Building2, Plus } from 'lucide-react'
import Link from 'next/link'

export default function ConstrutarasPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Construtoras"
        description="Gestão de construtoras e incorporadoras parceiras."
        breadcrumbs={[{ label: 'Construtoras' }]}
        action={
          <Link href="/backoffice/construtoras/nova">
             <Button icon={<Plus size={18} />}>Nova Construtora</Button>
          </Link>
        }
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={Building2}
          title="Nenhuma construtora cadastrada"
          description="Cadastre construtoras para vincular aos empreendimentos."
          action={
            <Link href="/backoffice/construtoras/nova">
                <Button variant="outline" size="sm" icon={<Plus size={16} />}>Cadastrar Agora</Button>
            </Link>
          }
        />
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/construtoras/nova"
cat > "$BASE_DIR/construtoras/nova/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Building2 } from 'lucide-react'

export default function NovaConstruturaPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Nova Construtora"
        breadcrumbs={[
          { label: 'Construtoras', href: '/backoffice/construtoras' },
          { label: 'Nova' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Building2 size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cadastro de Construtora</h2>
        <p className="text-gray-500">Formulário de cadastro será implementado aqui.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/construtoras/[id]"
cat > "$BASE_DIR/construtoras/[id]/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Building2 } from 'lucide-react'

export default function ConstruturaPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Detalhes da Construtora"
        breadcrumbs={[
          { label: 'Construtoras', href: '/backoffice/construtoras' },
          { label: 'Detalhes' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Building2 size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Detalhes da Construtora</h2>
        <p className="text-gray-500">Visualização do ID: {params.id}</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

echo -e "${GREEN}✅${NC} Construtoras: 3 páginas"

# ====================================================================
echo -e "${BLUE}👥 Leads${NC}"

mkdir -p "$BASE_DIR/leads/pipeline"
cat > "$BASE_DIR/leads/pipeline/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { TrendingUp } from 'lucide-react'

export default function PipelinePage() {
  const stages = [
    { name: 'Novo', count: 45, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { name: 'Contato', count: 23, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    { name: 'Proposta', count: 12, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    { name: 'Ganho', count: 34, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Pipeline de Leads"
        description="Funil comercial dividido por etapas de negociação."
        breadcrumbs={[
          { label: 'Leads', href: '/backoffice/leads' },
          { label: 'Pipeline' }
        ]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div key={stage.name} className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-soft">
            <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold mb-4 uppercase tracking-wider ${stage.color}`}>
              {stage.name}
            </div>
            <div className="text-3xl font-display font-bold text-gray-900 dark:text-white">{stage.count}</div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <TrendingUp size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Kanban Board</h2>
        <p className="text-gray-500">Visualização em colunas para gestão de oportunidades.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/leads/[id]"
cat > "$BASE_DIR/leads/[id]/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Users } from 'lucide-react'

export default function LeadPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Detalhes do Lead"
        breadcrumbs={[
          { label: 'Leads', href: '/backoffice/leads' },
          { label: 'Detalhes' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Users size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Perfil do Lead</h2>
        <p className="text-gray-500">Histórico completo e dados de contato do ID: {params.id}</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

echo -e "${GREEN}✅${NC} Leads: 2 páginas"

# ====================================================================
echo -e "${BLUE}🔗 Tracking${NC}"

mkdir -p "$BASE_DIR/tracking"
cat > "$BASE_DIR/tracking/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { MousePointerClick } from 'lucide-react'

export default function TrackingPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Tracking"
        description="Monitoramento de links rastreáveis e conversão."
        breadcrumbs={[{ label: 'Tracking' }]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <MousePointerClick size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sistema de Tracking</h2>
        <p className="text-gray-500">Analytics avançado de origem e comportamento.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/tracking/links"
cat > "$BASE_DIR/tracking/links/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import { Link as LinkIcon, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function LinksPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Links Rastreáveis"
        description="Gestão de URLs parametrizadas (UTM)."
        breadcrumbs={[
          { label: 'Tracking', href: '/backoffice/tracking' },
          { label: 'Links' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={LinkIcon}
          title="Nenhum link criado"
          description="Crie campanhas de links para rastrear suas conversões."
          action={
            <Button variant="outline" size="sm" icon={<Plus size={16} />}>Criar Link</Button>
          }
        />
      </div>
    </div>
  )
}
EOF

echo -e "${GREEN}✅${NC} Tracking: 2 páginas"
