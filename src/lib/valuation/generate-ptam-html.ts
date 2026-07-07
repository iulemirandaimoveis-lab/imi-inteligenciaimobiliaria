import { ValuationResult } from './homogenization'
import type { QuadroAmostralResult } from './quadro-amostral'
import { AVALIADOR } from '@/config/avaliador'

interface PhotoItem {
  url: string
  name?: string
  caption?: string
}

/** Escapa texto para interpolação segura em HTML (evita quebra de layout / injeção). */
function esc(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Escapa URL — só permite http(s)/data para src/href. */
function escUrl(v: unknown): string {
  const s = String(v ?? '').trim()
  if (/^(https?:|data:image\/)/i.test(s)) return esc(s)
  return ''
}

export function generatePTAMHtml(params: {
  valuation: Record<string, unknown>
  development: Record<string, unknown> | null
  comparables: Record<string, unknown>[]
  result: ValuationResult
  evaluatorName: string
  evaluatorCRECI?: string
  evaluatorPhone?: string
  evaluatorEmail?: string
  evaluatorCompany?: string
  photos?: PhotoItem[]
  valorMinimo?: number
  valorMaximo?: number
  liquidez?: 'alta' | 'media' | 'baixa'
  /** Quadro amostral (saneamento por faixa ±20% + arredondamento técnico). */
  quadro?: QuadroAmostralResult
  depreciacao?: {
    idade_real: number
    vida_util: number
    idade_percentual: number
    estado_conservacao: string
    coeficiente_ross: number
    coeficiente_heidecke: number
    depreciacao_total: number
    valor_depreciado: number
    valor_residual: number
  }
  qrCodeSvg?: string
  numeroLaudo?: string
  qrHash?: string
}): string {
  const {
    valuation, development, comparables, result, photos = [],
    evaluatorName,
    evaluatorCRECI,
    evaluatorPhone,
    evaluatorEmail,
    evaluatorCompany,
    valorMinimo,
    valorMaximo,
    liquidez,
    quadro,
    depreciacao,
    qrCodeSvg,
    numeroLaudo,
    qrHash,
  } = params

  const fmt = (v: number) =>
    (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtBRL = (v: number) => 'R$ ' + fmt(v)
  const fmtBRL0 = (v: number) =>
    'R$ ' + (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  // ── Metadados / campos ricos (colunas + JSONB) ────────────────────────────
  const meta = (valuation.metadata && typeof valuation.metadata === 'object'
    ? valuation.metadata as Record<string, unknown>
    : {}) as Record<string, unknown>
  const carac = Array.isArray(valuation.caracteristicas)
    ? (valuation.caracteristicas as unknown[]).map(String)
    : []
  // helper: primeiro valor definido entre coluna e metadata
  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      if (valuation[k] != null && valuation[k] !== '') return String(valuation[k])
      if (meta[k] != null && meta[k] !== '') return String(meta[k])
    }
    return ''
  }
  const pickList = (...keys: string[]): string[] => {
    for (const k of keys) {
      const v = valuation[k] ?? meta[k]
      if (Array.isArray(v) && v.length) return v.map(String)
      if (typeof v === 'string' && v.trim()) {
        return v.split(/[;\n·•]+/).map((s) => s.trim()).filter(Boolean)
      }
    }
    return []
  }

  const purposeLabel = pick('finalidade', 'purpose') || 'Determinação de valor de mercado para venda'
  const methodLabel = (valuation.method as string) === 'comparative_direct'
    ? 'Comparativo Direto de Dados de Mercado'
    : (pick('metodologia', 'method') || 'Comparativo Direto de Dados de Mercado')

  const devName = (development?.name as string) || pick('endereco', 'subject_address') || 'Imóvel Avaliando'
  const endereco = pick('endereco', 'subject_address')
  const complemento = pick('complemento')
  const bairro = pick('bairro')
  const cidade = pick('cidade') || 'Recife'
  const estado = pick('estado') || 'PE'
  const cep = pick('cep')
  const devAddress = (development?.address as string)
    || [endereco, complemento, bairro, `${cidade} — ${estado}`, cep ? `CEP: ${cep}` : '']
        .filter(Boolean).join(', ')
    || 'N/A'

  const tipoImovel = pick('tipo_imovel') || 'Imóvel Residencial'
  const clienteNome = pick('cliente_nome', 'requester_name', 'solicitante_nome')
  const clienteCpf = pick('cliente_cpf_cnpj', 'cpf')
  const matricula = pick('matricula', 'matricula_numero')
  const cartorio = pick('cartorio', 'registro_imoveis') || 'Registro Geral de Imóveis'
  const fracaoIdeal = pick('fracao_ideal')
  const areaPriv = Number(valuation.area_privativa || valuation.subject_area_sqm || 0)
  const areaTotalImovel = Number(valuation.area_total || 0)
  const vagas = pick('vagas')
  const quartos = pick('quartos')
  const banheiros = pick('banheiros')
  const andarImovel = pick('andar')
  const anoConstImovel = pick('ano_construcao')
  const padrao = pick('padrao')
  const estadoConserv = pick('estado_conservacao') || 'Regular a bom'

  const subjectAreaNum = quadro?.areaAvaliando || areaPriv || Number(valuation.subject_area_sqm) || 0
  const subjectArea = subjectAreaNum > 0 ? fmt(subjectAreaNum) : 'N/A'

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const dataVistoria = (() => {
    const dv = pick('data_vistoria')
    if (!dv) return today
    const d = new Date(dv)
    return isNaN(d.getTime()) ? today : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  })()

  const protocolo = pick('protocolo') || (valuation.id as string)?.slice(0, 8).toUpperCase() || 'IMI-0001'

  const anoConstrucao = depreciacao ? (new Date().getFullYear() - depreciacao.idade_real) : null

  // ── Valores principais (prioriza o quadro amostral quando presente) ────────
  const valorAdotado = quadro?.valorAdotado || result.estimated_value
  const valorUnitario = quadro?.valorUnitarioMedio || result.average_price_per_sqm
  const limInferior = quadro?.limiteInferior ?? valorMinimo ?? Math.round(valorAdotado * 0.9)
  const limSuperior = quadro?.limiteSuperior ?? valorMaximo ?? Math.round(valorAdotado * 1.1)
  const grau = quadro?.grauFundamentacao || result.confidence_grade

  // valor por extenso (pt-BR)
  const valorExtenso = numeroPorExtenso(Math.round(valorAdotado))

  // ── Descrição, situação legal, contexto (listas com fallback normativo) ────
  const comodos = pickList('comodos', 'descricao_comodos')
  const acabamentos = pickList('acabamentos')
  const condominio = pickList('condominio', 'infra_condominio')
  const documentacao = pickList('documentacao', 'documentos_analisados')
  const infraestrutura = pickList('infraestrutura', 'infra_urbana')
  const distanciaRef = pick('distancia_referencia', 'distancia_praia')

  const docsFallback = ['Matrícula imobiliária', 'IPTU', 'Informações cadastrais', 'Relatório fotográfico', 'Pesquisa mercadológica']
  const infraFallback = ['Rede de abastecimento de água', 'Rede de esgotamento sanitário', 'Pavimentação', 'Transporte público', 'Equipamentos de saúde', 'Instituições de ensino', 'Comércio e serviços']

  // ── Tabela do quadro amostral ─────────────────────────────────────────────
  // Estilo "quadro amostral" (referência): Nº, Bairro, Valor, Área, R$/m², Quartos, Garagem, Andar, Fonte
  const quadroRows = quadro
    ? quadro.amostras.map((a) => `
    <tr${a.eliminado ? ' class="row-eliminado"' : ''}>
      <td>${a.indice + 1}</td>
      <td style="text-align:left">${esc(a.bairro || bairro || '—')}</td>
      <td>${a.valorTotal ? fmtBRL0(a.valorTotal) : '—'}</td>
      <td>${a.area ? fmt(a.area) : '—'}</td>
      <td>${fmt(a.valorM2)}</td>
      <td>${a.quartos ?? '—'}</td>
      <td>${a.garagem ?? '—'}</td>
      <td>${a.andar ?? '—'}</td>
      <td>${a.desvioPct >= 0 ? '+' : ''}${fmt(a.desvioPct)}%</td>
      <td>${a.eliminado ? '<span class="tag-elim">Eliminado</span>' : '<span class="tag-ok">Mantido</span>'}</td>
    </tr>`).join('')
    : ''

  // Fallback: tabela de fatores clássica (quando não há quadro)
  const comparableRows = comparables.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="text-align:left">${esc(c.address || c.endereco || 'N/A')}${c.neighborhood ? ', ' + esc(c.neighborhood) : ''}</td>
      <td>${fmt(Number(c.area_sqm) || Number(c.area) || 0)}</td>
      <td>${fmtBRL(Number(c.asking_price) || Number(c.valorVenda) || 0)}</td>
      <td>${fmt(Number(c.price_per_sqm) || (Number(c.asking_price) / Number(c.area_sqm)) || 0)}</td>
      <td><strong>${fmt(Number(c.homogenized_price_per_sqm) || 0)}</strong></td>
    </tr>
  `).join('')

  // ── Justificativa metodológica ────────────────────────────────────────────
  const nComp = quadro?.nInicial ?? comparables.length
  const methodJustification = (() => {
    const m = (valuation.method as string) || 'comparative_direct'
    if (m === 'income' || m === 'renda') {
      return `O <strong>Método da Capitalização da Renda</strong> é indicado pela <em>NBR 14653-1 e NBR 14653-4</em> para imóveis geradores de renda. O valor é obtido pela capitalização da renda líquida esperada a uma taxa de desconto compatível com o risco do ativo imobiliário.`
    }
    if (m === 'cost' || m === 'custo' || m === 'evolutivo') {
      return `O <strong>Método Evolutivo (Custo de Reprodução)</strong>, normatizado pela <em>NBR 14653-2</em>, é empregado quando não há mercado comparativo ativo. O valor é obtido pela soma do valor do terreno ao custo de reprodução das benfeitorias, deduzida a depreciação física e funcional.`
    }
    return `O <strong>Método Comparativo Direto de Dados de Mercado</strong> é o método preconizado pela <em>NBR 14653-2</em> para imóveis urbanos com mercado ativo. Baseia-se na análise de uma amostra de imóveis com características similares ao avaliando, coletados na região de influência, aos quais se aplica o tratamento por saneamento estatístico com faixa de tolerância, eliminando os elementos discrepantes. A adequação é confirmada pela disponibilidade de ${nComp} elemento${nComp !== 1 ? 's' : ''} comparativo${nComp !== 1 ? 's' : ''}, conferindo representatividade à amostra (<em>NBR 14653-1, seção 8.2</em>).`
  })()

  // ── Cenários ──────────────────────────────────────────────────────────────
  const conservador = valorAdotado * 0.85
  const realista = valorAdotado
  const agressivo = valorAdotado * 1.12

  const scenariosSection = `
  <div class="scenarios-grid">
    <div class="scenario-card scenario-blue">
      <div class="scenario-label">Cenário Conservador</div>
      <div class="scenario-desc">−15% sobre o valor adotado · Condições de mercado desfavoráveis</div>
      <div class="scenario-value">${fmtBRL0(conservador)}</div>
    </div>
    <div class="scenario-card scenario-green">
      <div class="scenario-label">Cenário Realista</div>
      <div class="scenario-desc">Valor de mercado adotado · Condições normais de oferta e demanda</div>
      <div class="scenario-value">${fmtBRL0(realista)}</div>
    </div>
    <div class="scenario-card scenario-gold">
      <div class="scenario-label">Cenário Agressivo</div>
      <div class="scenario-desc">+12% sobre o valor adotado · Aquecimento de mercado</div>
      <div class="scenario-value">${fmtBRL0(agressivo)}</div>
    </div>
  </div>`

  // ── Liquidez ──────────────────────────────────────────────────────────────
  const liquidezSection = liquidez ? (() => {
    const discountMap = { alta: 0.10, media: 0.20, baixa: 0.30 } as const
    const labelMap = { alta: 'Alta', media: 'Média', baixa: 'Baixa' } as const
    const colorMap = { alta: '#1a6b3c', media: '#7a5a00', baixa: '#8b1a1a' } as const
    const descMap = {
      alta: 'Imóvel com boa liquidez de mercado — absorção esperada em prazo curto (até 90 dias)',
      media: 'Imóvel com liquidez moderada — absorção estimada entre 90 e 180 dias',
      baixa: 'Imóvel com liquidez reduzida — absorção estimada acima de 180 dias',
    } as const
    const desc = discountMap[liquidez]
    const descPct = (desc * 100).toFixed(0)
    const valorLiqForc = valorAdotado * (1 - desc)
    return `
    <div class="liquidez-box" style="border-left: 4px solid ${colorMap[liquidez]}">
      <div class="liquidez-header">
        <span class="liquidez-badge" style="background:${colorMap[liquidez]}">Liquidez ${labelMap[liquidez]}</span>
        <span class="liquidez-sub">Fator de Desconto: ${descPct}%</span>
      </div>
      <p style="margin:10px 0 12px">${descMap[liquidez]}</p>
      <table style="max-width:480px">
        <thead><tr><th>Valor de Mercado</th><th>Desconto (${descPct}%)</th><th>Valor de Liquidação Forçada</th></tr></thead>
        <tbody><tr>
          <td>${fmtBRL0(valorAdotado)}</td>
          <td style="color:#c0392b">−${fmtBRL0(valorAdotado * desc)}</td>
          <td><strong>${fmtBRL0(valorLiqForc)}</strong></td>
        </tr></tbody>
      </table>
    </div>`
  })() : ''

  // ── Ross-Heidecke ─────────────────────────────────────────────────────────
  const rossHeideckeSection = depreciacao ? `
    <table style="max-width:100%">
      <thead><tr>
        <th>Ano Construção</th><th>Idade (anos)</th><th>Vida Útil</th><th>% Consumida</th>
        <th>Estado</th><th>Coef. Ross</th><th>Coef. Heidecke</th><th>Depreciação (%)</th>
      </tr></thead>
      <tbody><tr>
        <td>${anoConstrucao ?? 'N/A'}</td>
        <td>${depreciacao.idade_real}</td>
        <td>${depreciacao.vida_util}</td>
        <td>${fmt(depreciacao.idade_percentual)}%</td>
        <td>${esc(depreciacao.estado_conservacao)}</td>
        <td>${fmt(depreciacao.coeficiente_ross)}</td>
        <td>${fmt(depreciacao.coeficiente_heidecke)}</td>
        <td><strong>${fmt(depreciacao.depreciacao_total)}%</strong></td>
      </tr></tbody>
    </table>` : ''

  // ── Numeração dinâmica das seções ─────────────────────────────────────────
  let sec = 0
  const N = () => ++sec

  // Seção "Situação Legal" só aparece se houver dado legal
  const hasLegal = !!(matricula || clienteNome || clienteCpf)
  const hasDescricao = !!(comodos.length || acabamentos.length || condominio.length || carac.length)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Laudo de Avaliação — ${esc(numeroLaudo || protocolo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #050B14; --navy-mid: #0A1624; --gold: #C8A44A;
    --gold-dim: rgba(200,164,74,0.3); --text: #E8E4DC; --text-muted: #8E99AB;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; font-size: 11pt; line-height: 1.6; }

  /* ── COVER ── */
  .cover { background: linear-gradient(160deg, var(--navy) 0%, #0d2240 60%, #162d50 100%); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 60px 80px; position: relative; overflow: hidden; page-break-after: always; }
  .cover::before { content: ''; position: absolute; top: 0; right: 0; width: 400px; height: 400px; background: radial-gradient(circle at center, rgba(200,164,74,0.08) 0%, transparent 70%); pointer-events: none; }
  .cover-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .cover-brand { font-family: 'Playfair Display', serif; font-size: 36pt; color: var(--gold); letter-spacing: 6px; font-weight: 700; }
  .cover-proto { font-size: 10pt; color: var(--text-muted); background: rgba(255,255,255,0.04); border: 1px solid var(--gold-dim); padding: 8px 16px; border-radius: 6px; text-align: right; }
  .cover-proto strong { display: block; color: var(--gold); font-size: 12pt; margin-bottom: 2px; }
  .cover-center { text-align: center; margin: auto 0; padding: 40px 0; }
  .cover-divider { width: 80px; height: 3px; background: linear-gradient(90deg, transparent, var(--gold), transparent); margin: 24px auto; }
  .cover-title { font-family: 'Playfair Display', serif; font-size: 34pt; color: var(--gold); letter-spacing: 3px; line-height: 1.15; margin-bottom: 8px; }
  .cover-subtitle { font-size: 12pt; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; line-height: 1.4; }
  .cover-property { background: rgba(255,255,255,0.04); border: 1px solid var(--gold-dim); border-radius: 12px; padding: 24px 32px; margin-top: 40px; text-align: left; }
  .cover-property .prop-label { font-size: 9pt; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .cover-property .prop-value { font-size: 14pt; color: var(--text); font-weight: 500; margin-bottom: 16px; }
  .cover-property .prop-value:last-child { margin-bottom: 0; }
  .cover-property .prop-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gold-dim); }
  .cover-property .prop-stat { text-align: center; }
  .cover-property .prop-stat-value { font-family: 'Playfair Display', serif; font-size: 17pt; color: var(--gold); }
  .cover-property .prop-stat-label { font-size: 8pt; color: var(--text-muted); margin-top: 2px; }
  .cover-bottom { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--gold-dim); padding-top: 24px; }
  .cover-bottom-left { font-size: 9pt; color: var(--text-muted); }
  .cover-bottom-left strong { display: block; color: var(--text); font-size: 10pt; margin-bottom: 2px; }
  .cover-norm { font-size: 8pt; color: var(--text-muted); text-align: right; }
  .cover-norm span { display: block; }
  .cover-qr { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cover-qr-img svg { width: 90px; height: 90px; border-radius: 4px; background: #fff; padding: 4px; }
  .cover-qr-label { font-size: 7pt; color: var(--text-muted); text-align: center; text-transform: uppercase; letter-spacing: 0.08em; }
  .cover-qr-num { font-size: 7pt; color: var(--gold); font-family: monospace; text-align: center; letter-spacing: 1px; }

  /* ── CONTENT ── */
  .content { max-width: 900px; margin: 0 auto; padding: 40px 30px; }
  h3 { font-family: 'Playfair Display', serif; font-size: 15pt; color: var(--navy); border-bottom: 2px solid var(--gold); padding-bottom: 8px; margin: 32px 0 16px; display: flex; align-items: center; gap: 10px; }
  h3::before { content: attr(data-num); display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: var(--navy); color: var(--gold); border-radius: 50%; font-size: 11pt; font-family: 'Inter', sans-serif; font-weight: 700; flex-shrink: 0; }
  h4 { font-size: 11.5pt; color: var(--navy); margin: 18px 0 8px; font-weight: 700; }
  p { margin-bottom: 8px; }
  ul.clean { list-style: none; margin: 8px 0 12px; padding: 0; columns: 2; column-gap: 32px; }
  ul.clean li { font-size: 10pt; padding: 3px 0 3px 16px; position: relative; break-inside: avoid; }
  ul.clean li::before { content: '▪'; color: var(--gold); position: absolute; left: 0; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 20px; background: #f9f8f4; border-radius: 8px; padding: 16px; border: 1px solid #e8e4dc; }
  .info-item { display: flex; gap: 6px; align-items: baseline; }
  .info-item .label { font-weight: 600; color: #4a4a6a; min-width: 130px; font-size: 9.5pt; }
  .info-item .value { font-size: 10pt; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 8.5pt; }
  th { background: var(--navy); color: var(--gold); padding: 8px 6px; text-align: center; font-weight: 600; font-size: 8pt; }
  td { padding: 6px; border-bottom: 1px solid #ddd; text-align: center; }
  tr:nth-child(even) td { background: #f8f7f3; }
  tr.row-eliminado td { background: #fdecea; color: #a03027; text-decoration: line-through; text-decoration-color: rgba(160,48,39,0.4); }
  .tag-elim { background: #c0392b; color: #fff; padding: 1px 7px; border-radius: 10px; font-size: 7pt; font-weight: 700; }
  .tag-ok { background: #1a6b3c; color: #fff; padding: 1px 7px; border-radius: 10px; font-size: 7pt; font-weight: 700; }
  .stats-box { background: linear-gradient(135deg, var(--navy), var(--navy-mid)); color: var(--text); padding: 24px; border-radius: 12px; margin: 20px 0; border: 1px solid var(--gold-dim); }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center; }
  .stat-value { font-family: 'Playfair Display', serif; font-size: 20pt; color: var(--gold); }
  .stat-label { font-size: 9pt; color: var(--text-muted); margin-top: 4px; }
  .result-box { text-align: center; background: linear-gradient(135deg, var(--navy), #0d2240); color: var(--text); padding: 36px 30px; border-radius: 14px; margin: 24px 0; border: 2px solid var(--gold); position: relative; }
  .result-box .result-label { font-size: 10pt; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; }
  .result-box .value { font-family: 'Playfair Display', serif; font-size: 34pt; color: var(--gold); margin: 10px 0 6px; }
  .result-box .value-ext { font-size: 10pt; color: var(--text-muted); font-style: italic; margin-bottom: 6px; }
  .result-box .grade-badge { display: inline-block; background: var(--gold); color: var(--navy); padding: 5px 18px; border-radius: 20px; font-weight: 700; font-size: 10.5pt; margin-top: 10px; }
  .calc-flow { display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
  .calc-step { flex: 1; min-width: 130px; background: #f9f8f4; border: 1px solid #e8e4dc; border-radius: 8px; padding: 12px 14px; text-align: center; }
  .calc-step .cs-label { font-size: 8pt; color: #8a7a4a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .calc-step .cs-value { font-size: 12pt; font-weight: 700; color: var(--navy); }
  .calc-step.hl { background: #fef4d8; border-color: var(--gold); }
  .band-row { display: flex; gap: 12px; margin: 12px 0; flex-wrap: wrap; }
  .band-chip { flex: 1; min-width: 150px; border-radius: 8px; padding: 12px 16px; text-align: center; border: 1px solid; }
  .band-chip .bc-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
  .band-chip .bc-value { font-size: 13pt; font-weight: 700; }
  .band-lo { background: #fdecea; border-color: #e5b3ad; color: #a03027; }
  .band-mid { background: #eef6ff; border-color: #b8d4f0; color: #1a4a7a; }
  .band-hi { background: #fdf0d8; border-color: #e5cf95; color: #8a6a1a; }

  .scenarios-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 20px 0; }
  .scenario-card { border-radius: 10px; padding: 18px 16px; text-align: center; border: 1px solid transparent; }
  .scenario-label { font-weight: 700; font-size: 10pt; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .scenario-desc { font-size: 8pt; line-height: 1.4; margin-bottom: 12px; opacity: 0.85; }
  .scenario-value { font-family: 'Playfair Display', serif; font-size: 15pt; font-weight: 700; }
  .scenario-blue { background: #dbeafe; border-color: #3b82f6; color: #1e3a5f; }
  .scenario-blue .scenario-label, .scenario-blue .scenario-value { color: #1d4ed8; }
  .scenario-green { background: #dcfce7; border-color: #22c55e; color: #14532d; }
  .scenario-green .scenario-label, .scenario-green .scenario-value { color: #15803d; }
  .scenario-gold { background: #fef9c3; border-color: #eab308; color: #713f12; }
  .scenario-gold .scenario-label, .scenario-gold .scenario-value { color: #92400e; }

  .liquidez-box { background: #f9f8f4; border-radius: 8px; padding: 16px 20px; margin: 16px 0; border: 1px solid #e8e4dc; }
  .liquidez-header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
  .liquidez-badge { color: #fff; padding: 4px 14px; border-radius: 16px; font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .liquidez-sub { font-size: 9.5pt; color: #4a4a6a; font-weight: 600; }

  .method-justify { background: #f0f4ff; border-left: 4px solid var(--navy); border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 14px 0; font-size: 10pt; color: #1a1a2e; line-height: 1.7; }
  .note-box { background: #f9f8f4; border-left: 4px solid var(--gold); border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 14px 0; font-size: 9.5pt; color: #333; line-height: 1.7; }
  .commercial-box { background: linear-gradient(135deg, #fdf8ef, #fef4d8); border: 2px solid var(--gold); border-radius: 12px; padding: 24px 28px; margin: 20px 0; }
  .commercial-box .commercial-title { font-family: 'Playfair Display', serif; font-size: 12pt; color: var(--navy); margin-bottom: 10px; font-weight: 700; }
  .commercial-box p { font-size: 10.5pt; color: #2a2a3e; line-height: 1.7; }
  .commercial-box .highlight-value { font-family: 'Playfair Display', serif; color: #92400e; font-weight: 700; }

  .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
  .photo-item { border-radius: 8px; overflow: hidden; border: 1px solid #e8e4dc; }
  .photo-item img { width: 100%; height: 160px; object-fit: cover; display: block; }
  .photo-caption { font-size: 8pt; color: #666; padding: 6px 8px; background: #f9f8f4; text-align: center; }

  .cv-block { background: #f9f8f4; border: 1px solid #e8e4dc; border-radius: 8px; padding: 18px 22px; margin: 14px 0; }
  .cv-block .cv-name { font-family: 'Playfair Display', serif; font-size: 14pt; color: var(--navy); font-weight: 700; }
  .cv-block .cv-reg { font-size: 9.5pt; color: #8a7a4a; font-weight: 600; margin: 2px 0 12px; }
  .cv-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .cv-cols h5 { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.08em; color: #8E99AB; margin-bottom: 6px; }
  .cv-cols ul { list-style: none; }
  .cv-cols li { font-size: 9.5pt; padding: 2px 0 2px 14px; position: relative; }
  .cv-cols li::before { content: '·'; color: var(--gold); position: absolute; left: 4px; font-weight: 700; }

  .decl-box { border: 1px solid #e8e4dc; border-radius: 8px; padding: 16px 20px; margin: 12px 0; font-size: 9.5pt; line-height: 1.75; background: #fcfbf8; }
  .decl-box ol { margin: 8px 0 0 18px; }
  .decl-box li { margin-bottom: 4px; }

  .qr-verify-section { display: flex; gap: 24px; align-items: flex-start; background: #f8f6f0; border: 1px solid #e0d8c8; border-left: 4px solid #C8A44A; border-radius: 6px; padding: 20px; margin-top: 12px; }
  .qr-verify-qr svg { width: 120px; height: 120px; flex-shrink: 0; border-radius: 4px; }
  .qr-verify-info { flex: 1; min-width: 0; }
  .qr-verify-title { font-size: 11pt; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
  .qr-verify-desc { font-size: 9pt; color: #555; line-height: 1.6; }

  .footer { text-align: center; padding: 30px; color: var(--text-muted); font-size: 9pt; border-top: 2px solid var(--gold-dim); margin-top: 40px; }
  .signature-area { display: flex; justify-content: center; gap: 80px; margin: 40px 0 20px; text-align: center; }
  .signature-line { border-top: 1px solid #333; padding-top: 8px; width: 240px; font-size: 10pt; line-height: 1.5; }

  @media print {
    body { font-size: 10pt; background: white; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { padding: 40px 60px; background: #050B14 !important; min-height: 100vh; }
    .content { padding: 20px; }
    table { font-size: 7.5pt; page-break-inside: avoid; }
    h3 { page-break-after: avoid; }
    .info-grid, .photo-grid, .scenarios-grid, .commercial-box, .cv-block, .decl-box, .stats-box, .calc-flow { page-break-inside: avoid; }
    .signature-area { page-break-before: always; }
    @page { margin: 1.5cm 2cm; size: A4; }
    @page :first { margin: 0; }
  }
</style>
</head>
<body>

<!-- ════ CAPA ════ -->
<div class="cover">
  <div class="cover-top">
    <div class="cover-brand">IMI</div>
    <div class="cover-proto">
      <strong>${esc(numeroLaudo || protocolo)}</strong>
      Laudo de Avaliação<br>${today}
    </div>
  </div>
  <div class="cover-center">
    <div class="cover-title">LAUDO TÉCNICO<br>DE AVALIAÇÃO</div>
    <div class="cover-divider"></div>
    <div class="cover-subtitle">${esc(tipoImovel)} · Método ${esc(methodLabel)}</div>
    <div class="cover-property">
      <div class="prop-label">Imóvel Avaliando</div>
      <div class="prop-value">${esc(devName)}</div>
      <div class="prop-label">Endereço</div>
      <div class="prop-value" style="font-size:12pt">${esc(devAddress)}</div>
      <div class="prop-grid">
        <div class="prop-stat">
          <div class="prop-stat-value">${fmtBRL0(valorAdotado)}</div>
          <div class="prop-stat-label">Valor de Mercado</div>
        </div>
        <div class="prop-stat">
          <div class="prop-stat-value">${fmt(valorUnitario)}</div>
          <div class="prop-stat-label">R$/m² Homogeneizado</div>
        </div>
        <div class="prop-stat">
          <div class="prop-stat-value">${esc(grau)}</div>
          <div class="prop-stat-label">Grau NBR 14653</div>
        </div>
      </div>
    </div>
  </div>
  <div class="cover-bottom">
    <div class="cover-bottom-left">
      <strong>${esc(evaluatorName)}</strong>
      ${evaluatorCompany ? `<span>${esc(evaluatorCompany)}</span><br>` : ''}
      ${evaluatorCRECI ? `CRECI ${esc(evaluatorCRECI)}` : ''}${AVALIADOR.cnai ? ` · CNAI ${esc(AVALIADOR.cnai)}` : ''}
      ${evaluatorPhone ? ` · ${esc(evaluatorPhone)}` : ''}
    </div>
    ${qrCodeSvg ? `
    <div class="cover-qr">
      <div class="cover-qr-img">${qrCodeSvg}</div>
      <div class="cover-qr-label">Verificar autenticidade</div>
      ${numeroLaudo ? `<div class="cover-qr-num">${esc(numeroLaudo)}</div>` : ''}
    </div>` : ''}
    <div class="cover-norm">
      <span>Conforme NBR 14653-1 e NBR 14653-2</span>
      <span>Resolução COFECI 1.066/2007</span>
    </div>
  </div>
</div>

<!-- ════ CONTEÚDO ════ -->
<div class="content">

  <h3 data-num="${N()}">Introdução, Objetivo e Premissas</h3>
  <p>O presente Laudo Técnico de Avaliação Imobiliária foi elaborado em conformidade com os preceitos da <strong>ABNT NBR 14653 — Avaliação de Bens</strong>, especialmente sua Parte 2 (Imóveis Urbanos), tendo por objetivo determinar o <strong>${esc(purposeLabel.toLowerCase())}</strong> do imóvel objeto desta avaliação, mediante aplicação do <strong>${esc(methodLabel)}</strong>, utilizando informações obtidas em pesquisa mercadológica realizada na região de influência do bem avaliando.</p>
  <h4>Premissas e Ressalvas</h4>
  <p>A presente avaliação considerou as informações documentais apresentadas pelo contratante, a vistoria realizada no imóvel, as condições de mercado observadas na data-base e a presunção de regularidade das informações fornecidas. Ressalta-se que não foram consideradas eventuais pendências judiciais, fiscais, ambientais ou administrativas não informadas; que o valor obtido representa uma estimativa de valor de mercado na data da avaliação; e que alterações futuras nas condições econômicas e mercadológicas podem impactar o valor apurado.</p>

  <h3 data-num="${N()}">Identificação do Imóvel</h3>
  <div class="info-grid">
    ${clienteNome ? `<div class="info-item"><span class="label">Proprietário / Solicitante:</span><span class="value">${esc(clienteNome)}</span></div>` : ''}
    ${clienteCpf ? `<div class="info-item"><span class="label">CPF / CNPJ:</span><span class="value">${esc(clienteCpf)}</span></div>` : ''}
    <div class="info-item"><span class="label">Tipo de Imóvel:</span><span class="value">${esc(tipoImovel)}</span></div>
    <div class="info-item"><span class="label">Endereço:</span><span class="value">${esc(devAddress)}</span></div>
    ${areaPriv > 0 ? `<div class="info-item"><span class="label">Área Privativa:</span><span class="value">${fmt(areaPriv)} m²</span></div>` : ''}
    ${areaTotalImovel > 0 ? `<div class="info-item"><span class="label">Área Total:</span><span class="value">${fmt(areaTotalImovel)} m²</span></div>` : ''}
    ${fracaoIdeal ? `<div class="info-item"><span class="label">Fração Ideal:</span><span class="value">${esc(fracaoIdeal)}</span></div>` : ''}
    ${quartos ? `<div class="info-item"><span class="label">Quartos:</span><span class="value">${esc(quartos)}</span></div>` : ''}
    ${banheiros ? `<div class="info-item"><span class="label">Banheiros:</span><span class="value">${esc(banheiros)}</span></div>` : ''}
    ${vagas ? `<div class="info-item"><span class="label">Vagas de Garagem:</span><span class="value">${esc(vagas)}</span></div>` : ''}
    ${andarImovel ? `<div class="info-item"><span class="label">Andar:</span><span class="value">${esc(andarImovel)}</span></div>` : ''}
    ${anoConstImovel ? `<div class="info-item"><span class="label">Ano de Construção:</span><span class="value">${esc(anoConstImovel)}</span></div>` : ''}
    ${padrao ? `<div class="info-item"><span class="label">Padrão Construtivo:</span><span class="value">${esc(padrao)}</span></div>` : ''}
    <div class="info-item"><span class="label">Estado de Conservação:</span><span class="value">${esc(estadoConserv)}</span></div>
    <div class="info-item"><span class="label">Protocolo:</span><span class="value">${esc(protocolo)}</span></div>
  </div>

  ${hasLegal ? `
  <h3 data-num="${N()}">Situação Legal do Imóvel</h3>
  <div class="info-grid">
    ${matricula ? `<div class="info-item"><span class="label">Matrícula nº:</span><span class="value">${esc(matricula)}</span></div>` : ''}
    <div class="info-item"><span class="label">Cartório:</span><span class="value">${esc(cartorio)}${cidade ? ` — ${esc(cidade)}/${esc(estado)}` : ''}</span></div>
  </div>
  <h4>Documentação Analisada</h4>
  <ul class="clean">${(documentacao.length ? documentacao : docsFallback).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}

  ${hasDescricao ? `
  <h3 data-num="${N()}">Descrição do Imóvel</h3>
  ${comodos.length ? `<h4>Composição</h4><ul class="clean">${comodos.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
  ${carac.length && !comodos.length ? `<h4>Características</h4><ul class="clean">${carac.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
  ${acabamentos.length ? `<h4>Acabamentos</h4><ul class="clean">${acabamentos.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
  ${condominio.length ? `<h4>Infraestrutura de Condomínio</h4><ul class="clean">${condominio.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}` : ''}

  <h3 data-num="${N()}">Vistoria e Contexto Urbano</h3>
  <p>A vistoria foi realizada em <strong>${dataVistoria}</strong>, avaliando-se o estado geral de conservação, a qualidade construtiva, a funcionalidade dos ambientes, os acabamentos e os aspectos de manutenção. O imóvel apresenta padrão construtivo compatível com a região${bairro ? ` de ${esc(bairro)}` : ''} e estado geral de conservação <strong>${esc(estadoConserv.toLowerCase())}</strong>.</p>
  <h4>Infraestrutura Urbana Disponível</h4>
  <ul class="clean">${(infraestrutura.length ? infraestrutura : infraFallback).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
  ${distanciaRef ? `<p class="note-box">Localização de referência: ${esc(distanciaRef)}.</p>` : ''}

  <h3 data-num="${N()}">Metodologia e Análise Mercadológica</h3>
  <div class="method-justify">${methodJustification}</div>
  <div class="info-grid">
    <div class="info-item"><span class="label">Finalidade:</span><span class="value">${esc(purposeLabel)}</span></div>
    <div class="info-item"><span class="label">Metodologia:</span><span class="value">${esc(methodLabel)}</span></div>
    <div class="info-item"><span class="label">Data-base:</span><span class="value">${today}</span></div>
    <div class="info-item"><span class="label">Norma Aplicada:</span><span class="value">NBR 14653-1 e 14653-2</span></div>
    <div class="info-item"><span class="label">Avaliador:</span><span class="value">${esc(evaluatorName)}${evaluatorCRECI ? ` · CRECI ${esc(evaluatorCRECI)}` : ''}</span></div>
    <div class="info-item"><span class="label">Resolução:</span><span class="value">COFECI 1.066/2007</span></div>
  </div>

  <h3 data-num="${N()}">Quadro Amostral e Homogeneização</h3>
  <p>Foram coletados <strong>${nComp}</strong> elementos comparativos${bairro ? ` predominantemente no bairro de ${esc(bairro)}` : ''}, conforme tabela abaixo. Procedeu-se ao tratamento por saneamento estatístico, com faixa de tolerância de <strong>±${quadro ? fmt(quadro.toleranciaPct) : '20,00'}%</strong> em torno da média, eliminando-se os elementos discrepantes conforme a NBR 14653-2.</p>
  ${quadro ? `
  <table>
    <thead><tr>
      <th>Nº</th><th style="text-align:left">Bairro</th><th>Valor R$</th><th>Área m²</th>
      <th>R$/m²</th><th>Quartos</th><th>Garagem</th><th>Andar</th><th>Desvio</th><th>Situação</th>
    </tr></thead>
    <tbody>${quadroRows}</tbody>
  </table>
  <p style="font-size:8.5pt;color:#666">Desvio calculado em relação à média inicial da amostra. Elementos fora da faixa de tolerância ±${fmt(quadro.toleranciaPct)}% foram eliminados no saneamento.</p>

  <h4>Tratamento dos Dados — Saneamento com Faixa de ±${fmt(quadro.toleranciaPct)}%</h4>
  <div class="band-row">
    <div class="band-chip band-lo"><div class="bc-label">Limite Inferior (−${fmt(quadro.toleranciaPct)}%)</div><div class="bc-value">${fmt(quadro.limiteInferiorFaixa)}</div></div>
    <div class="band-chip band-mid"><div class="bc-label">Média Inicial R$/m²</div><div class="bc-value">${fmt(quadro.mediaInicial)}</div></div>
    <div class="band-chip band-hi"><div class="bc-label">Limite Superior (+${fmt(quadro.toleranciaPct)}%)</div><div class="bc-value">${fmt(quadro.limiteSuperiorFaixa)}</div></div>
  </div>
  <p style="font-size:9.5pt;color:#444">Foram eliminadas <strong>${quadro.nEliminados}</strong> amostra(s) fora da faixa de tolerância. A amostra homogeneizada final conta com <strong>${quadro.nSaneada}</strong> elementos.</p>
  ` : `
  <table>
    <thead><tr><th>#</th><th style="text-align:left">Endereço / Bairro</th><th>m²</th><th>Valor</th><th>R$/m²</th><th>R$/m² Hom.</th></tr></thead>
    <tbody>${comparableRows}</tbody>
  </table>`}

  <h3 data-num="${N()}">Tratamento Estatístico</h3>
  <div class="stats-box">
    <div class="stats-grid">
      <div><div class="stat-value">${fmt(valorUnitario)}</div><div class="stat-label">Valor Unitário Homog. R$/m²</div></div>
      <div><div class="stat-value">${quadro ? fmt(quadro.mediaInicial) : fmt(result.median_price_per_sqm)}</div><div class="stat-label">${quadro ? 'Média Inicial R$/m²' : 'Mediana R$/m²'}</div></div>
      <div><div class="stat-value">${quadro ? fmt(quadro.coeficienteVariacaoSaneado) : fmt(result.coefficient_of_variation)}%</div><div class="stat-label">Coef. Variação (pós)</div></div>
    </div>
    <div class="stats-grid" style="margin-top:16px">
      <div><div class="stat-value">${quadro ? fmt(quadro.desvioPadraoSaneado) : fmt(result.std_deviation)}</div><div class="stat-label">Desvio Padrão</div></div>
      <div><div class="stat-value">${quadro ? quadro.nSaneada : comparables.length}</div><div class="stat-label">Elementos Saneados</div></div>
      <div><div class="stat-value">${esc(grau)}</div><div class="stat-label">Grau Fundamentação</div></div>
    </div>
  </div>

  <h3 data-num="${N()}">Cálculo do Valor e Arredondamento Técnico</h3>
  <div class="calc-flow">
    <div class="calc-step"><div class="cs-label">Valor Unitário</div><div class="cs-value">${fmt(valorUnitario)}/m²</div></div>
    <div class="calc-step"><div class="cs-label">Área Considerada</div><div class="cs-value">${subjectArea} m²</div></div>
    <div class="calc-step"><div class="cs-label">Valor Calculado</div><div class="cs-value">${fmtBRL0(quadro?.valorBruto ?? valorAdotado)}</div></div>
    <div class="calc-step hl"><div class="cs-label">Valor Adotado${quadro ? ` (arred. ${fmt(Math.abs(quadro.arredondamentoPct))}%)` : ''}</div><div class="cs-value">${fmtBRL0(valorAdotado)}</div></div>
  </div>

  <div class="result-box">
    <div class="result-label">Valor de Mercado Adotado</div>
    <div class="value">${fmtBRL0(valorAdotado)}</div>
    <div class="value-ext">(${esc(valorExtenso)})</div>
    <div class="grade-badge">Grau ${esc(grau)} — NBR 14653</div>
  </div>

  <h4>Faixa de Valor de Mercado (±${quadro ? fmt(quadro.faixaPct) : '10,00'}%)</h4>
  <table style="max-width:520px;margin:0 auto 12px">
    <thead><tr><th>Limite Inferior</th><th style="background:#1a3a5c;color:#C8A44A">Valor Adotado</th><th>Limite Superior</th></tr></thead>
    <tbody><tr>
      <td>${fmtBRL0(limInferior)}</td>
      <td><strong>${fmtBRL0(valorAdotado)}</strong></td>
      <td>${fmtBRL0(limSuperior)}</td>
    </tr></tbody>
  </table>

  <h3 data-num="${N()}">Cenários de Valor</h3>
  <p>Projeção de valor em três cenários de mercado, a partir do valor adotado, para apoio à tomada de decisão.</p>
  ${scenariosSection}

  ${liquidez ? `<h3 data-num="${N()}">Análise de Liquidez</h3>
  <p>Avaliação do potencial de absorção do imóvel pelo mercado e estimativa do valor de liquidação forçada, conforme referências da NBR 14653-1, seção 8.8.</p>
  ${liquidezSection}` : ''}

  ${depreciacao ? `<h3 data-num="${N()}">Depreciação Física — Ross-Heidecke</h3>
  <p>Cálculo da depreciação física das benfeitorias pelo método Ross-Heidecke, conforme NBR 14653-2, considerando idade real, vida útil e estado de conservação.</p>
  ${rossHeideckeSection}` : ''}

  <h3 data-num="${N()}">Conclusão</h3>
  <p>Com base na metodologia aplicada, na pesquisa mercadológica saneada e nos critérios da ABNT NBR 14653, conclui-se que o <strong>valor de mercado do imóvel avaliando</strong>, na data-base desta avaliação, é de <strong>${fmtBRL0(valorAdotado)}</strong> (${esc(valorExtenso)}), situando-se na faixa entre ${fmtBRL0(limInferior)} e ${fmtBRL0(limSuperior)}. Este valor representa o preço mais provável pelo qual o imóvel seria negociado, em condições normais de mercado, entre partes independentes e bem informadas.</p>

  <h3 data-num="${N()}">Ressalvas e Limitações</h3>
  <p>Este parecer foi elaborado com base em dados disponíveis no mercado na data de referência. Os valores representam a melhor estimativa de valor de mercado nas condições observadas, não tendo sido consideradas eventuais pendências jurídicas, fiscais ou ambientais. O presente documento não substitui laudo de vistoria técnica estrutural.</p>

  <h3 data-num="${N()}">Declaração de Independência Técnica</h3>
  <div class="decl-box">
    O responsável técnico declara que:
    <ol>
      <li>Não possui interesse direto ou indireto no resultado desta avaliação;</li>
      <li>Não mantém vínculo que comprometa sua independência profissional;</li>
      <li>Os dados utilizados foram obtidos através de fontes consideradas idôneas na data-base do trabalho;</li>
      <li>O presente laudo foi elaborado em conformidade com a ABNT NBR 14653 e demais normas aplicáveis;</li>
      <li>As conclusões apresentadas refletem exclusivamente o entendimento técnico do avaliador.</li>
    </ol>
  </div>

  <h3 data-num="${N()}">Termo de Responsabilidade Técnica</h3>
  <div class="decl-box">
    Declaro, para os devidos fins, que o presente Laudo Técnico de Avaliação Imobiliária foi elaborado mediante vistoria, análise documental, pesquisa mercadológica e aplicação de metodologia compatível com as normas técnicas vigentes. As informações constantes neste documento representam minha convicção técnica profissional, observados os limites metodológicos inerentes ao processo avaliatório, em conformidade com o Código de Ética dos Corretores de Imóveis e com a Resolução COFECI 1.066/2007.
  </div>

  ${photos.length > 0 ? `<h3 data-num="${N()}">Registro Fotográfico</h3>
  <p>Imagens do imóvel avaliando registradas na data da vistoria.</p>
  <div class="photo-grid">
    ${photos.map((p, i) => {
      const u = escUrl(p.url)
      const cap = esc(p.caption || p.name || 'Foto ' + (i + 1))
      return u ? `<div class="photo-item"><img src="${u}" alt="${cap}" /><div class="photo-caption">${cap}</div></div>` : ''
    }).join('')}
  </div>` : ''}

  <h3 data-num="${N()}">Currículo do Avaliador</h3>
  <div class="cv-block">
    <div class="cv-name">${esc(evaluatorName)}</div>
    <div class="cv-reg">CRECI ${esc(evaluatorCRECI || AVALIADOR.creci)} · CNAI ${esc(AVALIADOR.cnai)}${AVALIADOR.titulos?.length ? ' · ' + esc(AVALIADOR.titulos[0]) : ''}</div>
    <div class="cv-cols">
      <div>
        <h5>Formação</h5>
        <ul>${AVALIADOR.formacao.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>
      <div>
        <h5>Atuação</h5>
        <ul>${AVALIADOR.atuacao.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      </div>
    </div>
  </div>
  <div class="note-box">
    <strong>Sobre a IMI — Inteligência Imobiliária.</strong> Empresa especializada em avaliações imobiliárias, perícias judiciais e extrajudiciais, consultoria patrimonial, estudos mercadológicos e inteligência imobiliária, atuando com foco em precisão técnica, conformidade normativa e suporte à tomada de decisão patrimonial.
  </div>

  ${qrCodeSvg && numeroLaudo ? `
  <h3 data-num="${N()}">Código de Verificação Digital</h3>
  <div class="qr-verify-section">
    <div class="qr-verify-qr">${qrCodeSvg}</div>
    <div class="qr-verify-info">
      <div class="qr-verify-title">Autenticidade Verificável</div>
      <p class="qr-verify-desc">Este laudo possui código de verificação digital. Escaneie o QR Code ou acesse a URL abaixo para confirmar a autenticidade e os dados deste documento em tempo real.</p>
      <table style="max-width:100%;margin-top:12px">
        <tbody>
          <tr><td style="width:30%;color:#8E99AB;font-size:9pt;padding:5px 8px;text-align:left">Número do Laudo</td><td style="font-family:monospace;font-size:10pt;font-weight:700;color:#8a6a1a;padding:5px 8px;text-align:left">${esc(numeroLaudo)}</td></tr>
          <tr><td style="color:#8E99AB;font-size:9pt;padding:5px 8px;text-align:left">Hash SHA-256</td><td style="font-family:monospace;font-size:9pt;color:#666;word-break:break-all;padding:5px 8px;text-align:left">${esc(qrHash || '—')}</td></tr>
          <tr><td style="color:#8E99AB;font-size:9pt;padding:5px 8px;text-align:left">URL de Verificação</td><td style="font-size:9pt;padding:5px 8px;text-align:left"><a href="${escUrl(AVALIADOR.site.startsWith('http') ? AVALIADOR.site : 'https://' + AVALIADOR.site)}/verificar?hash=${esc(qrHash || '')}" style="color:#8a6a1a">${esc(AVALIADOR.site)}/verificar</a></td></tr>
          <tr><td style="color:#8E99AB;font-size:9pt;padding:5px 8px;text-align:left">Emitido em</td><td style="font-size:9pt;padding:5px 8px;text-align:left">${today}</td></tr>
        </tbody>
      </table>
    </div>
  </div>` : ''}

  <h3 data-num="${N()}">Encerramento e Assinaturas</h3>
  <p>Este documento foi elaborado em conformidade com as Normas Brasileiras de Avaliação de Bens — ABNT NBR 14653. A reprodução total ou parcial deste laudo sem autorização expressa do autor é proibida.</p>
  <div class="signature-area">
    <div><div class="signature-line">
      ${esc(evaluatorName)}<br>
      ${evaluatorCRECI ? `<small>CRECI ${esc(evaluatorCRECI)} · CNAI ${esc(AVALIADOR.cnai)}</small><br>` : ''}
      ${evaluatorCompany ? `<small>${esc(evaluatorCompany)}</small><br>` : ''}
      ${evaluatorEmail ? `<small>${esc(evaluatorEmail)}</small>` : ''}
    </div></div>
    <div><div class="signature-line">${today}<br><small>Data de Emissão</small></div></div>
  </div>

</div>

<div class="footer">
  <strong>IMI &mdash; Inteligência Imobiliária</strong><br>
  Laudo ${esc(numeroLaudo || protocolo)} · Documento gerado pelo sistema IMI<br>
  Conforme NBR 14653-1 e NBR 14653-2 da ABNT &mdash; Resolução COFECI 1.066/2007
</div>

</body>
</html>`
}

// ── Número por extenso (reais) ──────────────────────────────────────────────

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

function trecho(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cem'
  let s = ''
  const c = Math.floor(n / 100)
  const resto = n % 100
  if (c > 0) s += CENTENAS[c]
  if (resto > 0) {
    if (s) s += ' e '
    if (resto < 20) s += UNIDADES[resto]
    else {
      const d = Math.floor(resto / 10)
      const u = resto % 10
      s += DEZENAS[d]
      if (u > 0) s += ' e ' + UNIDADES[u]
    }
  }
  return s
}

/** Converte um valor inteiro em reais para extenso (suporta até bilhões). */
export function numeroPorExtenso(valor: number): string {
  const n = Math.floor(Math.abs(valor))
  if (n === 0) return 'zero reais'

  const grupos: number[] = []
  let tmp = n
  while (tmp > 0) {
    grupos.push(tmp % 1000)
    tmp = Math.floor(tmp / 1000)
  }

  const escalas: [string, string][] = [
    ['', ''],
    ['mil', 'mil'],
    ['milhão', 'milhões'],
    ['bilhão', 'bilhões'],
  ]

  const partes: string[] = []
  for (let i = grupos.length - 1; i >= 0; i--) {
    const g = grupos[i]
    if (g === 0) continue
    let txt = trecho(g)
    if (i === 1) {
      // milhar: "um mil" → "mil"
      txt = g === 1 ? 'mil' : `${txt} mil`
    } else if (i >= 2) {
      txt = `${txt} ${g === 1 ? escalas[i][0] : escalas[i][1]}`
    }
    partes.push(txt)
  }

  // junção com "e" conforme norma
  let resultado = ''
  for (let i = 0; i < partes.length; i++) {
    if (i === 0) resultado = partes[i]
    else resultado += (i === partes.length - 1 ? ' e ' : ', ') + partes[i]
  }

  const sufixo = n === 1 ? ' real' : ' reais'
  return resultado + sufixo
}
