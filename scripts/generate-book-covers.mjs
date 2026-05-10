#!/usr/bin/env node
/**
 * IMI Book Cover Generator (nano banana)
 * Generates SVG book covers for all titles in the Biblioteca IMI.
 * Usage: node scripts/generate-book-covers.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT_DIR = resolve(ROOT, 'public/books/covers')

mkdirSync(OUT_DIR, { recursive: true })

// ── Pilar color system ─────────────────────────────────────
const PILAR_STYLES = {
  avaliacao:     { bg1: '#0D1928', bg2: '#162840', bg3: '#0A1320', accent: '#9FB3C8', label: 'AVALIAÇÃO' },
  investimentos: { bg1: '#081A14', bg2: '#102E22', bg3: '#061410', accent: '#34d399', label: 'INVESTIMENTOS' },
  internacional: { bg1: '#0A1628', bg2: '#0F2040', bg3: '#081220', accent: '#60a5fa', label: 'INTERNACIONAL' },
  patrimonial:   { bg1: '#151008', bg2: '#2A2210', bg3: '#100C06', accent: '#c9a040', label: 'PATRIMÔNIO' },
  operacao:      { bg1: '#150810', bg2: '#2A1020', bg3: '#100608', accent: '#f472b6', label: 'OPERAÇÃO' },
  tecnologia:    { bg1: '#0E0818', bg2: '#1A1030', bg3: '#0A0614', accent: '#a78bfa', label: 'TECNOLOGIA' },
  default:       { bg1: '#0A1624', bg2: '#162840', bg3: '#0D1928', accent: '#C8A44A', label: 'IMI' },
}

// Catalog — matches CATALOG_SEED in biblioteca/page.tsx
const CATALOG = [
  { slug: 'livro-00-o-mapa-do-dinheiro-invisivel',              title: 'O Mapa do Dinheiro Invisível',                   subtitle: 'Como Descobrir, Medir e Capturar o Valor Oculto dos Imóveis',       author: 'Iule Miranda', pilar: 'avaliacao',     num: '00' },
  { slug: 'livro-01-avaliacao-imoveis-na-pratica',              title: 'Avaliação de Imóveis na Prática',                subtitle: 'O Método Completo para Determinar o Valor Justo de Qualquer Imóvel', author: 'Iule Miranda', pilar: 'avaliacao',     num: '01' },
  { slug: 'livro-02-avaliacao-imobiliaria-para-investidores',   title: 'Avaliação Imobiliária para Investidores',        subtitle: 'Como Analisar se um Imóvel é Bom Investimento Antes de Comprar',    author: 'Iule Miranda', pilar: 'avaliacao',     num: '02' },
  { slug: 'livro-03-avaliacao-processos-judiciais',             title: 'Avaliação Judicial de Imóveis',                  subtitle: 'Perícia, Laudos e Defesa Técnica em Litígios Imobiliários',        author: 'Iule Miranda', pilar: 'avaliacao',     num: '03' },
  { slug: 'livro-04-avaliar-terrenos-lotes',                    title: 'Avaliação de Terrenos Urbanos',                  subtitle: 'Do Lote Vazio ao Potencial Construtivo — Métodos e Valor',         author: 'Iule Miranda', pilar: 'avaliacao',     num: '04' },
  { slug: 'livro-05-engenharia-avaliacoes-simplificada',        title: 'Engenharia de Avaliações',                       subtitle: 'Estatística, Modelagem e Ciência Aplicada ao Valor Imobiliário',   author: 'Iule Miranda', pilar: 'avaliacao',     num: '05' },
  { slug: 'livro-06-identificar-imoveis-abaixo-valor',          title: 'Como Identificar Imóveis Abaixo do Valor de Mercado', subtitle: 'Ineficiências, Oportunidades e o Sistema que Transforma Dados em Vantagem', author: 'Iule Miranda', pilar: 'investimentos', num: '06' },
  { slug: 'livro-07-investir-imoveis-seguranca',                title: 'Como Investir em Imóveis com Segurança',         subtitle: 'Due Diligence, Risco Calculado e Estrutura de Proteção',           author: 'Iule Miranda', pilar: 'investimentos', num: '07' },
  { slug: 'livro-08-estrategias-renda-aluguel',                 title: 'Estratégias de Renda com Aluguel',               subtitle: 'Como Transformar Imóveis em Máquinas de Fluxo de Caixa',          author: 'Iule Miranda', pilar: 'investimentos', num: '08' },
  { slug: 'livro-09-construir-patrimonio-imoveis',              title: 'Como Construir Patrimônio com Imóveis',          subtitle: 'Ciclos, Alavancagem e a Arquitetura de Riqueza que Atravessa Gerações', author: 'Iule Miranda', pilar: 'investimentos', num: '09' },
  { slug: 'livro-10-fundamentos-investimento-imobiliario',      title: 'Fundamentos do Investimento Imobiliário',        subtitle: 'Capital, Risco e Decisão — O Mapa Completo para Começar Certo',   author: 'Iule Miranda', pilar: 'investimentos', num: '10' },
  { slug: 'livro-11-investir-imoveis-eua',                      title: 'Como Investir em Imóveis nos EUA',               subtitle: 'LLC, Financiamento, Tributação e Renda em Dólar',                 author: 'Iule Miranda', pilar: 'internacional', num: '11' },
  { slug: 'livro-12-investir-imoveis-portugal',                 title: 'Como Investir em Imóveis em Portugal',           subtitle: 'Residência, Renda em Euro e o Plano B que Virou Plano A',         author: 'Iule Miranda', pilar: 'internacional', num: '12' },
  { slug: 'livro-13-investir-imoveis-dubai',                    title: 'Como Investir em Imóveis em Dubai',              subtitle: 'Zero Income Tax, Yields de 7%+ e as Armadilhas que o Instagram Não Mostra', author: 'Iule Miranda', pilar: 'internacional', num: '13' },
  { slug: 'livro-14-reits-fiis-internacionais',                 title: 'Investimento via REITs e FIIs Internacionais',   subtitle: 'Diversificação Imobiliária Global sem Comprar Tijolo',            author: 'Iule Miranda', pilar: 'internacional', num: '14' },
  { slug: 'livro-15-tributacao-internacional',                  title: 'Tributação Internacional para Investidores Imobiliários', subtitle: 'Como Estruturar, Declarar e Otimizar Impostos em Múltiplas Jurisdições', author: 'Iule Miranda', pilar: 'internacional', num: '15' },
  { slug: 'livro-16-holding-patrimonial',                       title: 'Holding Patrimonial Imobiliária',                subtitle: 'Como Estruturar, Tributar e Proteger Patrimônio com Pessoa Jurídica', author: 'Iule Miranda', pilar: 'patrimonial',   num: '16' },
  { slug: 'livro-17-planejamento-sucessorio-imobiliario',       title: 'Planejamento Sucessório Imobiliário',            subtitle: 'Como Transferir Patrimônio sem Destruir o que Você Construiu',   author: 'Iule Miranda', pilar: 'patrimonial',   num: '17' },
  { slug: 'livro-18-protecao-avancada-de-ativos',               title: 'Proteção Avançada de Ativos',                    subtitle: 'Como Blindar Seu Patrimônio Imobiliário Contra os Riscos',        author: 'Iule Miranda', pilar: 'patrimonial',   num: '18' },
  { slug: 'livro-19-planejamento-patrimonial-longo-prazo',      title: 'Planejamento Patrimonial de Longo Prazo',        subtitle: 'O Masterplan de 20 Anos para Riqueza Imobiliária',                author: 'Iule Miranda', pilar: 'patrimonial',   num: '19' },
  { slug: 'livro-20-como-montar-um-bpo-imobiliario',            title: 'Como Montar um BPO Imobiliário',                 subtitle: 'Do Zero à Operação Escalável para Bancos e Fundos',               author: 'Iule Miranda', pilar: 'operacao',      num: '20' },
  { slug: 'livro-21-gestao-profissional-de-imoveis',            title: 'Gestão Profissional de Imóveis',                 subtitle: 'Sistemas, Métricas e Inteligência Operacional',                   author: 'Iule Miranda', pilar: 'operacao',      num: '21' },
  { slug: 'livro-22-pericia-imobiliaria-judicial',              title: 'Perícia Imobiliária Judicial',                   subtitle: 'Como Atuar como Perito Avaliador em Processos Judiciais',         author: 'Iule Miranda', pilar: 'operacao',      num: '22' },
  { slug: 'livro-23-corretagem-estrategica',                    title: 'Corretagem Estratégica',                         subtitle: 'De Vendas Avulsas a Negócio Escalável de Alto Valor',             author: 'Iule Miranda', pilar: 'operacao',      num: '23' },
  { slug: 'livro-24-ia-no-mercado-imobiliario',                 title: 'IA no Mercado Imobiliário',                      subtitle: 'Como a Inteligência Artificial Está Redefinindo Tudo',            author: 'Iule Miranda', pilar: 'tecnologia',    num: '24' },
  { slug: 'livro-25-proptech-e-inovacao-imobiliaria',           title: 'PropTech e Inovação Imobiliária',                subtitle: 'As Tecnologias que Estão Reconstruindo o Mercado',                author: 'Iule Miranda', pilar: 'tecnologia',    num: '25' },
  { slug: 'livro-26-automacao-operacoes-imobiliarias',          title: 'Automação de Operações Imobiliárias',            subtitle: 'Como Eliminar Trabalho Manual e Escalar sem Contratar',           author: 'Iule Miranda', pilar: 'tecnologia',    num: '26' },
  { slug: 'livro-27-o-futuro-do-mercado-imobiliario',           title: 'O Futuro do Mercado Imobiliário',                subtitle: 'Uma Visão de 20 Anos para Quem Vive de Imóveis',                  author: 'Iule Miranda', pilar: 'tecnologia',    num: '27' },
  { slug: 'livro-28-avaliacao-mercadologica-joao-diniz',        title: 'Avaliação Mercadológica de Imóveis',             subtitle: 'Legislações, Conceitos, Práticas — João Diniz Marcello',         author: 'João Diniz Marcello', pilar: 'avaliacao', num: '28' },
  { slug: 'bonus-01-glossario-definitivo-avaliacao-imobiliaria', title: 'Glossário Definitivo da Avaliação Imobiliária', subtitle: '500+ Termos Técnicos, Jurídicos e de Mercado',                   author: 'Iule Miranda', pilar: 'avaliacao',     num: 'B1' },
  { slug: 'bonus-02-checklist-master-avaliador-imobiliario',    title: 'Checklist Master do Avaliador Imobiliário',      subtitle: '127 Verificações Essenciais Para Laudos à Prova de Impugnação',  author: 'Iule Miranda', pilar: 'avaliacao',     num: 'B2' },
  { slug: 'bonus-03-modelos-laudos-templates-profissionais',    title: 'Modelos de Laudos e Templates Profissionais',    subtitle: 'Estruturas Prontas Para Avaliação Residencial, Comercial e Perícia', author: 'Iule Miranda', pilar: 'avaliacao', num: 'B3' },
]

// ── Helpers ────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wrapWords(text, maxWidth, charPx) {
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (test.length * charPx <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

// ── SVG Generator ──────────────────────────────────────────
function generateCover({ slug, title, subtitle, author, pilar, num }) {
  const W = 600
  const H = 800
  const c = PILAR_STYLES[pilar] || PILAR_STYLES.default
  const id = slug.replace(/[^a-zA-Z0-9]/g, '_')

  // Title wrapping — ~15px per char at font-size 28
  const titleLines = wrapWords(title, W - 88, 14.5)
  const titleFontSize = titleLines.length <= 2 ? 30 : titleLines.length <= 3 ? 26 : 22
  const titleLineH = titleFontSize * 1.45

  // Subtitle wrapping — ~8px per char at font-size 13
  const subtitleLines = subtitle ? wrapWords(subtitle, W - 88, 8.2).slice(0, 3) : []

  // Y positions (bottom-anchored layout)
  const bottomPad = 68
  const authorY = H - bottomPad
  const accentLineY = authorY - 18
  const subtitleStartY = accentLineY - (subtitleLines.length * 20) - 12
  const titleStartY = subtitleStartY - (titleLines.length * titleLineH) - 10

  // Large watermark number Y
  const wmY = Math.min(titleStartY - 10, 380)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg_${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${c.bg1}"/>
      <stop offset="55%"  stop-color="${c.bg2}"/>
      <stop offset="100%" stop-color="${c.bg3}"/>
    </linearGradient>
    <linearGradient id="acc_${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${c.accent}"/>
      <stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fade_${id}" x1="0" y1="0.6" x2="0" y2="1">
      <stop offset="0%"   stop-color="${c.bg3}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${c.bg3}" stop-opacity="0.85"/>
    </linearGradient>
    <radialGradient id="glow_${id}" cx="85%" cy="18%" r="55%">
      <stop offset="0%"   stop-color="${c.accent}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2_${id}" cx="10%" cy="82%" r="40%">
      <stop offset="0%"   stop-color="${c.accent}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg_${id})"/>
  <rect width="${W}" height="${H}" fill="url(#glow_${id})"/>
  <rect width="${W}" height="${H}" fill="url(#glow2_${id})"/>

  <!-- Geometric accent — top-right corner lines -->
  <rect x="${W - 3}" y="0"  width="3" height="160" fill="${c.accent}" opacity="0.18"/>
  <rect x="${W - 14}" y="20" width="2" height="100" fill="${c.accent}" opacity="0.10"/>
  <rect x="${W - 24}" y="40" width="1.5" height="60" fill="${c.accent}" opacity="0.06"/>

  <!-- Subtle diagonal grid lines -->
  <line x1="${W}" y1="0" x2="${W - 180}" y2="300" stroke="${c.accent}" stroke-width="0.5" opacity="0.05"/>
  <line x1="${W}" y1="0" x2="${W - 280}" y2="400" stroke="${c.accent}" stroke-width="0.5" opacity="0.04"/>

  <!-- Large watermark number -->
  <text x="${W - 44}" y="${wmY}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="220"
    font-weight="700"
    fill="${c.accent}"
    opacity="0.04"
    text-anchor="end"
    dominant-baseline="auto">${esc(num)}</text>

  <!-- ── IMI LOGO (exact header match) ─────────────────── -->
  <!-- "IMI" serif bold 32px white letter-spacing 4 -->
  <text x="44" y="85"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="34"
    font-weight="700"
    fill="#FFFFFF"
    letter-spacing="4"
    xml:space="preserve">${esc('IMI')}</text>

  <!-- Gold vertical divider: 1.5px × 30px -->
  <rect x="108" y="62" width="1.5" height="30" fill="#C8A44A"/>

  <!-- INTELIGÊNCIA / IMOBILIÁRIA — 9px uppercase white/60% -->
  <text x="119" y="74"
    font-family="Arial, Helvetica, sans-serif"
    font-size="9"
    font-weight="600"
    fill="#FFFFFF"
    fill-opacity="0.60"
    letter-spacing="2.5"
    xml:space="preserve">${esc('INTELIGÊNCIA')}</text>
  <text x="119" y="88"
    font-family="Arial, Helvetica, sans-serif"
    font-size="9"
    font-weight="600"
    fill="#FFFFFF"
    fill-opacity="0.60"
    letter-spacing="2.5"
    xml:space="preserve">${esc('IMOBILIÁRIA')}</text>

  <!-- Accent line below logo -->
  <rect x="44" y="106" width="140" height="1.5" fill="url(#acc_${id})" rx="1"/>

  <!-- Pilar category label -->
  <text x="44" y="136"
    font-family="Arial, Helvetica, sans-serif"
    font-size="9.5"
    font-weight="700"
    fill="${c.accent}"
    letter-spacing="2.8"
    opacity="0.90"
    xml:space="preserve">${esc(c.label)}</text>

  <!-- Bottom fade overlay -->
  <rect width="${W}" height="${H}" fill="url(#fade_${id})"/>

  <!-- ── Book Title ──────────────────────────────────────── -->
  ${titleLines.map((line, i) => `<text x="44" y="${Math.round(titleStartY + i * titleLineH)}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${titleFontSize}"
    font-weight="700"
    fill="#E8E4DC"
    xml:space="preserve">${esc(line)}</text>`).join('\n  ')}

  <!-- ── Subtitle ───────────────────────────────────────── -->
  ${subtitleLines.map((line, i) => `<text x="44" y="${Math.round(subtitleStartY + i * 20)}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="12.5"
    fill="#E8E4DC"
    fill-opacity="0.42"
    xml:space="preserve">${esc(line)}</text>`).join('\n  ')}

  <!-- Bottom accent line -->
  <rect x="44" y="${accentLineY}" width="${W - 88}" height="1" fill="url(#acc_${id})" opacity="0.55"/>

  <!-- Author -->
  <text x="44" y="${authorY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="12"
    font-weight="600"
    fill="#E8E4DC"
    fill-opacity="0.45"
    letter-spacing="0.8"
    xml:space="preserve">${esc(author || 'Iule Miranda')}</text>
</svg>`
}

// ── Generate all covers ────────────────────────────────────
let generated = 0
let errors = 0

for (const book of CATALOG) {
  try {
    const svg = generateCover(book)
    const outPath = resolve(OUT_DIR, `${book.slug}.svg`)
    writeFileSync(outPath, svg, 'utf-8')
    console.log(`  ✓  ${book.slug}`)
    generated++
  } catch (err) {
    console.error(`  ✗  ${book.slug}: ${err.message}`)
    errors++
  }
}

console.log(`\n  Generated ${generated} covers → public/books/covers/`)
if (errors) console.error(`  ${errors} errors`)
