// src/app/api/contratos/gerar/route.ts
// ── Gerador de contratos via Claude Sonnet ────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getModeloById, IDIOMAS_LABEL } from '@/lib/modelos-contratos'

export const runtime = 'nodejs'
export const maxDuration = 90

const INSTRUCOES_IDIOMA: Record<string, string> = {
  pt: 'Redija o contrato integralmente em português brasileiro (pt-BR). Use linguagem jurídica formal, direta e precisa conforme praxe notarial brasileira.',
  en: 'Draft the entire contract in English. Use formal legal language following international contract drafting standards (plain English legal style).',
  es: 'Redacte el contrato íntegramente en español formal. Use lenguaje jurídico conforme al derecho civil iberoamericano.',
  ar: 'اكتب العقد بالكامل باللغة العربية الفصحى. استخدم أسلوبًا قانونيًا رسميًا وفق معايير القانون المدني الإماراتي والدولي.',
  ja: '契約書全体を日本語で作成してください。日本の民法・借地借家法・商慣習に準拠した正式な法律用語を使用してください。',
}

const INSTRUCOES_JURISDICAO: Record<string, string> = {
  BR: 'Este contrato é regido pelo Código Civil Brasileiro (Lei 10.406/2002) e legislação específica aplicável. Inclua referências aos artigos pertinentes.',
  AE: 'This contract is governed by UAE Federal Law No. 5 of 1985 (Civil Code) and RERA/DLD regulations. Include regulatory references.',
  JP: 'この契約は日本民法および関連法令に準拠します。',
  US: 'This contract is governed by applicable US state law. Include standard representations, warranties and dispute resolution.',
  INTL: 'International contract — specify governing law clause clearly. Include UNCITRAL/ICC arbitration provisions where applicable.',
  ES: 'Este contrato se rige por el Código Civil Español y la legislación aplicable.',
}

