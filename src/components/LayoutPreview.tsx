import type React from 'react';
import { LayoutItem } from '../types';
import { formatCurrency } from '../utils/pricing';

const CANVAS_WIDTH = 1220;
const CANVAS_HEIGHT = 760;
const PADDING_X = 118;
const GRID_STEP = 24;

const strokeFor = (type: string) => {
  if (type.includes('window')) return '#1d4ed8';
  if (type.includes('bathroom')) return '#0f766e';
  if (type.includes('air_conditioning')) return '#6d28d9';
  if (type.includes('light')) return '#b45309';
  if (type.includes('room') || type.includes('partition')) return '#111827';
  return '#0f172a';
};

const labelFor = (type: string) => {
  if (type === 'base_door' || type === 'additional_door') return 'Puerta';
  if (type === 'base_window_80x80' || type === 'window_80x80') return 'Ventana 80x80';
  if (type === 'large_window') return 'Ventana grande';
  if (type === 'base_socket' || type === 'additional_socket') return 'Enchufe';
  if (type === 'base_light_point') return 'Punto de luz';
  if (type === 'base_electrical_panel') return 'Cuadro eléctrico';
  if (type === 'interior_room') return 'Habitación';
  if (type === 'full_bathroom') return 'Baño';
  if (type === 'air_conditioning') return 'A/A';
  if (type === 'wall_partition') return 'Tabique';
  return 'Elemento';
};

const toCanvasBox = (item: LayoutItem, innerWidth: number, innerHeight: number, offsetY: number) => ({
  x: PADDING_X + (item.x / 100) * innerWidth,
  y: offsetY + (item.y / 100) * innerHeight,
  width: Math.max((item.width / 100) * innerWidth, 14),
  height: Math.max((item.height / 100) * innerHeight, 14),
});

