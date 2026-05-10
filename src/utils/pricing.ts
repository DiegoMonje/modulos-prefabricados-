import { ConfiguratorState, LayoutItem, LayoutItemType, LayoutSummary, PriceResult } from '../types';

export const REFERENCE_LENGTH = 6;
export const REFERENCE_WIDTH = 2.4;
export const REFERENCE_BASE_PRICE = 4750;
export const REFERENCE_SQUARE_METERS = REFERENCE_LENGTH * REFERENCE_WIDTH;
export const REFERENCE_PRICE_PER_M2 = REFERENCE_BASE_PRICE / REFERENCE_SQUARE_METERS;
export const ORIENTATIVE_PRICE_PER_M2 = REFERENCE_PRICE_PER_M2;
export const SHORT_MODULE_SURCHARGE_BY_LENGTH: Record<number, number> = {
  3: 0.20,
  4: 0.10,
  5: 0.10,
};
export const VAT_RATE = 0.21;
export const WALL_PARTITION_PRICE = 300;
export const INTERIOR_ROOM_PRICE = 700;
export const FULL_BATHROOM_PRICE = 1500;
export const SHOWER_TRAY_DISCOUNT = 100;

export const ROOM_INCLUDED_FEATURES = ['puerta', 'ventana 80x80', 'punto de luz', 'enchufe'];
export const BATHROOM_INCLUDED_FEATURES = [
  'puerta',
  'ventana 80x80',
  'punto de luz',
  'enchufe',
  'lavabo',
  'váter',
  'plato de ducha opcional',
];

export const LAYOUT_ITEM_CATALOG: Record<LayoutItemType, { label: string; price: number; width: number; height: number; zone: 'edge' | 'inside'; included?: boolean }> = {
  base_door: { label: 'Puerta incluida', price: 0, width: 12, height: 7, zone: 'edge', included: true },
  base_window_80x80: { label: 'Ventana 80x80 incluida', price: 0, width: 13, height: 5, zone: 'edge', included: true },
  base_socket: { label: 'Enchufe incluido', price: 0, width: 7, height: 7, zone: 'inside', included: true },
  base_light_point: { label: 'Punto de luz incluido', price: 0, width: 7, height: 7, zone: 'inside', included: true },
  base_electrical_panel: { label: 'Cuadro eléctrico incluido', price: 0, width: 10, height: 8, zone: 'inside', included: true },
  additional_socket: { label: 'Enchufe adicional', price: 50, width: 7, height: 7, zone: 'inside' },
  additional_door: { label: 'Puerta adicional', price: 120, width: 12, height: 7, zone: 'edge' },
  window_80x80: { label: 'Ventana 80x80 extra', price: 200, width: 13, height: 5, zone: 'edge' },
  large_window: { label: 'Ventana grande', price: 250, width: 18, height: 5, zone: 'edge' },
  interior_room: { label: 'Habitación interior', price: INTERIOR_ROOM_PRICE, width: 28, height: 22, zone: 'inside' },
  full_bathroom: { label: 'Baño completo', price: FULL_BATHROOM_PRICE, width: 20, height: 18, zone: 'inside' },
  air_conditioning: { label: 'Aire acondicionado', price: 600, width: 14, height: 8, zone: 'inside' },
  wall_partition: { label: 'Tabique simple', price: WALL_PARTITION_PRICE, width: 100, height: 3, zone: 'inside' },
};

export const createBaseLayoutItems = (): LayoutItem[] => [
  { id: 'base-door', itemType: 'base_door', itemLabel: 'Puerta incluida', x: 43, y: 0, width: 12, height: 7, rotation: 0, price: 0, zone: 'edge', included: true },
  { id: 'base-window', itemType: 'base_window_80x80', itemLabel: 'Ventana 80x80 incluida', x: 70, y: 0, width: 13, height: 5, rotation: 0, price: 0, zone: 'edge', included: true },
  { id: 'base-socket', itemType: 'base_socket', itemLabel: 'Enchufe incluido', x: 18, y: 45, width: 7, height: 7, rotation: 0, price: 0, zone: 'inside', included: true },
  { id: 'base-light', itemType: 'base_light_point', itemLabel: 'Punto de luz incluido', x: 48, y: 45, width: 7, height: 7, rotation: 0, price: 0, zone: 'inside', included: true },
  { id: 'base-panel', itemType: 'base_electrical_panel', itemLabel: 'Cuadro eléctrico incluido', x: 8, y: 12, width: 10, height: 8, rotation: 0, price: 0, zone: 'inside', included: true },
];

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const isReferenceModule = (config: ConfiguratorState) =>
  Math.abs(config.length - REFERENCE_LENGTH) < 0.01 &&
  Math.abs(config.width - REFERENCE_WIDTH) < 0.01;

const getShortModuleSurchargeRate = (length: number) => {
  const matchedLength = Object.keys(SHORT_MODULE_SURCHARGE_BY_LENGTH)
    .map(Number)
    .find((shortLength) => Math.abs(length - shortLength) < 0.01);

  return matchedLength ? SHORT_MODULE_SURCHARGE_BY_LENGTH[matchedLength] : 0;
};

const isBathroomWithoutShowerTray = (item: LayoutItem) => item.itemType === 'full_bathroom' && item.hasShowerTray === false;
const isIncludedGeneratedItem = (item: LayoutItem) => Boolean(item.included || item.parentId || item.source);

export const getLayoutItemPrice = (item: LayoutItem) => {
  if (isIncludedGeneratedItem(item)) return 0;
  if (isBathroomWithoutShowerTray(item)) return Math.max(0, item.price - SHOWER_TRAY_DISCOUNT);
  return item.price;
};

