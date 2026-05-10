const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(process.cwd(), 'src', 'components', 'LayoutPreview.tsx');
let source = fs.readFileSync(filePath, 'utf8');

// La versión React Konva del CAD ya no usa el bloque HTML antiguo con scaleLabel.
// Este parche solo era necesario para la versión anterior de LayoutPreview basada en div/svg.
// Si el CAD Konva está activo, no hay nada que modificar y el build debe continuar.
if (source.includes("from 'react-konva'")) {
  console.log('CAD clean labels patch skipped: React Konva CAD is already active.');
  process.exit(0);
}

if (!source.includes('CAD_CLEAN_BATHROOM_LABELS_PATCH')) {
  const scaleLine = "  const scaleLabel = isDoor(item) ? '80 cm' : isBathroomWindow40(item) ? '40 x 40 cm' : isWindow80(item) ? '80 x 80 cm' : item.itemType === 'large_window' ? '120 cm' : undefined;\n";
  const scaleLineFallback = "  const scaleLabel = isDoor(item) ? '80 cm' : isWindow80(item) ? '80 x 80 cm' : item.itemType === 'large_window' ? '120 cm' : undefined;\n";
  const newScaleBlock = "  const scaleLabel = isDoor(item) ? '80 cm' : isBathroomWindow40(item) ? '40 x 40 cm' : isWindow80(item) ? '80 x 80 cm' : item.itemType === 'large_window' ? '120 cm' : undefined;\n  const isIncludedBathroomChild = Boolean(item.source === 'bathroom' && item.parentId);\n  const CAD_CLEAN_BATHROOM_LABELS_PATCH = true;\n";

  if (source.includes(scaleLine)) {
    source = source.replace(scaleLine, newScaleBlock);
  } else if (source.includes(scaleLineFallback)) {
    source = source.replace(scaleLineFallback, newScaleBlock);
  } else {
    console.log('CAD clean labels patch skipped: scaleLabel line not found in current LayoutPreview.');
    process.exit(0);
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
    console.log('CAD clean labels patch skipped: label/price block not found in current LayoutPreview.');
    process.exit(0);
  }
  source = source.replace(oldLabelBlock, newLabelBlock);
}

if (!source.includes('CAD_CLEAN_BATHROOM_BLOCK_PATCH')) {
  const bathroomBlockRegex = /  if \(item\.itemType === 'full_bathroom'\) \{\n    return \([\s\S]*?\n    \);\n  \}\n\n  if \(item\.itemType === 'air_conditioning'\)/;
  const bathroomBlockReplacement = `  if (item.itemType === 'full_bathroom') {
    return (
      <div className="relative h-full w-full overflow-hidden border-2 bg-teal-950/80 shadow-[inset_0_0_0_1px_rgba(94,234,212,0.14)]" style={{ borderColor: color }}>
        <div className="absolute inset-x-0 top-0 h-1.5 bg-teal-200/90" />
        <div className="absolute left-2 top-2 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-teal-100 ring-1 ring-teal-300/20">
          Baño
        </div>
        <span className="hidden">CAD_CLEAN_BATHROOM_BLOCK_PATCH</span>
      </div>
    );
  }

  if (item.itemType === 'air_conditioning')`;

  if (!bathroomBlockRegex.test(source)) {
    console.log('CAD clean bathroom block patch skipped: bathroom visual block not found in current LayoutPreview.');
    process.exit(0);
  }

  source = source.replace(bathroomBlockRegex, bathroomBlockReplacement);
}

fs.writeFileSync(filePath, source);
console.log('CAD included bathroom labels and fixed bathroom block cleaned.');