const DimensionLine = ({ x1, y1, x2, y2, label, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) => (
  <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="1.4" markerStart="url(#dimArrow)" markerEnd="url(#dimArrow)" />
    <text
      x={(x1 + x2) / 2}
      y={(y1 + y2) / 2 - (vertical ? 0 : 12)}
      textAnchor="middle"
      fontSize="16"
      fontWeight="800"
      fill="#334155"
      transform={vertical ? `rotate(-90 ${(x1 + x2) / 2} ${(y1 + y2) / 2})` : undefined}
    >
      {label}
    </text>
  </g>
);

const TechnicalSymbol = ({ item, selected, innerWidth, innerHeight, offsetY }: { item: LayoutItem; selected: boolean; innerWidth: number; innerHeight: number; offsetY: number }) => {
  const box = toCanvasBox(item, innerWidth, innerHeight, offsetY);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const stroke = strokeFor(item.itemType);
  const selectionStroke = selected ? '#f97316' : stroke;
  const label = labelFor(item.itemType);
  const isIncluded = !!item.included;
  const rotation = item.rotation || 0;
  const isDivision = ['interior_room', 'full_bathroom', 'wall_partition'].includes(item.itemType);

  const makeDoor = () => {
    const side = Math.max(box.width, box.height);
    return (
      <g>
        <line x1={box.x} y1={box.y + box.height} x2={box.x + box.width} y2={box.y + box.height} stroke={selectionStroke} strokeWidth="2.5" />
        <line x1={box.x} y1={box.y} x2={box.x} y2={box.y + box.height} stroke={selectionStroke} strokeWidth="2.5" />
        <path d={`M ${box.x} ${box.y + box.height} A ${side} ${side} 0 0 1 ${box.x + box.width} ${box.y}`} fill="none" stroke={selectionStroke} strokeWidth="1.9" strokeDasharray="5 4" />
      </g>
    );
  };

  const makeWindow = () => (
    <g>
      <line x1={box.x} y1={cy - 5} x2={box.x + box.width} y2={cy - 5} stroke={selectionStroke} strokeWidth="2.4" />
      <line x1={box.x} y1={cy + 5} x2={box.x + box.width} y2={cy + 5} stroke={selectionStroke} strokeWidth="2.4" />
      <line x1={box.x + 3} y1={cy} x2={box.x + box.width - 3} y2={cy} stroke={selectionStroke} strokeWidth="1.2" strokeDasharray="4 4" />
    </g>
  );

  const makeSocket = () => (
    <g>
      <circle cx={cx} cy={cy} r={Math.min(box.width, box.height) / 2.15} fill="white" stroke={selectionStroke} strokeWidth="1.9" />
      <circle cx={cx - 5} cy={cy} r="1.8" fill={selectionStroke} />
      <circle cx={cx + 5} cy={cy} r="1.8" fill={selectionStroke} />
    </g>
  );

  const makeLight = () => (
    <g>
      <circle cx={cx} cy={cy} r={Math.min(box.width, box.height) / 2.2} fill="white" stroke={selectionStroke} strokeWidth="1.9" />
      <line x1={cx - 7} y1={cy - 7} x2={cx + 7} y2={cy + 7} stroke={selectionStroke} strokeWidth="1.4" />
      <line x1={cx + 7} y1={cy - 7} x2={cx - 7} y2={cy + 7} stroke={selectionStroke} strokeWidth="1.4" />
    </g>
  );

  const makePanel = () => (
    <g>
      <rect x={box.x} y={box.y} width={box.width} height={box.height} fill="white" stroke={selectionStroke} strokeWidth="1.8" rx="2" />
      <path d={`M ${box.x + 6} ${box.y + box.height - 6} L ${box.x + 6} ${box.y + 6} L ${box.x + box.width - 6} ${box.y + 6}`} fill="none" stroke={selectionStroke} strokeWidth="1.3" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={selectionStroke}>CE</text>
    </g>
  );

  const makePartition = () => (
    <g>
      <rect x={box.x} y={box.y} width={box.width} height={box.height} fill="#111827" stroke={selectionStroke} strokeWidth="1" />
      <line x1={box.x} y1={box.y + box.height / 2} x2={box.x + box.width} y2={box.y + box.height / 2} stroke="#ffffff" strokeWidth="0.9" opacity="0.7" />
    </g>
  );

  const makeRoom = () => (
    <g>
      <rect x={box.x} y={box.y} width={box.width} height={box.height} fill="rgba(255,255,255,0.86)" stroke={selectionStroke} strokeWidth="2.5" />
      <rect x={box.x} y={box.y} width={box.width} height="6" fill="#111827" opacity="0.9" />
      <rect x={box.x} y={box.y + box.height - 6} width={box.width} height="6" fill="#111827" opacity="0.9" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="18" fontWeight="900" fill="#111827">HAB</text>
      <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">División {item.layoutOrientation === 'longitudinal' ? 'a lo largo' : 'a lo ancho'}</text>
    </g>
  );

  const makeBathroom = () => (
    <g>
      <rect x={box.x} y={box.y} width={box.width} height={box.height} fill="rgba(240,253,250,0.94)" stroke={selectionStroke} strokeWidth="2.5" />
      <rect x={box.x} y={box.y} width={box.width} height="6" fill="#0f766e" opacity="0.95" />
      <rect x={box.x} y={box.y + box.height - 6} width={box.width} height="6" fill="#0f766e" opacity="0.95" />
      <circle cx={box.x + 34} cy={box.y + 36} r="12" fill="none" stroke={selectionStroke} strokeWidth="1.5" />
      <rect x={box.x + box.width - 62} y={box.y + box.height - 48} width="42" height="28" fill="none" stroke={selectionStroke} strokeWidth="1.5" rx="3" />
      <line x1={box.x + box.width - 55} y1={box.y + box.height - 34} x2={box.x + box.width - 27} y2={box.y + box.height - 34} stroke={selectionStroke} strokeWidth="1" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="18" fontWeight="900" fill="#0f766e">BAÑO</text>
      <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">División {item.layoutOrientation === 'longitudinal' ? 'a lo largo' : 'a lo ancho'}</text>
    </g>
  );

  const makeAC = () => (
    <g>
      <rect x={box.x} y={box.y} width={box.width} height={box.height} fill="white" stroke={selectionStroke} strokeWidth="1.8" rx="4" />
      <line x1={box.x + 5} y1={cy - 4} x2={box.x + box.width - 5} y2={cy - 4} stroke={selectionStroke} strokeWidth="1.2" />
      <line x1={box.x + 5} y1={cy + 1} x2={box.x + box.width - 5} y2={cy + 1} stroke={selectionStroke} strokeWidth="1.2" />
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="11" fontWeight="800" fill={selectionStroke}>A/A</text>
    </g>
  );

  let shape: React.ReactNode = null;
  if (item.itemType.includes('door')) shape = makeDoor();
  else if (item.itemType.includes('window')) shape = makeWindow();
  else if (item.itemType.includes('socket')) shape = makeSocket();
  else if (item.itemType.includes('light')) shape = makeLight();
  else if (item.itemType.includes('electrical_panel')) shape = makePanel();
  else if (item.itemType === 'wall_partition') shape = makePartition();
  else if (item.itemType.includes('bathroom')) shape = makeBathroom();
  else if (item.itemType.includes('air_conditioning')) shape = makeAC();
  else if (item.itemType.includes('room')) shape = makeRoom();

  return (
    <g transform={!isDivision ? `rotate(${rotation} ${cx} ${cy})` : undefined}>
      {selected ? <rect x={box.x - 7} y={box.y - 7} width={box.width + 14} height={box.height + 14} fill="none" stroke="#f97316" strokeWidth="2.2" strokeDasharray="7 5" rx="4" /> : null}
      {shape}
      {!isDivision && <text x={cx} y={box.y - 9} textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">{label}</text>}
      {!isIncluded && item.price > 0 && (
        <text x={cx} y={box.y + box.height + 17} textAnchor="middle" fontSize="11" fontWeight="800" fill="#64748b">
          {formatCurrency(item.price)}
        </text>
      )}
      {isIncluded && (
        <text x={cx} y={box.y + box.height + 17} textAnchor="middle" fontSize="11" fontWeight="800" fill="#16a34a">
          Incluido
        </text>
      )}
    </g>
  );
};

export const LayoutPreview = ({
  length,
  width,
  items,
  editable = false,
  selectedItemId,
  onSelectItem,
  onItemPointerDown,
  planeRef,
  zoom = 1,
}: {
  length: number;
  width: number;
  items: LayoutItem[];
  editable?: boolean;
  selectedItemId?: string | null;
  onSelectItem?: (id: string) => void;
  onItemPointerDown?: (event: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onRemove?: (id: string) => void;
  onRotate?: (id: string) => void;
  planeRef?: React.RefObject<HTMLDivElement | null>;
  zoom?: number;
}) => {
  const ratio = width > 0 ? length / width : 2.5;
  const innerWidth = CANVAS_WIDTH - PADDING_X * 2;
  const innerHeight = innerWidth / ratio;
  const maxInnerHeight = CANVAS_HEIGHT - 170;
  const safeHeight = Math.min(innerHeight, maxInnerHeight);
  const offsetY = (CANVAS_HEIGHT - safeHeight) / 2 + 15;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-slate-900">Plano 2D de tu módulo</h3>
          <p className="text-sm text-slate-600">Coloca puertas, ventanas, tabiques y recintos interiores a lo ancho o a lo largo.</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
          {length} x {width} m
        </div>
      </div>

      <div
        ref={planeRef}
        className="relative overflow-auto rounded-[26px] border border-slate-300 bg-white p-2 shadow-sm"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget || (event.target as SVGElement).tagName === 'svg') onSelectItem?.('');
        }}
      >
        <div className="min-w-[900px] origin-top-left transition-transform duration-150" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%` }}>
          <svg viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} className="h-auto w-full">
            <defs>
              <marker id="dimArrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#475569" />
              </marker>
              <pattern id="smallGrid" width={GRID_STEP} height={GRID_STEP} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}`} fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
              <pattern id="bigGrid" width={GRID_STEP * 5} height={GRID_STEP * 5} patternUnits="userSpaceOnUse">
                <rect width={GRID_STEP * 5} height={GRID_STEP * 5} fill="url(#smallGrid)" />
                <path d={`M ${GRID_STEP * 5} 0 L 0 0 0 ${GRID_STEP * 5}`} fill="none" stroke="#cbd5e1" strokeWidth="1.4" />
              </pattern>
            </defs>

            <rect x="0" y="0" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#ffffff" />
            <rect x={PADDING_X} y={offsetY} width={innerWidth} height={safeHeight} fill="url(#bigGrid)" />

            <DimensionLine x1={PADDING_X} y1={offsetY - 34} x2={PADDING_X + innerWidth} y2={offsetY - 34} label={`${length} m`} />
            <DimensionLine x1={PADDING_X - 44} y1={offsetY} x2={PADDING_X - 44} y2={offsetY + safeHeight} label={`${width} m`} vertical />

            <line x1={PADDING_X} y1={offsetY - 22} x2={PADDING_X} y2={offsetY} stroke="#94a3b8" strokeWidth="1" />
            <line x1={PADDING_X + innerWidth} y1={offsetY - 22} x2={PADDING_X + innerWidth} y2={offsetY} stroke="#94a3b8" strokeWidth="1" />
            <line x1={PADDING_X - 28} y1={offsetY} x2={PADDING_X} y2={offsetY} stroke="#94a3b8" strokeWidth="1" />
            <line x1={PADDING_X - 28} y1={offsetY + safeHeight} x2={PADDING_X} y2={offsetY + safeHeight} stroke="#94a3b8" strokeWidth="1" />

            <rect x={PADDING_X} y={offsetY} width={innerWidth} height={safeHeight} fill="none" stroke="#111827" strokeWidth="10" />
            <text x={PADDING_X + 18} y={offsetY + 30} fontSize="15" fontWeight="900" fill="#334155">Plano orientativo</text>

            {items.map((item) => (
              <g
                key={item.id}
                className={editable ? 'cursor-pointer' : ''}
                onPointerDown={editable && onItemPointerDown ? (event) => {
                  event.stopPropagation();
                  onSelectItem?.(item.id);
                  onItemPointerDown(event as unknown as React.PointerEvent<HTMLDivElement>, item.id);
                } : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectItem?.(item.id);
                }}
              >
                <TechnicalSymbol item={item} selected={selectedItemId === item.id} innerWidth={innerWidth} innerHeight={safeHeight} offsetY={offsetY} />
              </g>
            ))}
          </svg>
        </div>
      </div>

      <p className="text-xs text-slate-500">La distribución final será revisada por nuestro equipo antes de fabricar.</p>
    </div>
  );
};
