import type React from 'react';
import { RotateCcw, Smartphone } from 'lucide-react';
import { LayoutItem, LayoutItemType } from '../types';
import { formatCurrency } from '../utils/pricing';

const WALL_THICKNESS = 10;
const CAD_MODULE_WIDTH = 980;
const CAD_STAGE_PADDING_WIDTH = 84;
const DOOR_WIDTH_METERS = 0.8;
const WINDOW_80_WIDTH_METERS = 0.8;
const LARGE_WINDOW_WIDTH_METERS = 1.2;
const WINDOW_MARKER_DEPTH_METERS = 0.12;

type ResizeHandle = 'bottom' | 'right';
type EdgeSide = 'top' | 'right' | 'bottom' | 'left';

type VisualBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  side?: EdgeSide;
};

const isDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom', 'wall_partition'].includes(item.itemType);
const isResizableDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom'].includes(item.itemType);
const isDoor = (item: LayoutItem) => item.itemType === 'base_door' || item.itemType === 'additional_door';
const isWindow80 = (item: LayoutItem) => item.itemType === 'base_window_80x80' || item.itemType === 'window_80x80';
const isWindow = (item: LayoutItem) => isWindow80(item) || item.itemType === 'large_window';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const formatMeters = (value: number) =>
  value.toLocaleString('es-ES', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 2,
  });

