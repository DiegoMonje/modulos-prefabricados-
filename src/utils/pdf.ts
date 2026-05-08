import { ConfiguratorState, ContactFormState, LeadRow, LayoutItem, PriceResult, QuoteRow } from '../types';
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

const drawLine = (x1: number, y1: number, x2: number, y2: number, width = 1, color = '0.05 0.09 0.16') =>
  `${color} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;

const drawRect = (x: number, y: number, width: number, height: number, stroke = '0.05 0.09 0.16', lineWidth = 1, fill?: string) => {
  const fillCommand = fill ? `${fill} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f\n` : '';
  return `${fillCommand}${stroke} RG ${lineWidth} w ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S\n`;
};

const drawCircle = (cx: number, cy: number, r: number, stroke = '0.05 0.09 0.16', lineWidth = 1, fill?: string) => {
  const c = r * 0.5522847498;
  let commands = `${stroke} RG ${lineWidth} w\n`;
  if (fill) commands += `${fill} rg\n`;
  commands += `${(cx + r).toFixed(2)} ${cy.toFixed(2)} m ${(cx + r).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx + c).toFixed(2)} ${(cy + r).toFixed(2)} ${cx.toFixed(2)} ${(cy + r).toFixed(2)} c\n`;
  commands += `${(cx - c).toFixed(2)} ${(cy + r).toFixed(2)} ${(cx - r).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx - r).toFixed(2)} ${cy.toFixed(2)} c\n`;
  commands += `${(cx - r).toFixed(2)} ${(cy - c).toFixed(2)} ${(cx - c).toFixed(2)} ${(cy - r).toFixed(2)} ${cx.toFixed(2)} ${(cy - r).toFixed(2)} c\n`;
  commands += `${(cx + c).toFixed(2)} ${(cy - r).toFixed(2)} ${(cx + r).toFixed(2)} ${(cy - c).toFixed(2)} ${(cx + r).toFixed(2)} ${cy.toFixed(2)} c\n`;
  commands += fill ? 'B\n' : 'S\n';
  return commands;
};

const isDoor = (item: LayoutItem) => item.itemType === 'base_door' || item.itemType === 'additional_door';
const isWindow80 = (item: LayoutItem) => item.itemType === 'base_window_80x80' || item.itemType === 'window_80x80';
const isWindow = (item: LayoutItem) => isWindow80(item) || item.itemType === 'large_window';
const isEdgeOpening = (item: LayoutItem) => item.zone === 'edge' && (isDoor(item) || isWindow(item));

const edgeSideFor = (item: LayoutItem): 'top' | 'right' | 'bottom' | 'left' => {
  if (item.rotation === 90) return 'right';
  if (item.rotation === 180) return 'bottom';
  if (item.rotation === 270) return 'left';

  const topDistance = Math.abs(item.y);
  const bottomDistance = Math.abs(100 - (item.y + item.height));
  const leftDistance = Math.abs(item.x);
  const rightDistance = Math.abs(100 - (item.x + item.width));
  const min = Math.min(topDistance, bottomDistance, leftDistance, rightDistance);

  if (min === bottomDistance) return 'bottom';
  if (min === leftDistance) return 'left';
  if (min === rightDistance) return 'right';
  return 'top';
};

const roomDepthMeters = (item: LayoutItem, moduleLength: number, moduleWidth: number) => {
  const orientation = item.layoutOrientation || 'transversal';
  if (item.roomWidthMeters) return item.roomWidthMeters;
  if (orientation === 'longitudinal') return Number(((item.width / 100) * moduleLength).toFixed(2));
  return Number(((item.height / 100) * moduleWidth).toFixed(2));
};

const planLabel = (item: LayoutItem) => {
  const labels: Record<string, string> = {
    base_door: 'P',
    additional_door: 'P',
    base_window_80x80: 'V 80x80',
    window_80x80: 'V 80x80',
    large_window: 'VG',
    base_socket: 'T',
    additional_socket: 'T',
    base_light_point: 'PL',
    base_electrical_panel: 'CE',
    air_conditioning: 'A/A',
    wall_partition: 'TABIQUE',
    interior_room: 'HABITACION',
    full_bathroom: 'BANO',
  };
  return labels[item.itemType] || item.itemLabel || 'E';
};

const planCommands = (config: any, x: number, y: number, maxWidth = 330, maxHeight = 128) => {
  if (!config) return '';

  const moduleLength = Math.max(Number(config.length || 6), 0.1);
  const moduleWidth = Math.max(Number(config.width || 2.4), 0.1);
  const ratio = moduleLength / moduleWidth;
  let planWidth = maxWidth;
  let planHeight = planWidth / ratio;
  if (planHeight > maxHeight) {
    planHeight = maxHeight;
    planWidth = planHeight * ratio;
  }

  const planX = x + (maxWidth - planWidth) / 2;
  const planTop = y - 24;
  const planBottom = planTop - planHeight;
  const wallThickness = 4;
  const items = ((config.layout_json || []) as LayoutItem[]).filter(Boolean);
  const px = (pct: number) => planX + (pct / 100) * planWidth;
  const py = (pct: number) => planTop - (pct / 100) * planHeight;
  const pw = (pct: number) => (pct / 100) * planWidth;
  const ph = (pct: number) => (pct / 100) * planHeight;

  let commands = '';
  commands += textCommand('Plano tecnico 2D a escala orientativa', x, y, 11, true);
  commands += textCommand(`Modulo ${moduleLength} x ${moduleWidth} m`, x + maxWidth - 115, y, 9, true);
  commands += `0.97 0.99 1 rg ${x} ${(planBottom - 20).toFixed(2)} ${maxWidth} ${(planHeight + 54).toFixed(2)} re f\n`;
  commands += `0.82 0.88 0.96 RG 0.5 w ${x} ${(planBottom - 20).toFixed(2)} ${maxWidth} ${(planHeight + 54).toFixed(2)} re S\n`;

  // Cotas principales
  commands += drawLine(planX, planTop + 14, planX + planWidth, planTop + 14, 0.7, '0.26 0.32 0.44');
  commands += drawLine(planX, planTop + 9, planX, planTop + 19, 0.7, '0.26 0.32 0.44');
  commands += drawLine(planX + planWidth, planTop + 9, planX + planWidth, planTop + 19, 0.7, '0.26 0.32 0.44');
  commands += textCommand(`${moduleLength} m`, planX + planWidth / 2 - 10, planTop + 20, 8, true);
  commands += drawLine(planX - 14, planTop, planX - 14, planBottom, 0.7, '0.26 0.32 0.44');
  commands += drawLine(planX - 19, planTop, planX - 9, planTop, 0.7, '0.26 0.32 0.44');
  commands += drawLine(planX - 19, planBottom, planX - 9, planBottom, 0.7, '0.26 0.32 0.44');
  commands += textCommand(`${moduleWidth} m`, planX - 32, planBottom + planHeight / 2, 8, true);

  // Fondo y reticula tipo plano
  commands += `1 1 1 rg ${planX.toFixed(2)} ${planBottom.toFixed(2)} ${planWidth.toFixed(2)} ${planHeight.toFixed(2)} re f\n`;
  commands += '0.88 0.92 0.97 RG 0.25 w\n';
  const gridX = Math.max(12, planWidth / Math.max(moduleLength * 2, 1));
  const gridY = Math.max(12, planHeight / Math.max(moduleWidth * 2, 1));
  for (let gx = planX + gridX; gx < planX + planWidth; gx += gridX) commands += `${gx.toFixed(2)} ${planBottom.toFixed(2)} m ${gx.toFixed(2)} ${planTop.toFixed(2)} l S\n`;
  for (let gy = planBottom + gridY; gy < planTop; gy += gridY) commands += `${planX.toFixed(2)} ${gy.toFixed(2)} m ${(planX + planWidth).toFixed(2)} ${gy.toFixed(2)} l S\n`;

  // Divisiones primero
  items.filter((item) => ['interior_room', 'full_bathroom', 'wall_partition'].includes(item.itemType)).forEach((item) => {
    const rx = px(Number(item.x || 0));
    const rh = ph(Number(item.height || 0));
    const ry = py(Number(item.y || 0)) - rh;
    const rw = pw(Number(item.width || 0));

    if (item.itemType === 'wall_partition') {
      commands += drawRect(rx, ry, Math.max(rw, 3), Math.max(rh, 2), '0.10 0.14 0.20', 1, '0.10 0.14 0.20');
      return;
    }

    const fill = item.itemType === 'full_bathroom' ? '0.90 0.98 0.98' : '0.95 0.97 1';
    const stroke = item.itemType === 'full_bathroom' ? '0.06 0.55 0.52' : '0.15 0.23 0.42';
    commands += drawRect(rx, ry, rw, rh, stroke, 1.4, fill);
    commands += textCommand(planLabel(item), rx + 5, ry + rh - 12, 7, true);
    commands += textCommand(`${roomDepthMeters(item, moduleLength, moduleWidth).toLocaleString('es-ES')} m`, rx + 5, ry + 8, 7, true);

    if (item.itemType === 'interior_room') {
      commands += drawLine(rx + rw * 0.12, ry + rh, rx + rw * 0.34, ry + rh - rh * 0.25, 1, '0.15 0.23 0.42');
      commands += drawRect(rx + rw * 0.56, ry + rh - 8, Math.max(16, rw * 0.25), 3, '0.06 0.45 0.80', 0.8, '0.70 0.90 1');
      commands += drawCircle(rx + rw * 0.55, ry + rh * 0.48, 5, '0.90 0.52 0.08', 0.8);
      commands += drawLine(rx + rw * 0.51, ry + rh * 0.44, rx + rw * 0.59, ry + rh * 0.52, 0.8, '0.90 0.52 0.08');
      commands += drawLine(rx + rw * 0.59, ry + rh * 0.44, rx + rw * 0.51, ry + rh * 0.52, 0.8, '0.90 0.52 0.08');
      commands += drawCircle(rx + rw * 0.74, ry + rh * 0.32, 4, '0.05 0.09 0.16', 0.8);
      commands += textCommand('T', rx + rw * 0.72, ry + rh * 0.29, 5, true);
    }

    if (item.itemType === 'full_bathroom') {
      commands += drawRect(rx + rw * 0.60, ry + rh * 0.10, Math.max(16, rw * 0.28), Math.max(14, rh * 0.30), '0.06 0.55 0.52', 0.9);
      commands += drawCircle(rx + rw * 0.26, ry + rh * 0.35, 6, '0.06 0.55 0.52', 0.9);
      commands += drawRect(rx + rw * 0.18, ry + rh * 0.58, Math.max(14, rw * 0.22), Math.max(8, rh * 0.13), '0.06 0.55 0.52', 0.9);
      commands += drawLine(rx + rw * 0.08, ry + rh, rx + rw * 0.28, ry + rh - rh * 0.24, 1, '0.06 0.55 0.52');
      commands += drawRect(rx + rw * 0.62, ry + rh - 7, Math.max(12, rw * 0.18), 3, '0.06 0.45 0.80', 0.8, '0.70 0.90 1');
      commands += textCommand('V 40x40', rx + rw * 0.61, ry + rh - 11, 5, true);
      commands += drawCircle(rx + rw * 0.48, ry + rh * 0.49, 4, '0.90 0.52 0.08', 0.8);
      commands += textCommand('PL', rx + rw * 0.44, ry + rh * 0.46, 5, true);
      commands += textCommand('T', rx + rw * 0.72, ry + rh * 0.55, 5, true);
      commands += textCommand('Termo', rx + rw * 0.70, ry + rh * 0.46, 5);
    }
  });

  // Muros perimetrales encima de la reticula y divisiones
  commands += drawRect(planX, planBottom, planWidth, planHeight, '0.03 0.05 0.10', wallThickness);

  // Aperturas en muros
  items.filter(isEdgeOpening).forEach((item) => {
    const side = edgeSideFor(item);
    const isLargeWindow = item.itemType === 'large_window';
    const openingMeters = isDoor(item) || isWindow80(item) ? 0.8 : isLargeWindow ? 1.2 : 0.8;
    const openingW = (openingMeters / moduleLength) * planWidth;
    const openingH = (openingMeters / moduleWidth) * planHeight;
    const itemX = px(Number(item.x || 0));
    const itemY = py(Number(item.y || 0));

    if (side === 'top' || side === 'bottom') {
      const ox = Math.max(planX + 2, Math.min(itemX, planX + planWidth - openingW - 2));
      const oy = side === 'top' ? planTop : planBottom;
      commands += drawLine(ox, oy, ox + openingW, oy, wallThickness + 1.5, '1 1 1');

      if (isDoor(item)) {
        const swing = Math.min(openingW, planHeight * 0.35);
        const dir = side === 'top' ? -1 : 1;
        commands += drawLine(ox, oy, ox, oy + swing * dir, 1.1, '0.03 0.05 0.10');
        commands += drawLine(ox, oy, ox + openingW, oy, 1.1, '0.03 0.05 0.10');
        commands += `${'0.03 0.05 0.10'} RG 0.7 w ${ox.toFixed(2)} ${(oy + swing * dir).toFixed(2)} m ${(ox + openingW * 0.55).toFixed(2)} ${(oy + swing * 0.95 * dir).toFixed(2)} ${(ox + openingW).toFixed(2)} ${(oy + swing * 0.55 * dir).toFixed(2)} ${(ox + openingW).toFixed(2)} ${oy.toFixed(2)} c S\n`;
        commands += textCommand('P 80', ox + 2, oy + (side === 'top' ? 8 : -10), 6, true);
      } else {
        commands += drawLine(ox, oy + 3, ox + openingW, oy + 3, 1, '0.00 0.45 0.85');
        commands += drawLine(ox, oy - 3, ox + openingW, oy - 3, 1, '0.00 0.45 0.85');
        commands += textCommand(isLargeWindow ? 'VG' : 'V 80', ox + 2, oy + (side === 'top' ? 8 : -10), 6, true);
      }
      return;
    }

    const ox = side === 'left' ? planX : planX + planWidth;
    const oy = Math.max(planBottom + 2, Math.min(itemY, planTop - openingH - 2));
    commands += drawLine(ox, oy, ox, oy + openingH, wallThickness + 1.5, '1 1 1');
    if (isDoor(item)) {
      const swing = Math.min(openingH, planWidth * 0.12);
      const dir = side === 'left' ? 1 : -1;
      commands += drawLine(ox, oy + openingH, ox + swing * dir, oy + openingH, 1.1, '0.03 0.05 0.10');
      commands += drawLine(ox, oy, ox, oy + openingH, 1.1, '0.03 0.05 0.10');
      commands += textCommand('P 80', ox + (side === 'left' ? 5 : -22), oy + openingH / 2, 6, true);
    } else {
      commands += drawLine(ox + 3, oy, ox + 3, oy + openingH, 1, '0.00 0.45 0.85');
      commands += drawLine(ox - 3, oy, ox - 3, oy + openingH, 1, '0.00 0.45 0.85');
      commands += textCommand(isLargeWindow ? 'VG' : 'V 80', ox + (side === 'left' ? 5 : -22), oy + openingH / 2, 6, true);
    }
  });

  // Elementos interiores sueltos
  items.filter((item) => !isEdgeOpening(item) && !['interior_room', 'full_bathroom', 'wall_partition'].includes(item.itemType)).forEach((item) => {
    const cx = px(Number(item.x || 0) + Number(item.width || 0) / 2);
    const cy = py(Number(item.y || 0) + Number(item.height || 0) / 2);
    const label = planLabel(item);

    if (item.itemType === 'base_socket' || item.itemType === 'additional_socket') {
      commands += drawCircle(cx, cy, 5, '0.05 0.09 0.16', 0.9);
      commands += drawLine(cx - 4, cy, cx + 4, cy, 0.8, '0.05 0.09 0.16');
      commands += textCommand('T', cx - 3, cy - 12, 6, Boolean(item.included));
      return;
    }

    if (item.itemType === 'base_light_point') {
      commands += drawCircle(cx, cy, 6, '0.90 0.52 0.08', 0.9);
      commands += drawLine(cx - 4, cy - 4, cx + 4, cy + 4, 0.8, '0.90 0.52 0.08');
      commands += drawLine(cx + 4, cy - 4, cx - 4, cy + 4, 0.8, '0.90 0.52 0.08');
      commands += textCommand('PL', cx - 5, cy - 14, 6, Boolean(item.included));
      return;
    }

    if (item.itemType === 'base_electrical_panel') {
      commands += drawRect(cx - 14, cy - 8, 28, 16, '0.05 0.09 0.16', 0.9);
      commands += textCommand('CE', cx - 6, cy - 3, 6, true);
      return;
    }

    if (item.itemType === 'air_conditioning') {
      commands += drawRect(cx - 16, cy - 8, 32, 16, '0.35 0.20 0.75', 0.9);
      commands += textCommand('A/A', cx - 7, cy - 3, 6, true);
      return;
    }

    commands += textCommand(label, cx - 4, cy, 6, Boolean(item.included));
  });

  commands += textCommand('Leyenda: P=Puerta  V=Ventana  VG=Ventana grande  T=Enchufe  PL=Punto de luz  CE=Cuadro electrico  A/A=Aire acondicionado', x, planBottom - 10, 6);
  commands += textCommand('Plano orientativo sujeto a revision tecnica antes de fabricacion.', x, planBottom - 20, 6, true);

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

  // Header limpio, con altura suficiente para evitar solapes en visor PDF.
  content += '0.06 0.09 0.16 rg 0 780 595 62 re f\n';
  content += '1 1 1 rg\n';
  content += textCommand('Presupuesto / Factura proforma orientativa', 45, 816, 17, true);
  content += textCommand(company.name, 45, 796, 10);
  content += textCommand('Documento orientativo sujeto a revision tecnica', 365, 796, 9);
  content += '0.05 0.09 0.16 rg\n';

  y = 750;
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
    content += planCommands(config, 45, y - 2, 330, 128);
    y -= 172;
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
