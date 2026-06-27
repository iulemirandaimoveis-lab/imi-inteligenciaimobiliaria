import { requirePermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { getDevelopmentBySlug } from '@/lib/lotmap/engine'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { MapMirrorView, type MapProject } from '@/features/users/map/MapMirrorView'
import { getGeoAnchor } from '@/features/users/map/anchors'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  // Disponibilidade requer availability.read (corretor tem).
  const session = await requirePermission(PERMISSIONS.AVAILABILITY_READ)

  // Espelha os mapas EXISTENTES: resolve a config de cada empreendimento pelo
  // slug, reutilizando o mesmo registro/JSON e o status ao vivo (subdivision_lots).
  const lotProjects: MapProject[] = session.projects.map((p) => {
    const config = getDevelopmentBySlug(p.slug)
    return {
      projectId: p.id,
      slug: p.slug,
      name: p.name,
      kind: 'lots',
      developmentId: config?.id ?? null,
      // Geometria é estática; o status é lido AO VIVO (subdivision_lots) pelo
      // InteractiveLotMap → o espelho atualiza sozinho, sem cache-busting.
      mapJsonUrl: config?.mapJsonUrl ?? null,
      whatsappContact: config?.whatsappContact ?? null,
      // Âncora p/ a vista de satélite (coordenada confirmada pelo cliente).
      geoAnchor: getGeoAnchor(p.slug),
    }
  })

  // Empreendimentos VERTICAIS (prédios) — disponibilidade por torre/andar/unidade,
  // não por lotes. Espelham o mesmo viewer do site público (fonte única de dados).
  // O Jazz Boulevard ainda não tem âncora de satélite; entra com seu mapa próprio.
  const verticalProjects: MapProject[] = [
    {
      projectId: 'jazz-boulevard',
      slug: 'jazz-boulevard',
      name: 'Jazz Boulevard',
      kind: 'vertical',
      developmentId: null,
      mapJsonUrl: null,
      whatsappContact: '5581986141487',
      geoAnchor: null,
    },
  ]

  const projects: MapProject[] = [...lotProjects, ...verticalProjects]

  return (
    <ImiSessionProvider session={session}>
      <DashboardTopbar projectName={session.projects[0]?.name ?? 'Alto Bellevue'} />
      <MapMirrorView projects={projects} />
    </ImiSessionProvider>
  )
}
