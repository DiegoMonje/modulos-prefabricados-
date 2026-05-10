const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.join(process.cwd(), 'src', 'components', 'LayoutPreviewKonva.tsx');
const targetPath = path.join(process.cwd(), 'src', 'components', 'LayoutPreview.tsx');

if (!fs.existsSync(sourcePath)) {
  throw new Error('No existe src/components/LayoutPreviewKonva.tsx');
}

const source = fs.readFileSync(sourcePath, 'utf8');
if (!source.includes("from 'react-konva'") || !source.includes('export const LayoutPreview')) {
  throw new Error('LayoutPreviewKonva.tsx no parece válido.');
}

fs.writeFileSync(targetPath, source);
console.log('React Konva CAD canvas activated.');
