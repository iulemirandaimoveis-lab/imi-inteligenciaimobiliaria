import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModeloById, IDIOMAS_LABEL } from '@/lib/modelos-contratos'
import { z } from 'zod'
export const runtime = 'nodejs'

const ParteSchema = z.object({
  nome: z.string().optional(),
  razao_social: z.string().optional(),
  tipo: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  representante: z.string().optional(),
  cargo_representante: z.string().optional(),
  estado_civil: z.string().optional(),
  profissao: z.string().optional(),
  nacionalidade: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
})

const ContratoGerarSchema = z.object({
  modelo_id: z.string().min(1),
  idioma_primario: z.string().max(5).optional(),
  idiomas_adicionais: z.array(z.string()).optional(),
  contratante: ParteSchema,
  contratado: ParteSchema,
  dados_contrato: z.record(z.unknown()).optional(),
  criado_por_nome: z.string().optional(),
  notas_adicionais: z.string().max(5000).optional(),
})
interface Parte {
  nome?: string
  razao_social?: string
  tipo?: string
  cpf_cnpj?: string
  representante?: string
  cargo_representante?: string
  estado_civil?: string
  profissao?: string
  nacionalidade?: string
  endereco?: string
  cidade?: string
  estado?: string
  email?: string
  telefone?: string
}
interface Campo {
  section: string
  label: string
  key: string
}
interface Modelo {
  nome: string
  jurisdicao?: string
  campos: Campo[]
  categoria: string
}
interface IdiomaInfo {
  label: string
}
function qualificaParte(p: Parte, label: string) {
  if (!p) return ''
  let text = `**${label}**\n\n`
  text += `**Nome/Razão Social:** ${p.nome || p.razao_social || 'Não informado'}\n`
  if (p.tipo === 'pessoa_juridica') {
    if (p.cpf_cnpj) text += `**CNPJ:** ${p.cpf_cnpj}\n`
    if (p.representante) text += `**Representante Legal:** ${p.representante} ${p.cargo_representante ? `(${p.cargo_representante})` : ''}\n`
  } else {
    if (p.cpf_cnpj) text += `**CPF:** ${p.cpf_cnpj}\n`
    if (p.estado_civil) text += `**Estado Civil:** ${p.estado_civil}\n`
    if (p.profissao) text += `**Profissão:** ${p.profissao}\n`
    if (p.nacionalidade) text += `**Nacionalidade:** ${p.nacionalidade}\n`
  }
  
  const enderecoParts = [p.endereco, p.cidade, p.estado].filter(Boolean)
  if (enderecoParts.length) text += `**Endereço:** ${enderecoParts.join(', ')}\n`
  if (p.email) text += `**Email:** ${p.email}\n`
  if (p.telefone) text += `**Telefone:** ${p.telefone}\n`
  
  return text
}
function generateLocalContractMarkdown(
  modelo: Modelo,
  idiomaInfo: IdiomaInfo,
  contratante: Parte,
  contratado: Parte,
  dados: Record<string, unknown>,
  criadoPorNome: string,
  notasAdicionais?: string
) {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  
  let md = `# INSTRUMENTO PARTICULAR DE ${modelo.nome.toUpperCase()}\n\n`
  
  md += `Pelo presente instrumento particular, e na melhor forma de direito, as partes abaixo qualificadas celebram o presente contrato, mediante as cláusulas e condições a seguir:\n\n`
  
  md += `## 1. DAS PARTES\n\n`
  md += qualificaParte(contratante, 'CONTRATANTE / LOCADOR / PROMITENTE VENDEDOR (PARTE A)') + '\n'
  md += qualificaParte(contratado, 'CONTRATADO / LOCATÁRIO / PROMITENTE COMPRADOR (PARTE B)') + '\n'
  
  md += `## 2. DO OBJETO\n\n`
  md += `As partes concordam com a negociação referente ao escopo deste instrumento (${modelo.nome}), sob a jurisdição aplicável (${modelo.jurisdicao || 'BR'}).\n\n`
  
  md += `**Especificações do Objeto:**\n`
  modelo.campos.filter((c: Campo) => c.section === 'objeto').forEach((c: Campo) => {
    md += `- **${c.label}:** ${dados[c.key] || 'Não especificado'}\n`
  })
  md += '\n'
  
  md += `## 3. DOS VALORES E CONDIÇÕES DE PAGAMENTO\n\n`
  modelo.campos.filter((c: Campo) => c.section === 'valores').forEach((c: Campo) => {
    md += `- **${c.label}:** ${dados[c.key] || 'Não especificado'}\n`
  })
  md += '\n'
  
  md += `## 4. DOS PRAZOS E VIGÊNCIA\n\n`
  modelo.campos.filter((c: Campo) => c.section === 'prazos').forEach((c: Campo) => {
    md += `- **${c.label}:** ${dados[c.key] || 'Não especificado'}\n`
  })
  md += '\n'
  
  md += `## 5. DAS GARANTIAS (SE APLICÁVEL)\n\n`
  const garantias = modelo.campos.filter((c: Campo) => c.section === 'garantias')
  if(garantias.length === 0) {
     md += `Não há garantias específicas declaradas nestes campos automáticos.\n\n`
  } else {
     garantias.forEach((c: Campo) => {
       md += `- **${c.label}:** ${dados[c.key] || 'Não especificado'}\n`
     })
     md += '\n'
  }
  
  md += `## 6. DAS CONDIÇÕES GERAIS E PECULIARIDADES\n\n`
  modelo.campos.filter((c: Campo) => c.section === 'condicoes').forEach((c: Campo) => {
    md += `- **${c.label}:** ${dados[c.key] || 'Não especificado'}\n`
  })
  
  if (notasAdicionais) {
    md += `\n**Condições Especiais Adicionais:**\n${notasAdicionais}\n`
  }
  md += '\n'
  md += `## 7. DO FORO E DISPOSIÇÕES FINAIS\n\n`
  md += `Fica eleito o foro da situação do imóvel ou da comarca correspondente para dirimir quaisquer dúvidas oriundas deste contrato, renunciando a qualquer outro por mais privilegiado que seja.\n\n`
  
  md += `E por estarem assim justas e contratadas, as partes assinam o presente instrumento em vias de igual teor e forma.\n\n`
  md += `Local e Data: _________________________, ${dataAtual}.\n\n`
  md += `<br/><br/>\n`
  md += `______________________________________________________________\n`
  md += `**${contratante.nome || contratante.razao_social || 'PARTE A'}**\n\n`
  md += `<br/><br/>\n`
  md += `______________________________________________________________\n`
  md += `**${contratado.nome || contratado.razao_social || 'PARTE B'}**\n\n`
  
  md += `\n\n---\n*Desenvolvido e gerado via plataforma IMI – Inteligência Imobiliária por ${criadoPorNome} em ${dataAtual}. Modelo base: ${modelo.nome} (${idiomaInfo.label})*`
  
  return md
}
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rawBody = await req.json()
    const parsed = ContratoGerarSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }
    const {
      modelo_id,
      idioma_primario,
      idiomas_adicionais = [],
      contratante,
      contratado,
      dados_contrato,
      criado_por_nome,
      notas_adicionais,
    } = parsed.data
    const modelo = getModeloById(modelo_id)
    if (!modelo) {
      return NextResponse.json({ error: 'Modelo não encontrado' }, { status: 404 })
    }
    const idioma = idioma_primario || 'pt'
    const idiomaInfo = IDIOMAS_LABEL[idioma] || IDIOMAS_LABEL.pt
    // Geração Local (Substitui Anthropic para não travar o fluxo se acabar o crédito)
    const conteudoPrimario = generateLocalContractMarkdown(
      modelo,
      idiomaInfo,
      contratante,
      contratado,
      dados_contrato || {},
      criado_por_nome || 'IMI – Inteligência Imobiliária',
      notas_adicionais || ''
    )
    const conteudoAdicional: Record<string, string> = {}
    
    // Fallback: se tiver idiomas adicionais, também geramos mas com aviso que é um template em PT.
    if (idiomas_adicionais && idiomas_adicionais.length > 0) {
       idiomas_adicionais.filter((l: string) => l !== idioma).forEach((lang: string) => {
         conteudoAdicional[lang] = `> [TRANSLATION REQUIRED] The API translation feature is currently turned off to preserve credits. This is the local fallback template.\n\n` + conteudoPrimario
       });
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
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 })
  }
}
