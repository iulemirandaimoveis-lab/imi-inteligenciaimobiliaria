export type AvailabilityStatus =
  | 'available'
  | 'reserved'
  | 'sold'
  | 'blocked'
  | 'launching'
  | 'hidden';

export type PropertyKind =
  | 'lot'
  | 'apartment'
  | 'commercial_room'
  | 'house'
  | 'parking'
  | 'common_area';

export type DevelopmentKind = 'subdivision' | 'building' | 'mixed';

export interface IMIProperty {
  id: string;
  developmentId: string;
  kind: PropertyKind;

  code: string;
  title: string;

  block?: string;
  lotNumber?: string;
  tower?: string;
  floor?: number;
  unitNumber?: string;

  privateAreaM2?: number;
  totalAreaM2?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parkingSpaces?: number;

  status: AvailabilityStatus;

  price?: number;
  priceVisible: boolean;

  sceneNodeId: string;

  media: {
    coverImage?: string;
    gallery?: string[];
    floorPlanImage?: string;
    tourUrl?: string;
    pdfUrl?: string;
  };

  commercial: {
    crmId?: string;
    brokerId?: string;
    reservationId?: string;
    leadCaptureEnabled: boolean;
  };

  metadata: Record<string, unknown>;
}

export interface IMIDevelopment {
  id: string;
  slug: string;
  name: string;
  kind: DevelopmentKind;
  city: string;
  state: string;
  description?: string;
  coverImage?: string;
  whatsappPhone?: string;
  published: boolean;
}

export interface SpatialLeadPayload {
  developmentId: string;
  propertyId?: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  interaction?: Record<string, unknown>;
}

export const AVAILABILITY_COLORS: Record<AvailabilityStatus, { bg: string; text: string; light: string; dark: string; label: string }> = {
  available:  { bg: '#16A34A', text: '#fff', light: '#DCFCE7', dark: '#166534', label: 'Disponível' },
  reserved:   { bg: '#D97706', text: '#fff', light: '#FEF3C7', dark: '#92400E', label: 'Reservado' },
  sold:       { bg: '#6B7280', text: '#fff', light: '#F3F4F6', dark: '#374151', label: 'Vendido' },
  blocked:    { bg: '#DC2626', text: '#fff', light: '#FEE2E2', dark: '#991B1B', label: 'Indisponível' },
  launching:  { bg: '#2563EB', text: '#fff', light: '#DBEAFE', dark: '#1E40AF', label: 'Lançamento' },
  hidden:     { bg: '#9CA3AF', text: '#fff', light: '#F9FAFB', dark: '#6B7280', label: 'Oculto' },
};
