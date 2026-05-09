'use client'

import { useIntelligenceLocationSearch } from '@/hooks/useIntelligenceLocationSearch'

export function LocationSearchPanel() {
  const {
    stateUf,
    setStateUf,
    municipalityId,
    setMunicipalityId,
    states,
    municipalities,
    neighborhoods,
    isLoading,
  } = useIntelligenceLocationSearch()

  return (
    <section className="space-y-3" aria-label="Busca de localização nacional">
      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={stateUf}
          onChange={(event) => {
            setStateUf(event.target.value)
            setMunicipalityId(null)
          }}
          className="rounded-md border px-3 py-2"
        >
          <option value="">Estado</option>
          {states.map((state) => (
            <option key={state.id} value={state.uf}>{state.name}</option>
          ))}
        </select>

        <select
          value={municipalityId ?? ''}
          onChange={(event) => setMunicipalityId(event.target.value ? Number(event.target.value) : null)}
          disabled={!stateUf}
          className="rounded-md border px-3 py-2"
        >
          <option value="">Município</option>
          {municipalities.map((municipality) => (
            <option key={municipality.id} value={municipality.id}>{municipality.name}</option>
          ))}
        </select>

        <select disabled className="rounded-md border px-3 py-2">
          <option value="">Bairro</option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando locais...</p> : null}
    </section>
  )
}
