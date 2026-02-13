#!/bin/bash
# ====================================================================
# PARTE 2 - Continua criando páginas
# ====================================================================

set -e

BASE_DIR="src/app/(backoffice)/backoffice"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📝 Conteúdo (Subpáginas)${NC}"

# Conteúdo index já deve existir, criar subpáginas que faltarem
mkdir -p "$BASE_DIR/conteudo/novo"
cat > "$BASE_DIR/conteudo/novo/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { FileText } from 'lucide-react'

export default function NovoConteudoPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Novo Conteúdo"
        breadcrumbs={[
          { label: 'Conteúdo', href: '/backoffice/conteudo' },
          { label: 'Novo' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <FileText size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Editor de Conteúdo</h2>
        <p className="text-gray-500">Interface de criação de posts e artigos ricos.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

# Calendario e Automacao ja foram restaurados no Step 1759 e 1762, mas o script pode garantir que existem

echo -e "${GREEN}✅${NC} Conteúdo: Subpáginas garantidas"

# ====================================================================
echo -e "${BLUE}📢 Campanhas${NC}"

# Campanhas index ja foi restaurado no Step 1774

mkdir -p "$BASE_DIR/campanhas/nova"
cat > "$BASE_DIR/campanhas/nova/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Megaphone } from 'lucide-react'

export default function NovaCampanhaPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Nova Campanha"
        breadcrumbs={[
          { label: 'Campanhas', href: '/backoffice/campanhas' },
          { label: 'Nova' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Megaphone size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configuração de Campanha</h2>
        <p className="text-gray-500">Definição de público-alvo, canais e orçamento.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/campanhas/roi"
cat > "$BASE_DIR/campanhas/roi/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { BarChart3 } from 'lucide-react'

export default function ROIPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="ROI de Campanhas"
        breadcrumbs={[
          { label: 'Campanhas', href: '/backoffice/campanhas' },
          { label: 'ROI' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <BarChart3 size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Análise de Retorno (ROI)</h2>
        <p className="text-gray-500">Gráficos detalhados de performance financeira.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/campanhas/[id]"
cat > "$BASE_DIR/campanhas/[id]/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Megaphone } from 'lucide-react'

export default function CampanhaPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Detalhes da Campanha"
        breadcrumbs={[
          { label: 'Campanhas', href: '/backoffice/campanhas' },
          { label: 'Detalhes' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Megaphone size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Visão Geral da Campanha</h2>
        <p className="text-gray-500">Dados da campanha ID: {params.id}</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/campanhas/[id]/analytics"
cat > "$BASE_DIR/campanhas/[id]/analytics/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { BarChart3 } from 'lucide-react'

export default function CampanhaAnalyticsPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Analytics da Campanha"
        breadcrumbs={[
          { label: 'Campanhas', href: '/backoffice/campanhas' },
          { label: 'Campanha', href: `/backoffice/campanhas/${params.id}` },
          { label: 'Analytics' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <BarChart3 size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Métricas de Engajamento</h2>
        <p className="text-gray-500">Cliques, impressões e conversões do ID: {params.id}</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

echo -e "${GREEN}✅${NC} Campanhas: Subpáginas criadas"

# ====================================================================
echo -e "${BLUE}📋 Avaliações${NC}"

mkdir -p "$BASE_DIR/avaliacoes"
cat > "$BASE_DIR/avaliacoes/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import { FileText, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function AvaliacoesPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Avaliações Imobiliárias"
        description="Gestão de laudos e PTAMS (NBR 14653)."
        breadcrumbs={[{ label: 'Avaliações' }]}
        action={
            <Link href="/backoffice/avaliacoes/nova">
                <Button icon={<Plus size={18} />}>Nova Avaliação</Button>
            </Link>
        }
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={FileText}
          title="Nenhuma avaliação registrada"
          description="Crie laudos profissionais de avaliação imobiliária."
          action={
            <Link href="/backoffice/avaliacoes/nova">
                <Button variant="outline" size="sm" icon={<Plus size={16} />}>Novo Laudo</Button>
            </Link>
          }
        />
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/avaliacoes/nova"
cat > "$BASE_DIR/avaliacoes/nova/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { FileText } from 'lucide-react'

export default function NovaAvaliacaoPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Nova Avaliação"
        breadcrumbs={[
          { label: 'Avaliações', href: '/backoffice/avaliacoes' },
          { label: 'Nova' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <FileText size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Wizard de Avaliação</h2>
        <p className="text-gray-500">Passo a passo compatível com NBR 14653.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/avaliacoes/[id]"
cat > "$BASE_DIR/avaliacoes/[id]/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { FileText } from 'lucide-react'

export default function AvaliacaoPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Detalhes da Avaliação"
        breadcrumbs={[
          { label: 'Avaliações', href: '/backoffice/avaliacoes' },
          { label: 'Detalhes' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <FileText size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Laudo Técnico</h2>
        <p className="text-gray-500">Visualização e exportação do laudo ID: {params.id}</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

echo -e "${GREEN}✅${NC} Avaliações: 3 páginas"

# ====================================================================
echo -e "${BLUE}💳 Crédito${NC}"

mkdir -p "$BASE_DIR/credito"
cat > "$BASE_DIR/credito/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import { CreditCard, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function CreditoPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Crédito Imobiliário"
        description="Gestão de solicitações de financiamento."
        breadcrumbs={[{ label: 'Crédito' }]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={CreditCard}
          title="Nenhuma solicitação"
          description="Acompanhe processos de financiamento dos clientes."
          action={
             <Button variant="outline" size="sm" icon={<Plus size={16} />}>Nova Solicitação</Button>
          }
        />
      </div>
    </div>
  )
}
EOF

# ====================================================================
echo -e "${BLUE}📞 Consultorias${NC}"
# Consultorias index ja foi restaurado no Step 1770
mkdir -p "$BASE_DIR/consultorias/nova"
cat > "$BASE_DIR/consultorias/nova/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Phone } from 'lucide-react'

export default function NovaConsultoriaPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Nova Consultoria"
        breadcrumbs={[
          { label: 'Consultorias', href: '/backoffice/consultorias' },
          { label: 'Nova' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Phone size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Solicitação de Suporte</h2>
        <p className="text-gray-500">Formulário de abertura de chamado.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

# ====================================================================
echo -e "${BLUE}📅 Agenda${NC}"

mkdir -p "$BASE_DIR/agenda"
cat > "$BASE_DIR/agenda/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Calendar } from 'lucide-react'

export default function AgendaPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Agenda Corporativa"
        description="Gestão de visitas e compromissos."
        breadcrumbs={[{ label: 'Agenda' }]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Calendar size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Agenda Inteligente</h2>
        <p className="text-gray-500">Sincronização com Google Calendar e Outlook.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

# ====================================================================
echo -e "${BLUE}📊 Relatórios${NC}"

mkdir -p "$BASE_DIR/relatorios"
cat > "$BASE_DIR/relatorios/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { PieChart } from 'lucide-react'

export default function RelatoriosPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Relatórios Gerenciais"
        description="Análise de dados e inteligência de mercado."
        breadcrumbs={[{ label: 'Relatórios' }]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <PieChart size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Central de Relatórios</h2>
        <p className="text-gray-500">Exportação de dados e dashboards customizáveis.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/relatorios/audit"
cat > "$BASE_DIR/relatorios/audit/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Shield } from 'lucide-react'

export default function AuditPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Audit Trail"
        breadcrumbs={[
          { label: 'Relatórios', href: '/backoffice/relatorios' },
          { label: 'Audit' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Shield size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Trilha de Auditoria</h2>
        <p className="text-gray-500">Registro imutável de todas as ações no sistema.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

# ====================================================================
echo -e "${BLUE}🔌 Integrações${NC}"

mkdir -p "$BASE_DIR/integracoes"
cat > "$BASE_DIR/integracoes/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Layers } from 'lucide-react'

export default function IntegracoesPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Integrações"
        description="Conectividade com portais e ferramentas externas."
        breadcrumbs={[{ label: 'Integrações' }]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Layers size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Marketplace de Integrações</h2>
        <p className="text-gray-500">Zap, VivaReal, RD Station e mais.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

# ====================================================================
echo -e "${BLUE}💬 WhatsApp${NC}"

mkdir -p "$BASE_DIR/whatsapp"
cat > "$BASE_DIR/whatsapp/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { MessageSquare } from 'lucide-react'

export default function WhatsAppPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="WhatsApp Business API"
        description="Central de mensagens unificada."
        breadcrumbs={[{ label: 'WhatsApp' }]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
            <MessageSquare size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">WhatsApp Multi-agente</h2>
        <p className="text-gray-500">Distribuição de leads e automação de conversas.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

# ====================================================================
echo -e "${BLUE}⚙️ Settings${NC}"

mkdir -p "$BASE_DIR/settings"
cat > "$BASE_DIR/settings/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Configurações Gerais"
        description="Preferências do sistema e personalização."
        breadcrumbs={[{ label: 'Configurações' }]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Settings size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Painel de Controle</h2>
        <p className="text-gray-500">Ajustes finos do sistema IMI Atlantis.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/settings/usuarios"
cat > "$BASE_DIR/settings/usuarios/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import EmptyState from '@/components/backoffice/EmptyState'
import { UserCircle, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function UsuariosPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Usuários Administrativos"
        breadcrumbs={[
          { label: 'Configurações', href: '/backoffice/settings' },
          { label: 'Usuários' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
        <EmptyState
          icon={UserCircle}
          title="Nenhum usuário adicional"
          description="Gerencie os administradores do sistema."
          action={
            <Button variant="outline" size="sm" icon={<Plus size={16} />}>Adicionar Admin</Button>
          }
        />
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/settings/permissoes"
cat > "$BASE_DIR/settings/permissoes/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Lock } from 'lucide-react'

export default function PermissoesPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Matriz de Permissões"
        breadcrumbs={[
          { label: 'Configurações', href: '/backoffice/settings' },
          { label: 'Permissões' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Lock size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Controle de Acesso RBAC</h2>
        <p className="text-gray-500">Definição granular de papéis e acessos.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

mkdir -p "$BASE_DIR/settings/logs"
cat > "$BASE_DIR/settings/logs/page.tsx" << 'EOF'
'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { ScrollText } from 'lucide-react'

export default function LogsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Logs de Sistema"
        breadcrumbs={[
          { label: 'Configurações', href: '/backoffice/settings' },
          { label: 'Logs' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <ScrollText size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Visualizador de Logs</h2>
        <p className="text-gray-500">Diagnóstico e monitoramento técnico.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
EOF

echo ""
echo -e "${GREEN}✅ TODAS AS PÁGINAS CRIADAS!${NC}"
echo ""
echo "📊 Resumo Final:"
echo "  - Estrutura completa de diretórios gerada"
echo "  - Componentes 'Breve' de luxo implementados"
echo "  - Zero Links Quebrados (404)"

