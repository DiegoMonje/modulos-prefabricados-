const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(process.cwd(), 'src', 'components', 'LayoutPreview.tsx');
let source = fs.readFileSync(filePath, 'utf8');

if (!source.includes('CAD_CLEAN_BATHROOM_LABELS_PATCH')) {
  const scaleLine = "  const scaleLabel = isDoor(item) ? '80 cm' : isBathroomWindow40(item) ? '40 x 40 cm' : isWindow80(item) ? '80 x 80 cm' : item.itemType === 'large_window' ? '120 cm' : undefined;\n";
  const scaleLineFallback = "  const scaleLabel = isDoor(item) ? '80 cm' : isWindow80(item) ? '80 x 80 cm' : item.itemType === 'large_window' ? '120 cm' : undefined;\n";
  const newScaleBlock = "  const scaleLabel = isDoor(item) ? '80 cm' : isBathroomWindow40(item) ? '40 x 40 cm' : isWindow80(item) ? '80 x 80 cm' : item.itemType === 'large_window' ? '120 cm' : undefined;\n  const isIncludedBathroomChild = Boolean(item.source === 'bathroom' && item.parentId);\n  const CAD_CLEAN_BATHROOM_LABELS_PATCH = true;\n";

  if (source.includes(scaleLine)) {
    source = source.replace(scaleLine, newScaleBlock);
  } else if (source.includes(scaleLineFallback)) {
    source = source.replace(scaleLineFallback, newScaleBlock);
  } else {
    throw new Error('No se encontró la línea de scaleLabel para limpiar etiquetas del baño.');
  }

  const oldLabelBlock = `      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/95 px-1.5 py-0.5 text-[10px] font-black text-slate-100 opacity-95 shadow-sm ring-1 ring-slate-600">
        {label}{scaleLabel ? \` · \${scaleLabel}\` : ''}
      </span>
      <PriceBadge item={item} />`;

  const newLabelBlock = `      {!isIncludedBathroomChild || selected ? (
        <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/95 px-1.5 py-0.5 text-[10px] font-black text-slate-100 opacity-95 shadow-sm ring-1 ring-slate-600">
          {label}{scaleLabel ? \` · \${scaleLabel}\` : ''}
        </span>
      ) : null}
      {!isIncludedBathroomChild || selected ? <PriceBadge item={item} /> : null}`;

  if (!source.includes(oldLabelBlock)) {
    throw new Error('No se encontró el bloque de etiqueta/precio para limpiar el baño.');
  }
  source = source.replace(oldLabelBlock, newLabelBlock);
}

fs.writeFileSync(filePath, source);
console.log('CAD included bathroom labels cleaned.');
