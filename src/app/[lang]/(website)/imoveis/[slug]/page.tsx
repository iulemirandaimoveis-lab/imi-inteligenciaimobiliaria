'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import DevelopmentHero from '../components/DevelopmentHero'
import DevelopmentDetails from '../components/DevelopmentDetails'
import DevelopmentGallery from '../components/DevelopmentGallery'
import DevelopmentUnits from '../components/DevelopmentUnits'
import DevelopmentLocation from '../components/DevelopmentLocation'
import DevelopmentCTA from '../components/DevelopmentCTA'
import { getDevelopmentBySlug } from '../data/developments'

export default function DevelopmentDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const development = getDevelopmentBySlug(slug)

  if (!development) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Empreendimento não encontrado
        </h1>
        <p className="text-slate-600 mb-8 text-center">
          O empreendimento que você está procurando não existe ou foi removido.
        </p>
        <Button asChild>
          <Link href="/imoveis">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ver empreendimentos
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <DevelopmentHero development={development} />
      <DevelopmentDetails development={development} />
      <DevelopmentGallery development={development} />
      <DevelopmentUnits development={development} />
      <DevelopmentLocation development={development} />
      <DevelopmentCTA development={development} />
    </div>
  )
}
