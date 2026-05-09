import { LayoutItem, LayoutItemType } from '../../types';
import { formatCurrency, getLayoutItemPrice, LAYOUT_ITEM_CATALOG, SHOWER_TRAY_DISCOUNT } from '../../utils/pricing';

export type PlanToolCategoryId = 'openings' | 'electricity' | 'distribution' | 'comfort';

export type PlanToolDefinition = {
  type: LayoutItemType;
  category: PlanToolCategoryId;
  title: string;
  description: string;
  icon: 'door' | 'window' | 'socket' | 'light' | 'panel' | 'wall' | 'room' | 'bath' | 'ac';
  commercialHint: string;
};

export const PLAN_TOOL_CATEGORIES: Record<PlanToolCategoryId, { title: string; description: string }> = {
  openings: {
    title: 'Aberturas',
    description: 'Puertas y ventanas para definir accesos y luz natural.',
  },
  electricity: {
    title: 'Electricidad',
    description: 'Puntos eléctricos para preparar una distribución más clara.',
  },
  distribution: {
    title: 'Distribución',
    description: 'Divisiones interiores orientativas para habitaciones y baño.',
  },
  comfort: {
    title: 'Confort',
    description: 'Extras de climatización y comodidad.',
  },
};

export const PLAN_TOOL_DEFINITIONS: PlanToolDefinition[] = [
  {
    type: 'additional_door',
    category: 'openings',
    title: 'Puerta adicional',
    description: 'Añade un segundo acceso al módulo.',
    icon: 'door',
    commercialHint: 'Útil para módulos de obra, almacenes o accesos independientes.',
  },
  {
    type: 'window_80x80',
    category: 'openings',
    title: 'Ventana 80x80',
    description: 'Añade una ventana estándar.',
    icon: 'window',
    commercialHint: 'Aporta ventilación y luz natural.',
  },
  {
    type: 'large_window',
    category: 'openings',
    title: 'Ventana grande',
    description: 'Añade una ventana de mayor tamaño.',
    icon: 'window',
    commercialHint: 'Mejora la entrada de luz y la sensación de amplitud.',
  },
  {
    type: 'additional_socket',
    category: 'electricity',
    title: 'Enchufe adicional',
    description: 'Añade un punto de corriente extra.',
    icon: 'socket',
    commercialHint: 'Recomendable para oficinas, vestuarios y negocios.',
  },
  {
    type: 'wall_partition',
    category: 'distribution',
    title: 'Tabique simple',
    description: 'Añade un tabique con 3 paneles y mano de obra.',
    icon: 'wall',
    commercialHint: 'Incluye 3 paneles y mano de obra. Ayuda a dividir el módulo de forma sencilla.',
  },
  {
    type: 'interior_room',
    category: 'distribution',
    title: 'Habitación interior',
    description: 'Crea una estancia con puerta, ventana 80x80, punto de luz y enchufe.',
    icon: 'room',
    commercialHint: 'Incluye puerta, ventana 80x80, punto de luz y enchufe.',
  },
  {
    type: 'full_bathroom',
    category: 'distribution',
    title: 'Baño completo',
    description: 'Añade baño con puerta, ventana 40x40, luz, enchufes, lavabo, váter y plato de ducha opcional.',
    icon: 'bath',
    commercialHint: `Incluye puerta, ventana 40x40, punto de luz, enchufe interior, enchufe exterior para termo, lavabo, váter y plato de ducha opcional. Si se elimina el plato se descuentan ${formatCurrency(SHOWER_TRAY_DISCOUNT)}.`,
  },
  {
    type: 'air_conditioning',
    category: 'comfort',
    title: 'Aire acondicionado',
    description: 'Añade climatización al módulo.',
    icon: 'ac',
    commercialHint: 'Muy útil para oficinas, locales y uso prolongado.',
  },
];

export const getPlanTool = (type: LayoutItemType) =>
  PLAN_TOOL_DEFINITIONS.find((tool) => tool.type === type);

export const getPlanItemLabel = (item: LayoutItem) => item.itemLabel || LAYOUT_ITEM_CATALOG[item.itemType]?.label || 'Elemento';

export const getPlanItemPriceLabel = (item: LayoutItem) => {
  if (item.included) return 'Incluido';
  const price = getLayoutItemPrice(item);
  if (item.itemType === 'full_bathroom' && item.hasShowerTray === false) return `+ ${formatCurrency(price)} · sin plato (-${formatCurrency(SHOWER_TRAY_DISCOUNT)})`;
  if (price > 0) return `+ ${formatCurrency(price)}`;
  return 'Sin coste automático';
};

export const getPlanItemStatusLabel = (item: LayoutItem) => {
  if (item.included) return 'Elemento base incluido';
  if (getLayoutItemPrice(item) > 0) return 'Extra presupuestado';
  return 'Elemento orientativo';
};

export const canRemovePlanItem = (item?: LayoutItem | null) => Boolean(item && !item.included);
export const canDuplicatePlanItem = (item?: LayoutItem | null) => Boolean(item && !item.included);
export const canRotatePlanItem = (item?: LayoutItem | null) => {
  if (!item) return false;
  return item.zone === 'edge' || ['air_conditioning', 'additional_socket'].includes(item.itemType);
};
export const canOrientPlanItem = (item?: LayoutItem | null) => {
  if (!item) return false;
  return ['wall_partition', 'interior_room', 'full_bathroom'].includes(item.itemType);
};

export const canToggleShowerTray = (item?: LayoutItem | null) => item?.itemType === 'full_bathroom';

export const getPlanItemPositionLabel = (item?: LayoutItem | null) => {
  if (!item) return 'Sin elemento seleccionado';
  return `X ${Math.round(item.x)} · Y ${Math.round(item.y)} · ${Math.round(item.width)} x ${Math.round(item.height)}%`;
};

export const getPlanItemHelpText = (item?: LayoutItem | null) => {
  if (!item) return 'Selecciona un elemento del plano para ver sus opciones.';
  const tool = getPlanTool(item.itemType);
  if (item.included) return 'Este elemento viene incluido en la configuración base y no se puede eliminar.';
  return tool?.commercialHint || 'Elemento orientativo para preparar un presupuesto más preciso.';
};
