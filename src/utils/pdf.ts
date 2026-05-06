import { ConfiguratorState, ContactFormState, LeadRow, PriceResult, QuoteRow } from '../types';
import { formatCurrency, ORIENTATIVE_PRICE_PER_M2, REFERENCE_BASE_PRICE, REFERENCE_LENGTH, REFERENCE_WIDTH } from './pricing';

const company = {
  name: 'Módulos Prefabricados San José S.L.',
  cif: 'B25987025',
  address: 'Plaza de los Inventores 7, 1D, San José de la Rinconada, 41300',
  phone: '600227252',
  email: 'contacto@modulosprefabricadossanjose.com',
};

const sanitizeFilename = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const normalizePdfText = (value: string) =>
  value
    .replace(/€/g, 'EUR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E\n]/g, '');

const escapePdfText = (value: string) => normalizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const wrapText = (text: string, maxChars: number) => {
  const words = normalizePdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });

  if (line) lines.push(line);
  return lines;
};

const textCommand = (text: string, x: number, y: number, size = 10, bold = false) => {
  const font = bold ? '/F2' : '/F1';
  return `BT ${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET\n`;
};

const wrappedTextCommands = (text: string, x: number, y: number, maxChars: number, size = 10, lineHeight = 13) => {
  const lines = wrapText(text, maxChars);
  const commands = lines.map((line, index) => textCommand(line, x, y - index * lineHeight, size)).join('');
  return { commands, nextY: y - lines.length * lineHeight };
};

const layoutLabel = (itemType?: string, itemLabel?: string) => {
  const labels: Record<string, string> = {
    base_door: 'P',
    additional_door: 'P',
    base_window_80x80: 'V',
    window_80x80: 'V',
    large_window: 'VG',
    base_socket: 'T',
    additional_socket: 'T',
    base_light_point: 'PL',
    base_electrical_panel: 'CE',
    air_conditioning: 'A/A',
    interior_room: 'H',
    full_bathroom: 'B',
  };
  return labels[itemType || ''] || itemLabel?.slice(0, 4) || 'E';
};

const planCommands = (config: any, x: number, y: number, width = 300, height = 105) => {
  if (!config) return '';
  let commands = '';
  commands += textCommand('Plano 2D orientativo', x, y + 16, 11, true);
  commands += `0.94 0.97 1 rg ${x} ${y - height} ${width} ${height} re f\n`;
  commands += `0.05 0.09 0.16 RG 2 w ${x} ${y - height} ${width} ${height} re S\n`;
  commands += '0.70 0.76 0.84 RG 0.2 w\n';
  for (let gx = x + 20; gx < x + width; gx += 20) commands += `${gx} ${y - height} m ${gx} ${y} l S\n`;
  for (let gy = y - height + 20; gy < y; gy += 20) commands += `${x} ${gy} m ${x + width} ${gy} l S\n`;
  commands += '0.05 0.09 0.16 rg\n';
  const items = (config.layout_json || []) as Array<{ itemType?: string; itemLabel?: string; x?: number; y?: number; width?: number; height?: number; included?: boolean; rotation?: number }>;
  items.slice(0, 18).forEach((item) => {
    const px = x + ((Number(item.x || 0) / 100) * width);
    const py = y - ((Number(item.y || 0) / 100) * height) - 8;
    const label = `${layoutLabel(item.itemType, item.itemLabel)}${item.rotation ? ` ${item.rotation}g` : ''}`;
    commands += textCommand(label, px, py, 7, Boolean(item.included));
  });
  commands += textCommand('Leyenda: P=Puerta · V=Ventana · T=Enchufe · PL=Punto de luz · CE=Cuadro electrico · A/A=Aire acondicionado · H=Habitacion · B=Bano', x, y - height - 14, 7);
  return commands;
};

const buildPdf = (content: string) => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
};

