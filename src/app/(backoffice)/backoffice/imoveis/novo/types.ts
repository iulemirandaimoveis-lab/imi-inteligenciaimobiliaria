import type { ImageUploadFileStatus } from '@/lib/supabase-storage'
import {
  Building2, Home, Star, Maximize, Globe, Flag, Briefcase,
  Waves, Dumbbell, UtensilsCrossed, Flame, Trees,
  Trophy, Thermometer, ChefHat, Shield, Camera, Zap, Dog,
  MonitorPlay, Sunset, Sparkles, Plane,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────────────── */
export interface Developer { id: string; name: string; logo_url?: string | null }

export interface FormData {
  name: string; type: string; condition: string
  country: string; cep: string; state: string; city: string
  neighborhood: string; address: string; streetNumber: string; complement: string
  developer_id: string; developer: string
  area: string; bedrooms: string; bathrooms: string; parking: string; floor: string
  features: string[]
  priceMin: string; priceMax: string; pricePerSqm: string
  totalUnits: string; availableUnits: string; deliveryDate: string
  description: string; status_commercial: string; is_highlighted: boolean
  images: File[]; floorPlans: File[]; brochure: File | null
  videoUrl: string; videoShort: string
}

export const DEFAULT_FORM: FormData = {
  name: '', type: '', condition: 'lancamento',
  country: 'Brasil', cep: '', state: '', city: '',
  neighborhood: '', address: '', streetNumber: '', complement: '',
  developer_id: '', developer: '',
  area: '', bedrooms: '', bathrooms: '', parking: '', floor: '',
  features: [],
  priceMin: '', priceMax: '', pricePerSqm: '',
  totalUnits: '', availableUnits: '', deliveryDate: '',
  description: '', status_commercial: 'draft', is_highlighted: false,
  images: [], floorPlans: [], brochure: null,
  videoUrl: '', videoShort: '',
}

export interface StepProps {
  step: 1|2|3|4; form: FormData; errors: Record<string, string>
  developers: Developer[]; saving: boolean; cepLoading: boolean
  draftSaved: boolean
  set: (k: keyof FormData, v: unknown) => void
  next: () => void; prev: () => void; handleSave: () => void
  handleCepChange: (v: string) => void
  toggleFeature: (f: string) => void
  handleDrop: (e: React.DragEvent) => void
  handleImageInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: (i: number) => void
  uploadFiles: ImageUploadFileStatus[]
  uploadVisible: boolean
}

export interface DesktopStepProps extends StepProps {
  setStep: (s: 1|2|3|4) => void
}

/* ─── Constants ────────────────────────────────────────────────── */
export const TYPES = [
  { value: 'Apartamento', icon: Building2, desc: 'Condomínio residencial' },
  { value: 'Casa',        icon: Home,      desc: 'Unifamiliar, terreno'   },
  { value: 'Cobertura',   icon: Star,      desc: 'Último andar, rooftop'  },
  { value: 'Studio',      icon: Maximize,  desc: 'Compacto, investimento' },
  { value: 'Loft',        icon: Globe,     desc: 'Pé direito duplo'       },
  { value: 'Terreno',     icon: Flag,      desc: 'Loteamento, gleba'      },
  { value: 'Comercial',   icon: Briefcase, desc: 'Sala, loja, andar'      },
  { value: 'Villa',       icon: Star,      desc: 'Premium, resort'        },
]

export const CONDITIONS = [
  { value: 'lancamento',    label: 'Lançamento'      },
  { value: 'em_construcao', label: 'Em Construção'   },
  { value: 'pronto',        label: 'Pronto p/ Morar' },
  { value: 'seminovo',      label: 'Seminovo'        },
  { value: 'usado',         label: 'Usado/Revenda'   },
]

export const STATUSES = [
  { value: 'draft',     label: 'Rascunho'  },
  { value: 'published', label: 'Publicado' },
  { value: 'campaign',  label: 'Campanha'  },
  { value: 'private',   label: 'Privado'   },
]

export const FEATURES: { label: string; icon: React.ElementType }[] = [
  { label: 'Piscina',           icon: Waves       },
  { label: 'Academia',          icon: Dumbbell    },
  { label: 'Salão de festas',   icon: UtensilsCrossed },
  { label: 'Churrasqueira',     icon: Flame       },
  { label: 'Playground',        icon: Trees       },
  { label: 'Quadra esportiva',  icon: Trophy      },
  { label: 'Sauna',             icon: Thermometer },
  { label: 'Espaço gourmet',    icon: ChefHat     },
  { label: 'Portaria 24h',      icon: Shield      },
  { label: 'Câmeras segurança', icon: Camera      },
  { label: 'Gerador',           icon: Zap         },
  { label: 'Pet friendly',      icon: Dog         },
  { label: 'Coworking',         icon: MonitorPlay },
  { label: 'Rooftop',           icon: Sunset      },
  { label: 'Spa',               icon: Sparkles    },
  { label: 'Cinema',            icon: MonitorPlay },
  { label: 'Heliponto',         icon: Plane       },
]

export const DRAFT_KEY = 'imi-draft-imovel'

export const STEP_META = [
  { title: 'Identificação',   subtitle: 'Nome, tipo e condição do empreendimento'   },
  { title: 'Localização',     subtitle: 'Endereço completo e CEP para auto-preenchimento' },
  { title: 'Características', subtitle: 'Especificações, valores e detalhes do imóvel' },
  { title: 'Mídia',           subtitle: 'Fotos, plantas, brochure e links de vídeo' },
]
