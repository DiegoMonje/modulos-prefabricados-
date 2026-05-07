export type PanelChoice =
  | 'Panel sándwich blanco 30 mm'
  | 'Otro grosor de panel'
  | 'Otro color de panel'
  | 'Otro grosor y otro color';

export type UseType =
  | 'Caseta de obra'
  | 'Oficina'
  | 'Almacén'
  | 'Vestuario'
  | 'Caseta para finca'
  | 'Local comercial'
  | 'Otro';

export type DeliveryTimeline =
  | 'Lo antes posible'
  | 'En menos de 1 mes'
  | 'En 1-3 meses'
  | 'Más adelante'
  | 'Solo estoy mirando precios';

export type LeadStatus =
  | 'Nuevo'
  | 'Contactado'
  | 'Presupuesto enviado'
  | 'Negociando'
  | 'Vendido'
  | 'Perdido';

export type LayoutItemType =
  | 'base_door'
  | 'base_window_80x80'
  | 'base_socket'
  | 'base_light_point'
  | 'base_electrical_panel'
  | 'additional_socket'
  | 'additional_door'
  | 'window_80x80'
  | 'large_window'
  | 'interior_room'
  | 'full_bathroom'
  | 'air_conditioning'
  | 'wall_partition';

export interface LayoutItem {
  id: string;
  itemType: LayoutItemType;
  itemLabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  price: number;
  zone: 'edge' | 'inside';
  included?: boolean;
  layoutOrientation?: 'transversal' | 'longitudinal';
  roomWidthMeters?: number;
  showerTrayWidthMeters?: 0.9 | 1 | null;
  includedFeatures?: string[];
}

export interface ConfiguratorState {
  length: number;
  width: number;
  widthOption: '2.40 m' | '2.50 m' | 'Otro ancho';
  customWidth: string;
  isSpecialMeasure: boolean;
  panelChoice: PanelChoice;
  panelType: string;
  panelThickness: string;
  panelColor: string;
  specialThickness: string;
  specialColor: string;
  isSpecialPanel: boolean;
  useType: UseType;
  province: string;
  city: string;
  postalCode: string;
  deliveryTimeline: DeliveryTimeline;
  layoutItems: LayoutItem[];
}

export interface ContactFormState {
  fullName: string;
  phone: string;
  email: string;
  intendedUse: string;
  comments: string;
  accepted: boolean;
  newsletterSubscribed: boolean;
}

export interface LayoutSummary {
  includedDoor: boolean;
  includedWindow80x80: boolean;
  includedSocketQuantity: number;
  includedLightPointQuantity: number;
  includedElectricalPanel: boolean;
  additionalSockets: number;
  additionalDoors: number;
  windows80x80: number;
  largeWindows: number;
  interiorRooms: number;
  hasFullBathroom: boolean;
  hasAirConditioning: boolean;
  extrasList: string[];
  includedList: string[];
  roomIncludedFeatures?: string[];
  bathroomIncludedFeatures?: string[];
}

export interface PriceResult {
  squareMeters: number;
  basePrice: number;
  extrasPrice: number;
  estimatedPriceWithoutVat: number;
  vatAmount: number;
  estimatedPriceWithVat: number;
  summary: LayoutSummary;
}

export interface LeadRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  province: string;
  city: string;
  postal_code: string | null;
  intended_use: string | null;
  comments: string | null;
  status: LeadStatus;
  estimated_min_price?: number;
  estimated_max_price?: number;
  estimated_price_without_vat?: number;
  estimated_vat_amount?: number;
  estimated_price_with_vat?: number;
  newsletter_subscribed?: boolean;
  privacy_accepted?: boolean;
  download_requested?: boolean;
  downloaded_at?: string | null;
  lead_source?: string | null;
  created_at: string;
  updated_at: string;
  configurations?: ConfigurationRow[];
  notes?: NoteRow[];
  quotes?: QuoteRow[];
}

export interface QuoteRow {
  id: string;
  lead_id: string;
  quote_number: string;
  quote_date: string;
  base_price: number;
  iva_percentage: number;
  iva_amount: number;
  total_price: number;
  pdf_url: string | null;
  created_at: string;
}

export interface ConfigurationRow {
  id: string;
  lead_id: string;
  length: number;
  width: number;
  square_meters: number;
  is_special_measure?: boolean;
  panel_type?: string;
  panel_thickness: string;
  panel_color?: string;
  is_special_panel?: boolean;
  use_type: string;
  door_type?: string;
  door_quantity?: number;
  window_quantity?: number;
  extras: string[];
  transport_required?: boolean;
  assembly_required?: boolean;
  delivery_timeline: string;
  base_included_door?: boolean;
  base_included_window_80x80?: boolean;
  base_included_electrical_installation?: boolean;
  base_included_socket_quantity?: number;
  base_included_light_point_quantity?: number;
  has_air_conditioning?: boolean;
  has_electrical_installation?: boolean;
  has_full_bathroom?: boolean;
  interior_rooms_quantity?: number;
  extra_windows_80x80_quantity?: number;
  extra_large_windows_quantity?: number;
  additional_doors_quantity?: number;
  additional_socket_quantity?: number;
  layout_json?: LayoutItem[];
  created_at: string;
}

export interface NewsletterSubscriberRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  province: string | null;
  city: string | null;
  subscribed_at: string;
  source: string;
  active: boolean;
}

export interface NoteRow {
  id: string;
  lead_id: string;
  note: string;
  created_at: string;
}

export interface NewLeadPayload {
  contact: ContactFormState;
  config: ConfiguratorState;
  price: PriceResult;
}