async function gerarConteudo(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const status = response.status
    let errText = ''
    try { errText = await response.text() } catch { }

    // Parse known Anthropic errors into user-friendly messages
    if (status === 401) throw new Error('Chave da API Anthropic inválida ou ausente. Verifique a configuração.')
    if (status === 429) throw new Error('Limite de requisições atingido. Aguarde um momento e tente novamente.')
    if (status === 529) throw new Error('Serviço da IA temporariamente sobrecarregado. Tente novamente em alguns minutos.')
    if (errText.includes('credit balance') || errText.includes('billing'))
      throw new Error('Créditos insuficientes na API de IA. Entre em contato com o suporte para recarregar.')
    if (errText.includes('too many tokens') || errText.includes('context length'))
      throw new Error('O contrato solicitado excede o limite de tamanho. Tente simplificar as instruções.')
    if (status >= 500) throw new Error('Erro no servidor da IA. Tente novamente em alguns minutos.')

    throw new Error('Erro ao gerar contrato. Tente novamente ou contate o suporte.')
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

function buildSystemPrompt(idioma: string, jurisdicao: string, criadoPorNome: string): string {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  return `Você é um especialista jurídico sênior em direito imobiliário nacional e internacional, com 20+ anos de experiência redigindo contratos para fundos soberanos, incorporadoras e investidores globais.

${INSTRUCOES_IDIOMA[idioma] || INSTRUCOES_IDIOMA.pt}

JURISDIÇÃO: ${INSTRUCOES_JURISDICAO[jurisdicao] || INSTRUCOES_JURISDICAO.BR}

REGRAS ABSOLUTAS DE REDAÇÃO:
1. Contrato COMPLETO e JURIDICAMENTE ROBUSTO — sem lacunas, sem "a definir", sem campos em branco.
2. Numeração sequencial: CLÁUSULA 1ª, CLÁUSULA 2ª... (ou equivalente no idioma).
3. OBRIGATÓRIO incluir: qualificação completa das partes, objeto, obrigações, valores (algarismos E por extenso), prazos, rescisão, multas, foro, local/data e espaços para assinatura e testemunhas.
4. Datas por extenso. Valores numéricos E por extenso entre parênteses.
5. Use Markdown estruturado: # para título, ## para seções, ### para cláusulas.
6. Entregue APENAS o texto do contrato — sem notas explicativas, sem comentários externos ao documento.
7. Extensão: 1.000–2.500 palavras conforme complexidade do tipo de contrato.
8. Rodapé: "Documento gerado por ${criadoPorNome} via IMI Atlantis Platform em ${dataAtual}"`
}

function buildUserPrompt(
  modelo: any,
  idioma: string,
  contratante: any,
  contratado: any,
  dados: Record<string, any>,
  notasAdicionais?: string
): string {
  const idiomaInfo = IDIOMAS_LABEL[idioma] || IDIOMAS_LABEL.pt

  const dadosFormatados = modelo.campos
    .filter((c: any) => dados[c.key] !== null && dados[c.key] !== undefined && dados[c.key] !== '')
    .map((c: any) => `- ${c.label}: ${dados[c.key]}`)
    .join('\n')

  const qualificaParte = (p: any, label: string) => {
    const linhas = [`${label}:`, `Nome: ${p.nome}`]
    if (p.tipo === 'pessoa_juridica') {
      if (p.razao_social) linhas.push(`Razão Social: ${p.razao_social}`)
      if (p.cpf_cnpj) linhas.push(`CNPJ: ${p.cpf_cnpj}`)
      if (p.representante) linhas.push(`Representante: ${p.representante}, ${p.cargo_representante || ''}`)
    } else {
      if (p.cpf_cnpj) linhas.push(`CPF: ${p.cpf_cnpj}`)
      if (p.estado_civil) linhas.push(`Estado Civil: ${p.estado_civil}`)
      if (p.profissao) linhas.push(`Profissão: ${p.profissao}`)
      if (p.nacionalidade) linhas.push(`Nacionalidade: ${p.nacionalidade}`)
    }
    const enderecoParts = [p.endereco, p.cidade, p.estado].filter(Boolean)
    if (enderecoParts.length) linhas.push(`Endereço: ${enderecoParts.join(', ')}`)
    if (p.email) linhas.push(`Email: ${p.email}`)
    if (p.telefone) linhas.push(`Telefone: ${p.telefone}`)
    return linhas.join('\n')
  }

  return `Gere o contrato completo conforme as especificações abaixo.

TIPO: ${modelo.nome}
IDIOMA: ${idiomaInfo.label} ${idiomaInfo.flag}

═══════════════════════════════════
${qualificaParte(contratante, 'CONTRATANTE (PARTE A)')}

═══════════════════════════════════
${qualificaParte(contratado, 'CONTRATADO (PARTE B)')}

═══════════════════════════════════
DADOS DO CONTRATO:
${dadosFormatados || '(Usar dados padrão do modelo)'}
${notasAdicionais ? `\n═══════════════════════════════════\nINSTRUÇÕES ESPECIAIS / PECULIARIDADES:\n${notasAdicionais}` : ''}

═══════════════════════════════════
Gere agora o contrato completo.`
}

export async function POST(req: NextRequest) {
  try {
    const {
      modelo_id,
      idioma_primario,
      idiomas_adicionais = [],
      contratante,
      contratado,
      dados_contrato,
      criado_por_nome,
      notas_adicionais,
    } = await req.json()

    if (!modelo_id || !contratante || !contratado) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
    }

    const modelo = getModeloById(modelo_id)
    if (!modelo) {
      return NextResponse.json({ error: 'Modelo não encontrado' }, { status: 404 })
    }

    const idioma = idioma_primario || 'pt'
    const systemPrompt = buildSystemPrompt(idioma, modelo.jurisdicao, criado_por_nome || 'IMI Atlantis')
    const userPrompt = buildUserPrompt(modelo, idioma, contratante, contratado, dados_contrato, notas_adicionais)

    // ── Gera versão primária (sempre PT ou idioma selecionado) ──
    const conteudoPrimario = await gerarConteudo(systemPrompt, userPrompt, apiKey)

    if (!conteudoPrimario || conteudoPrimario.length < 300) {
      return NextResponse.json({ error: 'Conteúdo gerado insuficiente' }, { status: 422 })
    }

    // ── Gera versões adicionais em paralelo ────────────────────
    const conteudoAdicional: Record<string, string> = {}

    if (idiomas_adicionais.length > 0) {
      const traducoes = await Promise.allSettled(
        idiomas_adicionais
          .filter((l: string) => l !== idioma)
          .map(async (lang: string) => {
            const sys = buildSystemPrompt(lang, modelo.jurisdicao, criado_por_nome || 'IMI Atlantis')
            const usr = buildUserPrompt(modelo, lang, contratante, contratado, dados_contrato, notas_adicionais)
            const conteudo = await gerarConteudo(sys, usr, apiKey)
            return { lang, conteudo }
          })
      )

      traducoes.forEach(result => {
        if (result.status === 'fulfilled' && result.value.conteudo) {
          conteudoAdicional[result.value.lang] = result.value.conteudo
        }
      })
    }

    const numero = `IMI-${new Date().getFullYear()}-CTR-${String(Date.now()).slice(-6)}`

    return NextResponse.json({
      success: true,
      numero,
      conteudo_markdown: conteudoPrimario,
      conteudo_adicional: conteudoAdicional,
      modelo_nome: modelo.nome,
      categoria: modelo.categoria,
      idioma_primario: idioma,
      idiomas_adicionais,
    })

  } catch (error: any) {
    console.error('gerar-contrato error:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
