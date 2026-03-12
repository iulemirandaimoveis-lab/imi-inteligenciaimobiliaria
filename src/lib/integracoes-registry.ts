// src/lib/integracoes-registry.ts
// ── Registro completo de integrações IMI ─────────────
// Adicione novas integrações aqui. O hub lê este arquivo.

import type { Integracao } from '@/types/contratos'

export const INTEGRACOES: Integracao[] = [

  // ══════════════════════════════════════════════════
  // ASSINATURA DIGITAL
  // ══════════════════════════════════════════════════
  {
    id: 'govbr',
    nome: 'Gov.br — Assinatura Digital',
    descricao: 'Assinatura eletrônica qualificada ICP-Brasil, juridicamente válida em todo território nacional. Gratuita para CPF com conta Gov.br nível Prata ou Ouro.',
    categoria: 'assinatura_digital',
    icon: 'Shield',
    cor: '#1351B4',
    status: 'nao_configurado',
    gratuito: true,
    docs_url: 'https://www.gov.br/governodigital/pt-br/assinatura-eletronica',
    requer_oauth: true,
    campos_config: [
      {
        key: 'govbr_client_id',
        label: 'Client ID',
        tipo: 'text',
        placeholder: 'Obtido no Portal de Serviços Gov.br',
        required: true,
        descricao: 'Solicite credenciais em https://www.gov.br/governodigital/pt-br/acesso-governo/solicitacao-de-credenciais',
      },
      {
        key: 'govbr_client_secret',
        label: 'Client Secret',
        tipo: 'password',
        required: true,
        masked: true,
        descricao: 'Mantenha em segredo — nunca exposto ao front-end.',
      },
      {
        key: 'govbr_redirect_uri',
        label: 'Redirect URI',
        tipo: 'url',
        placeholder: 'https://seudominio.com/api/auth/govbr/callback',
        required: true,
        descricao: 'URL de callback registrada no Portal Gov.br.',
      },
      {
        key: 'govbr_environment',
        label: 'Ambiente',
        tipo: 'select',
        opcoes: ['staging', 'production'],
        required: true,
        descricao: 'staging = homologação, production = produção real.',
      },
    ],
  },

  {
    id: 'clicksign',
    nome: 'ClickSign',
    descricao: 'Plataforma de assinatura eletrônica mais usada no Brasil. Integra nativamente com WhatsApp, email e PIX. API REST com webhooks em tempo real.',
    categoria: 'assinatura_digital',
    icon: 'PenTool',
    cor: '#6B2FD9',
    status: 'nao_configurado',
    plano_minimo: 'R$ 99/mês',
    docs_url: 'https://developers.clicksign.com/docs',
    campos_config: [
      {
        key: 'clicksign_access_token',
        label: 'Access Token',
        tipo: 'password',
        placeholder: 'Obtido em app.clicksign.com → Configurações → API',
        required: true,
        masked: true,
        descricao: 'Token de acesso à API ClickSign.',
      },
      {
        key: 'clicksign_environment',
        label: 'Ambiente',
        tipo: 'select',
        opcoes: ['sandbox', 'production'],
        required: true,
        descricao: 'sandbox = testes grátis, production = produção real.',
      },
      {
        key: 'clicksign_webhook_url',
        label: 'Webhook URL (opcional)',
        tipo: 'url',
        placeholder: 'https://seudominio.com/api/contratos/webhook',
        required: false,
        descricao: 'URL para receber notificações de assinatura em tempo real.',
      },
    ],
  },

  // ══════════════════════════════════════════════════
  // EMAIL
  // ══════════════════════════════════════════════════
  {
    id: 'resend',
    nome: 'Resend',
    descricao: 'Serviço de envio de emails transacionais via API. Suporte a domínio próprio, templates React e analytics de abertura. 3.000 emails/mês grátis.',
    categoria: 'email',
    icon: 'Mail',
    cor: '#000000',
    status: 'nao_configurado',
    gratuito: true,
    docs_url: 'https://resend.com/docs',
    campos_config: [
      {
        key: 'resend_api_key',
        label: 'API Key',
        tipo: 'password',
        placeholder: 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        masked: true,
      },
      {
        key: 'resend_from_email',
        label: 'Email remetente padrão',
        tipo: 'text',
        placeholder: 'contratos@imi.imb.br',
        required: true,
        descricao: 'Domínio deve estar verificado no Resend.',
      },
      {
        key: 'resend_from_name',
        label: 'Nome remetente padrão',
        tipo: 'text',
        placeholder: 'IMI Inteligência Imobiliária',
        required: true,
      },
    ],
  },

  {
    id: 'smtp',
    nome: 'SMTP Próprio',
    descricao: 'Use seu próprio servidor SMTP (Gmail, Outlook, Hostinger, etc.) para envio de emails.',
    categoria: 'email',
    icon: 'Server',
    cor: '#4A90E2',
    status: 'nao_configurado',
    gratuito: true,
    campos_config: [
      { key: 'smtp_host',     label: 'Host SMTP',      tipo: 'text',     placeholder: 'smtp.gmail.com',   required: true },
      { key: 'smtp_port',     label: 'Porta',          tipo: 'text',     placeholder: '587',               required: true },
      { key: 'smtp_user',     label: 'Usuário',        tipo: 'text',     placeholder: 'seu@email.com',     required: true },
      { key: 'smtp_password', label: 'Senha / App Password', tipo: 'password', required: true, masked: true },
      { key: 'smtp_secure',   label: 'Criptografia',   tipo: 'select',   opcoes: ['TLS', 'SSL', 'None'],   required: true },
    ],
  },

  // ══════════════════════════════════════════════════
  // WHATSAPP
  // ══════════════════════════════════════════════════
  {
    id: 'evolution_api',
    nome: 'Evolution API (WhatsApp)',
    descricao: 'API WhatsApp open-source auto-hospedada. Envia mensagens, documentos e links de assinatura diretamente pelo WhatsApp.',
    categoria: 'whatsapp',
    icon: 'MessageCircle',
    cor: '#25D366',
    status: 'nao_configurado',
    gratuito: true,
    docs_url: 'https://doc.evolution-api.com/',
    campos_config: [
      {
        key: 'evolution_api_url',
        label: 'URL da API',
        tipo: 'url',
        placeholder: 'https://evolution.seudominio.com',
        required: true,
      },
      {
        key: 'evolution_api_key',
        label: 'API Key',
        tipo: 'password',
        required: true,
        masked: true,
      },
      {
        key: 'evolution_instance',
        label: 'Nome da instância',
        tipo: 'text',
        placeholder: 'IMI',
        required: true,
      },
    ],
  },

  {
    id: 'zapi',
    nome: 'Z-API (WhatsApp)',
    descricao: 'Plataforma brasileira para automação WhatsApp. Simples de configurar, suporte a webhooks e envio de mídias.',
    categoria: 'whatsapp',
    icon: 'MessageCircle',
    cor: '#25D366',
    status: 'nao_configurado',
    plano_minimo: 'R$ 99/mês',
    docs_url: 'https://developer.z-api.io/',
    campos_config: [
      { key: 'zapi_instance',  label: 'Instance ID', tipo: 'text',     required: true },
      { key: 'zapi_token',     label: 'Token',       tipo: 'password', required: true, masked: true },
      { key: 'zapi_client_id', label: 'Client Token',tipo: 'password', required: true, masked: true },
    ],
  },

  // ══════════════════════════════════════════════════
  // ARMAZENAMENTO
  // ══════════════════════════════════════════════════
  {
    id: 'google_drive',
    nome: 'Google Drive',
    descricao: 'Salva automaticamente todos os contratos gerados em uma pasta do Google Drive. Suporte a Service Account (sem interação manual) ou OAuth pessoal.',
    categoria: 'armazenamento',
    icon: 'HardDrive',
    cor: '#4285F4',
    status: 'nao_configurado',
    gratuito: true,
    docs_url: 'https://developers.google.com/drive/api',
    requer_oauth: true,
    campos_config: [
      {
        key: 'gdrive_mode',
        label: 'Modo de autenticação',
        tipo: 'select',
        opcoes: ['service_account', 'oauth_pessoal'],
        required: true,
        descricao: 'service_account = automático (recomendado para produção). oauth_pessoal = conecta sua conta Google.',
      },
      {
        key: 'gdrive_service_account_json',
        label: 'Service Account JSON',
        tipo: 'textarea' as any,
        placeholder: '{ "type": "service_account", "project_id": "..." }',
        required: false,
        descricao: 'Apenas para modo service_account. Cole o JSON completo da Service Account.',
      },
      {
        key: 'gdrive_folder_id',
        label: 'ID da pasta no Drive',
        tipo: 'text',
        placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
        required: true,
        descricao: 'ID da pasta onde os contratos serão salvos. Encontre na URL do Drive.',
      },
    ],
  },

  {
    id: 'supabase_storage',
    nome: 'Supabase Storage',
    descricao: 'Armazenamento interno do projeto — já configurado. Contratos são salvos no bucket "contratos/" automaticamente.',
    categoria: 'armazenamento',
    icon: 'Database',
    cor: '#3ECF8E',
    status: 'conectado', // sempre ativo — é o storage nativo
    gratuito: true,
    campos_config: [], // configurado via SUPABASE_URL/KEY no .env
  },

  // ══════════════════════════════════════════════════
  // GOOGLE
  // ══════════════════════════════════════════════════
  {
    id: 'google_calendar',
    nome: 'Google Calendar',
    descricao: 'Cria eventos automáticos para prazos de assinatura, vencimentos e follow-ups de contratos.',
    categoria: 'google',
    icon: 'Calendar',
    cor: '#4285F4',
    status: 'nao_configurado',
    gratuito: true,
    requer_oauth: true,
    campos_config: [
      { key: 'gcal_client_id',     label: 'Client ID',     tipo: 'text',     required: true },
      { key: 'gcal_client_secret', label: 'Client Secret', tipo: 'password', required: true, masked: true },
      { key: 'gcal_calendar_id',   label: 'Calendar ID',   tipo: 'text',     placeholder: 'primary', required: true },
    ],
  },

  {
    id: 'google_analytics',
    nome: 'Google Analytics 4',
    descricao: 'Rastreamento de uso da plataforma — páginas mais acessadas, funil de contratos e comportamento de usuários.',
    categoria: 'google',
    icon: 'BarChart2',
    cor: '#E37400',
    status: 'nao_configurado',
    gratuito: true,
    campos_config: [
      { key: 'ga4_measurement_id', label: 'Measurement ID', tipo: 'text', placeholder: 'G-XXXXXXXXXX', required: true },
    ],
  },

  // ══════════════════════════════════════════════════
  // REDES SOCIAIS / META
  // ══════════════════════════════════════════════════
  {
    id: 'meta_ads',
    nome: 'Meta Ads (Facebook & Instagram)',
    descricao: 'Integração com Meta Ads Manager para campanhas de captação de leads e imóveis. Gestão de pixel, audiências e relatórios.',
    categoria: 'redes_sociais',
    icon: 'Facebook',
    cor: '#0866FF',
    status: 'nao_configurado',
    docs_url: 'https://developers.facebook.com/docs/marketing-apis',
    campos_config: [
      { key: 'meta_access_token', label: 'Access Token',   tipo: 'password', required: true, masked: true },
      { key: 'meta_ad_account',   label: 'Ad Account ID',  tipo: 'text', placeholder: 'act_XXXXXXXXXX', required: true },
      { key: 'meta_pixel_id',     label: 'Pixel ID',       tipo: 'text', required: false },
      { key: 'meta_page_id',      label: 'Page ID',        tipo: 'text', required: false },
    ],
  },

  {
    id: 'instagram',
    nome: 'Instagram Business',
    descricao: 'Publicação de imóveis, relatórios de engajamento e gestão de mensagens diretas via API.',
    categoria: 'redes_sociais',
    icon: 'Instagram',
    cor: '#E1306C',
    status: 'nao_configurado',
    campos_config: [
      { key: 'instagram_access_token', label: 'Access Token',    tipo: 'password', required: true, masked: true },
      { key: 'instagram_account_id',   label: 'Business Account ID', tipo: 'text', required: true },
    ],
  },

  {
    id: 'linkedin_ads',
    nome: 'LinkedIn Ads',
    descricao: 'Campanhas de anúncios imobiliários no LinkedIn. Ideal para empreendimentos corporativos, lajes comerciais e investidores qualificados.',
    categoria: 'redes_sociais',
    icon: 'Linkedin',
    cor: '#0A66C2',
    status: 'nao_configurado',
    docs_url: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
    campos_config: [
      { key: 'linkedin_access_token', label: 'Access Token', tipo: 'password', required: true, masked: true, descricao: 'Token de acesso OAuth 2.0 do LinkedIn Marketing API.' },
      { key: 'linkedin_ad_account',   label: 'Ad Account ID', tipo: 'text', placeholder: 'urn:li:sponsoredAccount:XXXXXXX', required: true, descricao: 'ID da conta de anúncios no Campaign Manager.' },
      { key: 'linkedin_org_id',       label: 'Organization ID', tipo: 'text', placeholder: 'urn:li:organization:XXXXXXX', required: false, descricao: 'ID da organização (página da empresa) no LinkedIn.' },
    ],
  },

  {
    id: 'tiktok_ads',
    nome: 'TikTok Ads',
    descricao: 'Campanhas de imóveis no TikTok — vídeos curtos, carrossel e lead forms. Alcance massivo para público jovem e primeiro imóvel.',
    categoria: 'redes_sociais',
    icon: 'Music2',
    cor: '#000000',
    status: 'nao_configurado',
    docs_url: 'https://business-api.tiktok.com/portal/docs',
    campos_config: [
      { key: 'tiktok_access_token',  label: 'Access Token',   tipo: 'password', required: true, masked: true, descricao: 'Token de acesso do TikTok for Business API.' },
      { key: 'tiktok_advertiser_id', label: 'Advertiser ID',  tipo: 'text', placeholder: 'XXXXXXXXXXXXXXXXX', required: true, descricao: 'ID do anunciante no TikTok Ads Manager.' },
      { key: 'tiktok_pixel_id',      label: 'Pixel ID',       tipo: 'text', required: false, descricao: 'ID do TikTok Pixel para rastreamento de conversões.' },
    ],
  },

  // ══════════════════════════════════════════════════
  // PAGAMENTO
  // ══════════════════════════════════════════════════
  {
    id: 'stripe',
    nome: 'Stripe',
    descricao: 'Pagamentos internacionais — cobranças de honorários, assinaturas de plano e gestão de clientes internacionais (USD, AED, EUR).',
    categoria: 'pagamento',
    icon: 'CreditCard',
    cor: '#635BFF',
    status: 'nao_configurado',
    docs_url: 'https://stripe.com/docs/api',
    campos_config: [
      { key: 'stripe_publishable_key', label: 'Publishable Key', tipo: 'text',     required: true, placeholder: 'pk_live_...' },
      { key: 'stripe_secret_key',      label: 'Secret Key',      tipo: 'password', required: true, masked: true, placeholder: 'sk_live_...' },
      { key: 'stripe_webhook_secret',  label: 'Webhook Secret',  tipo: 'password', required: false, masked: true },
    ],
  },

  {
    id: 'mercadopago',
    nome: 'Mercado Pago',
    descricao: 'Pagamentos nacionais — PIX, boleto e cartão. Cobranças de honorários para clientes brasileiros.',
    categoria: 'pagamento',
    icon: 'CreditCard',
    cor: '#009EE3',
    status: 'nao_configurado',
    docs_url: 'https://www.mercadopago.com.br/developers/pt/docs',
    campos_config: [
      { key: 'mp_access_token', label: 'Access Token', tipo: 'password', required: true, masked: true },
      { key: 'mp_public_key',   label: 'Public Key',   tipo: 'text',     required: true },
    ],
  },

  // ══════════════════════════════════════════════════
  // CRM / OUTROS
  // ══════════════════════════════════════════════════
  {
    id: 'n8n',
    nome: 'n8n (Automações)',
    descricao: 'Plataforma de automação open-source. Conecta IMI a qualquer serviço externo via webhooks e fluxos visuais.',
    categoria: 'crm',
    icon: 'Zap',
    cor: '#FF6D5A',
    status: 'nao_configurado',
    gratuito: true,
    campos_config: [
      { key: 'n8n_webhook_url', label: 'Webhook URL base', tipo: 'url', placeholder: 'https://n8n.seudominio.com/webhook', required: true },
      { key: 'n8n_api_key',     label: 'API Key (opcional)',tipo: 'password', required: false, masked: true },
    ],
  },
  // ══════════════════════════════════════════════════
  // INTELIGÊNCIA ARTIFICIAL
  // ══════════════════════════════════════════════════
  {
    id: 'anthropic_claude',
    nome: 'Anthropic Claude',
    descricao: 'Claude Sonnet e Haiku — LLMs da Anthropic líderes em raciocínio, copywriting e análise. Usados por padrão no gerador de conteúdo, avaliações e análise de leads.',
    categoria: 'ia',
    icon: 'Sparkles',
    cor: '#D97706',
    status: 'nao_configurado',
    docs_url: 'https://docs.anthropic.com/api',
    campos_config: [
      {
        key: 'anthropic_api_key',
        label: 'API Key',
        tipo: 'password',
        placeholder: 'sk-ant-api03-...',
        required: true,
        masked: true,
        descricao: 'Obtida em console.anthropic.com → API Keys.',
      },
      {
        key: 'anthropic_default_model',
        label: 'Modelo padrão',
        tipo: 'select',
        opcoes: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4'],
        required: true,
        descricao: 'Sonnet = melhor qualidade. Haiku = mais rápido e barato.',
      },
    ],
  },

  {
    id: 'openai_gpt',
    nome: 'OpenAI GPT-4o',
    descricao: 'GPT-4o e GPT-4o-mini da OpenAI — excelentes para copywriting, e-mails e roteiros. Fallback automático quando Claude não disponível.',
    categoria: 'ia',
    icon: 'Sparkles',
    cor: '#10A37F',
    status: 'nao_configurado',
    docs_url: 'https://platform.openai.com/docs/api-reference',
    campos_config: [
      {
        key: 'openai_api_key',
        label: 'API Key',
        tipo: 'password',
        placeholder: 'sk-proj-...',
        required: true,
        masked: true,
        descricao: 'Obtida em platform.openai.com → API Keys.',
      },
      {
        key: 'openai_default_model',
        label: 'Modelo padrão',
        tipo: 'select',
        opcoes: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
        required: true,
        descricao: 'GPT-4o = melhor qualidade. mini = mais econômico.',
      },
    ],
  },

  {
    id: 'google_gemini_ai',
    nome: 'Google Gemini',
    descricao: 'Gemini 2.0 Flash e Pro — LLMs Google com suporte nativo a geração de imagens. Essencial para criar imagens de marketing imobiliário direto no backoffice.',
    categoria: 'ia',
    icon: 'Sparkles',
    cor: '#4285F4',
    status: 'nao_configurado',
    gratuito: true,
    docs_url: 'https://ai.google.dev/api',
    campos_config: [
      {
        key: 'google_ai_api_key',
        label: 'Google AI API Key',
        tipo: 'password',
        placeholder: 'AIzaSy...',
        required: true,
        masked: true,
        descricao: 'Obtida em aistudio.google.com → Get API Key. Gratuita com limites generosos.',
      },
      {
        key: 'gemini_default_model',
        label: 'Modelo padrão',
        tipo: 'select',
        opcoes: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.0-flash-exp'],
        required: true,
        descricao: 'Flash = rápido e econômico. Flash Exp = inclui geração de imagens.',
      },
    ],
  },

  {
    id: 'xai_grok',
    nome: 'xAI Grok',
    descricao: 'Grok-2 da xAI (Elon Musk) — LLM com conhecimento em tempo real via X/Twitter. Ideal para análise de tendências e conteúdo baseado em news do mercado imobiliário.',
    categoria: 'ia',
    icon: 'Sparkles',
    cor: '#1DA1F2',
    status: 'nao_configurado',
    docs_url: 'https://docs.x.ai/api',
    campos_config: [
      {
        key: 'xai_api_key',
        label: 'API Key',
        tipo: 'password',
        placeholder: 'xai-...',
        required: true,
        masked: true,
        descricao: 'Obtida em console.x.ai — aguardando acesso público.',
      },
      {
        key: 'grok_default_model',
        label: 'Modelo',
        tipo: 'select',
        opcoes: ['grok-2-1212', 'grok-2-vision-1212'],
        required: true,
      },
    ],
  },

  {
    id: 'azure_openai',
    nome: 'Azure OpenAI / GitHub Copilot',
    descricao: 'Azure OpenAI Service — modelos GPT-4o hospedados na Microsoft Azure. Compatível com GitHub Copilot Enterprise. Ideal para empresas com compliance LGPD.',
    categoria: 'ia',
    icon: 'Sparkles',
    cor: '#0078D4',
    status: 'nao_configurado',
    docs_url: 'https://learn.microsoft.com/azure/ai-services/openai/',
    campos_config: [
      {
        key: 'azure_openai_api_key',
        label: 'Azure API Key',
        tipo: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        masked: true,
      },
      {
        key: 'azure_openai_endpoint',
        label: 'Azure Endpoint',
        tipo: 'url',
        placeholder: 'https://seu-recurso.openai.azure.com',
        required: true,
        descricao: 'URL do recurso Azure OpenAI no portal Azure.',
      },
      {
        key: 'azure_openai_deployment',
        label: 'Deployment Name',
        tipo: 'text',
        placeholder: 'gpt-4o',
        required: true,
        descricao: 'Nome do deployment configurado no Azure.',
      },
    ],
  },

  {
    id: 'groq_ai',
    nome: 'Groq (Inferência Ultrarrápida)',
    descricao: 'Groq LPU — inferência de LLMs 10x mais rápida que GPU tradicional. Suporta Llama 3.3, Mixtral, Gemma. Ideal para features que precisam de resposta em < 500ms.',
    categoria: 'ia',
    icon: 'Zap',
    cor: '#F55036',
    status: 'nao_configurado',
    gratuito: true,
    docs_url: 'https://console.groq.com/docs',
    campos_config: [
      {
        key: 'groq_api_key',
        label: 'API Key',
        tipo: 'password',
        placeholder: 'gsk_...',
        required: true,
        masked: true,
        descricao: 'Obtida em console.groq.com — Free tier com 30req/min.',
      },
      {
        key: 'groq_default_model',
        label: 'Modelo padrão',
        tipo: 'select',
        opcoes: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
        required: true,
        descricao: 'Llama 70B = melhor qualidade. 8B Instant = ultrarrápido.',
      },
    ],
  },
]

export const getIntegracaoById = (id: string) =>
  INTEGRACOES.find(i => i.id === id)

export const getIntegracoesByCategoria = (cat: string) =>
  cat === 'todas' ? INTEGRACOES : INTEGRACOES.filter(i => i.categoria === cat)

export const CATEGORIAS_INTEGRACAO: Record<string, { label: string; icon: string }> = {
  assinatura_digital: { label: 'Assinatura Digital', icon: 'PenTool' },
  email:              { label: 'Email',               icon: 'Mail' },
  whatsapp:           { label: 'WhatsApp',            icon: 'MessageCircle' },
  armazenamento:      { label: 'Armazenamento',       icon: 'HardDrive' },
  google:             { label: 'Google',              icon: 'Globe' },
  redes_sociais:      { label: 'Redes Sociais',       icon: 'Share2' },
  pagamento:          { label: 'Pagamento',           icon: 'CreditCard' },
  crm:                { label: 'Automação / CRM',     icon: 'Zap' },
  ia:              { label: 'Inteligência Artificial', icon: 'Sparkles' },
}
