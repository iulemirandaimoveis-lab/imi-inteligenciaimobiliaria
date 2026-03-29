// IMI Feature Flags — Controle central de funcionalidades
// Tudo começa FALSE (gratuito). Ativar conforme receita entrar.

import { createClient } from '@/lib/supabase/client'

export interface FeatureFlags {
  // APIs PAGAS
  googlePlacesAPI: boolean
  googleGeocodingAPI: boolean
  googleStreetViewAPI: boolean
  attomDataAPI: boolean
  dataZapAPI: boolean
  sentinelHubAPI: boolean
  cesiumIonAPI: boolean
  claudeAPIpro: boolean

  // MÓDULOS
  voiceSearch: boolean
  digitalTwin3D: boolean
  computerVision: boolean
  arViewer: boolean
  predictiveModel: boolean
  satelliteMonitor: boolean
  llmDashboard: boolean

  // MERCADOS
  marketBR: boolean
  marketUS: boolean
  marketEU: boolean
  marketUAE: boolean
}

export const DEFAULT_FLAGS: FeatureFlags = {
  // APIs pagas: todas desligadas
  googlePlacesAPI: false,
  googleGeocodingAPI: false,
  googleStreetViewAPI: false,
  attomDataAPI: false,
  dataZapAPI: false,
  sentinelHubAPI: false,
  cesiumIonAPI: false,
  claudeAPIpro: false,

  // Módulos: todos ligados (implementação gratuita)
  voiceSearch: true,
  digitalTwin3D: true,
  computerVision: true,
  arViewer: true,
  predictiveModel: true,
  satelliteMonitor: true,
  llmDashboard: true,

  // Mercados: todos ligados
  marketBR: true,
  marketUS: true,
  marketEU: true,
  marketUAE: true,
}

export async function loadFeatureFlags(): Promise<FeatureFlags> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'feature_flags')
      .single()

    if (error || !data) return DEFAULT_FLAGS
    return { ...DEFAULT_FLAGS, ...JSON.parse(data.value) }
  } catch {
    return DEFAULT_FLAGS
  }
}
