'use client'

import { useMemo } from 'react'

export function useLocationHierarchy(selectedState?: string, selectedMunicipality?: string, selectedNeighborhood?: string) {
  return useMemo(
    () => ['Global', 'América do Sul', 'Brasil', selectedState, selectedMunicipality, selectedNeighborhood].filter(Boolean),
    [selectedMunicipality, selectedNeighborhood, selectedState],
  )
}
