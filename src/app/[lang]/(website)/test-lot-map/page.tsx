import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'

const InteractiveLotMap = dynamic(
  () => import('@/components/maps/InteractiveLotMap'),
  { ssr: false, loading: () => <div className="h-[600px] bg-gray-100 animate-pulse rounded-xl" /> }
)

const DEV_ID = 'ab7d1fc1-f069-4e3b-a515-8e1204c11247'
const GALLERY = ['/images/alto-bellevue-1.jpg', '/images/alto-bellevue-2.jpg']

export default async function TestLotMapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Lotes — Alto Bellevue (Dev)</h1>
          <p className="text-sm text-gray-500 mt-1">Página de desenvolvimento — acesso restrito</p>
        </div>
        <InteractiveLotMap
          developmentId={DEV_ID}
          lotMapJsonUrl="/maps/alto-bellevue-lots.json"
          galleryImages={GALLERY}
        />
      </div>
    </main>
  )
}