const labelFor = (type: LayoutItemType) => {
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

const symbolColorFor = (type: LayoutItemType) => {
  if (type.includes('window')) return '#7dd3fc';
  if (type.includes('bathroom')) return '#5eead4';
  if (type.includes('air_conditioning')) return '#c4b5fd';
  if (type.includes('light')) return '#fbbf24';
  if (type.includes('socket')) return '#e2e8f0';
  return '#f8fafc';
};

const realDepthFor = (item: LayoutItem, moduleLength: number, moduleWidth: number) => {
  const orientation = item.layoutOrientation || 'transversal';
  if (orientation === 'longitudinal') return (item.width / 100) * moduleLength;
  return (item.height / 100) * moduleWidth;
};

const edgeSideFor = (item: LayoutItem): EdgeSide => {
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

const getVisualBox = (item: LayoutItem, moduleLength: number, moduleWidth: number): VisualBox => {
  const metersToX = (meters: number) => (meters / Math.max(moduleLength, 0.1)) * 100;
  const metersToY = (meters: number) => (meters / Math.max(moduleWidth, 0.1)) * 100;

  if (item.zone === 'edge' && (isDoor(item) || isWindow(item))) {
    const side = edgeSideFor(item);
    const openingMeters = isDoor(item) || isWindow80(item) ? WINDOW_80_WIDTH_METERS : LARGE_WINDOW_WIDTH_METERS;
    const alongLengthPct = metersToX(openingMeters);
    const alongWidthPct = metersToY(openingMeters);
    const doorSwingXPct = metersToX(DOOR_WIDTH_METERS);
    const doorSwingYPct = metersToY(DOOR_WIDTH_METERS);
    const windowDepthXPct = clamp(metersToX(WINDOW_MARKER_DEPTH_METERS), 1.1, 3.2);
    const windowDepthYPct = clamp(metersToY(WINDOW_MARKER_DEPTH_METERS), 1.1, 4.5);

    if (side === 'top' || side === 'bottom') {
      const height = isDoor(item) ? doorSwingYPct : windowDepthYPct;
      return {
        x: clamp(item.x, 0, 100 - alongLengthPct),
        y: side === 'bottom' ? 100 - height : 0,
        width: alongLengthPct,
        height,
        side,
      };
    }

    const width = isDoor(item) ? doorSwingXPct : windowDepthXPct;
    return {
      x: side === 'right' ? 100 - width : 0,
      y: clamp(item.y, 0, 100 - alongWidthPct),
      width,
      height: alongWidthPct,
      side,
    };
  }

  return { x: item.x, y: item.y, width: item.width, height: item.height };
};

const PriceBadge = ({ item }: { item: LayoutItem }) => {
  const text = item.included ? 'Incluido' : item.price > 0 ? `+ ${formatCurrency(item.price)}` : 'Sin coste';
  return (
    <span className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black shadow-sm ${item.included ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30' : item.price > 0 ? 'bg-orange-400/15 text-orange-200 ring-1 ring-orange-400/30' : 'bg-slate-800 text-slate-300 ring-1 ring-slate-600'}`}>
      {text}
    </span>
  );
};

const SelectionHandles = () => (
  <>
    {[
      ['-left-1.5', '-top-1.5'],
      ['-right-1.5', '-top-1.5'],
      ['-bottom-1.5', '-left-1.5'],
      ['-bottom-1.5', '-right-1.5'],
    ].map(([x, y]) => (
      <span key={`${x}-${y}`} className={`pointer-events-none absolute ${x} ${y} h-3 w-3 rounded-sm border border-slate-950 bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.65)]`} />
    ))}
  </>
);

const rotationForSide = (side?: EdgeSide) => {
  if (side === 'right') return 90;
  if (side === 'bottom') return 180;
  if (side === 'left') return 270;
  return 0;
};

const DoorSymbol = ({ color, side }: { color: string; side?: EdgeSide }) => (
  <div className="relative h-full w-full" style={{ transform: `rotate(${rotationForSide(side)}deg)`, transformOrigin: 'center' }}>
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      <line x1="0" y1="0" x2="100" y2="0" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="0" y1="0" x2="0" y2="100" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 0 100 A 100 100 0 0 1 100 0" fill="none" stroke={color} strokeWidth="2" strokeDasharray="5 4" />
      <path d="M 0 0 L 100 0" stroke="#020617" strokeWidth="10" opacity="0.5" />
    </svg>
  </div>
);

const WindowSymbol = ({ color, side }: { color: string; side?: EdgeSide }) => {
  const vertical = side === 'left' || side === 'right';
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-sky-400/10 ring-1 ring-sky-200/30">
      <svg viewBox={vertical ? '0 0 26 100' : '0 0 100 26'} className="h-full w-full overflow-visible">
        {vertical ? (
          <>
            <line x1="8" y1="0" x2="8" y2="100" stroke={color} strokeWidth="4" />
            <line x1="18" y1="0" x2="18" y2="100" stroke={color} strokeWidth="4" />
            <line x1="13" y1="3" x2="13" y2="97" stroke={color} strokeWidth="1.4" strokeDasharray="5 4" />
          </>
        ) : (
          <>
            <line x1="0" y1="8" x2="100" y2="8" stroke={color} strokeWidth="4" />
            <line x1="0" y1="18" x2="100" y2="18" stroke={color} strokeWidth="4" />
            <line x1="3" y1="13" x2="97" y2="13" stroke={color} strokeWidth="1.4" strokeDasharray="5 4" />
          </>
        )}
      </svg>
    </div>
  );
};

const ArchitecturalSocket = ({ color }: { color: string }) => (
  <svg viewBox="0 0 60 60" className="h-full w-full overflow-visible">
    <circle cx="30" cy="30" r="18" fill="none" stroke={color} strokeWidth="3" />
    <line x1="18" y1="30" x2="42" y2="30" stroke={color} strokeWidth="3" />
    <circle cx="24" cy="23" r="2.5" fill={color} />
    <circle cx="36" cy="23" r="2.5" fill={color} />
  </svg>
);

const ArchitecturalLight = ({ color }: { color: string }) => (
  <svg viewBox="0 0 60 60" className="h-full w-full overflow-visible">
    <circle cx="30" cy="30" r="18" fill="none" stroke={color} strokeWidth="3" />
    <line x1="19" y1="19" x2="41" y2="41" stroke={color} strokeWidth="3" />
    <line x1="41" y1="19" x2="19" y2="41" stroke={color} strokeWidth="3" />
  </svg>
);

const ElectricalPanel = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 70" className="h-full w-full overflow-visible">
    <rect x="5" y="5" width="90" height="60" fill="none" stroke={color} strokeWidth="4" rx="3" />
    <line x1="18" y1="22" x2="82" y2="22" stroke={color} strokeWidth="2" />
    <line x1="18" y1="36" x2="82" y2="36" stroke={color} strokeWidth="2" />
    <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="900" fill={color}>CE</text>
  </svg>
);

const CadSymbol = ({ item, selected, visualBox }: { item: LayoutItem; selected: boolean; visualBox: VisualBox }) => {
  const color = selected ? '#fb923c' : symbolColorFor(item.itemType);
  const textColor = selected ? 'text-orange-200' : 'text-slate-100';

  if (isDoor(item)) return <DoorSymbol color={color} side={visualBox.side} />;
  if (isWindow(item)) return <WindowSymbol color={color} side={visualBox.side} />;

  if (item.itemType === 'base_socket' || item.itemType === 'additional_socket') {
    return <ArchitecturalSocket color={color} />;
  }

  if (item.itemType === 'base_light_point') {
    return <ArchitecturalLight color={color} />;
  }

  if (item.itemType === 'base_electrical_panel') {
    return <ElectricalPanel color={color} />;
  }

  if (item.itemType === 'wall_partition') {
    return (
      <div className="relative h-full w-full rounded-sm bg-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
        <div className="absolute inset-x-1 top-1/2 h-px bg-slate-950/60" />
      </div>
    );
  }

  if (item.itemType === 'interior_room') {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden border-2 bg-slate-950/80 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.16)]" style={{ borderColor: color }}>
        <div className="h-2 bg-slate-100" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className={`text-sm font-black ${textColor}`}>HABITACIÓN</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.layoutOrientation === 'longitudinal' ? 'División longitudinal' : 'División transversal'}</p>
          </div>
        </div>
        <div className="h-2 bg-slate-100" />
      </div>
    );
  }

  if (item.itemType === 'full_bathroom') {
    return (
      <div className="relative h-full w-full overflow-hidden border-2 bg-teal-950/80 shadow-[inset_0_0_0_1px_rgba(94,234,212,0.14)]" style={{ borderColor: color }}>
        <div className="absolute inset-x-0 top-0 h-2 bg-teal-200" />
        <svg viewBox="0 0 220 140" className="absolute inset-0 h-full w-full p-3">
          <circle cx="42" cy="44" r="17" fill="none" stroke={color} strokeWidth="4" />
          <rect x="154" y="88" width="48" height="32" fill="none" stroke={color} strokeWidth="4" rx="3" />
          <path d="M 28 108 C 40 92, 62 92, 74 108" fill="none" stroke={color} strokeWidth="3" />
        </svg>
        <div className="flex h-full items-center justify-center text-center">
          <div>
            <p className="text-sm font-black text-teal-100">BAÑO</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-300">{item.layoutOrientation === 'longitudinal' ? 'Longitudinal' : 'Transversal'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (item.itemType === 'air_conditioning') {
    return (
      <svg viewBox="0 0 100 55" className="h-full w-full overflow-visible">
        <rect x="6" y="6" width="88" height="43" fill="none" stroke={color} strokeWidth="4" rx="4" />
        <line x1="15" y1="28" x2="85" y2="28" stroke={color} strokeWidth="2" />
        <text x="50" y="42" textAnchor="middle" fontSize="18" fontWeight="900" fill={color}>A/A</text>
      </svg>
    );
  }

  return <div className="h-full w-full border border-slate-400 bg-slate-950" />;
};

