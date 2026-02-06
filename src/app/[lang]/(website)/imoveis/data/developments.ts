import { Development } from '../types/development';

export const developments: Development[] = [
  // ─── 1. SETAI BEACH RESORT & RESIDENCE ──────────────────────────
  {
    id: 'dev-001',
    slug: 'setai-beach-resort',
    name: 'Setai Beach Resort & Residence',
    developer: 'Setai Grupo GP',
    status: 'launch',
    location: {
      neighborhood: 'Praia de Ponta de Campina',
      city: 'Cabedelo',
      state: 'PB',
      coordinates: { lat: -7.0531, lng: -34.8361 },
    },
    deliveryDate: 'Dezembro 2026',
    registrationNumber: 'R-02-30.697',
    description:
      'Primeiro Resort & Residence do Estado, na área urbana mais valorizada da região metropolitana. Paraíso das águas turmalinas e cristalinas com corais, próximo à famosa Ilha de Areia Vermelha. Área de mais de 22 mil m².',
    shortDescription:
      'Primeiro Resort & Residence do Estado, frente mar em Ponta de Campina com 4 torres e mais de 22 mil m².',
    features: [
      'Frente mar',
      '4 torres',
      'Resort 5 estrelas',
      'Piscinas infinity',
      'Spa',
      'Restaurante',
      'Beach club',
      'Próximo à Ilha de Areia Vermelha',
    ],
    specs: {
      bedroomsRange: '1-4',
      areaRange: '29-251',
      bathroomsRange: '1-5',
      parkingRange: '1-4',
    },
    priceRange: { min: 815000, max: 6068412 },
    images: { main: '', gallery: [] },
    externalLinks: {
      officialSite: 'https://setaigrupogp.com.br/setai-beach-resort-residence',
    },
    units: [
      // Residencial
      { id: 'sbr-r-1', unit: '1', type: 'Garden', area: 173.71, position: 'Norte/Oeste', tower: 'Residencial', totalPrice: 4012701, status: 'available' },
      { id: 'sbr-r-2', unit: '2', type: 'Garden', area: 173.45, position: 'Norte', tower: 'Residencial', totalPrice: 4006695, status: 'available' },
      { id: 'sbr-r-3', unit: '3', type: 'Garden', area: 173.88, position: 'Norte', tower: 'Residencial', totalPrice: 4016628, status: 'available' },
      { id: 'sbr-r-102', unit: '102', type: 'Apartamento', area: 122.43, position: 'Norte', tower: 'Residencial', totalPrice: 2943829, status: 'available' },
      { id: 'sbr-r-103', unit: '103', type: 'Apartamento', area: 122.24, position: 'Norte', tower: 'Residencial', totalPrice: 2939261, status: 'available' },
      { id: 'sbr-r-404', unit: '404', type: 'Cobertura Duplex', area: 237.39, position: 'Norte', tower: 'Residencial', totalPrice: 5732969, status: 'available' },
      { id: 'sbr-r-411', unit: '411', type: 'Apto/Terraço', area: 196.58, position: 'Sul', tower: 'Residencial', totalPrice: 4644203, status: 'available' },
      { id: 'sbr-r-501', unit: '501', type: 'Cobertura Duplex', area: 251.28, position: 'Norte/Oeste', tower: 'Residencial', totalPrice: 6068412, status: 'available' },
      { id: 'sbr-r-502', unit: '502', type: 'Cobertura Duplex', area: 240.97, position: 'Norte', tower: 'Residencial', totalPrice: 5819426, status: 'available' },
      // Flats Torre Norte
      { id: 'sbr-fn-1', unit: '1', type: 'Flat', area: 36.05, tower: 'Torre Norte', totalPrice: 861000, status: 'available' },
      { id: 'sbr-fn-210', unit: '210', type: 'Flat', area: 29.05, tower: 'Torre Norte', totalPrice: 830000, status: 'available' },
      { id: 'sbr-fn-512', unit: '512', type: 'Flat', area: 29.05, tower: 'Torre Norte', totalPrice: 860000, status: 'available' },
      { id: 'sbr-fn-907', unit: '907', type: 'Flat Duplex', area: 55.43, tower: 'Torre Norte', totalPrice: 1296665, status: 'available' },
      { id: 'sbr-fn-908', unit: '908', type: 'Flat Duplex', area: 55.43, tower: 'Torre Norte', totalPrice: 1296665, status: 'available' },
      { id: 'sbr-fn-914', unit: '914', type: 'Flat Duplex', area: 80.01, tower: 'Torre Norte', totalPrice: 1871661, status: 'available' },
      // Flats Torre Sul
      { id: 'sbr-fs-112', unit: '1-12', type: 'Flat Garden', area: 53.55, tower: 'Torre Sul', totalPrice: 1274115, status: 'available' },
      { id: 'sbr-fs-127', unit: '127', type: 'Flat', area: 29.05, tower: 'Torre Sul', totalPrice: 815000, status: 'available' },
      { id: 'sbr-fs-224', unit: '224', type: 'Flat', area: 29.05, tower: 'Torre Sul', totalPrice: 830000, status: 'available' },
      { id: 'sbr-fs-427', unit: '427', type: 'Flat', area: 29.05, tower: 'Torre Sul', totalPrice: 849000, status: 'available' },
      { id: 'sbr-fs-905', unit: '905', type: 'Cobertura Duplex', area: 58.93, tower: 'Torre Sul', totalPrice: 1402121, status: 'available' },
      // Flats Torre Panorâmica
      { id: 'sbr-fp-701', unit: '701*', type: 'Cobertura Duplex', area: 104.46, tower: 'Torre Panorâmica', totalPrice: 2443616, status: 'available' },
    ],
    tags: ['frente-mar', 'resort', 'flat', 'luxo'],
    order: 1,
    isHighlighted: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 2. SETAI BY PININFARINA ────────────────────────────────────
  {
    id: 'dev-002',
    slug: 'setai-pininfarina',
    name: 'Setai by Pininfarina',
    developer: 'Setai Grupo GP',
    status: 'launch',
    location: {
      neighborhood: 'Altiplano Cabo Branco',
      city: 'João Pessoa',
      state: 'PB',
      coordinates: { lat: -7.128, lng: -34.805 },
    },
    deliveryDate: 'Junho 2029',
    registrationNumber: 'R-6-125.933',
    description:
      'Collab com a Pininfarina, brand centenária internacional referência em altíssimo padrão. Design e luxo posicionando a Paraíba no circuito internacional.',
    shortDescription:
      'Design Pininfarina no Altiplano Cabo Branco. 3 torres independentes com luxo de padrão internacional.',
    features: [
      'Design Pininfarina',
      '3 torres independentes',
      'Restaurante na base',
      'Vagas rotativas Torre C',
      'Até 4 vagas Torre A',
      'Altíssimo padrão internacional',
    ],
    specs: {
      bedroomsRange: '1-4',
      areaRange: '27-302',
      parkingRange: '1-4',
    },
    priceRange: { min: 635283, max: 6540344 },
    images: { main: '', gallery: [] },
    externalLinks: {
      officialSite: 'https://setaigrupogp.com.br/setai-residences-design-by-pininfarina/',
    },
    units: [
      // Torre C (Flats)
      { id: 'sp-c-101', unit: 'Flat 101', type: 'Flat', area: 41.31, tower: 'Torre C', totalPrice: 1000983, status: 'available' },
      { id: 'sp-c-104', unit: 'Flat 104', type: 'Flat', area: 31.01, tower: 'Torre C', totalPrice: 730531, status: 'available' },
      { id: 'sp-c-105', unit: 'Flat 105', type: 'Flat', area: 33.07, tower: 'Torre C', totalPrice: 785031, status: 'available' },
      { id: 'sp-c-106', unit: 'Flat 106', type: 'Flat', area: 34.13, tower: 'Torre C', totalPrice: 827004, status: 'available' },
      { id: 'sp-c-107', unit: 'Flat 107', type: 'Flat', area: 27.76, tower: 'Torre C', totalPrice: 635283, status: 'available' },
      // Torre A
      { id: 'sp-a-601', unit: '601', type: 'Apartamento', area: 302.64, tower: 'Torre A', parkingSpots: 4, totalPrice: 5201855, status: 'available' },
      { id: 'sp-a-2001', unit: '2001', type: 'Apartamento', area: 302.64, tower: 'Torre A', parkingSpots: 4, totalPrice: 6327402, status: 'available' },
      { id: 'sp-a-2701', unit: '2701', type: 'Apartamento', area: 302.64, tower: 'Torre A', parkingSpots: 4, totalPrice: 6540344, status: 'available' },
      // Torre B
      { id: 'sp-b-301', unit: '301', type: 'Apartamento', area: 145.34, tower: 'Torre B', parkingSpots: 3, totalPrice: 2668994, status: 'available' },
      { id: 'sp-b-303', unit: '303', type: 'Apartamento', area: 76.63, tower: 'Torre B', parkingSpots: 2, totalPrice: 1407218, status: 'available' },
      { id: 'sp-b-3001', unit: '3001', type: 'Apartamento', area: 145.34, tower: 'Torre B', parkingSpots: 3, totalPrice: 3162178, status: 'available' },
    ],
    tags: ['luxo', 'design'],
    order: 2,
    isHighlighted: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 3. HERITAGE ONE ────────────────────────────────────────────
  {
    id: 'dev-003',
    slug: 'heritage-one',
    name: 'Heritage One',
    developer: 'Setai Grupo GP',
    status: 'launch',
    location: {
      neighborhood: 'Bessa (Aeroclube)',
      city: 'João Pessoa',
      state: 'PB',
      coordinates: { lat: -7.0982, lng: -34.8377 },
      address: 'Rua Emanoel Orlando de Figueiredo Lima, Bessa',
    },
    deliveryDate: 'Junho 2028',
    registrationNumber: 'R-5-119.602',
    description:
      'Linha Heritage do Setai Grupo GP. Localização premium na Rua Emanoel Orlando de Figueiredo Lima, Bessa.',
    shortDescription:
      'Linha Heritage no Bessa. Apartamentos de 91 a 98m² com localização premium.',
    features: [
      'Linha Heritage',
      'Localização premium no Bessa',
      '2 vagas de garagem',
      'Posição nascente',
    ],
    specs: {
      bedroomsRange: '3',
      areaRange: '91-98',
      parkingRange: '2',
    },
    priceRange: { min: 1082931, max: 1448343 },
    images: { main: '', gallery: [] },
    externalLinks: {
      officialSite: 'https://setaigrupogp.com.br/linha-heritage/',
    },
    units: [
      { id: 'ho-401', unit: '401', type: 'Apartamento', area: 98.67, position: 'Nasc/Norte', parkingSpots: 2, totalPrice: 1163847, status: 'available' },
      { id: 'ho-402', unit: '402', type: 'Apartamento', area: 91.81, position: 'Nasc/Sul', parkingSpots: 2, totalPrice: 1082931, status: 'available' },
      { id: 'ho-501', unit: '501', type: 'Apartamento', area: 98.67, position: 'Nasc/Norte', parkingSpots: 2, totalPrice: 1176778, status: 'available' },
      { id: 'ho-602', unit: '602', type: 'Apartamento', area: 91.81, position: 'Nasc/Sul', parkingSpots: 2, totalPrice: 1106996, status: 'available' },
      { id: 'ho-1101', unit: '1101', type: 'Apartamento', area: 98.67, position: 'Nasc/Norte', parkingSpots: 2, totalPrice: 1370753, status: 'available' },
      { id: 'ho-1102', unit: '1102', type: 'Apartamento', area: 91.81, position: 'Nasc/Sul', parkingSpots: 2, totalPrice: 1275452, status: 'available' },
      { id: 'ho-1201', unit: '1201', type: 'Apartamento', area: 98.67, position: 'Nasc/Norte', parkingSpots: 2, totalPrice: 1383684, status: 'available' },
      { id: 'ho-1202', unit: '1202', type: 'Apartamento', area: 91.81, position: 'Nasc/Sul', parkingSpots: 2, totalPrice: 1287484, status: 'available' },
      { id: 'ho-1302', unit: '1302', type: 'Apartamento', area: 91.81, position: 'Nasc/Sul', parkingSpots: 2, totalPrice: 1299517, status: 'available' },
      { id: 'ho-1402', unit: '1402', type: 'Apartamento', area: 91.81, position: 'Nasc/Sul', parkingSpots: 2, totalPrice: 1311549, status: 'available' },
      { id: 'ho-1501', unit: '1501', type: 'Apartamento', area: 98.67, position: 'Nasc/Norte', parkingSpots: 2, totalPrice: 1422479, status: 'available' },
      { id: 'ho-1502', unit: '1502', type: 'Apartamento', area: 91.81, position: 'Nasc/Sul', parkingSpots: 2, totalPrice: 1323582, status: 'available' },
      { id: 'ho-1601', unit: '1601', type: 'Apartamento', area: 98.67, position: 'Nasc/Norte', parkingSpots: 2, totalPrice: 1435411, status: 'available' },
      { id: 'ho-1701', unit: '1701', type: 'Apartamento', area: 98.67, position: 'Nasc/Norte', parkingSpots: 2, totalPrice: 1448343, status: 'available' },
    ],
    tags: ['heritage'],
    order: 3,
    isHighlighted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 4. SETAI AURUS ─────────────────────────────────────────────
  {
    id: 'dev-004',
    slug: 'setai-aurus',
    name: 'Setai Aurus',
    developer: 'Setai Grupo GP',
    status: 'launch',
    location: {
      neighborhood: 'Areia Dourada',
      city: 'Cabedelo',
      state: 'PB',
      coordinates: { lat: -7.056, lng: -34.835 },
    },
    deliveryDate: 'Junho 2028',
    description:
      'Inspirado na cor da areia "dourada" e no próprio ouro. Localização privilegiada próximo à Ilha de Areia Dourada que emerge diariamente sobre o oceano.',
    shortDescription:
      'Inspirado no ouro, próximo à Ilha de Areia Dourada. Apartamentos de 69 a 230m² em Cabedelo.',
    features: [
      'Próximo à Ilha de Areia Dourada',
      'Localização privilegiada',
      'Inspiração no ouro',
      'Vista para o oceano',
    ],
    specs: {
      bedroomsRange: '2-3',
      areaRange: '69-230',
    },
    priceRange: { min: 1665507, max: 7564704 },
    images: { main: '', gallery: [] },
    externalLinks: {
      officialSite: 'https://setaigrupogp.com.br/setai-aurus/',
    },
    units: [
      { id: 'sa-g02', unit: 'Garden 02', type: '3 Suítes', area: 230.14, totalPrice: 7564704, status: 'available' },
      { id: 'sa-102', unit: '102', type: '2 Suítes', area: 69.18, totalPrice: 1665507, status: 'available' },
      { id: 'sa-401', unit: '401', type: '3 Suítes + DCE', area: 124.93, totalPrice: 2900270, status: 'available' },
      { id: 'sa-402', unit: '402', type: '2 Suítes', area: 107.92, totalPrice: 2505543, status: 'available' },
    ],
    tags: ['frente-mar'],
    order: 4,
    isHighlighted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 5. SETAI HOUSES RESORT ─────────────────────────────────────
  {
    id: 'dev-005',
    slug: 'setai-houses',
    name: 'Setai Houses Resort',
    developer: 'Setai Grupo GP',
    status: 'launch',
    location: {
      neighborhood: 'Praia de Intermares',
      city: 'Cabedelo',
      state: 'PB',
      coordinates: { lat: -7.0615, lng: -34.842 },
    },
    deliveryDate: 'Dezembro 2026',
    registrationNumber: 'R-02-39.466',
    description:
      'Primeiro condomínio de casas inspirado em resorts e hotelarias 5 estrelas do Nordeste. Releitura dos melhores projetos de João Armentano, Alex Hanazaki e Leonardo Maia.',
    shortDescription:
      'Condomínio de casas resort 5 estrelas em Intermares. Casas de 294 a 365m².',
    features: [
      'Casas de alto padrão',
      'Inspirado em resorts 5 estrelas',
      'Projetos de referência nacional',
      'Condomínio fechado',
      '2 vagas de garagem',
    ],
    specs: {
      bedroomsRange: '3-4',
      areaRange: '294-365',
      parkingRange: '2',
    },
    priceRange: { min: 2396613, max: 3318908 },
    images: { main: '', gallery: [] },
    externalLinks: {
      officialSite: 'https://setaigrupogp.com.br/setai-houses-resort',
    },
    units: [
      { id: 'sh-a', unit: 'Casa Tipo A', type: 'Casa', area: 314, parkingSpots: 2, totalPrice: 2509164, status: 'available' },
      { id: 'sh-b', unit: 'Casa Tipo B', type: 'Casa', area: 304, parkingSpots: 2, totalPrice: 2396613, status: 'available' },
      { id: 'sh-c', unit: 'Casa Tipo C', type: 'Casa', area: 324, parkingSpots: 2, totalPrice: 2509164, status: 'available' },
      { id: 'sh-d', unit: 'Casa Tipo D', type: 'Casa', area: 365, parkingSpots: 2, totalPrice: 3318908, status: 'available' },
    ],
    tags: ['casas', 'resort'],
    order: 5,
    isHighlighted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 6. SETAI MIRAJ ─────────────────────────────────────────────
  {
    id: 'dev-006',
    slug: 'setai-miraj',
    name: 'Setai Miraj',
    developer: 'Setai Grupo GP',
    status: 'launch',
    location: {
      neighborhood: 'Jardim Oceania (Bessa)',
      city: 'João Pessoa',
      state: 'PB',
      coordinates: { lat: -7.1015, lng: -34.83 },
    },
    deliveryDate: 'Dezembro 2026',
    registrationNumber: 'R-3-147.418',
    description:
      'THE NEW VISION. Inspiração aerodinâmica do caça francês Mirage, visual leve com aletas em forma de asas, vistas 360°.',
    shortDescription:
      'Inspiração aerodinâmica com vistas 360° no Jardim Oceania. Apartamentos de 76 a 124m².',
    features: [
      'Design aerodinâmico',
      'Vistas 360°',
      'Aletas em forma de asas',
      'Jardim Oceania',
    ],
    specs: {
      bedroomsRange: '2-3',
      areaRange: '76-124',
    },
    priceRange: { min: 1340333, max: 2149143 },
    images: { main: '', gallery: [] },
    externalLinks: {
      officialSite: 'https://setaigrupogp.com.br/setai-miraj',
    },
    units: [
      { id: 'sm-301', unit: '301', type: 'Apartamento', area: 124.42, position: 'Nasc/Sul', totalPrice: 2117186, status: 'available' },
      { id: 'sm-303', unit: '303', type: 'Apartamento', area: 76.64, position: 'Nascente', totalPrice: 1340333, status: 'available' },
      { id: 'sm-401', unit: '401', type: 'Apartamento', area: 124.42, position: 'Nasc/Sul', totalPrice: 2122479, status: 'available' },
      { id: 'sm-403', unit: '403', type: 'Apartamento', area: 76.64, position: 'Nascente', totalPrice: 1347035, status: 'available' },
      { id: 'sm-503', unit: '503', type: 'Apartamento', area: 76.64, position: 'Nascente', totalPrice: 1353770, status: 'available' },
      { id: 'sm-901', unit: '901', type: 'Apartamento', area: 124.42, position: 'Nasc/Sul', totalPrice: 2149143, status: 'available' },
    ],
    tags: [],
    order: 6,
    isHighlighted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 7. SETAI SAILOR ────────────────────────────────────────────
  {
    id: 'dev-007',
    slug: 'setai-sailor',
    name: 'Setai Sailor',
    developer: 'Setai Grupo GP',
    status: 'launch',
    location: {
      neighborhood: 'Praia do Poço',
      city: 'Cabedelo',
      state: 'PB',
      coordinates: { lat: -7.0485, lng: -34.8375 },
    },
    deliveryDate: 'Junho 2028',
    description:
      'Inspirado no mundo náutico dos grandes veleiros. 73 unidades compactas, 3 espaços comerciais gastronômicos e rooftop surreal.',
    shortDescription:
      'Inspiração náutica na Praia do Poço. Unidades compactas de 26 a 48m² com rooftop.',
    features: [
      'Inspiração náutica',
      '73 unidades compactas',
      '3 espaços gastronômicos',
      'Rooftop',
      'Praia do Poço',
    ],
    specs: {
      bedroomsRange: '1',
      areaRange: '26-48',
    },
    priceRange: { min: 582247, max: 1120084 },
    images: { main: '', gallery: [] },
    externalLinks: {
      officialSite: 'https://setaigrupogp.com.br/setai-sailor',
    },
    units: [
      { id: 'ss-01g', unit: '01 Garden', type: 'Garden', area: 40.09, position: 'Sul', totalPrice: 822684, status: 'available' },
      { id: 'ss-0204g', unit: '02-04 Garden', type: 'Garden', area: 48.51, position: 'Sul', totalPrice: 995471, status: 'available' },
      { id: 'ss-408', unit: '408', type: 'Apartamento', area: 36.69, position: 'Nascente', totalPrice: 1120084, status: 'available' },
      { id: 'ss-214', unit: '214', type: 'Apartamento', area: 26.6, position: 'Norte', totalPrice: 582247, status: 'available' },
    ],
    tags: ['compacto'],
    order: 7,
    isHighlighted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 8. PRONTA ENTREGA — SETAI YACHT ───────────────────────────
  {
    id: 'dev-008',
    slug: 'setai-yacht',
    name: 'Setai Yacht',
    developer: 'Setai Grupo GP',
    status: 'ready',
    location: {
      neighborhood: 'Cabo Branco',
      city: 'João Pessoa',
      state: 'PB',
      coordinates: { lat: -7.1305, lng: -34.8095 },
    },
    description: 'Empreendimento Setai Yacht em Cabo Branco, João Pessoa. Unidade pronta para entrega.',
    shortDescription: 'Flat pronto em Cabo Branco. 31m², pronta entrega.',
    features: ['Pronta entrega', 'Cabo Branco'],
    specs: {
      bedroomsRange: '1',
      areaRange: '31',
    },
    priceRange: { min: 783500, max: 783500 },
    images: { main: '', gallery: [] },
    units: [
      { id: 'sy-302', unit: '302', type: 'Flat', area: 31.34, position: 'Norte', totalPrice: 783500, status: 'available' },
    ],
    tags: ['pronta-entrega', 'flat'],
    order: 10,
    isHighlighted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 9. PRONTA ENTREGA — SETAI EDITION ─────────────────────────
  {
    id: 'dev-009',
    slug: 'setai-edition',
    name: 'Setai Edition',
    developer: 'Setai Grupo GP',
    status: 'ready',
    location: {
      neighborhood: 'Cabo Branco',
      city: 'João Pessoa',
      state: 'PB',
      coordinates: { lat: -7.1310, lng: -34.8090 },
    },
    description: 'Empreendimento Setai Edition em Cabo Branco, João Pessoa. Unidade pronta para entrega.',
    shortDescription: 'Flat pronto em Cabo Branco. 30m², pronta entrega.',
    features: ['Pronta entrega', 'Cabo Branco'],
    specs: {
      bedroomsRange: '1',
      areaRange: '30',
    },
    priceRange: { min: 782500, max: 782500 },
    images: { main: '', gallery: [] },
    units: [
      { id: 'se-3', unit: '3', type: 'Flat', area: 30.9, position: 'Norte', totalPrice: 782500, status: 'available' },
    ],
    tags: ['pronta-entrega', 'flat'],
    order: 11,
    isHighlighted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 10. PRONTA ENTREGA — SETAI AQUAMARIS ──────────────────────
  {
    id: 'dev-010',
    slug: 'setai-aquamaris',
    name: 'Setai Aquamaris',
    developer: 'Setai Grupo GP',
    status: 'ready',
    location: {
      neighborhood: 'Bessa',
      city: 'João Pessoa',
      state: 'PB',
      coordinates: { lat: -7.0980, lng: -34.8370 },
    },
    description: 'Empreendimento Setai Aquamaris no Bessa, João Pessoa. Unidades garden prontas para entrega.',
    shortDescription: 'Gardens prontos no Bessa. De 21 a 34m², pronta entrega.',
    features: ['Pronta entrega', 'Bessa', 'Garden'],
    specs: {
      bedroomsRange: '1',
      areaRange: '21-34',
    },
    priceRange: { min: 567000, max: 931500 },
    images: { main: '', gallery: [] },
    units: [
      { id: 'saq-g01', unit: 'Garden 01', type: 'Garden', area: 34.5, totalPrice: 931500, status: 'available' },
      { id: 'saq-g08', unit: 'Garden 08', type: 'Garden', area: 21.0, totalPrice: 567000, status: 'available' },
    ],
    tags: ['pronta-entrega', 'flat'],
    order: 12,
    isHighlighted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },

  // ─── 11. PRONTA ENTREGA — SETAI SANDRO BARROS ──────────────────
  {
    id: 'dev-011',
    slug: 'setai-sandro-barros',
    name: 'Setai Sandro Barros',
    developer: 'Setai Grupo GP',
    status: 'ready',
    location: {
      neighborhood: 'Cabo Branco',
      city: 'João Pessoa',
      state: 'PB',
      coordinates: { lat: -7.1300, lng: -34.8100 },
    },
    description: 'Empreendimento Setai Sandro Barros em Cabo Branco, João Pessoa. 10 unidades prontas para entrega com metragens de 22 a 92m².',
    shortDescription: 'Cabo Branco, 10 unidades de 22 a 92m². Pronta entrega.',
    features: ['Pronta entrega', 'Cabo Branco', '10 unidades disponíveis'],
    specs: {
      bedroomsRange: '1-3',
      areaRange: '22-92',
    },
    priceRange: { min: 599000, max: 2310250 },
    images: { main: '', gallery: [] },
    units: [
      { id: 'ssb-min', unit: 'Unidade Compacta', type: 'Flat', area: 22.95, totalPrice: 599000, status: 'available' },
      { id: 'ssb-max', unit: 'Unidade Premium', type: 'Apartamento', area: 92.41, totalPrice: 2310250, status: 'available' },
    ],
    tags: ['pronta-entrega'],
    order: 13,
    isHighlighted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-06',
  },
];

export function getDevelopmentBySlug(slug: string): Development | undefined {
  return developments.find((d) => d.slug === slug);
}

export function getDevelopmentsByStatus(status: Development['status']): Development[] {
  return developments.filter((d) => d.status === status);
}

export function getDevelopmentsByTag(tag: string): Development[] {
  return developments.filter((d) => d.tags.includes(tag));
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}
