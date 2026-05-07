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
  interior_room: { label: 'Habitación interior', price: 300, width: 28, height: 22, zone: 'inside' },
  full_bathroom: { label: 'Baño completo', price: 1500, width: 20, height: 18, zone: 'inside' },
  air_conditioning: { label: 'Aire acondicionado', price: 600, width: 14, height: 8, zone: 'inside' },
  wall_partition: { label: 'Tabique interior', price: 0, width: 100, height: 3, zone: 'inside' },
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

export const calculateBasePrice = (config: Pick<ConfiguratorState, 'length' | 'width'>): number => {
  const squareMeters = Number((config.length * config.width).toFixed(2));
  if (isReferenceModule(config as ConfiguratorState)) return REFERENCE_BASE_PRICE;

  const proportionalBase = squareMeters * REFERENCE_PRICE_PER_M2;
  const surchargeRate = getShortModuleSurchargeRate(config.length);
  const adjustedBase = proportionalBase * (1 + surchargeRate);

  return Math.round(adjustedBase);
};

export const summarizeLayoutItems = (items: LayoutItem[]): LayoutSummary => {
  const count = (type: LayoutItemType) => items.filter((item) => item.itemType === type).length;

  const additionalSockets = count('additional_socket');
  const additionalDoors = count('additional_door');
  const windows80x80 = count('window_80x80');
  const largeWindows = count('large_window');
  const interiorRooms = count('interior_room');
  const hasFullBathroom = count('full_bathroom') > 0;
  const hasAirConditioning = count('air_conditioning') > 0;
  const wallPartitions = count('wall_partition');
  const includedSocketQuantity = count('base_socket');
  const includedLightPointQuantity = count('base_light_point');
  const includedDoor = count('base_door') > 0;
  const includedWindow80x80 = count('base_window_80x80') > 0;
  const includedElectricalPanel = count('base_electrical_panel') > 0;

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
  if (interiorRooms) extrasList.push(`${interiorRooms} habitación(es) interior(es)`);
  if (hasFullBathroom) extrasList.push('baño completo');
  if (hasAirConditioning) extrasList.push('aire acondicionado');
  if (wallPartitions) extrasList.push(`${wallPartitions} tabique(s) interior(es)`);

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
    hasFullBathroom,
    hasAirConditioning,
    extrasList,
    includedList,
  };
};

export const calculatePrice = (config: ConfiguratorState): PriceResult => {
  const squareMeters = Number((config.length * config.width).toFixed(2));
  const basePrice = calculateBasePrice(config);
  const extrasPrice = Math.round(config.layoutItems.reduce((sum, item) => sum + item.price, 0));
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
