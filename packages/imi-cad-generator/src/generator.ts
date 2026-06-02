import Anthropic from '@anthropic-ai/sdk'
import { nanoid } from 'nanoid'
import type { CadGenerationInput, CadGenerationResult } from './types'
import { buildOpenSCADSystemPrompt, extractConstraints } from './prompt-parser'

export async function generateCadModel(
  input: CadGenerationInput,
  anthropicApiKey: string,
): Promise<CadGenerationResult> {
  const client = new Anthropic({ apiKey: anthropicApiKey })
  const generationId = nanoid()

  const constraintsSummary = input.constraints
    ? Object.entries(input.constraints)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : 'sem restrições específicas'

  const userPrompt = `Tipo de projeto: ${input.projectType}
Restrições: ${constraintsSummary}
Descrição: ${input.prompt}`

  const warnings: string[] = []

  const autoConstraints = extractConstraints(input.prompt)
  if (Object.keys(autoConstraints).length > 0 && !input.constraints) {
    warnings.push(
      `Restrições inferidas automaticamente do prompt: ${JSON.stringify(autoConstraints)}`,
    )
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4096,
    system: buildOpenSCADSystemPrompt(input.projectType),
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textContent = message.content.find(b => b.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('IMI CAD Generator: resposta inesperada do modelo')
  }

  const scadCode = textContent.text.trim()

  if (!scadCode.includes('module') && !scadCode.includes('cube') && !scadCode.includes('cylinder')) {
    warnings.push('Código OpenSCAD gerado pode estar incompleto. Revise antes de exportar.')
  }

  return {
    scadCode,
    warnings,
    generationId,
    createdAt: new Date().toISOString(),
  }
}
