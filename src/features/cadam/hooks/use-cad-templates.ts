'use client'

import { useState, useEffect } from 'react'
import type { TemplateOption, CadProjectType } from '../types'

export function useCadTemplates(type?: CadProjectType) {
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = type ? `/api/cadam/templates?type=${type}` : '/api/cadam/templates'

    fetch(url)
      .then(r => r.json())
      .then(data => {
        setTemplates(data.templates ?? [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [type])

  return { templates, loading, error }
}