export const downloadQuotePdf = (lead: LeadRow, quote: QuoteRow) => {
  const config = lead.configurations?.[0];
  let y = 800;
  let content = '';

  // Header
  content += '0.06 0.09 0.16 rg 0 808 595 34 re f\n';
  content += '1 1 1 rg\n';
  content += textCommand('Presupuesto orientativo', 45, 820, 18, true);
  content += textCommand(company.name, 45, 805, 10);
  content += '0.05 0.09 0.16 rg\n';

  y = 770;
  content += textCommand('Datos de empresa', 45, y, 12, true);
  content += textCommand('Datos del cliente', 325, y, 12, true);
  y -= 18;

  content += textCommand(company.name, 45, y, 10);
  content += textCommand(lead.full_name, 325, y, 10);
  y -= 14;
  content += textCommand(`CIF: ${company.cif}`, 45, y, 10);
  content += textCommand(`Telefono: ${lead.phone}`, 325, y, 10);
  y -= 14;
  content += textCommand(`Tel: ${company.phone}`, 45, y, 10);
  content += textCommand(`Email: ${lead.email || '-'}`, 325, y, 10);
  y -= 14;
  content += textCommand(company.email, 45, y, 10);
  content += textCommand(`${lead.city}, ${lead.province}`, 325, y, 10);
  y -= 14;
  content += wrappedTextCommands(company.address, 45, y, 42, 10, 12).commands;

  y -= 35;
  content += '0.89 0.91 0.94 RG 45 ' + y + ' 505 0.5 re S\n';
  y -= 22;

  content += textCommand('Informacion del presupuesto', 45, y, 12, true);
  y -= 18;
  content += textCommand(`Numero: ${quote.quote_number}`, 45, y, 10);
  content += textCommand(`Fecha: ${new Date(quote.quote_date).toLocaleDateString('es-ES')}`, 325, y, 10);
  y -= 28;

  content += textCommand('Descripcion de la caseta', 45, y, 12, true);
  y -= 18;

  const details = [
    ['Medidas', config ? `${config.length} x ${config.width} m` : '-'],
    ['Metros cuadrados', config ? `${config.square_meters} m2` : '-'],
    ['Grosor de panel', config?.panel_thickness || '-'],
    ['Tipo de uso', config?.use_type || lead.intended_use || '-'],
    ['Puertas', config ? `${config.door_quantity} - ${config.door_type}` : '-'],
    ['Ventanas', config ? `${config.window_quantity}` : '-'],
    ['Plazo indicado', config?.delivery_timeline || '-'],
  ];

  details.forEach(([label, value]) => {
    content += textCommand(`${label}:`, 45, y, 10, true);
    content += textCommand(String(value), 170, y, 10);
    y -= 14;
  });

  const extras = config?.extras?.length ? config.extras.join(', ') : 'Sin extras seleccionados';
  content += textCommand('Extras:', 45, y, 10, true);
  const extrasWrapped = wrappedTextCommands(extras, 170, y, 55, 10, 12);
  content += extrasWrapped.commands;
  y = extrasWrapped.nextY - 8;

  if (lead.comments) {
    content += textCommand('Comentarios:', 45, y, 10, true);
    y -= 14;
    const commentsWrapped = wrappedTextCommands(lead.comments, 45, y, 85, 10, 12);
    content += commentsWrapped.commands;
    y = commentsWrapped.nextY - 10;
  }

  if (config) {
    content += planCommands(config, 45, y - 10, 310, 105);
    y -= 145;
  }

  // Economic box
  const isReference = config && Math.abs(Number(config.length) - REFERENCE_LENGTH) < 0.01 && Math.abs(Number(config.width) - REFERENCE_WIDTH) < 0.01 && !config.is_special_panel;
  const technicalBasePrice = config ? (isReference ? REFERENCE_BASE_PRICE : Math.round(Number(config.square_meters) * ORIENTATIVE_PRICE_PER_M2)) : Number(quote.base_price);
  const extrasPrice = Math.max(0, Number(quote.base_price) - technicalBasePrice);

  y -= 10;
  content += '0.97 0.98 0.99 rg 45 ' + (y - 88) + ' 505 100 re f\n';
  content += '0.05 0.09 0.16 rg\n';
  content += textCommand('Resumen economico', 65, y - 5, 12, true);
  content += textCommand('Precio base estimado', 65, y - 25, 10);
  content += textCommand(formatCurrency(technicalBasePrice), 430, y - 25, 10);
  content += textCommand('Extras seleccionados', 65, y - 43, 10);
  content += textCommand(formatCurrency(extrasPrice), 430, y - 43, 10);
  content += textCommand('Base imponible estimada', 65, y - 61, 10, true);
  content += textCommand(formatCurrency(Number(quote.base_price)), 430, y - 61, 10, true);
  content += textCommand(`IVA ${quote.iva_percentage}%`, 65, y - 79, 10);
  content += textCommand(formatCurrency(Number(quote.iva_amount)), 430, y - 79, 10);
  content += textCommand('Total estimado con IVA', 65, y - 97, 11, true);
  content += textCommand(formatCurrency(Number(quote.total_price)), 430, y - 97, 11, true);
  y -= 125;

  content += textCommand('Condiciones', 45, y, 11, true);
  y -= 16;
  let wrapped = wrappedTextCommands(
    'Este presupuesto tiene caracter orientativo y puede variar segun revision final, transporte, montaje, distribucion interior, acabados seleccionados y disponibilidad de materiales.',
    45,
    y,
    95,
    9,
    11,
  );
  content += wrapped.commands;
  y = wrapped.nextY - 5;
  wrapped = wrappedTextCommands(
    'Para recibir un presupuesto final cerrado, revisaremos la solicitud y contactaremos contigo para confirmar todos los detalles del proyecto.',
    45,
    y,
    95,
    9,
    11,
  );
  content += wrapped.commands;

  content += textCommand(`${company.name} - ${company.phone} - ${company.email}`, 45, 35, 8);

  const pdf = buildPdf(content);
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `presupuesto-${quote.quote_number}-${sanitizeFilename(lead.full_name)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export const downloadConfiguratorPdf = (contact: ContactFormState, config: ConfiguratorState, price: PriceResult) => {
  const now = new Date();
  const quoteNumber = `WEB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getTime()).slice(-6)}`;
  const lead: LeadRow = {
    id: 'preview',
    full_name: contact.fullName,
    phone: contact.phone,
    email: contact.email || null,
    province: config.province,
    city: config.city,
    postal_code: config.postalCode || null,
    intended_use: contact.intendedUse || config.useType,
    comments: contact.comments || null,
    status: 'Nuevo',
    estimated_price_without_vat: price.estimatedPriceWithoutVat,
    estimated_vat_amount: price.vatAmount,
    estimated_price_with_vat: price.estimatedPriceWithVat,
    newsletter_subscribed: contact.newsletterSubscribed,
    privacy_accepted: contact.accepted,
    download_requested: true,
    downloaded_at: now.toISOString(),
    lead_source: 'configurador_plano_2d',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    configurations: [
      {
        id: 'preview-config',
        lead_id: 'preview',
        length: config.length,
        width: config.width,
        square_meters: price.squareMeters,
        is_special_measure: config.isSpecialMeasure,
        panel_type: config.panelType,
        panel_thickness: config.panelThickness,
        panel_color: config.panelColor,
        is_special_panel: config.isSpecialPanel,
        use_type: config.useType,
        door_type: 'Puerta incluida + adicionales',
        door_quantity: price.summary.additionalDoors,
        window_quantity: price.summary.windows80x80 + price.summary.largeWindows,
        extras: price.summary.extrasList,
        delivery_timeline: config.deliveryTimeline,
        base_included_door: price.summary.includedDoor,
        base_included_window_80x80: price.summary.includedWindow80x80,
        base_included_electrical_installation: true,
        base_included_socket_quantity: price.summary.includedSocketQuantity,
        base_included_light_point_quantity: price.summary.includedLightPointQuantity,
        has_air_conditioning: price.summary.hasAirConditioning,
        has_electrical_installation: true,
        has_full_bathroom: price.summary.hasFullBathroom,
        interior_rooms_quantity: price.summary.interiorRooms,
        extra_windows_80x80_quantity: price.summary.windows80x80,
        extra_large_windows_quantity: price.summary.largeWindows,
        additional_doors_quantity: price.summary.additionalDoors,
        additional_socket_quantity: price.summary.additionalSockets,
        layout_json: config.layoutItems,
        created_at: now.toISOString(),
      },
    ],
  };

  const quote: QuoteRow = {
    id: 'preview-quote',
    lead_id: 'preview',
    quote_number: quoteNumber,
    quote_date: now.toISOString().slice(0, 10),
    base_price: price.estimatedPriceWithoutVat,
    iva_percentage: 21,
    iva_amount: price.vatAmount,
    total_price: price.estimatedPriceWithVat,
    pdf_url: null,
    created_at: now.toISOString(),
  };

  downloadQuotePdf(lead, quote);
};
