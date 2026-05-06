import { ConfiguratorState, ContactFormState, PriceResult } from '../types';
import { formatCurrency } from './pricing';

const COMPANY_PHONE_WITH_COUNTRY_CODE = '34600227252';

const buildExtrasText = (price: PriceResult) => {
  const items = price.summary.extrasList;
  return items.length ? items.join(', ') : 'sin extras añadidos';
};

export const buildWhatsAppMessage = (
  contact: ContactFormState,
  config: ConfiguratorState,
  price: PriceResult,
): string => {
  const measures = `${config.length} x ${config.width} m (${price.squareMeters} m²)`;
  const extras = buildExtrasText(price);

  return `Hola, soy ${contact.fullName}. Estoy interesado en un módulo prefabricado de ${measures}, con ${config.panelType.toLowerCase()} ${config.panelColor.toLowerCase()} de ${config.panelThickness}. La configuración incluye 1 puerta, 1 ventana 80x80 e instalación eléctrica básica con 1 enchufe, 1 punto de luz y cuadro eléctrico. Extras añadidos: ${extras}. La ubicación sería ${config.city}, ${config.province}. Precio estimado sin IVA: ${formatCurrency(price.estimatedPriceWithoutVat)}. Total estimado con IVA: ${formatCurrency(price.estimatedPriceWithVat)}. Me gustaría recibir presupuesto personalizado.`;
};

export const buildWhatsAppUrl = (
  contact: ContactFormState,
  config: ConfiguratorState,
  price: PriceResult,
): string => {
  const encoded = encodeURIComponent(buildWhatsAppMessage(contact, config, price));
  return `https://wa.me/${COMPANY_PHONE_WITH_COUNTRY_CODE}?text=${encoded}`;
};
