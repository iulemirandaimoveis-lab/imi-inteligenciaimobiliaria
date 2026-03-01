
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import DevelopmentHero from '../components/DevelopmentHero'
import DevelopmentDetails from '../components/DevelopmentDetails'
import DevelopmentGallery from '../components/DevelopmentGallery'
import DevelopmentLocation from '../components/DevelopmentLocation'
import DevelopmentUnits from '../components/DevelopmentUnits'
import DevelopmentCTA from '../components/DevelopmentCTA'

// Forcing dynamic for real-time updates from Backoffice
export const dynamic = 'force-dynamic'

export default async function DevelopmentDetailPage({ params }: { params: { slug: string, lang: string } }) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('developments')
        .select(`
            *,
            developers (
                name,
                logo_url,
                website,
                phone,
                email
            )
        `)
        .eq('slug', params.slug)
        .single()

    if (error || !data) {
        return notFound()
    }

    const development = mapDbPropertyToDevelopment(data)

    return (
        <main className="bg-[#FAFBFC]">
            <DevelopmentHero development={development} />

            <div className="container-custom py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
                    {/* Main content */}
                    <div className="lg:col-span-8 space-y-14 md:space-y-20">
                        <DevelopmentDetails development={development} />
                        <DevelopmentGallery development={development} />
                        <DevelopmentUnits propertyId={development.id} propertyName={development.name} />
                        <DevelopmentLocation development={development} />
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4">
                        <DevelopmentCTA development={development} />
                    </aside>
                </div>
            </div>
        </main>
    )
}
