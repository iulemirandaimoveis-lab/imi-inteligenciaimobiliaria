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
  } = params

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtBRL = (v: number) =>
    'R$ ' + fmt(v)

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
  <h3>7. Registro Fotográfico</h3>
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

  const sectionOffset = photos.length > 0 ? 1 : 0

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

  @media print {
    body { font-size: 10pt; background: white; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { padding: 40px 60px; background: #050B14 !important; min-height: 100vh; }
    .content { padding: 20px; }
    table { font-size: 7.5pt; page-break-inside: avoid; }
    h3 { page-break-after: avoid; }
    .info-grid { page-break-inside: avoid; }
    .signature-area { page-break-before: always; }
    .photo-grid { page-break-inside: avoid; }
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
      Valor unitário: ${fmtBRL(result.average_price_per_sqm)}/m² &times; ${subjectArea} m²
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

  <h3 data-num="6">Ressalvas e Limitações</h3>
  <p>Este parecer foi elaborado com base em dados disponíveis no mercado na data de referência, utilizando o Método ${methodLabel}. Os valores apresentados representam a melhor estimativa de valor de mercado nas condições observadas, não tendo sido consideradas eventuais pendências jurídicas, fiscais ou ambientais. O presente documento não substitui laudo de vistoria técnica estrutural.</p>
  <p style="margin-top:10px">O avaliador declara inexistência de vínculo com as partes envolvidas e confirma a ausência de conflito de interesses na elaboração do presente parecer, em conformidade com o Código de Ética dos Corretores de Imóveis e com a Resolução COFECI 1.066/2007.</p>

  ${photoGallerySection ? photoGallerySection.replace('<h3>', `<h3 data-num="${6 + sectionOffset}">`) : ''}

  <h3 data-num="${7 + sectionOffset}">Assinaturas</h3>
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
