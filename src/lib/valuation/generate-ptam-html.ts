import { ValuationResult } from './homogenization'

interface PhotoItem {
  url: string
  name?: string
  caption?: string
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
    depreciacao,
    qrCodeSvg,
    numeroLaudo,
    qrHash,
  } = params

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtBRL = (v: number) =>
    'R$ ' + fmt(v)

  const purposeLabel = (valuation.purpose as string) || 'Venda'
  const methodLabel = (valuation.method as string) === 'comparative_direct'
    ? 'Comparativo Direto de Dados de Mercado'
    : (valuation.method as string) || 'Comparativo Direto de Dados de Mercado'

  const devName = (development?.name as string) || (valuation.subject_address as string) || 'N/A'
  const devAddress = (development?.address as string) || (development?.location as string) || (valuation.subject_address as string) || 'N/A'

  const subjectArea = valuation.subject_area_sqm
    ? fmt(Number(valuation.subject_area_sqm))
    : Number(valuation.value_per_sqm) > 0
      ? fmt(result.estimated_value / Number(valuation.value_per_sqm))
      : 'N/A'

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  const protocolo = (valuation.protocolo as string) || (valuation.id as string)?.slice(0, 8).toUpperCase() || 'IMI-0001'

  const anoConstrucao = depreciacao
    ? (new Date().getFullYear() - depreciacao.idade_real)
    : null

  const comparableRows = comparables.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="text-align:left">${c.address || 'N/A'}${c.neighborhood ? ', ' + c.neighborhood : ''}</td>
      <td>${fmt(Number(c.area_sqm) || 0)}</td>
      <td>${fmtBRL(Number(c.asking_price) || 0)}</td>
      <td>${fmt(Number(c.price_per_sqm) || (Number(c.asking_price) / Number(c.area_sqm) || 0))}</td>
      <td>${fmt(Number(c.offer_factor) || 1)}</td>
      <td>${fmt(Number(c.area_factor) || 1)}</td>
      <td>${fmt(Number(c.location_factor) || 1)}</td>
      <td>${fmt(Number(c.age_factor) || 1)}</td>
      <td>${fmt(Number(c.floor_factor) || 1)}</td>
      <td>${fmt(Number(c.parking_factor) || 1)}</td>
      <td>${fmt(Number(c.extra_factor) || 1)}</td>
      <td><strong>${fmt(Number(c.homogenized_price_per_sqm) || 0)}</strong></td>
    </tr>
  `).join('')

  const photoGallerySection = photos.length > 0 ? `
  <h3>Registro Fotográfico</h3>
  <p>Imagens do imóvel avaliando registradas na data da vistoria.</p>
  <div class="photo-grid">
    ${photos.map((p, i) => `
      <div class="photo-item">
        <img src="${p.url}" alt="${p.caption || p.name || 'Foto ' + (i + 1)}" />
        <div class="photo-caption">${p.caption || p.name || 'Foto ' + (i + 1)}</div>
      </div>
    `).join('')}
  </div>
  ` : ''

  // ── Methodology justification per method ──────────────────────────────────
  const methodJustification = (() => {
    const m = (valuation.method as string) || 'comparative_direct'
    if (m === 'comparative_direct') {
      return `O <strong>Método Comparativo Direto de Dados de Mercado</strong> é o método padrão preconizado pela <em>NBR 14653-2</em> para imóveis residenciais e comerciais urbanos com mercado ativo. Sua aplicação baseia-se na análise de uma amostra de imóveis com características similares ao avaliando, coletados na região de influência, aos quais se aplicam fatores de homogeneização que eliminam as diferenças atributivas (área, localização, estado de conservação, padrão construtivo, etc.). A adequação do método é confirmada pela disponibilidade de ${comparables.length} elemento${comparables.length !== 1 ? 's' : ''} comparativo${comparables.length !== 1 ? 's' : ''}, suficiente${comparables.length !== 1 ? 's' : ''} para conferir representatividade estatística à amostra (<em>NBR 14653-1, seção 8.2</em>).`
    }
    if (m === 'income' || m === 'renda') {
      return `O <strong>Método da Capitalização da Renda</strong> é indicado pela <em>NBR 14653-1 e NBR 14653-4</em> para imóveis geradores de renda (lajes corporativas, galpões logísticos, imóveis para locação). O valor do imóvel é obtido pela capitalização da renda líquida esperada a uma taxa de desconto compatível com o risco do ativo imobiliário. O método é aplicável quando existe histórico de locação ou dados de mercado suficientes para estimar a renda potencial com consistência.`
    }
    if (m === 'cost' || m === 'custo') {
      return `O <strong>Método Evolutivo (Custo de Reprodução)</strong>, normatizado pela <em>NBR 14653-2 e NBR 14653-7</em>, é empregado quando não há mercado comparativo ativo ou quando o imóvel possui características singulares. O valor é obtido pela soma do valor do terreno (determinado por comparação) ao custo de reprodução das benfeitorias, deduzida a depreciação física e funcional. Referências de custo unitário básico seguem a tabela CUB-SINDUSCON vigente.`
    }
    return `A metodologia aplicada segue os preceitos da <em>NBR 14653-1</em> (Parte Geral) e da respectiva parte específica, garantindo a conformidade técnica do parecer com as normas da ABNT e com a <em>Resolução COFECI 1.066/2007</em>.`
  })()

  // ── Three scenarios ───────────────────────────────────────────────────────
  const conservador = result.estimated_value * 0.85
  const realista    = result.estimated_value
  const agressivo   = result.estimated_value * 1.12

  const scenariosSection = `
  <div class="scenarios-grid">
    <div class="scenario-card scenario-blue">
      <div class="scenario-label">Cenário Conservador</div>
      <div class="scenario-desc">−15% sobre o valor estimado · Condições de mercado desfavoráveis ou desvalorização localizada</div>
      <div class="scenario-value">${fmtBRL(conservador)}</div>
    </div>
    <div class="scenario-card scenario-green">
      <div class="scenario-label">Cenário Realista</div>
      <div class="scenario-desc">Valor estimado de mercado · Condições normais de oferta e demanda</div>
      <div class="scenario-value">${fmtBRL(realista)}</div>
    </div>
    <div class="scenario-card scenario-gold">
      <div class="scenario-label">Cenário Agressivo</div>
      <div class="scenario-desc">+12% sobre o valor estimado · Aquecimento de mercado ou atributos de valorização</div>
      <div class="scenario-value">${fmtBRL(agressivo)}</div>
    </div>
  </div>`

  // ── Liquidez section ──────────────────────────────────────────────────────
  const liquidezSection = liquidez ? (() => {
    const discountMap: Record<'alta' | 'media' | 'baixa', number> = { alta: 0.10, media: 0.20, baixa: 0.30 }
    const labelMap: Record<'alta' | 'media' | 'baixa', string>   = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
    const colorMap: Record<'alta' | 'media' | 'baixa', string>   = { alta: '#1a6b3c', media: '#7a5a00', baixa: '#8b1a1a' }
    const descMap: Record<'alta' | 'media' | 'baixa', string>    = {
      alta:  'Imóvel com boa liquidez de mercado — absorção esperada em prazo curto (até 90 dias)',
      media: 'Imóvel com liquidez moderada — absorção estimada entre 90 e 180 dias',
      baixa: 'Imóvel com liquidez reduzida — absorção estimada acima de 180 dias',
    }
    const desc    = discountMap[liquidez]
    const descPct = (desc * 100).toFixed(0)
    const valorLiqForc = result.estimated_value * (1 - desc)
    return `
    <div class="liquidez-box" style="border-left: 4px solid ${colorMap[liquidez]}">
      <div class="liquidez-header">
        <span class="liquidez-badge" style="background:${colorMap[liquidez]}">Liquidez ${labelMap[liquidez]}</span>
        <span class="liquidez-sub">Fator de Desconto: ${descPct}%</span>
      </div>
      <p style="margin:10px 0 12px">${descMap[liquidez]}</p>
      <table style="max-width:480px">
        <thead>
          <tr>
            <th>Valor de Mercado</th>
            <th>Desconto (${descPct}%)</th>
            <th>Valor de Liquidação Forçada</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${fmtBRL(result.estimated_value)}</td>
            <td style="color:#c0392b">−${fmtBRL(result.estimated_value * desc)}</td>
            <td><strong>${fmtBRL(valorLiqForc)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>`
  })() : ''

  // ── Ross-Heidecke section ─────────────────────────────────────────────────
  const rossHeideckeSection = depreciacao ? `
    <table style="max-width:100%">
      <thead>
        <tr>
          <th>Ano Construção</th>
          <th>Idade Real (anos)</th>
          <th>Vida Útil (anos)</th>
          <th>% Consumida</th>
          <th>Estado Conservação</th>
          <th>Coef. Ross</th>
          <th>Coef. Heidecke</th>
          <th>Depreciação Total (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${anoConstrucao ?? 'N/A'}</td>
          <td>${depreciacao.idade_real}</td>
          <td>${depreciacao.vida_util}</td>
          <td>${fmt(depreciacao.idade_percentual)}%</td>
          <td>${depreciacao.estado_conservacao}</td>
          <td>${fmt(depreciacao.coeficiente_ross)}</td>
          <td>${fmt(depreciacao.coeficiente_heidecke)}</td>
          <td><strong>${fmt(depreciacao.depreciacao_total)}%</strong></td>
        </tr>
      </tbody>
    </table>
    <div class="info-grid" style="margin-top:12px">
      <div class="info-item"><span class="label">Valor Antes da Depreciação:</span><span class="value">${fmtBRL(depreciacao.valor_depreciado + depreciacao.valor_residual)}</span></div>
      <div class="info-item"><span class="label">Depreciação Apurada:</span><span class="value" style="color:#c0392b">−${fmtBRL(depreciacao.valor_depreciado)}</span></div>
      <div class="info-item"><span class="label">Valor Residual (pós-dep.):</span><span class="value"><strong>${fmtBRL(depreciacao.valor_residual)}</strong></span></div>
      <div class="info-item"><span class="label">Método:</span><span class="value">Ross-Heidecke · NBR 14653-2, Anexo A</span></div>
    </div>` : ''

  // ── Dynamic section numbering ─────────────────────────────────────────────
  let sectionNum = 5 // sections 1-4 fixed: Identificação, Metodologia, Pesquisa, Tratamento, Resultado
  const nextSec = () => ++sectionNum

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PTAM — ${protocolo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #050B14;
    --navy-mid: #0A1624;
    --gold: #C8A44A;
    --gold-dim: rgba(200,164,74,0.3);
    --text: #E8E4DC;
    --text-muted: #8E99AB;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    color: #1a1a2e;
    background: #fff;
    font-size: 11pt;
    line-height: 1.6;
  }

  /* ── COVER PAGE ── */
  .cover {
    background: linear-gradient(160deg, var(--navy) 0%, #0d2240 60%, #162d50 100%);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 60px 80px;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }
  .cover::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 400px; height: 400px;
    background: radial-gradient(circle at center, rgba(200,164,74,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .cover-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .cover-brand {
    font-family: 'Playfair Display', serif;
    font-size: 36pt;
    color: var(--gold);
    letter-spacing: 6px;
    font-weight: 700;
  }
  .cover-proto {
    font-size: 10pt;
    color: var(--text-muted);
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--gold-dim);
    padding: 8px 16px;
    border-radius: 6px;
    text-align: right;
  }
  .cover-proto strong { display: block; color: var(--gold); font-size: 12pt; margin-bottom: 2px; }
  .cover-center { text-align: center; margin: auto 0; padding: 40px 0; }
  .cover-divider {
    width: 80px; height: 3px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    margin: 24px auto;
  }
  .cover-title {
    font-family: 'Playfair Display', serif;
    font-size: 42pt;
    color: var(--gold);
    letter-spacing: 4px;
    line-height: 1.1;
    margin-bottom: 8px;
  }
  .cover-subtitle {
    font-size: 13pt;
    color: var(--text-muted);
    letter-spacing: 2px;
    text-transform: uppercase;
    line-height: 1.4;
  }
  .cover-property {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--gold-dim);
    border-radius: 12px;
    padding: 24px 32px;
    margin-top: 40px;
    text-align: left;
  }
  .cover-property .prop-label { font-size: 9pt; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .cover-property .prop-value { font-size: 14pt; color: var(--text); font-weight: 500; margin-bottom: 16px; }
  .cover-property .prop-value:last-child { margin-bottom: 0; }
  .cover-property .prop-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gold-dim); }
  .cover-property .prop-stat { text-align: center; }
  .cover-property .prop-stat-value { font-family: 'Playfair Display', serif; font-size: 18pt; color: var(--gold); }
  .cover-property .prop-stat-label { font-size: 8pt; color: var(--text-muted); margin-top: 2px; }
  .cover-bottom {
    display: flex; justify-content: space-between; align-items: flex-end;
    border-top: 1px solid var(--gold-dim); padding-top: 24px;
  }
  .cover-bottom-left { font-size: 9pt; color: var(--text-muted); }
  .cover-bottom-left strong { display: block; color: var(--text); font-size: 10pt; margin-bottom: 2px; }
  .cover-norm { font-size: 8pt; color: var(--text-muted); text-align: right; }
  .cover-norm span { display: block; }

  /* ── CONTENT ── */
  .content { max-width: 900px; margin: 0 auto; padding: 40px 30px; }
  h3 {
    font-family: 'Playfair Display', serif;
    font-size: 15pt;
    color: var(--navy);
    border-bottom: 2px solid var(--gold);
    padding-bottom: 8px;
    margin: 32px 0 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  h3::before {
    content: attr(data-num);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--navy);
    color: var(--gold);
    border-radius: 50%;
    font-size: 11pt;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    flex-shrink: 0;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    margin-bottom: 20px;
    background: #f9f8f4;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e8e4dc;
  }
  .info-item { display: flex; gap: 6px; align-items: baseline; }
  .info-item .label {
    font-weight: 600;
    color: #4a4a6a;
    min-width: 130px;
    font-size: 9.5pt;
  }
  .info-item .value { font-size: 10pt; color: #1a1a2e; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 8.5pt;
  }
  th {
    background: var(--navy);
    color: var(--gold);
    padding: 8px 6px;
    text-align: center;
    font-weight: 600;
    font-size: 8pt;
  }
  td {
    padding: 6px;
    border-bottom: 1px solid #ddd;
    text-align: center;
  }
  tr:nth-child(even) td { background: #f8f7f3; }
  .stats-box {
    background: linear-gradient(135deg, var(--navy), var(--navy-mid));
    color: var(--text);
    padding: 24px;
    border-radius: 12px;
    margin: 20px 0;
    border: 1px solid var(--gold-dim);
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    text-align: center;
  }
  .stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 20pt;
    color: var(--gold);
  }
  .stat-label { font-size: 9pt; color: var(--text-muted); margin-top: 4px; }
  .result-box {
    text-align: center;
    background: linear-gradient(135deg, var(--navy), #0d2240);
    color: var(--text);
    padding: 36px 30px;
    border-radius: 14px;
    margin: 24px 0;
    border: 2px solid var(--gold);
    position: relative;
  }
  .result-box .result-label { font-size: 10pt; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; }
  .result-box .value {
    font-family: 'Playfair Display', serif;
    font-size: 34pt;
    color: var(--gold);
    margin: 10px 0 6px;
  }
  .result-box .grade-badge {
    display: inline-block;
    background: var(--gold);
    color: var(--navy);
    padding: 5px 18px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 10.5pt;
    margin-top: 10px;
  }

  /* ── THREE SCENARIOS ── */
  .scenarios-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin: 20px 0;
  }
  .scenario-card {
    border-radius: 10px;
    padding: 18px 16px;
    text-align: center;
    border: 1px solid transparent;
  }
  .scenario-label {
    font-weight: 700;
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .scenario-desc {
    font-size: 8pt;
    line-height: 1.4;
    margin-bottom: 12px;
    opacity: 0.85;
  }
  .scenario-value {
    font-family: 'Playfair Display', serif;
    font-size: 16pt;
    font-weight: 700;
  }
  .scenario-blue {
    background: #dbeafe;
    border-color: #3b82f6;
    color: #1e3a5f;
  }
  .scenario-blue .scenario-label { color: #1d4ed8; }
  .scenario-blue .scenario-value { color: #1d4ed8; }
  .scenario-green {
    background: #dcfce7;
    border-color: #22c55e;
    color: #14532d;
  }
  .scenario-green .scenario-label { color: #15803d; }
  .scenario-green .scenario-value { color: #15803d; }
  .scenario-gold {
    background: #fef9c3;
    border-color: #eab308;
    color: #713f12;
  }
  .scenario-gold .scenario-label { color: #92400e; }
  .scenario-gold .scenario-value { color: #92400e; }

  /* ── LIQUIDEZ ── */
  .liquidez-box {
    background: #f9f8f4;
    border-radius: 8px;
    padding: 16px 20px;
    margin: 16px 0;
    border: 1px solid #e8e4dc;
  }
  .liquidez-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }
  .liquidez-badge {
    color: #fff;
    padding: 4px 14px;
    border-radius: 16px;
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .liquidez-sub {
    font-size: 9.5pt;
    color: #4a4a6a;
    font-weight: 600;
  }

  /* ── METHODOLOGY JUSTIFICATION ── */
  .method-justify {
    background: #f0f4ff;
    border-left: 4px solid var(--navy);
    border-radius: 0 8px 8px 0;
    padding: 14px 18px;
    margin: 14px 0;
    font-size: 10pt;
    color: #1a1a2e;
    line-height: 1.7;
  }

  /* ── COMMERCIAL EXPLANATION ── */
  .commercial-box {
    background: linear-gradient(135deg, #fdf8ef, #fef4d8);
    border: 2px solid var(--gold);
    border-radius: 12px;
    padding: 24px 28px;
    margin: 20px 0;
  }
  .commercial-box .commercial-title {
    font-family: 'Playfair Display', serif;
    font-size: 12pt;
    color: var(--navy);
    margin-bottom: 10px;
    font-weight: 700;
  }
  .commercial-box p {
    font-size: 10.5pt;
    color: #2a2a3e;
    line-height: 1.7;
  }
  .commercial-box .highlight-value {
    font-family: 'Playfair Display', serif;
    color: #92400e;
    font-weight: 700;
  }

  /* ── PHOTO GALLERY ── */
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 20px 0;
  }
  .photo-item {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e8e4dc;
  }
  .photo-item img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    display: block;
  }
  .photo-caption {
    font-size: 8pt;
    color: #666;
    padding: 6px 8px;
    background: #f9f8f4;
    text-align: center;
  }

  /* ── FOOTER ── */
  .footer {
    text-align: center;
    padding: 30px;
    color: var(--text-muted);
    font-size: 9pt;
    border-top: 2px solid var(--gold-dim);
    margin-top: 40px;
  }
  .signature-area {
    display: flex;
    justify-content: center;
    gap: 80px;
    margin: 40px 0 20px;
    text-align: center;
  }
  .signature-line {
    border-top: 1px solid #333;
    padding-top: 8px;
    width: 200px;
    font-size: 10pt;
    line-height: 1.5;
  }

  /* ── COVER QR ── */
  .cover-qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .cover-qr-img svg { width: 90px; height: 90px; border-radius: 4px; background: #fff; padding: 4px; }
  .cover-qr-label { font-size: 7pt; color: var(--text-muted); text-align: center; text-transform: uppercase; letter-spacing: 0.08em; }
  .cover-qr-num { font-size: 7pt; color: var(--gold); font-family: monospace; text-align: center; letter-spacing: 1px; }

  /* ── QR VERIFY SECTION ── */
  .qr-verify-section {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    background: #f8f6f0;
    border: 1px solid #e0d8c8;
    border-left: 4px solid #C8A44A;
    border-radius: 6px;
    padding: 20px;
    margin-top: 12px;
  }
  .qr-verify-qr svg { width: 120px; height: 120px; flex-shrink: 0; border-radius: 4px; }
  .qr-verify-info { flex: 1; min-width: 0; }
  .qr-verify-title { font-size: 11pt; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
  .qr-verify-desc { font-size: 9pt; color: #555; line-height: 1.6; }

  @media print {
    body { font-size: 10pt; background: white; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { padding: 40px 60px; background: #050B14 !important; min-height: 100vh; }
    .content { padding: 20px; }
    table { font-size: 7.5pt; page-break-inside: avoid; }
    h3 { page-break-after: avoid; }
    .info-grid { page-break-inside: avoid; }
    .signature-area { page-break-before: always; }
    .photo-grid { page-break-inside: avoid; }
    .scenarios-grid { page-break-inside: avoid; }
    .commercial-box { page-break-inside: avoid; }
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
      <strong>${protocolo}</strong>
      Protocolo de Avaliação<br>
      ${today}
    </div>
  </div>

  <div class="cover-center">
    <div class="cover-title">PTAM</div>
    <div class="cover-divider"></div>
    <div class="cover-subtitle">Parecer Técnico de<br>Avaliação Mercadológica</div>

    <div class="cover-property">
      <div class="prop-label">Imóvel Avaliado</div>
      <div class="prop-value">${devName}</div>
      <div class="prop-label">Endereço</div>
      <div class="prop-value" style="font-size:12pt">${devAddress}</div>
      <div class="prop-grid">
        <div class="prop-stat">
          <div class="prop-stat-value">${fmtBRL(result.estimated_value)}</div>
          <div class="prop-stat-label">Valor de Mercado</div>
        </div>
        <div class="prop-stat">
          <div class="prop-stat-value">${fmt(result.average_price_per_sqm)}</div>
          <div class="prop-stat-label">R$/m² Médio</div>
        </div>
        <div class="prop-stat">
          <div class="prop-stat-value">${result.confidence_grade}</div>
          <div class="prop-stat-label">Grau NBR 14653</div>
        </div>
      </div>
    </div>
  </div>

  <div class="cover-bottom">
    <div class="cover-bottom-left">
      <strong>${evaluatorName}</strong>
      ${evaluatorCompany ? `<span>${evaluatorCompany}</span><br>` : ''}
      ${evaluatorCRECI ? `CRECI ${evaluatorCRECI}` : ''}
      ${evaluatorPhone ? ` · ${evaluatorPhone}` : ''}
    </div>
    ${qrCodeSvg ? `
    <div class="cover-qr">
      <div class="cover-qr-img">${qrCodeSvg}</div>
      <div class="cover-qr-label">Verificar autenticidade</div>
      ${numeroLaudo ? `<div class="cover-qr-num">${numeroLaudo}</div>` : ''}
    </div>` : ''}
    <div class="cover-norm">
      <span>Conforme NBR 14653-1 e NBR 14653-2</span>
      <span>Resolução COFECI 1.066/2007</span>
    </div>
  </div>
</div>

<!-- ════ CONTEÚDO ════ -->
<div class="content">

  <h3 data-num="1">Identificação do Imóvel</h3>
  <div class="info-grid">
    <div class="info-item"><span class="label">Empreendimento:</span><span class="value">${devName}</span></div>
    <div class="info-item"><span class="label">Endereço:</span><span class="value">${devAddress}</span></div>
    <div class="info-item"><span class="label">Área Avaliada (m²):</span><span class="value">${subjectArea}</span></div>
    <div class="info-item"><span class="label">Data da Avaliação:</span><span class="value">${today}</span></div>
    <div class="info-item"><span class="label">Protocolo:</span><span class="value">${protocolo}</span></div>
    <div class="info-item"><span class="label">Status:</span><span class="value">Concluído</span></div>
  </div>

  <h3 data-num="2">Finalidade e Metodologia</h3>
  <div class="info-grid">
    <div class="info-item"><span class="label">Finalidade:</span><span class="value">${purposeLabel}</span></div>
    <div class="info-item"><span class="label">Metodologia:</span><span class="value">${methodLabel}</span></div>
    <div class="info-item"><span class="label">Solicitante:</span><span class="value">${(valuation.requester_name as string) || 'N/A'}</span></div>
    <div class="info-item"><span class="label">Avaliador:</span><span class="value">${evaluatorName}${evaluatorCRECI ? ` · CRECI ${evaluatorCRECI}` : ''}</span></div>
    ${evaluatorCompany ? `<div class="info-item"><span class="label">Empresa:</span><span class="value">${evaluatorCompany}</span></div>` : ''}
    ${evaluatorPhone ? `<div class="info-item"><span class="label">Telefone:</span><span class="value">${evaluatorPhone}</span></div>` : ''}
    ${evaluatorEmail ? `<div class="info-item"><span class="label">E-mail:</span><span class="value">${evaluatorEmail}</span></div>` : ''}
    <div class="info-item"><span class="label">Norma Aplicada:</span><span class="value">NBR 14653-1 e NBR 14653-2</span></div>
    <div class="info-item"><span class="label">Resolução:</span><span class="value">COFECI 1.066/2007</span></div>
  </div>
  <div class="method-justify">${methodJustification}</div>

  <h3 data-num="3">Pesquisa de Mercado e Homogeneização</h3>
  <p>Foram coletados <strong>${comparables.length}</strong> elementos comparativos na região do imóvel avaliando, conforme tabela abaixo. Os fatores de homogeneização foram aplicados de acordo com a NBR 14653-2, utilizando o método dos fatores de valorização/desvalorização.</p>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th style="text-align:left">Endereço / Bairro</th>
        <th>m²</th>
        <th>Valor</th>
        <th>R$/m²</th>
        <th>F.Of.</th>
        <th>F.Área</th>
        <th>F.Loc.</th>
        <th>F.Id.</th>
        <th>F.Pav.</th>
        <th>F.Vag.</th>
        <th>F.Ext.</th>
        <th>R$/m² Hom.</th>
      </tr>
    </thead>
    <tbody>
      ${comparableRows}
    </tbody>
  </table>

  <p style="font-size:8.5pt;color:#666;margin-top:8px">
    <strong>Legenda:</strong> F.Of. = Fator Oferta | F.Área = Fator Área | F.Loc. = Fator Localização | F.Id. = Fator Idade | F.Pav. = Fator Pavimento | F.Vag. = Fator Vagas | F.Ext. = Fator Extra
  </p>

  <h3 data-num="4">Tratamento Estatístico</h3>
  <div class="stats-box">
    <div class="stats-grid">
      <div>
        <div class="stat-value">${fmt(result.average_price_per_sqm)}</div>
        <div class="stat-label">Média R$/m²</div>
      </div>
      <div>
        <div class="stat-value">${fmt(result.median_price_per_sqm)}</div>
        <div class="stat-label">Mediana R$/m²</div>
      </div>
      <div>
        <div class="stat-value">${fmt(result.coefficient_of_variation)}%</div>
        <div class="stat-label">Coef. Variação</div>
      </div>
    </div>
    <div class="stats-grid" style="margin-top:16px">
      <div>
        <div class="stat-value">${fmt(result.std_deviation)}</div>
        <div class="stat-label">Desvio Padrão</div>
      </div>
      <div>
        <div class="stat-value">${comparables.length}</div>
        <div class="stat-label">Elementos Amostrais</div>
      </div>
      <div>
        <div class="stat-value">${result.confidence_grade}</div>
        <div class="stat-label">Grau Fundamentação</div>
      </div>
    </div>
  </div>

  <h3 data-num="5">Resultado da Avaliação</h3>
  <div class="result-box">
    <div class="result-label">Valor de Mercado Estimado</div>
    <div class="value">${fmtBRL(result.estimated_value)}</div>
    <div style="font-size:10pt;color:var(--text-muted)">
      Valor unitário: ${fmtBRL(result.average_price_per_sqm)}/m² &times; ${subjectArea} m²
    </div>
    <div class="grade-badge">Grau ${result.confidence_grade} — NBR 14653</div>
  </div>
  ${(valorMinimo || valorMaximo) ? `
  <table style="max-width:500px;margin:0 auto 20px">
    <thead>
      <tr>
        <th>Mínimo</th>
        <th style="background:#1a3a5c;color:#C8A44A">Avaliado</th>
        <th>Máximo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${fmtBRL(valorMinimo ?? result.estimated_value * 0.85)}</td>
        <td><strong>${fmtBRL(result.estimated_value)}</strong></td>
        <td>${fmtBRL(valorMaximo ?? result.estimated_value * 1.15)}</td>
      </tr>
    </tbody>
  </table>` : ''}

  <h3 data-num="${nextSec()}">Cenários de Valor</h3>
  <p style="margin-bottom:14px">Projeção de valor em três cenários de mercado, calculados a partir do valor estimado base, para apoio à tomada de decisão.</p>
  ${scenariosSection}

  ${liquidez ? `<h3 data-num="${nextSec()}">Análise de Liquidez</h3>
  <p style="margin-bottom:12px">Avaliação do potencial de absorção do imóvel pelo mercado e estimativa do valor de liquidação forçada, conforme critérios de desconto praticados pelo mercado e referências da NBR 14653-1, seção 8.8.</p>
  ${liquidezSection}` : ''}

  ${depreciacao ? `<h3 data-num="${nextSec()}">Depreciação Física — Método Ross-Heidecke</h3>
  <p style="margin-bottom:12px">Cálculo da depreciação física das benfeitorias pelo método Ross-Heidecke, conforme NBR 14653-2 (Anexo A), considerando a idade real, a vida útil estimada e o estado de conservação do imóvel.</p>
  ${rossHeideckeSection}` : ''}

  <h3 data-num="${nextSec()}">Ressalvas e Limitações</h3>
  <p>Este parecer foi elaborado com base em dados disponíveis no mercado na data de referência, utilizando o Método ${methodLabel}. Os valores apresentados representam a melhor estimativa de valor de mercado nas condições observadas, não tendo sido consideradas eventuais pendências jurídicas, fiscais ou ambientais. O presente documento não substitui laudo de vistoria técnica estrutural.</p>
  <p style="margin-top:10px">O avaliador declara inexistência de vínculo com as partes envolvidas e confirma a ausência de conflito de interesses na elaboração do presente parecer, em conformidade com o Código de Ética dos Corretores de Imóveis e com a Resolução COFECI 1.066/2007.</p>

  ${photos.length > 0 ? `<h3 data-num="${nextSec()}">Registro Fotográfico</h3>
  <p>Imagens do imóvel avaliando registradas na data da vistoria.</p>
  <div class="photo-grid">
    ${photos.map((p, i) => `
      <div class="photo-item">
        <img src="${p.url}" alt="${p.caption || p.name || 'Foto ' + (i + 1)}" />
        <div class="photo-caption">${p.caption || p.name || 'Foto ' + (i + 1)}</div>
      </div>
    `).join('')}
  </div>` : ''}

  <h3 data-num="${nextSec()}">Para o Solicitante</h3>
  <div class="commercial-box">
    <div class="commercial-title">Resumo da Avaliação em Linguagem Acessível</div>
    <p>O imóvel avaliado possui valor de mercado estimado em <span class="highlight-value">${fmtBRL(result.estimated_value)}</span>, conforme metodologia NBR 14653. Este valor representa o preço mais provável pelo qual o imóvel seria negociado, em condições normais de mercado, entre partes independentes e bem informadas, sem pressões de qualquer natureza — podendo variar entre <strong>${fmtBRL(conservador)}</strong> (cenário conservador) e <strong>${fmtBRL(agressivo)}</strong> (cenário de valorização), a depender das condições de negociação e do comportamento do mercado local na data da transação.</p>
  </div>

  ${qrCodeSvg && numeroLaudo ? `
  <h3 data-num="${nextSec()}">Código de Verificação Digital</h3>
  <div class="qr-verify-section">
    <div class="qr-verify-qr">${qrCodeSvg}</div>
    <div class="qr-verify-info">
      <div class="qr-verify-title">Autenticidade Verificável</div>
      <p class="qr-verify-desc">
        Este laudo possui código de verificação digital. Escaneie o QR Code ou acesse
        a URL abaixo para confirmar a autenticidade e os dados deste documento
        em tempo real.
      </p>
      <table style="max-width:100%;margin-top:12px">
        <tbody>
          <tr>
            <td style="width:30%;color:#8E99AB;font-size:9pt;padding:5px 8px">Número do Laudo</td>
            <td style="font-family:monospace;font-size:10pt;font-weight:700;color:#C8A44A;padding:5px 8px">${numeroLaudo}</td>
          </tr>
          <tr>
            <td style="width:30%;color:#8E99AB;font-size:9pt;padding:5px 8px">Hash SHA-256</td>
            <td style="font-family:monospace;font-size:9pt;color:#aaa;word-break:break-all;padding:5px 8px">${qrHash || '—'}</td>
          </tr>
          <tr>
            <td style="width:30%;color:#8E99AB;font-size:9pt;padding:5px 8px">URL de Verificação</td>
            <td style="font-size:9pt;padding:5px 8px"><a href="https://www.iulemirandaimoveis.com.br/verificar?hash=${qrHash}" style="color:#C8A44A">www.iulemirandaimoveis.com.br/verificar</a></td>
          </tr>
          <tr>
            <td style="width:30%;color:#8E99AB;font-size:9pt;padding:5px 8px">Emitido em</td>
            <td style="font-size:9pt;padding:5px 8px">${today}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>` : ''}

  <h3 data-num="${nextSec()}">Assinaturas</h3>
  <div class="signature-area signatures">
    <div>
      <div class="signature-line">
        ${evaluatorName}<br>
        ${evaluatorCRECI ? `<small>CRECI ${evaluatorCRECI}</small><br>` : ''}
        ${evaluatorCompany ? `<small>${evaluatorCompany}</small><br>` : ''}
        ${evaluatorPhone ? `<small>${evaluatorPhone}</small><br>` : ''}
        ${evaluatorEmail ? `<small>${evaluatorEmail}</small>` : ''}
      </div>
    </div>
    <div>
      <div class="signature-line">
        ${today}<br>
        <small>Data de Emissão</small>
      </div>
    </div>
  </div>

</div>

<div class="footer">
  <strong>IMI &mdash; Inteligência Imobiliária</strong><br>
  Documento gerado automaticamente pelo sistema IMI · Protocolo ${protocolo}<br>
  Conforme NBR 14653-1 e NBR 14653-2 da ABNT &mdash; Resolução COFECI 1.066/2007
</div>

</body>
</html>`
}