const buildTicks = (amount: number) => {
  const safeAmount = Math.max(amount, 0.1);
  const wholeMeters = Math.floor(safeAmount);
  const ticks = Array.from({ length: wholeMeters + 1 }, (_, index) => index);
  const lastTick = ticks[ticks.length - 1] ?? 0;
  if (Math.abs(safeAmount - lastTick) > 0.01) ticks.push(Number(safeAmount.toFixed(2)));
  return ticks;
};

const RulerTicks = ({ amount, vertical = false }: { amount: number; vertical?: boolean }) => {
  const safeAmount = Math.max(amount, 0.1);
  const ticks = buildTicks(safeAmount);

  return (
    <div className={vertical ? 'absolute bottom-[10px] left-0 top-[10px] w-14' : 'absolute left-[10px] right-[10px] top-0 h-10'}>
      {ticks.map((tick) => {
        const position = Math.min(100, Math.max(0, (tick / safeAmount) * 100));
        const style = vertical ? { top: `${position}%` } : { left: `${position}%` };
        return (
          <div key={`${vertical ? 'v' : 'h'}-${tick}`} className={vertical ? 'absolute left-4 flex items-center gap-1' : 'absolute top-4 flex -translate-x-1/2 flex-col items-center'} style={style}>
            <span className={vertical ? 'h-px w-3 bg-slate-400' : 'h-3 w-px bg-slate-400'} />
            <span className="whitespace-nowrap text-[10px] font-bold text-slate-400">{formatMeters(tick)}m</span>
          </div>
        );
      })}
    </div>
  );
};

const RotatePhoneNotice = () => (
  <div className="mb-4 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-center text-amber-950 shadow-sm md:hidden portrait:block landscape:hidden">
    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-orange shadow-sm">
      <div className="relative">
        <Smartphone size={34} />
        <RotateCcw size={18} className="absolute -right-4 -top-3" />
      </div>
    </div>
    <p className="text-lg font-black">Gira el móvil</p>
    <p className="mt-1 text-sm font-semibold">Para usar el plano 2D correctamente, pon el teléfono en horizontal.</p>
  </div>
);

