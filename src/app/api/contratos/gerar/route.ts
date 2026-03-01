import { NextRequest, NextResponse } from 'next/server'
import { getModeloById, IDIOMAS_LABEL } from '@/lib/modelos-contratos'

export const runtime = 'nodejs'

function qualificaParte(p: any, label: string) {
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
  modelo: any,
  idiomaInfo: any,
  contratante: any,
  contratado: any,
  dados: Record<string, any>,
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
  modelo.campos.filter((c: any) => c.section === 'objeto').forEach((c: any) => {
    md += `- **${c.label}:** ${dados[c.key] || 'Não especificado'}\n`
  })
  md += '\n'
  
  md += `## 3. DOS VALORES E CONDIÇÕES DE PAGAMENTO\n\n`
  modelo.campos.filter((c: any) => c.section === 'valores').forEach((c: any) => {
    md += `- **${c.label}:** ${dados[c.key] || 'Não especificado'}\n`
  })
  md += '\n'
  
  md += `## 4. DOS PRAZOS E VIGÊNCIA\n\n`
  modelo.campos.filter((c: any) => c.section === 'prazos').forEach((c: any) => {
    md += `- **${c.label}:** ${dados[c.key] || 'Não especificado'}\n`
  })
  md += '\n'
  
  md += `## 5. DAS GARANTIAS (SE APLICÁVEL)\n\n`
  const garantias = modelo.campos.filter((c: any) => c.section === 'garantias')
  if(garantias.length === 0) {
     md += `Não há garantias específicas declaradas nestes campos automáticos.\n\n`
  } else {
     garantias.forEach((c: any) => {
       md += `- **${c.label}:** ${dados[c.key] || 'Não especificado'}\n`
     })
     md += '\n'
  }
  
  md += `## 6. DAS CONDIÇÕES GERAIS E PECULIARIDADES\n\n`
  modelo.campos.filter((c: any) => c.section === 'condicoes').forEach((c: any) => {
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
      dados_contrato,
      criado_por_nome || 'IMI – Inteligência Imobiliária',
      notas_adicionais
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

  } catch (error: any) {
    console.error('gerar-contrato error:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
