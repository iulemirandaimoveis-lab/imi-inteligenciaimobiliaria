import { nanoid } from 'nanoid'
import type { AdapterInput, AdapterResult, SceneGraph, SceneNodeMapping } from './types'

export function buildSceneGraph(input: AdapterInput): AdapterResult {
  const warnings: string[] = []
  const nodes: SceneNodeMapping[] = []

  if (input.previewSceneJson) {
    const raw = input.previewSceneJson as Record<string, unknown>

    if (Array.isArray(raw.nodes)) {
      for (const node of raw.nodes as Record<string, unknown>[]) {
        const kind = inferNodeKind(String(node.name ?? ''))
        nodes.push({
          sceneNodeId: String(node.id ?? nanoid()),
          developmentId: input.developmentId,
          kind,
          label: String(node.name ?? ''),
          metadata: node.metadata as Record<string, unknown> | undefined,
        })
      }
    } else {
      warnings.push('previewSceneJson não contém array "nodes" — grafo gerado vazio.')
    }
  } else {
    warnings.push('Nenhum previewSceneJson fornecido. Associe os nós manualmente via IMI Admin.')
  }

  const sceneGraph: SceneGraph = {
    id: nanoid(),
    developmentId: input.developmentId,
    version: 1,
    nodes,
    gltfUrl: input.gltfUrl,
    createdAt: new Date().toISOString(),
  }

  return { sceneGraph, warnings }
}

function inferNodeKind(name: string): SceneNodeMapping['kind'] {
  const lower = name.toLowerCase()
  if (lower.includes('lote') || lower.includes('lot')) return 'lot'
  if (lower.includes('unidade') || lower.includes('unit') || lower.includes('apto')) return 'unit'
  if (lower.includes('andar') || lower.includes('floor') || lower.includes('pav')) return 'floor'
  if (lower.includes('edificio') || lower.includes('torre') || lower.includes('building')) return 'building'
  return 'common_area'
}
