const fs = require('node:fs');
const path = require('node:path');

const target = path.join(process.cwd(), 'src', 'components', 'LayoutPreview.tsx');
const source = Buffer.from(process.env.KONVA_LAYOUT_PREVIEW_TSX || '', 'base64').toString('utf8');

if (!source.includes("from 'react-konva'")) {
  throw new Error('No se pudo generar LayoutPreview Konva: contenido inválido.');
}

fs.writeFileSync(target, source);
console.log('LayoutPreview replaced with React Konva CAD canvas.');
