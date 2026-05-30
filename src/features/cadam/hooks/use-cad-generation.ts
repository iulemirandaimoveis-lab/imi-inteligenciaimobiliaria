'use client'

import { useState, useCallback } from 'react'
import type { CadConstraintsForm, CadGenerationState, CadProjectType } from '../types'

interface GenerateOptions {
  prompt: string
  projectType?: CadProjectType
  templateId?: string
  constraints?: CadConstraintsForm
  developmentId?: string
}

export function useCadGeneration() {
  const [state, setState] = useState<CadGenerationState>({
    status: 'idle',
    warnings: [],
  })

  const generate = useCallback(async (options: GenerateOptions) => {
    setState({ status: 'loading', warnings: [] })

    try {
      const res = await fetch('/api/cadam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      const data = await res.json()

      if (!res.ok) {
        setState({
          status: 'error',
          warnings: [],
          errorMessage: data.error ?? 'Erro desconhecido na geração',
        })
        return
      }

      setState({
        status: 'success',
        scadCode: data.result.scadCode,
        warnings: data.result.warnings ?? [],
        generationId: data.result.generationId,
      })
    } catch (err) {
      setState({
        status: 'error',
        warnings: [],
        errorMessage: err instanceof Error ? err.message : 'Falha de conexão',
      })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle', warnings: [] })
  }, [])

  return { state, generate, reset }
}