const ResizeWallHandle = ({ edge, depthMeters, onPointerDown }: { edge: ResizeHandle; depthMeters: number; onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void }) => {
  const label = `Ancho ${formatMeters(depthMeters)} m`;
  if (edge === 'right') {
    return (
      <button type="button" aria-label="Arrastrar pared interior para ajustar anchura" className="absolute left-full top-1/2 z-50 flex -translate-y-1/2 translate-x-1 items-center gap-1 rounded-full border border-orange-300 bg-orange-500 px-2 py-1 text-[10px] font-black text-white shadow-lg cursor-ew-resize" onPointerDown={onPointerDown}>
        <span className="h-7 w-1 rounded-full bg-white/90" />{label}
      </button>
    );
  }
  return (
    <button type="button" aria-label="Arrastrar pared interior para ajustar anchura" className="absolute left-1/2 top-full z-50 flex -translate-x-1/2 translate-y-1 items-center gap-1 rounded-full border border-orange-300 bg-orange-500 px-2 py-1 text-[10px] font-black text-white shadow-lg cursor-ns-resize" onPointerDown={onPointerDown}>
      <span className="h-1 w-8 rounded-full bg-white/90" />{label}
    </button>
  );
};

const CadItem = ({ item, editable, selected, moduleLength, moduleWidth, onSelectItem, onItemPointerDown, onItemResizePointerDown }: { item: LayoutItem; editable: boolean; selected: boolean; moduleLength: number; moduleWidth: number; onSelectItem?: (id: string) => void; onItemPointerDown?: (event: React.PointerEvent<HTMLDivElement>, id: string) => void; onItemResizePointerDown?: (event: React.PointerEvent<HTMLButtonElement>, id: string, edge: ResizeHandle) => void }) => {
  const visualBox = getVisualBox(item, moduleLength, moduleWidth);
  const rotation = !isDivision(item) && item.zone !== 'edge' ? item.rotation || 0 : 0;
  const label = labelFor(item.itemType);
  const resizeEdge: ResizeHandle = (item.layoutOrientation || 'transversal') === 'longitudinal' ? 'right' : 'bottom';
  const canResize = editable && selected && isResizableDivision(item);
  const depthMeters = realDepthFor(item, moduleLength, moduleWidth);
  const scaleLabel = isDoor(item) ? '80 cm' : isWindow80(item) ? '80 x 80 cm' : item.itemType === 'large_window' ? '120 cm' : undefined;

  return (
    <div
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-label={`${label} en el plano`}
      title={`${label}${scaleLabel ? ` · ${scaleLabel}` : ''}${item.included ? ' · incluido' : item.price ? ` · ${formatCurrency(item.price)}` : ''}`}
      className={`group absolute select-none ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ left: `${visualBox.x}%`, top: `${visualBox.y}%`, width: `${visualBox.width}%`, height: `${visualBox.height}%`, minWidth: item.itemType === 'wall_partition' ? 12 : isWindow(item) ? 28 : 34, minHeight: item.itemType === 'wall_partition' ? 8 : isWindow(item) ? 10 : 28, transform: `rotate(${rotation}deg)`, transformOrigin: 'center center', zIndex: selected ? 30 : isDivision(item) ? 18 : 20 }}
      onPointerDown={editable && onItemPointerDown ? (event) => { event.stopPropagation(); onSelectItem?.(item.id); onItemPointerDown(event, item.id); } : undefined}
      onClick={(event) => { event.stopPropagation(); onSelectItem?.(item.id); }}
    >
      {selected ? <div className="pointer-events-none absolute -inset-2 border-2 border-dashed border-orange-400 bg-orange-400/10 shadow-[0_0_18px_rgba(251,146,60,0.35)]" /> : null}
      <CadSymbol item={item} selected={selected} visualBox={visualBox} />
      {selected ? <SelectionHandles /> : null}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/95 px-1.5 py-0.5 text-[10px] font-black text-slate-100 opacity-95 shadow-sm ring-1 ring-slate-600">
        {label}{scaleLabel ? ` · ${scaleLabel}` : ''}
      </span>
      <PriceBadge item={item} />
      {canResize ? <ResizeWallHandle edge={resizeEdge} depthMeters={depthMeters} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onSelectItem?.(item.id); onItemResizePointerDown?.(event, item.id, resizeEdge); }} /> : null}
      {selected ? <span className="pointer-events-none absolute left-0 top-[calc(100%+24px)] whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[10px] font-bold text-white shadow ring-1 ring-slate-600">X {Math.round(item.x)} · Y {Math.round(item.y)}{isResizableDivision(item) ? ` · ancho ${formatMeters(depthMeters)} m` : scaleLabel ? ` · escala ${scaleLabel}` : ''}</span> : null}
    </div>
  );
};

export const LayoutPreview = ({ length, width, items, editable = false, selectedItemId, onSelectItem, onItemPointerDown, onItemResizePointerDown, planeRef, zoom = 1 }: { length: number; width: number; items: LayoutItem[]; editable?: boolean; selectedItemId?: string | null; onSelectItem?: (id: string) => void; onItemPointerDown?: (event: React.PointerEvent<HTMLDivElement>, id: string) => void; onItemResizePointerDown?: (event: React.PointerEvent<HTMLButtonElement>, id: string, edge: ResizeHandle) => void; onRemove?: (id: string) => void; onRotate?: (id: string) => void; planeRef?: React.RefObject<HTMLDivElement | null>; zoom?: number }) => {
  const moduleHeight = Math.max(220, CAD_MODULE_WIDTH * (width / Math.max(length, 0.1)));
  const safeZoom = Math.max(0.8, Math.min(1.5, zoom));

  return (
    <div className="space-y-3">
      {editable ? <RotatePhoneNotice /> : null}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-slate-900">Plano técnico 2D interactivo</h3>
          <p className="text-sm text-slate-600">Arrastra elementos en un plano tipo CAD con símbolos arquitectónicos y escala real.</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">{formatMeters(length)} x {formatMeters(width)} m</div>
      </div>

      <div className="overflow-hidden rounded-[26px] border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold text-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300 ring-1 ring-emerald-400/30">CAD 2D</span>
            <span className="rounded-full bg-slate-900 px-3 py-1 ring-1 ring-slate-700">Escala real {formatMeters(length)} x {formatMeters(width)} m</span>
            <span className="rounded-full bg-slate-900 px-3 py-1 ring-1 ring-slate-700">Símbolos arquitectónicos</span>
            <span className="rounded-full bg-slate-900 px-3 py-1 ring-1 ring-slate-700">Zoom {Math.round(safeZoom * 100)}%</span>
          </div>
          <span className="text-slate-400">Plano orientativo · revisión técnica antes de fabricación</span>
        </div>

        <div className="overflow-auto bg-slate-950 p-4 md:portrait:max-h-[68vh]">
          <div className="origin-top-left transition-transform duration-150" style={{ width: CAD_MODULE_WIDTH + CAD_STAGE_PADDING_WIDTH, transform: `scale(${safeZoom})`, transformOrigin: 'top left' }}>
            <div className="relative rounded-2xl bg-slate-900 p-5 pl-16 pt-12 shadow-inner ring-1 ring-slate-700" style={{ width: CAD_MODULE_WIDTH + CAD_STAGE_PADDING_WIDTH }}>
              <RulerTicks amount={length} />
              <RulerTicks amount={width} vertical />
              <div className="absolute left-16 right-5 top-10 h-px bg-slate-600" />
              <div className="absolute bottom-5 left-14 top-12 w-px bg-slate-600" />
              <div className="mb-2 flex items-center justify-between pl-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400"><span>Vista superior</span><span>Largo real: {formatMeters(length)} m</span></div>

              <div className="relative rounded-sm bg-slate-200 shadow-[0_18px_40px_rgba(0,0,0,0.42)]" style={{ height: moduleHeight + WALL_THICKNESS * 2 }}>
                <div
                  ref={planeRef}
                  className={`absolute overflow-visible bg-slate-950 ${editable ? 'cursor-crosshair' : ''}`}
                  style={{ left: WALL_THICKNESS, right: WALL_THICKNESS, top: WALL_THICKNESS, bottom: WALL_THICKNESS, backgroundColor: '#020617', backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px), linear-gradient(rgba(56, 189, 248, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.14) 1px, transparent 1px)', backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px' }}
                  onPointerDown={(event) => { if (event.target === event.currentTarget) onSelectItem?.(''); }}
                >
                  <div className="pointer-events-none absolute left-3 top-3 z-10 rounded bg-slate-950/85 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-slate-300 shadow-sm ring-1 ring-slate-700">Ancho real: {formatMeters(width)} m</div>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.13)_1px,transparent_1px)] [background-size:40px_40px]" />
                  {items.map((item) => <CadItem key={item.id} item={item} editable={editable} selected={selectedItemId === item.id} moduleLength={length} moduleWidth={width} onSelectItem={onSelectItem} onItemPointerDown={onItemPointerDown} onItemResizePointerDown={onItemResizePointerDown} />)}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-[11px] font-semibold text-slate-400 sm:grid-cols-3"><span>Escala proporcional al módulo real</span><span>Habitaciones y baños: pared interior deslizable</span><span>Puertas 80 cm y ventanas 80x80 a escala</span></div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500">La distribución final será revisada por nuestro equipo antes de fabricar.</p>
    </div>
  );
};
