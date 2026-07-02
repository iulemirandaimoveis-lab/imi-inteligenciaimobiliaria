'use client'

import { useState } from 'react'
import { DashboardTopbar } from '../dashboard/DashboardChrome'
import { MapMirrorView, type MapProject } from './MapMirrorView'

/**
 * Casca cliente da página /users/map — mantém o nome exibido no cabeçalho
 * sincronizado com o projeto realmente ativo dentro de `MapMirrorView`
 * (que tem seu próprio seletor de projeto, ex. Alto Bellevue ↔ Jazz
 * Boulevard). Sem isto, o `DashboardTopbar` mostrava sempre o primeiro
 * projeto da sessão, mesmo depois do usuário trocar de aba no mapa.
 */
export function MapPageClient({
  projects,
  fallbackName,
}: {
  projects: MapProject[]
  fallbackName: string
}) {
  const [activeName, setActiveName] = useState(fallbackName)

  return (
    <>
      <DashboardTopbar projectName={activeName} />
      <MapMirrorView projects={projects} onActiveProjectChange={setActiveName} />
    </>
  )
}
