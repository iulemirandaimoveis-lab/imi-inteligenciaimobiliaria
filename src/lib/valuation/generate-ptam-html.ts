import { ValuationResult } from './homogenization'

export function generatePTAMHtml(params: {
  valuation: Record<string, unknown>
  development: Record<string, unknown> | null
  comparables: Record<string, unknown>[]
  result: ValuationResult
  evaluatorName: string
}): string {
  const { valuation, development, comparables, result, evaluatorName } = params

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtBRL = (v: number) =>
    'R$ ' + fmt(v)

  const purposeLabel = (valuation.purpose as string) || 'Venda'
  const methodLabel = (valuation.method as string) === 'comparative_direct'
    ? 'Comparativo Direto de Dados de Mercado'
    : (valuation.method as string) || 'Comparativo Direto de Dados de Mercado'

  const devName = (development?.name as string) || 'N/A'
  const devAddress = (development?.address as string) || (development?.location as string) || 'N/A'
  const subjectArea = Number(valuation.value_per_sqm) > 0
    ? fmt(result.estimated_value / Number(valuation.value_per_sqm))
    : 'N/A'

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  const comparableRows = comparables.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.address || 'N/A'}, ${c.neighborhood || ''}</td>
      <td>${fmt(Number(c.area_sqm) || 0)}</td>
      <td>${fmtBRL(Number(c.asking_price) || 0)}</td>
      <td>${fmt(Number(c.price_per_sqm) || 0)}</td>
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

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PTAM - Parecer T\u00e9cnico de Avalia\u00e7\u00e3o Mercadol\u00f3gica</title>
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
  .header {
    background: var(--navy);
    color: var(--text);
    padding: 40px;
    text-align: center;
    border-bottom: 4px solid var(--gold);
  }
  .header h1 {
    font-family: 'Playfair Display', serif;
    font-size: 28pt;
    color: var(--gold);
    margin-bottom: 6px;
  }
  .header h2 {
    font-family: 'Inter', sans-serif;
    font-size: 14pt;
    font-weight: 400;
    color: var(--text-muted);
    letter-spacing: 2px;
  }
  .header .brand {
    font-family: 'Playfair Display', serif;
    font-size: 18pt;
    color: var(--gold);
    margin-bottom: 20px;
    letter-spacing: 4px;
  }
  .content { max-width: 900px; margin: 0 auto; padding: 40px 30px; }
  h3 {
    font-family: 'Playfair Display', serif;
    font-size: 16pt;
    color: var(--navy);
    border-bottom: 2px solid var(--gold);
    padding-bottom: 8px;
    margin: 30px 0 16px;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    margin-bottom: 20px;
  }
  .info-item { display: flex; gap: 6px; }
  .info-item .label {
    font-weight: 600;
    color: #4a4a6a;
    min-width: 140px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 9pt;
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
    padding: 30px;
    border-radius: 12px;
    margin: 24px 0;
    border: 2px solid var(--gold);
  }
  .result-box .value {
    font-family: 'Playfair Display', serif;
    font-size: 32pt;
    color: var(--gold);
    margin: 8px 0;
  }
  .result-box .grade-badge {
    display: inline-block;
    background: var(--gold);
    color: var(--navy);
    padding: 4px 16px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 11pt;
    margin-top: 8px;
  }
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
    margin: 40px 0;
    text-align: center;
  }
  .signature-line {
    border-top: 1px solid #333;
    padding-top: 8px;
    width: 200px;
    font-size: 10pt;
  }
  @media print {
    body { font-size: 10pt; background: white; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { padding: 20px; background: #0A1624 !important; color: white !important; }
    .content { padding: 20px; }
    table { font-size: 8pt; page-break-inside: avoid; }
    h3 { page-break-after: avoid; }
    .info-grid { page-break-inside: avoid; }
    .signatures { page-break-before: always; }
    @page { margin: 1.5cm 2cm; size: A4; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="brand">IMI</div>
  <h1>PTAM</h1>
  <h2>PARECER T\u00c9CNICO DE AVALIA\u00c7\u00c3O MERCADOL\u00d3GICA</h2>
</div>

<div class="content">

  <h3>1. Identifica\u00e7\u00e3o do Im\u00f3vel</h3>
  <div class="info-grid">
    <div class="info-item"><span class="label">Empreendimento:</span><span>${devName}</span></div>
    <div class="info-item"><span class="label">Endere\u00e7o:</span><span>${devAddress}</span></div>
    <div class="info-item"><span class="label">\u00c1rea (m\u00b2):</span><span>${subjectArea}</span></div>
    <div class="info-item"><span class="label">Data:</span><span>${today}</span></div>
  </div>

  <h3>2. Finalidade e Metodologia</h3>
  <div class="info-grid">
    <div class="info-item"><span class="label">Finalidade:</span><span>${purposeLabel}</span></div>
    <div class="info-item"><span class="label">Metodologia:</span><span>${methodLabel}</span></div>
    <div class="info-item"><span class="label">Solicitante:</span><span>${(valuation.requester_name as string) || 'N/A'}</span></div>
    <div class="info-item"><span class="label">Avaliador:</span><span>${evaluatorName}</span></div>
  </div>

  <h3>3. Pesquisa de Mercado e Homogeneiza\u00e7\u00e3o</h3>
  <p>Foram coletados <strong>${comparables.length}</strong> elementos comparativos na regi\u00e3o do im\u00f3vel avaliando, conforme tabela abaixo. Os fatores de homogeneiza\u00e7\u00e3o foram aplicados de acordo com a NBR 14653-2.</p>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Endere\u00e7o</th>
        <th>m\u00b2</th>
        <th>Valor</th>
        <th>R$/m\u00b2</th>
        <th>F.Of.</th>
        <th>F.\u00c1rea</th>
        <th>F.Loc.</th>
        <th>F.Id.</th>
        <th>F.Pav.</th>
        <th>F.Vag.</th>
        <th>F.Ext.</th>
        <th>R$/m\u00b2 Hom.</th>
      </tr>
    </thead>
    <tbody>
      ${comparableRows}
    </tbody>
  </table>

  <h3>4. Tratamento Estat\u00edstico</h3>
  <div class="stats-box">
    <div class="stats-grid">
      <div>
        <div class="stat-value">${fmt(result.average_price_per_sqm)}</div>
        <div class="stat-label">M\u00e9dia R$/m\u00b2</div>
      </div>
      <div>
        <div class="stat-value">${fmt(result.median_price_per_sqm)}</div>
        <div class="stat-label">Mediana R$/m\u00b2</div>
      </div>
      <div>
        <div class="stat-value">${fmt(result.coefficient_of_variation)}%</div>
        <div class="stat-label">Coef. Varia\u00e7\u00e3o</div>
      </div>
    </div>
    <div class="stats-grid" style="margin-top:16px">
      <div>
        <div class="stat-value">${fmt(result.std_deviation)}</div>
        <div class="stat-label">Desvio Padr\u00e3o</div>
      </div>
      <div>
        <div class="stat-value">${comparables.length}</div>
        <div class="stat-label">Elementos</div>
      </div>
      <div>
        <div class="stat-value">${result.confidence_grade}</div>
        <div class="stat-label">Grau Fundam.</div>
      </div>
    </div>
  </div>

  <h3>5. Resultado da Avalia\u00e7\u00e3o</h3>
  <div class="result-box">
    <div style="font-size:11pt;color:var(--text-muted)">Valor de Mercado Estimado</div>
    <div class="value">${fmtBRL(result.estimated_value)}</div>
    <div style="font-size:10pt;color:var(--text-muted)">Valor unit\u00e1rio: ${fmtBRL(result.average_price_per_sqm)}/m\u00b2</div>
    <div class="grade-badge">Grau ${result.confidence_grade} - NBR 14653</div>
  </div>

  <h3>6. Ressalvas e Limita\u00e7\u00f5es</h3>
  <p>Este parecer foi elaborado com base em dados dispon\u00edveis no mercado na data de refer\u00eancia, utilizando o M\u00e9todo ${methodLabel}. Os valores apresentados representam a melhor estimativa de valor de mercado nas condi\u00e7\u00f5es observadas. N\u00e3o foram consideradas eventuais pendências jur\u00eddicas, fiscais ou ambientais.</p>

  <div class="signature-area">
    <div>
      <div class="signature-line">${evaluatorName}<br><small>Avaliador Respons\u00e1vel</small></div>
    </div>
    <div>
      <div class="signature-line">Data: ${today}<br><small>Assinatura Digital</small></div>
    </div>
  </div>

</div>

<div class="footer">
  <strong>IMI</strong> &mdash; Intelligence Market Immobili\u00e8re<br>
  Documento gerado automaticamente pelo sistema IMI PTAM<br>
  Conforme NBR 14653-1 e NBR 14653-2 da ABNT
</div>

</body>
</html>`
}