export const calculateBasePrice = (config: Pick<ConfiguratorState, 'length' | 'width'>): number => {
  const squareMeters = Number((config.length * config.width).toFixed(2));
  if (isReferenceModule(config as ConfiguratorState)) return REFERENCE_BASE_PRICE;

  const proportionalBase = squareMeters * REFERENCE_PRICE_PER_M2;
  const surchargeRate = getShortModuleSurchargeRate(config.length);
  const adjustedBase = proportionalBase * (1 + surchargeRate);

  return Math.round(adjustedBase);
};

export const summarizeLayoutItems = (items: LayoutItem[]): LayoutSummary => {
  const billableItems = items.filter((item) => !item.parentId && !item.source);
  const count = (type: LayoutItemType) => billableItems.filter((item) => item.itemType === type).length;

  const additionalSockets = billableItems.filter((item) => item.itemType === 'additional_socket' && !item.included).length;
  const additionalDoors = billableItems.filter((item) => item.itemType === 'additional_door' && !item.included).length;
  const windows80x80 = billableItems.filter((item) => item.itemType === 'window_80x80' && !item.included).length;
  const largeWindows = billableItems.filter((item) => item.itemType === 'large_window' && !item.included).length;
  const interiorRooms = count('interior_room');
  const fullBathrooms = count('full_bathroom');
  const bathroomsWithoutShowerTray = billableItems.filter(isBathroomWithoutShowerTray).length;
  const hasFullBathroom = fullBathrooms > 0;
  const hasBathroomShowerTray = billableItems.some((item) => item.itemType === 'full_bathroom' && item.hasShowerTray !== false);
  const hasAirConditioning = count('air_conditioning') > 0;
  const wallPartitions = count('wall_partition');
  const includedSocketQuantity = items.filter((item) => item.itemType === 'base_socket' && !item.parentId).length;
  const includedLightPointQuantity = items.filter((item) => item.itemType === 'base_light_point' && !item.parentId).length;
  const includedDoor = items.some((item) => item.itemType === 'base_door' && !item.parentId);
  const includedWindow80x80 = items.some((item) => item.itemType === 'base_window_80x80' && !item.parentId);
  const includedElectricalPanel = items.some((item) => item.itemType === 'base_electrical_panel' && !item.parentId);

  const includedList: string[] = [];
  if (includedDoor) includedList.push('1 puerta incluida');
  if (includedWindow80x80) includedList.push('1 ventana 80x80 incluida');
  includedList.push('instalación eléctrica básica');
  if (includedSocketQuantity) includedList.push(`${includedSocketQuantity} enchufe incluido`);
  includedList.push('1 interruptor incluido');
  if (includedLightPointQuantity) includedList.push(`${includedLightPointQuantity} punto de luz incluido`);
  if (includedElectricalPanel) includedList.push('cuadro eléctrico incluido');

  const extrasList: string[] = [];
  if (additionalSockets) extrasList.push(`${additionalSockets} enchufe(s) adicional(es)`);
  if (additionalDoors) extrasList.push(`${additionalDoors} puerta(s) adicional(es)`);
  if (windows80x80) extrasList.push(`${windows80x80} ventana(s) 80x80 extra`);
  if (largeWindows) extrasList.push(`${largeWindows} ventana(s) grande(s)`);
  if (interiorRooms) extrasList.push(`${interiorRooms} habitación(es) interior(es) · incluye ${ROOM_INCLUDED_FEATURES.join(', ')}`);
  if (hasFullBathroom) {
    const bathroomText = `baño completo · incluye ${BATHROOM_INCLUDED_FEATURES.join(', ')}`;
    extrasList.push(bathroomsWithoutShowerTray ? `${bathroomText} · ${bathroomsWithoutShowerTray} sin plato de ducha (-${formatCurrency(SHOWER_TRAY_DISCOUNT)} c/u)` : bathroomText);
  }
  if (hasAirConditioning) extrasList.push('aire acondicionado');
  if (wallPartitions) extrasList.push(`${wallPartitions} tabique(s) simple(s) · paneles + mano de obra`);

  return {
    includedDoor,
    includedWindow80x80,
    includedSocketQuantity,
    includedLightPointQuantity,
    includedElectricalPanel,
    additionalSockets,
    additionalDoors,
    windows80x80,
    largeWindows,
    interiorRooms,
    fullBathrooms,
    bathroomsWithoutShowerTray,
    hasFullBathroom,
    hasBathroomShowerTray,
    hasAirConditioning,
    extrasList,
    includedList,
    roomIncludedFeatures: ROOM_INCLUDED_FEATURES,
    bathroomIncludedFeatures: BATHROOM_INCLUDED_FEATURES,
  };
};

export const calculatePrice = (config: ConfiguratorState): PriceResult => {
  const squareMeters = Number((config.length * config.width).toFixed(2));
  const basePrice = calculateBasePrice(config);
  const extrasPrice = Math.round(config.layoutItems.reduce((sum, item) => sum + getLayoutItemPrice(item), 0));
  const estimatedPriceWithoutVat = basePrice + extrasPrice;
  const vatAmount = Math.round(estimatedPriceWithoutVat * VAT_RATE);
  const estimatedPriceWithVat = estimatedPriceWithoutVat + vatAmount;
  const summary = summarizeLayoutItems(config.layoutItems);

  return {
    squareMeters,
    basePrice,
    extrasPrice,
    estimatedPriceWithoutVat,
    vatAmount,
    estimatedPriceWithVat,
    summary,
  };
};
