// src/types/contratos.ts

export type ContratoIdioma = 'pt' | 'en' | 'es' | 'ar' | 'ja'
export type ContratoStatus =
  | 'rascunho' | 'gerado' | 'aguardando_assinatura'
  | 'assinado_parcial' | 'assinado' | 'cancelado' | 'expirado'
export type ContratoCategoria =
  | 'locacao' | 'venda' | 'captacao' | 'avaliacao' | 'credito'
  | 'consultoria' | 'prestacao_servicos' | 'parceria'
  | 'gestao_patrimonial' | 'fundo_investimento' | 'internacional' | 'outros'

export interface ModeloContrato {
  id: string
  categoria: ContratoCategoria
  nome: string
  nome_en?: string
  descricao: string
  jurisdicao: 'BR' | 'US' | 'AE' | 'JP' | 'ES' | 'INTL'
  idiomas: ContratoIdioma[]
  campos: CampoContrato[]
  tags: string[]
  popular?: boolean
  internacional?: boolean
  icon: string
  cor: string
}

export interface CampoContrato {
  key: string
  label: string
  tipo: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'currency' | 'cpf' | 'cnpj' | 'cep' | 'phone'
  placeholder?: string
  required: boolean
  section: 'contratante' | 'contratado' | 'objeto' | 'valores' | 'prazos' | 'condicoes' | 'garantias'
  opcoes?: string[]
  width?: 'full' | 'half' | 'third'
}

export interface Parte {
  nome: string
  cpf_cnpj?: string
  tipo: 'pessoa_fisica' | 'pessoa_juridica'
  email: string
  telefone?: string
  endereco?: string
  cep?: string
  cidade?: string
  estado?: string
  nacionalidade?: string
  estado_civil?: string
  profissao?: string
  razao_social?: string
  representante?: string
  cargo_representante?: string
}

export interface ContratoGerado {
  id: string
  numero: string
  modelo_id: string
  modelo_nome: string
  categoria: ContratoCategoria
  status: ContratoStatus
  idioma_primario: ContratoIdioma
  idiomas_adicionais?: ContratoIdioma[]
  contratante: Parte
  contratado: Parte
  dados_contrato: Record<string, any>
  conteudo_markdown?: string
  conteudo_adicional?: Partial<Record<ContratoIdioma, string>>
  pdf_url?: string
  docx_url?: string
  criado_por: string
  criado_por_nome: string
  criado_em: string
  atualizado_em: string
  assinatura_provider?: 'govbr' | 'clicksign' | null
  govbr_protocolo?: string
  clicksign_key?: string
  signatarios?: Signatario[]
  notas?: string
}

export interface Signatario {
  nome: string
  email: string
  cpf?: string
  telefone?: string
  papel: 'contratante' | 'contratado' | 'testemunha' | 'avalista'
  status: 'pendente' | 'assinou' | 'recusou'
  assinou_em?: string
  provider?: 'govbr' | 'clicksign'
}

export type IntegracaoStatus = 'conectado' | 'desconectado' | 'erro' | 'pendente' | 'nao_configurado'
export type IntegracaoCategoria =
  | 'assinatura_digital' | 'email' | 'whatsapp'
  | 'armazenamento' | 'redes_sociais' | 'google' | 'pagamento' | 'crm'

export interface Integracao {
  id: string
  nome: string
  descricao: string
  categoria: IntegracaoCategoria
  icon: string
  cor: string
  status: IntegracaoStatus
  docs_url?: string
  campos_config: CampoConfig[]
  requer_oauth?: boolean
  gratuito?: boolean
  plano_minimo?: string
}

export interface CampoConfig {
  key: string
  label: string
  tipo: 'text' | 'password' | 'url' | 'select'
  placeholder?: string
  required: boolean
  descricao?: string
  opcoes?: string[]
  masked?: boolean
}
