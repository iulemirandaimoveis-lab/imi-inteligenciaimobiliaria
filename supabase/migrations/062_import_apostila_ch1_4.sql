-- ====================================================================
-- MIGRAÇÃO 062: Importar Base de Conhecimento — Apostila Diniz Cap. 1-4
-- Fonte: "Avaliações & Perícias de Imóveis" - Prof. João Diniz Marcello
-- UNICRECI Pernambuco / CRECI-PE — 163 páginas (15 extraídas, cap. 1-4)
-- Data: 2026-03-18
-- ====================================================================

DO $$
DECLARE v UUID;
BEGIN

-- ─── PÁGINA 1: Capa ──────────────────────────────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Capa','{}')
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES(v,'Identificação do curso',
'Apostila do Curso de Avaliações & Perícias de Imóveis, ministrado pelo Prof. João Diniz Marcello, realizado em Caruaru (26-27/maio/2025) e Recife (28-30/maio/2025), com apoio do UNICRECI Pernambuco, Interface Cursos e CRECI-PE.',
ARRAY['capa','curso','unicreci','creci-pe','recife','caruaru'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Capa');

-- ─── PÁGINA 2: Considerações Iniciais ────────────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Considerações Iniciais',
ARRAY['Lei 6.530/78','Resolução COFECI 1.066/2007'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES
(v,'Profissionais habilitados para avaliação de imóveis',
'As leis, resoluções e normas que regulamentam a atividade de Avaliação de Imóveis dispõem sobre quais profissionais são habilitados em Lei a realizar Avaliações de Imóveis no Brasil. São quatro categorias: Engenheiros Civis, Arquitetos, Corretores de Imóveis e Oficiais de Justiça.',
ARRAY['habilitacao','profissionais','avaliacao','legislacao'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Considerações Iniciais'),
(v,'Competência avaliatória dos corretores de imóveis',
'Os Corretores de Imóveis quando foram habilitados em lei a realizar Avaliações de Imóveis tiveram contestações do CONFEA e IBAPE no início. Atualmente esta discussão está pacificada, transitada em julgado, e os Corretores foram vencedores em todas as instâncias judiciais, estando habilitados a atuar como Perito Avaliador nas Avaliações Judiciais e Extrajudiciais.',
ARRAY['corretor','habilitacao','competencia','confea','ibape','perito avaliador'],'norma',
'Apostila_Diniz_Avaliacoes.pdf','Considerações Iniciais'),
(v,'Base legal da habilitação do corretor como perito avaliador',
'Argumentações legais que habilitam o Corretor de Imóveis a atuar como Perito Avaliador: Lei 6.530/78 Artigo 3º, Recurso Especial STJ 277.443/2002, Agravo Regimental RE 88.459/2011, Resolução COFECI 1.066/2007, e CNAI – Cadastro Nacional de Avaliadores Imobiliários.',
ARRAY['lei 6530','stj','cofeci','cnai','habilitacao legal','perito'],'norma',
'Apostila_Diniz_Avaliacoes.pdf','Considerações Iniciais'),
(v,'CNAI - Cadastro Nacional de Avaliadores Imobiliários',
'Os Corretores de Imóveis são os únicos profissionais no Brasil que possuem um Cadastro Nacional de Avaliadores Imobiliários (CNAI), regulamentado pelo COFECI, com mais de 30 mil Avaliadores cadastrados em todas as regiões do país. Os Engenheiros, Arquitetos e Oficiais de Justiça não possuem Cadastro Nacional de Avaliadores por meio de suas entidades representativas.',
ARRAY['cnai','cofeci','cadastro','avaliadores','corretor'],'norma',
'Apostila_Diniz_Avaliacoes.pdf','Considerações Iniciais'),
(v,'Selo Certificador COFECI',
'A Resolução 1.066/2007 do COFECI dispõe que todas as Avaliações realizadas por Corretores de Imóveis tenham afixada o Selo Certificador fornecido eletronicamente e gratuitamente pelo COFECI, para dar credibilidade, idoneidade e certificação às Avaliações. A exigência do Selo é do solicitante da Avaliação. Atualmente a grande maioria das instituições somente aceitam Avaliações com o Selo Certificador.',
ARRAY['selo certificador','cofeci','resolucao 1066','certificacao','avaliacao'],'norma',
'Apostila_Diniz_Avaliacoes.pdf','Considerações Iniciais');

-- ─── PÁGINA 3: Histórico das Avaliações ──────────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Histórico das Avaliações por Corretores',
ARRAY['Lei 5.194/66','Lei 6.530/78','CPC Lei 13.105/15','Resolução COFECI 1.066/2007'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES
(v,'Histórico das avaliações por corretores',
'Nos anos 40 os Corretores de Imóveis faziam parte de uma categoria organizada e reconhecida por toda sociedade. A criação das CVI (Câmaras de Valores Imobiliários), oriundas do Pregão Imobiliário, abriu o mercado de avaliações para os Corretores, sendo as mais expressivas na época a CVI de São Paulo e da Paraíba. Os CRECIs firmaram convênios com o Poder Público – Tribunais Federal, Estaduais, Ministérios Públicos, Justiça Federal, Justiça Eleitoral, Justiça do Trabalho, Municípios, Autarquias, Embaixadas, etc.',
ARRAY['historico','cvi','pregao imobiliario','creci','convenios','poder publico'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Histórico das Avaliações por Corretores'),
(v,'Profissionais avaliadores de imóveis habilitados em lei — tabela comparativa',
'Tabela comparativa dos profissionais habilitados em lei para realizar avaliações de imóveis: Engenheiros Civis (Lei 5.194/66, Resolução CONFEA 345/90, CONFEA/CREA); Arquitetos (Lei 5.194/66, Resolução CONFEA 345/90, CAU); Corretores de Imóveis (Lei 6.530/78 Art. 3º, Resoluções COFECI 957/2006 e 1.066/2007, COFECI/CRECI); Oficiais de Justiça (CPC Lei 13.105/15 Art. 154 Inc. V, Poder Judiciário).',
ARRAY['tabela','profissionais','habilitacao','lei','resolucao','conselho','confea','cofeci','cau'],'norma',
'Apostila_Diniz_Avaliacoes.pdf','Histórico das Avaliações por Corretores');

-- ─── PÁGINA 4: Principais Dispositivos da Resolução 1.066/2007 ───────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Resolução COFECI 1.066/2007 — Dispositivos Principais',
ARRAY['Resolução COFECI 1.066/2007','Lei 6.530/78','Lei 8.078/90','NBR 14.653-1','NBR 14.653-2','NBR 14.653-3','NBR 14.653-4'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES(v,'Resolução COFECI 1.066/2007 - Dispositivos principais',
'A Resolução considera como referência o artigo 3º da Lei 6.530/78, o Código de Defesa do Consumidor (Lei 8.078/90) e as normas da ABNT (NBR 14.653-1, 14.653-2, 14.653-3, 14.653-4). Disposições: Inscrição no CNAI é opcional; corretor formado em curso Sequencial, Tecnológico ou Superior tem inscrição automática no CNAI; Corretor formado em Curso Técnico deve ter Certificado em Avaliação Imobiliária; Estabelece como padrão o PTAM; Pessoa Jurídica pode patrocinar avaliação, mas responsável é o Corretor PESSOA FÍSICA; Todas avaliações devem ter Selo Certificador; Corretor deve arquivar avaliações por 05 ANOS; Procedimentos sujeitos ao Código de Ética (Resolução COFECI 326/92).',
ARRAY['resolucao 1066','cofeci','cnai','ptam','selo certificador','requisitos','inscricao','arquivo 5 anos'],'norma',
'Apostila_Diniz_Avaliacoes.pdf','Resolução COFECI 1.066/2007 — Dispositivos Principais');

-- ─── PÁGINA 5: Declaração de Avaliação Mercadológica e Selo Certificador
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Declaração de Avaliação Mercadológica e Selo Certificador',
ARRAY['COFECI','CRECI'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES(v,'Modelo de Declaração de Avaliação Mercadológica COFECI',
'Modelo de declaração emitida pelo COFECI/CRECI para avaliação mercadológica, contendo dados do corretor avaliador, tipo de imóvel, solicitante e data. Acompanhada de Selo Certificador com QR Code em quatro vias. Campos obrigatórios: nome do corretor, CPF, RG, CRECI, endereço, tipo de imóvel, solicitante, data, assinatura.',
ARRAY['declaracao','selo certificador','cofeci','creci','modelo','template','qr code','quatro vias'],'formulario',
'Apostila_Diniz_Avaliacoes.pdf','Declaração de Avaliação Mercadológica e Selo Certificador');

-- ─── PÁGINA 6: Razões e Justificativas ───────────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Razões e Justificativas para Atuação do Corretor como Perito Avaliador',
ARRAY['NBR 14.653','Ato Normativo 01/2011','CPC 2015 Art. 473'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES
(v,'Justificativas para atuação do corretor como perito avaliador',
'Razões que justificam a atuação do Corretor de Imóveis como Perito Avaliador: grande número de perícias realizadas por corretores; a avaliação é a primeira solicitação do cliente ao corretor ao vender, locar ou permutar; o corretor é o único especialista em mercado imobiliário com formação e convivência diária com demandas imobiliárias; engenheiros e arquitetos norteiam suas avaliações com base nas informações fornecidas pelos corretores; somente o corretor tem competência para identificar particularidades do mercado que não podem ser expressas por programas de inferências estatísticas.',
ARRAY['justificativa','corretor','perito avaliador','competencia','mercado imobiliario','especialista'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Razões e Justificativas para Atuação do Corretor como Perito Avaliador'),
(v,'Fundamentação na elaboração de laudos — Comparativo Corretor vs Engenheiro',
'Corretores elaboram Avaliação de Mercado baseada nos critérios do Anexo IV Ato Normativo 01/2011, critérios mercadológicos da NBR 14.653 e Art. 473 do CPC 2015, resultando em PTAM ou Laudo Técnico de Avaliação Mercadológica ou Pericial. Engenheiros/Arquitetos elaboram Avaliação Técnica baseada nos critérios técnicos da NBR 14.653. Oficiais de Justiça realizam Avaliação sem Normatização.',
ARRAY['fundamentacao','ptam','laudo','nbr 14653','cpc','comparativo','corretor','engenheiro'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Razões e Justificativas para Atuação do Corretor como Perito Avaliador');

-- ─── PÁGINA 7: PTAM e Laudos Técnicos ────────────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Pareceres Técnicos de Avaliação Mercadológica e Laudos Técnicos',
ARRAY['Resolução COFECI 1.066/2007','CPC Art. 471','CPC Art. 473'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES
(v,'PTAM - Parecer Técnico de Avaliação Mercadológica (definição)',
'Instituído pela Resolução COFECI 1.066/2007 para denominar as avaliações realizadas pelos Corretores de Imóveis.',
ARRAY['ptam','definicao','resolucao 1066','cofeci'],'definicao',
'Apostila_Diniz_Avaliacoes.pdf','Pareceres Técnicos de Avaliação Mercadológica e Laudos Técnicos'),
(v,'Definições de Laudos Técnicos',
'Laudo técnico (Houaiss): Texto contendo parecer técnico de engenheiro, médico, profissional com conhecimento técnico. Laudo (Michaelis): Opinião escrita em que um perito ou árbitro emite seu parecer e responde aos quesitos propostos pelo juiz e pelas partes interessadas. Laudo Pericial: Denominação geral a qualquer peça escrita em que um perito responde aos quesitos que lhe foram formulados e emite seu parecer.',
ARRAY['laudo tecnico','laudo pericial','definicao','perito'],'definicao',
'Apostila_Diniz_Avaliacoes.pdf','Pareceres Técnicos de Avaliação Mercadológica e Laudos Técnicos'),
(v,'Art. 471 CPC - Perícia Consensual',
'As partes podem, de comum acordo, escolher o perito, desde que sejam plenamente capazes e a causa possa ser resolvida por autocomposição. §1º: partes indicam assistentes técnicos; §2º: perito e assistentes entregam laudo e pareceres em prazo fixado pelo juiz; §3º: a perícia consensual substitui a que seria realizada por perito nomeado pelo juiz.',
ARRAY['cpc','art 471','pericia consensual','perito','assistente tecnico'],'norma',
'Apostila_Diniz_Avaliacoes.pdf','Pareceres Técnicos de Avaliação Mercadológica e Laudos Técnicos'),
(v,'Art. 473 CPC - Conteúdo obrigatório do Laudo Pericial',
'O laudo pericial deve conter: I - exposição do objeto da perícia; II - análise técnica ou científica realizada pelo perito; III - indicação do método utilizado, esclarecendo-o e demonstrando ser predominantemente aceito pelos especialistas; IV - resposta conclusiva a todos os quesitos. §1º: fundamentação em linguagem simples e coerência lógica. §2º: vedado ao perito ultrapassar limites de sua designação e emitir opiniões pessoais. §3º: perito e assistentes podem valer-se de todos os meios necessários – testemunhas, informações, documentos, mapas, plantas, fotografias.',
ARRAY['cpc','art 473','laudo pericial','conteudo obrigatorio','perito','fundamentacao','quesitos'],'norma',
'Apostila_Diniz_Avaliacoes.pdf','Pareceres Técnicos de Avaliação Mercadológica e Laudos Técnicos');

-- ─── PÁGINA 8: Requisitos Mínimos do PTAM ────────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','PTAM - Requisitos Mínimos (Ato Normativo 001/2011 COFECI)',
ARRAY['Resolução COFECI 1.066/2007','Ato Normativo 001/2011 COFECI'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES(v,'Requisitos mínimos do PTAM - Estrutura obrigatória',
'Estrutura obrigatória do PTAM conforme Anexo IV do Ato Normativo 001/2011 COFECI: 1) Identificação do solicitante; 2) Finalidade do PTAM; 3) Identificação e caracterização do imóvel (situação/localização, matrícula/cartório, áreas e dimensões, características e infraestrutura, descrição detalhada, relatório fotográfico da vistoria); 4) Pesquisa de imóveis comparandos pelo Método Comparativo Direto com homogeneização das amostras; 5) Determinação do Valor de Mercado; 6) Encerramento (conclusão, data, assinatura, Selo Certificador); 7) Anexos (fotos, plantas, certidão de matrícula atualizada, documentos, currículo do avaliador).',
ARRAY['ptam','requisitos minimos','estrutura','ato normativo','cofeci','laudo','checklist','comparandos','homogeneizacao'],'formulario',
'Apostila_Diniz_Avaliacoes.pdf','PTAM - Requisitos Mínimos (Ato Normativo 001/2011 COFECI)');

-- ─── PÁGINA 9: Norma Brasileira Avaliatória ───────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Norma Brasileira Avaliatória — NBR 14.653',
ARRAY['ABNT','NBR 14.653','NBR 14.653-1','NBR 14.653-2','NBR 14.653-3','NBR 14.653-4','NBR 14.653-5','NBR 14.653-6','NBR 14.653-7'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES(v,'NBR 14.653 - Norma Brasileira Avaliatória (ABNT) — 7 partes',
'A avaliação de bens para Engenharia está regulamentada pela ABNT e normatizada pela NBR 14.653, subdividida em 7 partes: Parte 1 (2019) - Procedimentos Gerais; Parte 2 (2011) - Imóveis Urbanos; Parte 3 (2004) - Imóveis Rurais; Parte 4 (2002) - Empreendimentos; Parte 5 (2006) - Máquinas, Equipamentos, Instalações e Bens Industriais em Geral; Parte 6 (2006) - Recursos Naturais e Ambientais; Parte 7 (2009) - Patrimônios Históricos. As Normas são originadas por demanda de qualquer pessoa ou entidade junto à ABNT. Comitês de Estudos analisam, criam Projetos de Norma levados a Consulta Nacional e, após consenso, a Norma passa a ser um Documento Técnico da ABNT.',
ARRAY['nbr 14653','abnt','norma','avaliacao','procedimentos gerais','imoveis urbanos','imoveis rurais','empreendimentos','partes'],'norma',
'Apostila_Diniz_Avaliacoes.pdf','Norma Brasileira Avaliatória — NBR 14.653');

-- ─── PÁGINA 10: Mercado para o Corretor Perito Avaliador ─────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Mercado para o Corretor Perito Avaliador','{}')
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES(v,'Tipos de avaliações judiciais e extrajudiciais',
'O corretor perito avaliador pode atuar em dois papéis judiciais: como Perito do Juiz (designado pelo Juízo) ou Perito Assistente Técnico (contratado pelas partes). Ações judiciais: Desapropriações, Separações Litigiosas/Divórcio, Dissoluções Societárias, Inventários, Revisionais de Aluguéis, Renovações de Aluguéis, Execuções Fiscais, Demarcatórias/Divisórias, Usucapião, Reintegração de Posse, Lucros Cessantes. Avaliações extrajudiciais: Venda e Compra, Mercado, Empresas, Patrimoniais, Garantias Reais, Prefeituras, Consórcios, Seguradoras, Bancos.',
ARRAY['mercado','perito avaliador','avaliacoes judiciais','avaliacoes extrajudiciais','tipos','acoes','desapropriacao','divorcio','inventario'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Mercado para o Corretor Perito Avaliador');

-- ─── PÁGINA 11: Conceituações Técnicas ───────────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Conceituações Técnicas','{}')
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES
(v,'Avaliação (2.1) — definição',
'Avaliação é a ciência da medida do valor. É o conjunto de operações que leva à determinação técnica do valor de um imóvel, ou do direito sobre o imóvel. A avaliação é sempre feita em função do valor à vista, sem os honorários de intermediação.',
ARRAY['avaliacao','definicao','valor','ciencia da medida','conceito'],'definicao',
'Apostila_Diniz_Avaliacoes.pdf','Conceituações Técnicas'),
(v,'Valor de Avaliação (2.2) — definição',
'Nas avaliações mercadológicas o valor determinado é sempre o valor de mercado, e corresponde sempre àquele que, num determinado instante, é único, qualquer que seja a finalidade da avaliação. Considera um mercado de concorrência perfeita, estável, onde não haja urgência e interesses de compra e/ou venda e/ou locação que interfiram no valor do imóvel.',
ARRAY['valor de avaliacao','valor de mercado','definicao','concorrencia perfeita'],'definicao',
'Apostila_Diniz_Avaliacoes.pdf','Conceituações Técnicas'),
(v,'Preço (2.3) — definição',
'É a quantidade de dinheiro pela qual se efetua uma operação imobiliária. Se houver necessidade urgente do vendedor ou do comprador, descaracteriza-se um mercado de natureza perfeita, o que pode influenciar o preço a ser maior ou menor em relação ao valor determinado tecnicamente.',
ARRAY['preco','definicao','operacao imobiliaria','mercado','urgencia'],'definicao',
'Apostila_Diniz_Avaliacoes.pdf','Conceituações Técnicas'),
(v,'Bens (2.4) — definição',
'Tudo o que é propriedade, possessão ou domínio de alguém.',
ARRAY['bens','definicao','propriedade'],'definicao',
'Apostila_Diniz_Avaliacoes.pdf','Conceituações Técnicas'),
(v,'Bens Imóveis (2.5) — definição',
'Os bens que, por natureza ou por destino, não podem ser removidos de um lugar a outro sem perda de sua forma e substância.',
ARRAY['bens imoveis','definicao'],'definicao',
'Apostila_Diniz_Avaliacoes.pdf','Conceituações Técnicas'),
(v,'Bens Tangíveis (2.6) — definição',
'São os bens identificados materialmente. Exemplos: imóveis, automóveis, navios, aviões e outros.',
ARRAY['bens tangiveis','definicao','material'],'definicao',
'Apostila_Diniz_Avaliacoes.pdf','Conceituações Técnicas'),
(v,'Bens Intangíveis (2.7) — definição',
'São os bens que não podemos identificar materialmente, mas que apresentam um valor adicional ao bem físico em razão de interesses histórico, arquitetônico, cultural, artístico, paisagístico e outros. Exemplos: Paisagem, pôr-do-sol, vista, obra de arte, ponto comercial, marcas e outros.',
ARRAY['bens intangiveis','definicao','valor agregado','paisagem','ponto comercial'],'definicao',
'Apostila_Diniz_Avaliacoes.pdf','Conceituações Técnicas');

-- ─── PÁGINA 12: Métodos Avaliatórios ────────────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Métodos Avaliatórios',ARRAY['NBR 14.653'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES
(v,'Métodos avaliatórios e suas aplicações — tabela NBR 14.653',
'Quadro resumo dos quatro métodos previstos na NBR 14.653: (1) Comparativo Direto de Dados de Mercado — Apartamentos, Casas, Salas, Conjuntos, Terrenos, Lotes, Prédios, Galpões, Depósitos, Armazéns, Glebas Urbanizáveis, Imóveis Rurais, Locações, Lojas; (2) Evolutivo — Casas, Prédios, Lojas, Galpões, Armazéns; (3) Involutivo — Terrenos, Lotes, Glebas; (4) Da Renda — Valor Locativo, Taxa de Remuneração.',
ARRAY['metodos avaliatorios','comparativo','evolutivo','involutivo','renda','nbr 14653','aplicacao','tabela'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Métodos Avaliatórios'),
(v,'Método Comparativo Direto de Dados de Mercado (3.1)',
'É o método em que o valor do imóvel é definido através de comparação de dados de mercado relativos a imóveis de características semelhantes ou assemelhadas ao imóvel avaliando. Recomenda-se que sempre que possível seja empregada esta metodologia: se o universo dos imóveis e informações pesquisadas forem significativamente satisfatórias, mais precisas será a avaliação e mais difícil será sua contestação. Recomenda-se como o método preferencial nas avaliações realizadas pelos corretores de imóveis. Aplicável a: Apartamentos, Casas, Salas e Conjuntos Comerciais, Lojas, Terrenos/Lotes, Prédios, Galpões/Depósitos/Armazéns, Glebas Urbanizáveis/Áreas, Áreas Rurais, Valor Locativo/Aluguel.',
ARRAY['metodo comparativo','dados de mercado','definicao','preferencial','corretor','homogenizacao','amostras'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Métodos Avaliatórios');

-- ─── PÁGINA 13: Métodos Evolutivo, Involutivo e da Renda ─────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Métodos Evolutivo, Involutivo e da Renda',ARRAY['NBR 14.653'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES
(v,'Método Evolutivo (3.2)',
'O valor do imóvel é definido pelo somatório dos valores do terreno e da(s) benfeitoria(s) existentes sobre este terreno. Fórmula conceitual: Valor Imóvel = Valor Terreno + Valor Benfeitorias. O valor do terreno pode ser definido pelo Método Comparativo Direto ou pelo Método Involutivo. A avaliação das benfeitorias pode ser determinada pelo Método Comparativo Direto ou pelo Método do Custo. Emprega-se nas situações em que não é possível obter imóveis semelhantes ao avaliando, usualmente para casas com características singulares e prédios comerciais (Hotéis, Colégios, Hospitais, Centros Empresariais, Pavilhões e Galpões).',
ARRAY['metodo evolutivo','definicao','benfeitoria','terreno','custo','somatoria','hoteis','colégios','hospitais'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Métodos Evolutivo, Involutivo e da Renda'),
(v,'Método Involutivo (3.3)',
'O valor do imóvel é definido através de um estudo de viabilidade técnico-econômica de aproveitamento do terreno ou de uma gleba urbanizável, baseado no seu aproveitamento eficiente, mediante hipotético empreendimento imobiliário compatível com as características do imóvel e com as condições do mercado. Emprega-se quando não há terrenos ou glebas semelhantes para comparação. Geralmente empregado em situações de forte demanda imobiliária e/ou quando o proprietário baseia-se no potencial construtivo. O processo de substituição de imóveis originais por novos empreendimentos é denominado "gentrificação".',
ARRAY['metodo involutivo','definicao','viabilidade','gleba','gentrificacao','potencial construtivo','terrenos','lotes'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Métodos Evolutivo, Involutivo e da Renda'),
(v,'Método da Renda (3.4)',
'O valor do imóvel é determinado pela renda que o imóvel gera considerando-se os cenários do mercado imobiliário. Emprega-se o Método da Capitalização da Renda para definição do valor locativo (Aluguel), quando não temos imóveis semelhantes ou assemelhados para utilizar o Método Comparativo Direto de Dados de Mercado. Aplicável a: Valor Locativo, Aluguel, Taxa de Remuneração.',
ARRAY['metodo da renda','definicao','capitalizacao','valor locativo','aluguel','taxa remuneracao','renda'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Métodos Evolutivo, Involutivo e da Renda');

-- ─── PÁGINA 14: Requisitos Obrigatórios na Elaboração dos Laudos ─────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Requisitos Obrigatórios na Elaboração dos Laudos Técnicos',
ARRAY['Resolução COFECI 1.066/2007','NBR 14.653'])
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES(v,'Estrutura obrigatória do Laudo Técnico / PTAM — seções 4.1 a 4.5',
'O Laudo Técnico é o documento elaborado pelo profissional habilitado onde são apresentados os critérios técnicos e a análise de mercado para determinação técnica do valor de um bem. Seções obrigatórias: 4.1 Indicação do Solicitante (em ações judiciais: nº do Processo, Comarca, Autor, Réu, tipo de Ação); 4.2 Objetivo do Laudo (finalidade: fins judiciais, patrimônio, espólio, etc.); 4.3 Identificação do Imóvel (conforme Matrícula, com gravames e ônus); 4.4 Descrição do Imóvel (áreas reais totais, comuns, privativas, frações ideais, padrão construtivo, estado de conservação); 4.5 Metodologia Avaliatória (identificar e definir o método utilizado; pode realizar ensaios com mais de um método para confrontar; na conclusão optar pela metodologia preferencial da NBR 14.653 ou pela de melhor embasamento técnico).',
ARRAY['laudo tecnico','ptam','requisitos obrigatorios','estrutura','solicitante','objetivo','identificacao imovel','descricao','metodologia','resolucao 1066','nbr 14653'],'formulario',
'Apostila_Diniz_Avaliacoes.pdf','Requisitos Obrigatórios na Elaboração dos Laudos Técnicos');

-- ─── PÁGINA 15: Vistoria do Imóvel ───────────────────────────────────
INSERT INTO avaliacoes_kb_pages(source_file,source_type,page_title,normas_citadas)
VALUES('Apostila_Diniz_Avaliacoes.pdf','pdf','Vistoria do Imóvel (4.6)','{}')
RETURNING id INTO v;
INSERT INTO avaliacoes_kb_topics(page_id,title,content,keywords,category,source_file,page_title)
VALUES
(v,'Vistoria do Imóvel (4.6) — procedimento',
'A vistoria permite ao avaliador conhecer detalhadamente o imóvel avaliando, considerando aspectos físicos, topografia, natureza do solo, condições ambientais, infraestrutura urbana, sistemas viários, coleta de lixo, redes de abastecimento, energia elétrica, telefones, esgotamento sanitário, águas pluviais, transporte coletivo, escolas, comércio, rede bancária, segurança, lazer, hospitais. O avaliador deve caracterizar e descrever a edificação quanto ao padrão construtivo e analisar o projeto imobiliário. No Parecer obrigatoriamente deve constar a data e o turno da vistoria. Caso a vistoria seja acompanhada por pessoas relacionadas ao Parecer, devemos mencioná-las.',
ARRAY['vistoria','imovel','procedimento','avaliador','infraestrutura','data vistoria','turno','topografia','solo'],'formulario',
'Apostila_Diniz_Avaliacoes.pdf','Vistoria do Imóvel (4.6)'),
(v,'Avaliações sem vistoria',
'Em Processos Judiciais onde não se consegue entrar no imóvel, a Avaliação pode ser realizada de forma indireta com base nas informações coletadas no mercado. Se o Juízo determinar que haja vistoria, pode ser emitida autorização judicial com requisição de força policial para acompanhamento do Perito. Nas avaliações extrajudiciais é normal a solicitação com caráter de CONFIDENCIALIDADE onde o Perito não vistoria internamente o imóvel.',
ARRAY['avaliacao sem vistoria','processo judicial','confidencialidade','avaliacao indireta','forca policial'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Vistoria do Imóvel (4.6)'),
(v,'Localização do Imóvel - Principal fator de valor (4.6.1.1)',
'A Localização é o principal Fator na determinação do Valor do Imóvel. Princípio fundamental: vale mais um imóvel simples, obsoleto, limitado, em um ótimo local, do que uma mansão em local sem infraestrutura básica de saneamento, água potável, energia, pavimentação, transportes, conexões, etc.',
ARRAY['localizacao','fator principal','valor','infraestrutura','principio fundamental'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Vistoria do Imóvel (4.6)'),
(v,'Áreas - Hierarquia de fontes para informação de área (4.6.1.2)',
'Hierarquia de preferência para informação de área do imóvel: 1º) Área de Matrícula (Certidão de Inteiro Teor do Registro de Imóveis); 2º) Área de Escritura; 3º) Área de Prefeitura; 4º) Área de Medição — Exata (Técnico de Edificações) ou Aproximada (Perito). Regra: manter a mesma área (Total ou Privativa) durante todo o processo — Amostras, Cálculos, Correções. Se optar pela Área Privativa, usar até o final do Laudo.',
ARRAY['areas','hierarquia','matricula','escritura','prefeitura','medicao','area privativa','area total','consistencia'],'formulario',
'Apostila_Diniz_Avaliacoes.pdf','Vistoria do Imóvel (4.6)'),
(v,'Andar - Valorização por pavimento (4.6.1.3)',
'Prédios com Elevador: Quanto mais alto o apartamento, mais valorizado (exceção se no último andar houver estrutura de lazer e o penúltimo também se beneficiar). 4 Pavimentos sem elevador: O 1º e 2º andares valem mais que o Térreo e o 3º andar.',
ARRAY['andar','pavimento','valorizacao','elevador','apartamento','predio'],'metodologia',
'Apostila_Diniz_Avaliacoes.pdf','Vistoria do Imóvel (4.6)');

RAISE NOTICE 'Importação concluída: 15 páginas e ~37 tópicos inseridos na base de conhecimento.';
END;
$$;
