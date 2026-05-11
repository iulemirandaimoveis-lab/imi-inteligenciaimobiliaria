#!/usr/bin/env node
/**
 * Gera todas as capas SVG da Biblioteca IMI
 * Cor: Nano Banana (#E8C840) sobre fundo navy escuro
 * Logo: exata do header (IMI serif + divisor gold + INTELIGÊNCIA/IMOBILIÁRIA)
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const OUTPUT_DIR = join(__dirname, '../public/books/covers')

// ── Palette ────────────────────────────────────────────────────────────────
const BANANA   = '#E8C840'   // nano banana primary
const BANANA2  = '#C8A030'   // nano banana dark (gradient)
const GOLD_DIV = '#C8A44A'   // IMI gold divider (matches header exactly)
const BG_TOP   = '#0A1624'
const BG_MID   = '#152038'
const BG_BOT   = '#0A1420'

// ── Utilities ──────────────────────────────────────────────────────────────
function slugToId(slug) {
  return slug.replace(/-/g, '_')
}

function escXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Word-wrap at maxChars, returning array of lines */
function wrap(text, maxChars = 32) {
  const words = text.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w
    if (candidate.length <= maxChars) {
      cur = candidate
    } else {
      if (cur) lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

/** Word-wrap subtitle at maxChars (wider), returning array of lines */
function wrapSub(text, maxChars = 54) {
  return wrap(text, maxChars)
}

// ── Book catalog ───────────────────────────────────────────────────────────
const BOOKS = [
  { slug: 'livro-00-o-mapa-do-dinheiro-invisivel',              num: '00', title: 'O Mapa do Dinheiro Invisível',                          subtitle: 'Como Descobrir, Medir e Capturar o Valor Oculto dos Imóveis',             author: 'Iule Miranda' },
  { slug: 'livro-01-avaliacao-imoveis-na-pratica',              num: '01', title: 'Avaliação de Imóveis na Prática',                       subtitle: 'O Método Completo para Determinar o Valor Justo de Qualquer Imóvel',    author: 'Iule Miranda' },
  { slug: 'livro-02-avaliacao-imobiliaria-para-investidores',   num: '02', title: 'Avaliação Imobiliária para Investidores',               subtitle: 'Como Analisar se um Imóvel é Bom Investimento Antes de Comprar',       author: 'Iule Miranda' },
  { slug: 'livro-03-avaliacao-processos-judiciais',             num: '03', title: 'Avaliação Judicial de Imóveis',                        subtitle: 'Perícia, Laudos e Defesa Técnica em Litígios Imobiliários',            author: 'Iule Miranda' },
  { slug: 'livro-04-avaliar-terrenos-lotes',                    num: '04', title: 'Avaliação de Terrenos Urbanos',                        subtitle: 'Do Lote Vazio ao Potencial Construtivo',                               author: 'Iule Miranda' },
  { slug: 'livro-05-engenharia-avaliacoes-simplificada',        num: '05', title: 'Engenharia de Avaliações',                             subtitle: 'Estatística, Modelagem e Ciência Aplicada ao Valor Imobiliário',       author: 'Iule Miranda' },
  { slug: 'livro-06-identificar-imoveis-abaixo-valor',         num: '06', title: 'Como Identificar Imóveis Abaixo do Valor de Mercado',  subtitle: 'Ineficiências, Oportunidades e o Sistema que Transforma Dados em Vantagem', author: 'Iule Miranda' },
  { slug: 'livro-07-investir-imoveis-seguranca',                num: '07', title: 'Como Investir em Imóveis com Segurança',               subtitle: 'Due Diligence, Risco Calculado e Estrutura de Proteção',              author: 'Iule Miranda' },
  { slug: 'livro-08-estrategias-renda-aluguel',                 num: '08', title: 'Estratégias de Renda com Aluguel',                    subtitle: 'Como Transformar Imóveis em Máquinas de Fluxo de Caixa',              author: 'Iule Miranda' },
  { slug: 'livro-09-construir-patrimonio-imoveis',              num: '09', title: 'Como Construir Patrimônio com Imóveis',               subtitle: 'Ciclos, Alavancagem e a Arquitetura de Riqueza que Atravessa Gerações', author: 'Iule Miranda' },
  { slug: 'livro-10-fundamentos-investimento-imobiliario',      num: '10', title: 'Fundamentos do Investimento Imobiliário',             subtitle: 'Capital, Risco e Decisão — O Mapa Completo para Começar Certo',      author: 'Iule Miranda' },
  { slug: 'livro-11-investir-imoveis-eua',                      num: '11', title: 'Como Investir em Imóveis nos EUA',                    subtitle: 'LLC, Financiamento, Tributação e Renda em Dólar',                    author: 'Iule Miranda' },
  { slug: 'livro-12-investir-imoveis-portugal',                 num: '12', title: 'Como Investir em Imóveis em Portugal',                subtitle: 'Residência, Renda em Euro e o Plano B que Virou Plano A',            author: 'Iule Miranda' },
  { slug: 'livro-13-investir-imoveis-dubai',                    num: '13', title: 'Como Investir em Imóveis em Dubai',                  subtitle: 'Zero Income Tax, Yields de 7%+ e as Armadilhas que o Instagram Não Mostra', author: 'Iule Miranda' },
  { slug: 'livro-14-reits-fiis-internacionais',                 num: '14', title: 'Investimento via REITs e FIIs Internacionais',        subtitle: 'Diversificação Imobiliária Global sem Comprar Tijolo',               author: 'Iule Miranda' },
  { slug: 'livro-15-tributacao-internacional',                  num: '15', title: 'Tributação Internacional para Investidores Imobiliários', subtitle: 'Como Estruturar, Declarar e Otimizar Impostos em Múltiplas Jurisdições', author: 'Iule Miranda' },
  { slug: 'livro-16-holding-patrimonial',                       num: '16', title: 'Holding Patrimonial Imobiliária',                    subtitle: 'Como Estruturar, Tributar e Proteger Patrimônio com PJ',             author: 'Iule Miranda' },
  { slug: 'livro-17-planejamento-sucessorio-imobiliario',       num: '17', title: 'Planejamento Sucessório Imobiliário',                 subtitle: 'Como Transferir Patrimônio sem Destruir o que Você Construiu',       author: 'Iule Miranda' },
  { slug: 'livro-18-protecao-avancada-de-ativos',               num: '18', title: 'Proteção Avançada de Ativos',                        subtitle: 'Como Blindar Seu Patrimônio Imobiliário',                            author: 'Iule Miranda' },
  { slug: 'livro-19-planejamento-patrimonial-longo-prazo',      num: '19', title: 'Planejamento Patrimonial de Longo Prazo',             subtitle: 'O Masterplan de 20 Anos para Riqueza Imobiliária',                  author: 'Iule Miranda' },
  { slug: 'livro-20-como-montar-um-bpo-imobiliario',            num: '20', title: 'Como Montar um BPO Imobiliário',                     subtitle: 'Do Zero à Operação Escalável',                                       author: 'Iule Miranda' },
  { slug: 'livro-21-gestao-profissional-de-imoveis',            num: '21', title: 'Gestão Profissional de Imóveis',                     subtitle: 'Sistemas, Métricas e Inteligência Operacional',                      author: 'Iule Miranda' },
  { slug: 'livro-22-pericia-imobiliaria-judicial',              num: '22', title: 'Perícia Imobiliária Judicial',                       subtitle: 'Como Atuar como Perito Avaliador',                                   author: 'Iule Miranda' },
  { slug: 'livro-23-corretagem-estrategica',                    num: '23', title: 'Corretagem Estratégica',                             subtitle: 'De Vendas Avulsas a Negócio Escalável de Alto Valor',               author: 'Iule Miranda' },
  { slug: 'livro-24-ia-no-mercado-imobiliario',                 num: '24', title: 'IA no Mercado Imobiliário',                          subtitle: 'Como a Inteligência Artificial Está Redefinindo Tudo',               author: 'Iule Miranda' },
  { slug: 'livro-25-proptech-e-inovacao-imobiliaria',           num: '25', title: 'PropTech e Inovação Imobiliária',                    subtitle: 'As Tecnologias que Estão Reconstruindo o Mercado',                  author: 'Iule Miranda' },
  { slug: 'livro-26-automacao-operacoes-imobiliarias',          num: '26', title: 'Automação de Operações Imobiliárias',                subtitle: 'Eliminar Manual, Escalar sem Contratar',                             author: 'Iule Miranda' },
  { slug: 'livro-27-o-futuro-do-mercado-imobiliario',           num: '27', title: 'O Futuro do Mercado Imobiliário',                   subtitle: 'Uma Visão de 20 Anos',                                               author: 'Iule Miranda' },
  { slug: 'livro-28-avaliacao-mercadologica-joao-diniz',        num: '28', title: 'Avaliação Mercadológica de Imóveis',                 subtitle: 'Legislações, Conceitos, Práticas',                                   author: 'João Diniz Marcello' },
  { slug: 'bonus-01-glossario-definitivo-avaliacao-imobiliaria',num: 'B1', title: 'Glossário Definitivo da Avaliação Imobiliária',      subtitle: '500+ Termos Técnicos, Jurídicos e de Mercado',                      author: 'Iule Miranda' },
  { slug: 'bonus-02-checklist-master-avaliador-imobiliario',    num: 'B2', title: 'Checklist Master do Avaliador Imobiliário',          subtitle: '127 Verificações Essenciais Para Laudos à Prova de Impugnação',    author: 'Iule Miranda' },
  { slug: 'bonus-03-modelos-laudos-templates-profissionais',    num: 'B3', title: 'Modelos de Laudos e Templates Profissionais',        subtitle: 'Estruturas Prontas Para Avaliação',                                  author: 'Iule Miranda' },
]

// ── SVG Generator ──────────────────────────────────────────────────────────
function generateSVG(book) {
  const id = slugToId(book.slug)
  const titleLines = wrap(book.title)
  const subLines   = book.subtitle ? wrapSub(book.subtitle) : []
  const nTitle = titleLines.length

  // Title block y positions (line-height 34)
  const TITLE_LH = 34
  const SUB_LH   = 20

  // Position title so content ends around y=750
  // Total height: nTitle*34 + subLines*20 + 40 (gap) + 30 (author block)
  const contentH  = nTitle * TITLE_LH + (subLines.length > 0 ? subLines.length * SUB_LH + 36 : 0) + 28
  const titleStartY = Math.min(760 - contentH, 650)

  const titleSvg = titleLines.map((line, i) => `  <text x="44" y="${titleStartY + i * TITLE_LH}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="30"
    font-weight="700"
    fill="#E8E4DC"
    xml:space="preserve">${escXml(line)}</text>`).join('\n')

  const lastTitleY = titleStartY + (nTitle - 1) * TITLE_LH
  const subStartY  = lastTitleY + 36

  const subSvg = subLines.map((line, i) => `  <text x="44" y="${subStartY + i * SUB_LH}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="12.5"
    fill="#E8E4DC"
    fill-opacity="0.42"
    xml:space="preserve">${escXml(line)}</text>`).join('\n')

  const lastSubY  = subLines.length > 0 ? subStartY + (subLines.length - 1) * SUB_LH : lastTitleY
  const accentY   = lastSubY + 24
  const authorY   = accentY + 16

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="800" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg_${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${BG_TOP}"/>
      <stop offset="55%"  stop-color="${BG_MID}"/>
      <stop offset="100%" stop-color="${BG_BOT}"/>
    </linearGradient>
    <linearGradient id="acc_${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${BANANA}"/>
      <stop offset="100%" stop-color="${BANANA}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fade_${id}" x1="0" y1="0.55" x2="0" y2="1">
      <stop offset="0%"   stop-color="${BG_BOT}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${BG_BOT}" stop-opacity="0.92"/>
    </linearGradient>
    <radialGradient id="glow_${id}" cx="80%" cy="12%" r="65%">
      <stop offset="0%"   stop-color="${BANANA}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${BANANA}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2_${id}" cx="15%" cy="88%" r="45%">
      <stop offset="0%"   stop-color="${BANANA}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${BANANA}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="800" fill="url(#bg_${id})"/>
  <rect width="600" height="800" fill="url(#glow_${id})"/>
  <rect width="600" height="800" fill="url(#glow2_${id})"/>

  <!-- Geometric accent — top-right corner strips -->
  <rect x="597" y="0"   width="3"   height="200" fill="${BANANA}" opacity="0.22"/>
  <rect x="587" y="18"  width="2"   height="130" fill="${BANANA}" opacity="0.13"/>
  <rect x="579" y="36"  width="1.5" height="80"  fill="${BANANA}" opacity="0.07"/>

  <!-- Subtle diagonal lines -->
  <line x1="600" y1="0" x2="400" y2="320" stroke="${BANANA}" stroke-width="0.6" opacity="0.04"/>
  <line x1="600" y1="0" x2="300" y2="450" stroke="${BANANA}" stroke-width="0.5" opacity="0.03"/>

  <!-- Large watermark number (very subtle) -->
  <text x="560" y="400"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="230"
    font-weight="700"
    fill="${BANANA}"
    opacity="0.038"
    text-anchor="end"
    dominant-baseline="auto">${book.num}</text>

  <!-- ── IMI LOGO — exact match to website header ────────────────────── -->
  <!-- "IMI" bold serif 28px white letter-spacing 2px -->
  <text x="44" y="70"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="28"
    font-weight="700"
    fill="#FFFFFF"
    letter-spacing="2"
    xml:space="preserve">IMI</text>

  <!-- Gold vertical divider: 1.5px × 25px (header: 1px × 22px, scaled up) -->
  <rect x="103" y="51" width="1.5" height="25" fill="${GOLD_DIV}"/>

  <!-- Tagline: INTELIGÊNCIA / IMOBILIÁRIA — 8px uppercase white 60% -->
  <text x="114" y="62"
    font-family="Arial, Helvetica, sans-serif"
    font-size="8"
    font-weight="600"
    fill="#FFFFFF"
    fill-opacity="0.60"
    letter-spacing="2.2"
    xml:space="preserve">INTELIGÊNCIA</text>
  <text x="114" y="74"
    font-family="Arial, Helvetica, sans-serif"
    font-size="8"
    font-weight="600"
    fill="#FFFFFF"
    fill-opacity="0.60"
    letter-spacing="2.2"
    xml:space="preserve">IMOBILIÁRIA</text>

  <!-- Accent line below logo -->
  <rect x="44" y="93" width="160" height="1.5" fill="url(#acc_${id})" rx="1"/>

  <!-- Bottom fade overlay -->
  <rect width="600" height="800" fill="url(#fade_${id})"/>

  <!-- ── Book Title ───────────────────────────────────────────────────── -->
${titleSvg}

  <!-- ── Subtitle ─────────────────────────────────────────────────────── -->
${subSvg}

  <!-- Bottom accent line -->
  <rect x="44" y="${accentY}" width="512" height="1" fill="url(#acc_${id})" opacity="0.55"/>

  <!-- Author -->
  <text x="44" y="${authorY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="12"
    font-weight="600"
    fill="#E8E4DC"
    fill-opacity="0.45"
    letter-spacing="0.8"
    xml:space="preserve">${escXml(book.author)}</text>
</svg>`
}

// ── Main ───────────────────────────────────────────────────────────────────
mkdirSync(OUTPUT_DIR, { recursive: true })

let generated = 0
for (const book of BOOKS) {
  const svg = generateSVG(book)
  const outPath = join(OUTPUT_DIR, `${book.slug}.svg`)
  writeFileSync(outPath, svg, 'utf8')
  generated++
  console.log(`✓  ${book.slug}.svg`)
}

console.log(`\n✅  ${generated} SVGs gerados em ${OUTPUT_DIR}`)
