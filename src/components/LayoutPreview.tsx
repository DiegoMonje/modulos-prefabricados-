import type React from 'react';
import { LayoutItem, LayoutItemType } from '../types';
import { formatCurrency } from '../utils/pricing';

const WALL_THICKNESS = 10;
const GRID_PERCENT = 2;
const CAD_STAGE_MIN_WIDTH = 980;

const isDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom', 'wall_partition'].includes(item.itemType);

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
  if (type.includes('window')) return '#2563eb';
  if (type.includes('bathroom')) return '#0f766e';
  if (type.includes('air_conditioning')) return '#7c3aed';
  if (type.includes('light')) return '#d97706';
  if (type.includes('socket')) return '#334155';
  if (type.includes('room') || type.includes('partition')) return '#111827';
  return '#0f172a';
};

const PriceBadge = ({ item }: { item: LayoutItem }) => {
  const text = item.included ? 'Incluido' : item.price > 0 ? `+ ${formatCurrency(item.price)}` : 'Sin coste';
  return (
    <span
      className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black shadow-sm ${
        item.included ? 'bg-emerald-50 text-emerald-700' : item.price > 0 ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
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
      <span key={`${x}-${y}`} className={`pointer-events-none absolute ${x} ${y} h-3 w-3 rounded-sm border border-white bg-orange-500 shadow`} />
    ))}
  </>
);

const CadSymbol = ({ item, selected }: { item: LayoutItem; selected: boolean }) => {
  const color = selected ? '#f97316' : symbolColorFor(item.itemType);
  const textColor = selected ? 'text-orange-700' : 'text-slate-900';

  if (item.itemType === 'base_door' || item.itemType === 'additional_door') {
    return (
      <div className="relative h-full w-full">
        <svg viewBox="0 0 120 70" className="h-full w-full overflow-visible">
          <line x1="0" y1="67" x2="110" y2="67" stroke={color} strokeWidth="7" strokeLinecap="round" />
          <line x1="0" y1="0" x2="0" y2="67" stroke={color} strokeWidth="7" strokeLinecap="round" />
          <path d="M 3 67 A 67 67 0 0 1 110 8" fill="none" stroke={color} strokeWidth="4" strokeDasharray="7 5" />
        </svg>
      </div>
    );
  }

  if (item.itemType === 'base_window_80x80' || item.itemType === 'window_80x80' || item.itemType === 'large_window') {
    return (
      <div className="flex h-full w-full items-center">
        <div className="h-3 w-full rounded-sm border-y-4 border-blue-600 bg-blue-50 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.35)]">
          <div className="mt-0.5 h-px w-full border-t border-dashed border-blue-500" />
        </div>
      </div>
    );
  }

  if (item.itemType === 'base_socket' || item.itemType === 'additional_socket') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="relative flex aspect-square h-full max-h-11 min-h-7 min-w-7 items-center justify-center rounded-full border-2 bg-white shadow-sm" style={{ borderColor: color }}>
          <span className="mr-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        </div>
      </div>
    );
  }

  if (item.itemType === 'base_light_point') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="relative flex aspect-square h-full max-h-11 min-h-7 min-w-7 items-center justify-center rounded-full border-2 bg-white shadow-sm" style={{ borderColor: color }}>
          <span className="absolute h-0.5 w-4 rotate-45 rounded" style={{ backgroundColor: color }} />
          <span className="absolute h-0.5 w-4 -rotate-45 rounded" style={{ backgroundColor: color }} />
        </div>
      </div>
    );
  }

  if (item.itemType === 'base_electrical_panel') {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border-2 bg-white text-[10px] font-black shadow-sm" style={{ borderColor: color, color }}>
        CE
      </div>
    );
  }

  if (item.itemType === 'wall_partition') {
    return (
      <div className="relative h-full w-full rounded-sm bg-slate-950 shadow-sm">
        <div className="absolute inset-x-1 top-1/2 h-px bg-white/60" />
      </div>
    );
  }

  if (item.itemType === 'interior_room') {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden rounded-sm border-2 bg-white/90 shadow-sm" style={{ borderColor: color }}>
        <div className="h-2 bg-slate-950" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className={`text-sm font-black ${textColor}`}>HAB</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.layoutOrientation === 'longitudinal' ? 'Largo' : 'Ancho'}</p>
          </div>
        </div>
        <div className="h-2 bg-slate-950" />
      </div>
    );
  }

  if (item.itemType === 'full_bathroom') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-sm border-2 bg-teal-50/95 shadow-sm" style={{ borderColor: color }}>
        <div className="absolute inset-x-0 top-0 h-2 bg-teal-700" />
        <div className="absolute left-3 top-5 h-5 w-5 rounded-full border-2" style={{ borderColor: color }} />
        <div className="absolute bottom-4 right-3 h-5 w-9 rounded border-2" style={{ borderColor: color }} />
        <div className="flex h-full items-center justify-center text-center">
          <div>
            <p className="text-sm font-black text-teal-800">BAÑO</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.layoutOrientation === 'longitudinal' ? 'Largo' : 'Ancho'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (item.itemType === 'air_conditioning') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded border-2 bg-white text-[10px] font-black shadow-sm" style={{ borderColor: color, color }}>
        <span className="mb-1 h-px w-4/5" style={{ backgroundColor: color }} />
        A/A
      </div>
    );
  }

  return <div className="h-full w-full rounded border border-slate-400 bg-white" />;
};

const RulerTicks = ({ amount, vertical = false }: { amount: number; vertical?: boolean }) => {
  const roundedAmount = Math.max(1, Math.round(amount));
  const ticks = Array.from({ length: roundedAmount + 1 }, (_, index) => index);

  return (
    <div className={vertical ? 'absolute bottom-[10px] left-0 top-[10px] w-12' : 'absolute left-[10px] right-[10px] top-0 h-10'}>
      {ticks.map((tick) => {
        const position = (tick / roundedAmount) * 100;
        const style = vertical ? { top: `${position}%` } : { left: `${position}%` };
        return (
          <div key={tick} className={vertical ? 'absolute left-5 flex items-center gap-1' : 'absolute top-4 flex -translate-x-1/2 flex-col items-center'} style={style}>
            <span className={vertical ? 'h-px w-3 bg-slate-400' : 'h-3 w-px bg-slate-400'} />
            <span className="text-[10px] font-bold text-slate-500">{tick}m</span>
          </div>
        );
      })}
    </div>
  );
};

const CadItem = ({
  item,
  editable,
  selected,
  onSelectItem,
  onItemPointerDown,
}: {
  item: LayoutItem;
  editable: boolean;
  selected: boolean;
  onSelectItem?: (id: string) => void;
  onItemPointerDown?: (event: React.PointerEvent<HTMLDivElement>, id: string) => void;
}) => {
  const rotation = !isDivision(item) ? item.rotation || 0 : 0;
  const label = labelFor(item.itemType);

  return (
    <div
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-label={`${label} en el plano`}
      title={`${label}${item.included ? ' incluido' : item.price ? ` · ${formatCurrency(item.price)}` : ''}`}
      className={`group absolute select-none ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `${item.width}%`,
        height: `${item.height}%`,
        minWidth: item.itemType === 'wall_partition' ? 12 : 34,
        minHeight: item.itemType === 'wall_partition' ? 8 : 28,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: selected ? 30 : isDivision(item) ? 18 : 20,
      }}
      onPointerDown={editable && onItemPointerDown ? (event) => {
        event.stopPropagation();
        onSelectItem?.(item.id);
        onItemPointerDown(event, item.id);
      } : undefined}
      onClick={(event) => {
        event.stopPropagation();
        onSelectItem?.(item.id);
      }}
    >
      {selected ? <div className="pointer-events-none absolute -inset-2 rounded-md border-2 border-dashed border-orange-500 bg-orange-500/5" /> : null}
      <CadSymbol item={item} selected={selected} />
      {selected ? <SelectionHandles /> : null}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-black text-slate-900 opacity-90 shadow-sm ring-1 ring-slate-200">
        {label}
      </span>
      <PriceBadge item={item} />
      {selected ? (
        <span className="pointer-events-none absolute left-0 top-[calc(100%+24px)] whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow">
          X {Math.round(item.x)} · Y {Math.round(item.y)}
        </span>
      ) : null}
    </div>
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
  const moduleHeight = Math.max(300, Math.min(500, CAD_STAGE_MIN_WIDTH / ratio));
  const safeZoom = Math.max(0.8, Math.min(1.5, zoom));

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-slate-900">Plano técnico 2D interactivo</h3>
          <p className="text-sm text-slate-600">Arrastra elementos sobre una retícula técnica con ajuste automático a pared y divisiones reales.</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
          {length} x {width} m
        </div>
      </div>

      <div className="overflow-hidden rounded-[26px] border border-slate-300 bg-slate-950 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">CAD 2D</span>
            <span className="rounded-full bg-slate-800 px-3 py-1">Retícula {GRID_PERCENT}%</span>
            <span className="rounded-full bg-slate-800 px-3 py-1">Zoom {Math.round(safeZoom * 100)}%</span>
          </div>
          <span className="text-slate-400">Plano orientativo · revisión técnica antes de fabricación</span>
        </div>

        <div className="overflow-auto bg-slate-950 p-4">
          <div
            className="origin-top-left transition-transform duration-150"
            style={{
              minWidth: CAD_STAGE_MIN_WIDTH + 100,
              transform: `scale(${safeZoom})`,
              transformOrigin: 'top left',
              width: `${100 / safeZoom}%`,
            }}
          >
            <div className="relative rounded-2xl bg-slate-100 p-5 pl-16 pt-12 shadow-inner ring-1 ring-slate-700/10">
              <RulerTicks amount={length} />
              <RulerTicks amount={width} vertical />

              <div className="absolute left-16 right-5 top-10 h-px bg-slate-400" />
              <div className="absolute bottom-5 left-14 top-12 w-px bg-slate-400" />

              <div className="mb-2 flex items-center justify-between pl-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                <span>Vista superior</span>
                <span>{length} m</span>
              </div>

              <div
                className="relative rounded-sm bg-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
                style={{ height: moduleHeight + WALL_THICKNESS * 2 }}
              >
                <div
                  ref={planeRef}
                  className={`absolute bg-white ${editable ? 'cursor-crosshair' : ''}`}
                  style={{
                    left: WALL_THICKNESS,
                    right: WALL_THICKNESS,
                    top: WALL_THICKNESS,
                    bottom: WALL_THICKNESS,
                    backgroundColor: '#ffffff',
                    backgroundImage:
                      'linear-gradient(rgba(148, 163, 184, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.18) 1px, transparent 1px), linear-gradient(rgba(30, 64, 175, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 64, 175, 0.18) 1px, transparent 1px)',
                    backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px',
                  }}
                  onPointerDown={(event) => {
                    if (event.target === event.currentTarget) onSelectItem?.('');
                  }}
                >
                  <div className="pointer-events-none absolute left-3 top-3 rounded bg-white/85 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500 shadow-sm ring-1 ring-slate-200">
                    Plano orientativo
                  </div>

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:40px_40px]" />

                  {items.map((item) => (
                    <CadItem
                      key={item.id}
                      item={item}
                      editable={editable}
                      selected={selectedItemId === item.id}
                      onSelectItem={onSelectItem}
                      onItemPointerDown={onItemPointerDown}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-[11px] font-semibold text-slate-500 sm:grid-cols-3">
                <span>Escala visual aproximada</span>
                <span>Elementos arrastrables con ajuste a retícula</span>
                <span>Puertas y ventanas se acoplan a paredes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">La distribución final será revisada por nuestro equipo antes de fabricar.</p>
    </div>
  );
};
