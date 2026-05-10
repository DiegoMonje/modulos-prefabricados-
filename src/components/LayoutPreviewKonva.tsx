import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Smartphone } from 'lucide-react';
import { Stage, Layer, Rect, Line, Circle, Arc, Text as KonvaText, Group, Path, Ellipse } from 'react-konva';
import { LayoutItem, LayoutItemType } from '../types';
import { formatCurrency } from '../utils/pricing';

const BATHROOM_40_WINDOW_PATCH = true;
const WALL_THICKNESS = 8;
const DOOR_WIDTH_METERS = 0.8;
const WINDOW_80_WIDTH_METERS = 0.8;
const WINDOW_40_WIDTH_METERS = 0.4;
const LARGE_WINDOW_WIDTH_METERS = 1.2;
const WINDOW_DEPTH_METERS = 0.1;
const MIN_BATHROOM_DEPTH_METERS = 1.2;
const MIN_ROOM_DEPTH_METERS = 1.5;

type ResizeHandle = 'bottom' | 'right';
type EdgeSide = 'top' | 'right' | 'bottom' | 'left';

type VisualBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  side?: EdgeSide;
};

type LayoutPreviewProps = {
  length: number;
  width: number;
  items: LayoutItem[];
  editable?: boolean;
  selectedItemId?: string | null;
  selectedItem?: LayoutItem | null;
  zoom?: number;
  className?: string;
  planeRef?: React.RefObject<HTMLDivElement | null>;
  onSelectItem?: (id: string) => void;
  onItemPointerDown?: (event: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onItemResizePointerDown?: (event: React.PointerEvent<HTMLButtonElement>, id: string, edge: ResizeHandle) => void;
  [key: string]: unknown;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const isDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom', 'wall_partition'].includes(item.itemType);
const isResizableDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom'].includes(item.itemType);
const isDoor = (item: LayoutItem) => item.itemType === 'base_door' || item.itemType === 'additional_door';
const isWindow80 = (item: LayoutItem) => item.itemType === 'base_window_80x80' || item.itemType === 'window_80x80';
const isWindow = (item: LayoutItem) => isWindow80(item) || item.itemType === 'large_window';
const isBathroomWindow40 = (item: LayoutItem) => item.source === 'bathroom' && item.itemType === 'window_80x80';
const isEdgeOpening = (item: LayoutItem) => item.zone === 'edge' && (isDoor(item) || isWindow(item));

const formatMeters = (value: number) =>
  value.toLocaleString('es-ES', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 2,
  });

const labelFor = (type: LayoutItemType) => {
  if (type === 'base_door' || type === 'additional_door') return 'Puerta';
  if (type === 'base_window_80x80' || type === 'window_80x80') return 'Ventana';
  if (type === 'large_window') return 'Ventana grande';
  if (type === 'base_socket' || type === 'additional_socket') return 'Enchufe';
  if (type === 'base_light_point') return 'Punto de luz';
  if (type === 'base_electrical_panel') return 'Cuadro eléctrico';
  if (type === 'interior_room') return 'Habitación';
  if (type === 'full_bathroom') return 'Baño';
  if (type === 'bathroom_sink') return 'Lavabo';
  if (type === 'bathroom_wc') return 'Váter';
  if (type === 'bathroom_shower') return 'Ducha';
  if (type === 'air_conditioning') return 'A/A';
  if (type === 'wall_partition') return 'Tabique';
  return 'Elemento';
};

const colorFor = (item: LayoutItem, selected: boolean) => {
  if (selected) return '#fb923c';
  if (item.itemType.includes('bathroom')) return '#5eead4';
  if (item.itemType.includes('window')) return '#7dd3fc';
  if (item.itemType.includes('light')) return '#fbbf24';
  if (item.itemType.includes('socket')) return '#e2e8f0';
  if (item.itemType === 'air_conditioning') return '#c4b5fd';
  return '#f8fafc';
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

const realDepthFor = (item: LayoutItem, moduleLength: number, moduleWidth: number) => {
  const orientation = item.layoutOrientation || 'transversal';
  if (orientation === 'longitudinal') return (item.width / 100) * moduleLength;
  return (item.height / 100) * moduleWidth;
};

const getVisualBox = (item: LayoutItem, moduleLength: number, moduleWidth: number): VisualBox => {
  const metersToX = (meters: number) => (meters / Math.max(moduleLength, 0.1)) * 100;
  const metersToY = (meters: number) => (meters / Math.max(moduleWidth, 0.1)) * 100;

  if (isEdgeOpening(item)) {
    const side = edgeSideFor(item);
    const openingMeters = item.itemType === 'large_window' ? LARGE_WINDOW_WIDTH_METERS : WINDOW_80_WIDTH_METERS;
    const alongLengthPct = metersToX(openingMeters);
    const alongWidthPct = metersToY(openingMeters);
    const swingXPct = metersToX(DOOR_WIDTH_METERS);
    const swingYPct = metersToY(DOOR_WIDTH_METERS);
    const windowDepthXPct = clamp(metersToX(WINDOW_DEPTH_METERS), 1, 3.2);
    const windowDepthYPct = clamp(metersToY(WINDOW_DEPTH_METERS), 1, 4.5);

    if (side === 'top' || side === 'bottom') {
      const height = isDoor(item) ? swingYPct : windowDepthYPct;
      return {
        x: clamp(item.x, 0, 100 - alongLengthPct),
        y: side === 'bottom' ? 100 - height : 0,
        width: alongLengthPct,
        height,
        side,
      };
    }

    const width = isDoor(item) ? swingXPct : windowDepthXPct;
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

const realSizeFor = (item: LayoutItem, moduleLength: number, moduleWidth: number) => {
  if (isDoor(item)) return '0,80 m';
  if (isBathroomWindow40(item)) return '0,40 x 0,40 m';
  if (isWindow80(item)) return '0,80 x 0,80 m';
  if (item.itemType === 'large_window') return '1,20 m';
  if (isResizableDivision(item)) return `${formatMeters(realDepthFor(item, moduleLength, moduleWidth))} m de ancho`;
  return '';
};

const toPixels = (box: VisualBox, planX: number, planY: number, planW: number, planH: number) => ({
  x: planX + (box.x / 100) * planW,
  y: planY + (box.y / 100) * planH,
  width: Math.max((box.width / 100) * planW, 8),
  height: Math.max((box.height / 100) * planH, 8),
});

const buildWarnings = (items: LayoutItem[], moduleLength: number, moduleWidth: number) => {
  const warnings: string[] = [];
  items.filter(isResizableDivision).forEach((item) => {
    const depth = realDepthFor(item, moduleLength, moduleWidth);
    if (item.itemType === 'full_bathroom' && depth < MIN_BATHROOM_DEPTH_METERS) warnings.push('El baño debería tener al menos 1,20 m de ancho útil.');
    if (item.itemType === 'interior_room' && depth < MIN_ROOM_DEPTH_METERS) warnings.push('La habitación debería tener al menos 1,50 m de ancho útil.');
  });
  return warnings.slice(0, 3);
};

const WallGrid = ({ planX, planY, planW, planH, length, width }: { planX: number; planY: number; planW: number; planH: number; length: number; width: number }) => {
  const verticalLines = Array.from({ length: Math.floor(length * 2) + 1 }, (_, index) => index / 2);
  const horizontalLines = Array.from({ length: Math.floor(width * 2) + 1 }, (_, index) => index / 2);

  return (
    <>
      <Rect x={planX} y={planY} width={planW} height={planH} fill="#020617" />
      {verticalLines.map((meter) => {
        const x = planX + (meter / length) * planW;
        return <Line key={`v-${meter}`} points={[x, planY, x, planY + planH]} stroke={Number.isInteger(meter) ? '#1e3a5f' : '#10233a'} strokeWidth={Number.isInteger(meter) ? 1 : 0.6} />;
      })}
      {horizontalLines.map((meter) => {
        const y = planY + (meter / width) * planH;
        return <Line key={`h-${meter}`} points={[planX, y, planX + planW, y]} stroke={Number.isInteger(meter) ? '#1e3a5f' : '#10233a'} strokeWidth={Number.isInteger(meter) ? 1 : 0.6} />;
      })}
      <Rect x={planX} y={planY} width={planW} height={planH} stroke="#e2e8f0" strokeWidth={WALL_THICKNESS} />
    </>
  );
};

const Rulers = ({ planX, planY, planW, planH, length, width }: { planX: number; planY: number; planW: number; planH: number; length: number; width: number }) => {
  const xTicks = Array.from({ length: Math.floor(length) + 1 }, (_, index) => index);
  const yTicks = Array.from({ length: Math.floor(width) + 1 }, (_, index) => index);
  return (
    <>
      <Line points={[planX, planY - 36, planX + planW, planY - 36]} stroke="#64748b" strokeWidth={1} />
      {xTicks.map((tick) => {
        const x = planX + (tick / length) * planW;
        return (
          <Group key={`rx-${tick}`}>
            <Line points={[x, planY - 45, x, planY - 28]} stroke="#94a3b8" strokeWidth={1} />
            <KonvaText x={x - 10} y={planY - 28} width={20} align="center" text={`${tick}m`} fontSize={11} fontStyle="bold" fill="#bfdbfe" />
          </Group>
        );
      })}
      <Line points={[planX - 36, planY, planX - 36, planY + planH]} stroke="#64748b" strokeWidth={1} />
      {yTicks.map((tick) => {
        const y = planY + (tick / width) * planH;
        return (
          <Group key={`ry-${tick}`}>
            <Line points={[planX - 45, y, planX - 28, y]} stroke="#94a3b8" strokeWidth={1} />
            <KonvaText x={planX - 72} y={y - 7} width={30} align="right" text={`${tick}m`} fontSize={11} fontStyle="bold" fill="#bfdbfe" />
          </Group>
        );
      })}
      <KonvaText x={planX + planW - 140} y={planY - 26} text={`LARGO REAL: ${formatMeters(length)} M`} fontSize={12} fontStyle="bold" fill="#bfdbfe" letterSpacing={1} />
      <KonvaText x={planX + 8} y={planY + 12} text={`ANCHO REAL: ${formatMeters(width)} M`} fontSize={12} fontStyle="bold" fill="#bfdbfe" />
    </>
  );
};

const DoorSymbol = ({ x, y, width, height, color, side }: { x: number; y: number; width: number; height: number; color: string; side?: EdgeSide }) => {
  const rotation = side === 'right' ? 90 : side === 'bottom' ? 180 : side === 'left' ? 270 : 0;
  const size = Math.max(width, height);
  return (
    <Group x={x} y={y} rotation={rotation} offsetX={rotation ? size / 2 : 0} offsetY={rotation ? size / 2 : 0}>
      <Line points={[0, 0, size, 0]} stroke={color} strokeWidth={4} lineCap="round" />
      <Line points={[0, 0, 0, size]} stroke={color} strokeWidth={4} lineCap="round" />
      <Arc x={0} y={0} innerRadius={size - 2} outerRadius={size - 1} angle={90} rotation={0} stroke={color} strokeWidth={2} dash={[6, 5]} />
    </Group>
  );
};

const WindowSymbol = ({ x, y, width, height, color }: { x: number; y: number; width: number; height: number; color: string }) => {
  const vertical = height > width;
  return vertical ? (
    <Group>
      <Rect x={x} y={y} width={width} height={height} fill="rgba(14,165,233,0.12)" stroke="rgba(186,230,253,0.35)" strokeWidth={1} />
      <Line points={[x + width * 0.35, y, x + width * 0.35, y + height]} stroke={color} strokeWidth={3} />
      <Line points={[x + width * 0.65, y, x + width * 0.65, y + height]} stroke={color} strokeWidth={3} />
    </Group>
  ) : (
    <Group>
      <Rect x={x} y={y} width={width} height={height} fill="rgba(14,165,233,0.12)" stroke="rgba(186,230,253,0.35)" strokeWidth={1} />
      <Line points={[x, y + height * 0.35, x + width, y + height * 0.35]} stroke={color} strokeWidth={3} />
      <Line points={[x, y + height * 0.65, x + width, y + height * 0.65]} stroke={color} strokeWidth={3} />
    </Group>
  );
};

const SocketSymbol = ({ x, y, width, height, color }: { x: number; y: number; width: number; height: number; color: string }) => {
  const r = Math.min(width, height) / 2;
  const cx = x + width / 2;
  const cy = y + height / 2;
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r * 0.72} stroke={color} strokeWidth={2} />
      <Line points={[cx - r * 0.45, cy, cx + r * 0.45, cy]} stroke={color} strokeWidth={2} />
      <Circle x={cx - r * 0.25} y={cy - r * 0.28} radius={1.8} fill={color} />
      <Circle x={cx + r * 0.25} y={cy - r * 0.28} radius={1.8} fill={color} />
    </Group>
  );
};

const LightSymbol = ({ x, y, width, height, color }: { x: number; y: number; width: number; height: number; color: string }) => {
  const r = Math.min(width, height) / 2;
  const cx = x + width / 2;
  const cy = y + height / 2;
  return (
    <Group>
      <Circle x={cx} y={cy} radius={r * 0.72} stroke={color} strokeWidth={2} />
      <Line points={[cx - r * 0.45, cy - r * 0.45, cx + r * 0.45, cy + r * 0.45]} stroke={color} strokeWidth={2} />
      <Line points={[cx + r * 0.45, cy - r * 0.45, cx - r * 0.45, cy + r * 0.45]} stroke={color} strokeWidth={2} />
    </Group>
  );
};

const SinkSymbol = ({ x, y, width, height, color }: { x: number; y: number; width: number; height: number; color: string }) => (
  <Group>
    <Rect x={x + width * 0.2} y={y + height * 0.08} width={width * 0.6} height={height * 0.22} stroke={color} strokeWidth={2} cornerRadius={3} />
    <Ellipse x={x + width / 2} y={y + height * 0.58} radiusX={width * 0.3} radiusY={height * 0.26} stroke={color} strokeWidth={2} />
    <Circle x={x + width / 2} y={y + height * 0.25} radius={2} fill={color} />
  </Group>
);

const WcSymbol = ({ x, y, width, height, color }: { x: number; y: number; width: number; height: number; color: string }) => (
  <Group>
    <Rect x={x + width * 0.22} y={y + height * 0.05} width={width * 0.56} height={height * 0.22} stroke={color} strokeWidth={2} cornerRadius={3} />
    <Path x={x} y={y} data={`M ${width * 0.25} ${height * 0.32} C ${width * 0.25} ${height * 0.65}, ${width * 0.38} ${height * 0.92}, ${width * 0.5} ${height * 0.92} C ${width * 0.62} ${height * 0.92}, ${width * 0.75} ${height * 0.65}, ${width * 0.75} ${height * 0.32} Z`} stroke={color} strokeWidth={2} />
    <Ellipse x={x + width / 2} y={y + height * 0.58} radiusX={width * 0.18} radiusY={height * 0.20} stroke={color} strokeWidth={1.5} />
  </Group>
);

const ShowerSymbol = ({ x, y, width, height, color }: { x: number; y: number; width: number; height: number; color: string }) => (
  <Group>
    <Rect x={x} y={y} width={width} height={height} stroke={color} strokeWidth={2.5} cornerRadius={4} />
    <Line points={[x + width * 0.08, y + height * 0.9, x + width * 0.9, y + height * 0.1]} stroke={color} strokeWidth={1.8} />
    <Circle x={x + width * 0.72} y={y + height * 0.28} radius={3} fill={color} />
    <Line points={[x + width * 0.18, y + height * 0.22, x + width * 0.35, y + height * 0.22]} stroke={color} strokeWidth={2} />
  </Group>
);

const ElectricalPanelSymbol = ({ x, y, width, height, color }: { x: number; y: number; width: number; height: number; color: string }) => (
  <Group>
    <Rect x={x} y={y} width={width} height={height} stroke={color} strokeWidth={2.5} cornerRadius={3} />
    <Line points={[x + width * 0.15, y + height * 0.35, x + width * 0.85, y + height * 0.35]} stroke={color} strokeWidth={1.5} />
    <KonvaText x={x} y={y + height * 0.56} width={width} align="center" text="CE" fontSize={Math.max(9, height * 0.24)} fontStyle="bold" fill={color} />
  </Group>
);

const AirSymbol = ({ x, y, width, height, color }: { x: number; y: number; width: number; height: number; color: string }) => (
  <Group>
    <Rect x={x} y={y} width={width} height={height} stroke={color} strokeWidth={2.5} cornerRadius={4} />
    <Line points={[x + width * 0.15, y + height * 0.52, x + width * 0.85, y + height * 0.52]} stroke={color} strokeWidth={1.5} />
    <KonvaText x={x} y={y + height * 0.58} width={width} align="center" text="A/A" fontSize={Math.max(9, height * 0.25)} fontStyle="bold" fill={color} />
  </Group>
);

const CadObject = ({ item, selected, planX, planY, planW, planH, moduleLength, moduleWidth }: { item: LayoutItem; selected: boolean; planX: number; planY: number; planW: number; planH: number; moduleLength: number; moduleWidth: number }) => {
  const visualBox = getVisualBox(item, moduleLength, moduleWidth);
  const box = toPixels(visualBox, planX, planY, planW, planH);
  const color = colorFor(item, selected);

  if (item.itemType === 'wall_partition') {
    return <Rect x={box.x} y={box.y} width={box.width} height={box.height} fill="#f8fafc" opacity={0.9} shadowColor="#020617" shadowBlur={5} />;
  }

  if (item.itemType === 'interior_room' || item.itemType === 'full_bathroom') {
    const isBathroom = item.itemType === 'full_bathroom';
    return (
      <Group>
        <Rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill={isBathroom ? 'rgba(20,184,166,0.17)' : 'rgba(15,23,42,0.28)'}
          stroke={color}
          strokeWidth={selected ? 3 : 2}
        />
        <Rect x={box.x} y={box.y} width={box.width} height={5} fill={isBathroom ? '#99f6e4' : '#e2e8f0'} opacity={0.95} />
        <KonvaText
          x={box.x + 8}
          y={box.y + 10}
          text={isBathroom ? 'BAÑO' : 'HABITACIÓN'}
          fontSize={12}
          fontStyle="bold"
          fill={isBathroom ? '#ccfbf1' : '#f8fafc'}
        />
      </Group>
    );
  }

  if (isDoor(item)) return <DoorSymbol x={box.x} y={box.y} width={box.width} height={box.height} color={color} side={visualBox.side} />;
  if (isWindow(item)) return <WindowSymbol x={box.x} y={box.y} width={box.width} height={box.height} color={color} />;
  if (item.itemType === 'base_socket' || item.itemType === 'additional_socket') return <SocketSymbol x={box.x} y={box.y} width={box.width} height={box.height} color={color} />;
  if (item.itemType === 'base_light_point') return <LightSymbol x={box.x} y={box.y} width={box.width} height={box.height} color={color} />;
  if (item.itemType === 'base_electrical_panel') return <ElectricalPanelSymbol x={box.x} y={box.y} width={box.width} height={box.height} color={color} />;
  if (item.itemType === 'bathroom_sink') return <SinkSymbol x={box.x} y={box.y} width={box.width} height={box.height} color={color} />;
  if (item.itemType === 'bathroom_wc') return <WcSymbol x={box.x} y={box.y} width={box.width} height={box.height} color={color} />;
  if (item.itemType === 'bathroom_shower') return <ShowerSymbol x={box.x} y={box.y} width={box.width} height={box.height} color={color} />;
  if (item.itemType === 'air_conditioning') return <AirSymbol x={box.x} y={box.y} width={box.width} height={box.height} color={color} />;

  return <Rect x={box.x} y={box.y} width={box.width} height={box.height} stroke={color} strokeWidth={2} />;
};

const SelectionLayer = ({ selectedItem, planX, planY, planW, planH, moduleLength, moduleWidth }: { selectedItem: LayoutItem | null; planX: number; planY: number; planW: number; planH: number; moduleLength: number; moduleWidth: number }) => {
  if (!selectedItem) return null;
  const box = toPixels(getVisualBox(selectedItem, moduleLength, moduleWidth), planX, planY, planW, planH);
  const label = `${selectedItem.itemLabel || labelFor(selectedItem.itemType)}${realSizeFor(selectedItem, moduleLength, moduleWidth) ? ` · ${realSizeFor(selectedItem, moduleLength, moduleWidth)}` : ''}`;
  return (
    <Group>
      <Rect x={box.x - 5} y={box.y - 5} width={box.width + 10} height={box.height + 10} stroke="#fb923c" strokeWidth={2} dash={[7, 5]} fill="rgba(251,146,60,0.06)" />
      <Rect x={box.x} y={Math.max(8, box.y - 28)} width={Math.max(120, label.length * 6.2)} height={20} fill="#020617" cornerRadius={5} stroke="#475569" strokeWidth={1} />
      <KonvaText x={box.x + 7} y={Math.max(12, box.y - 24)} text={label} fontSize={10} fontStyle="bold" fill="#f8fafc" />
    </Group>
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

export const LayoutPreview = forwardRef<HTMLDivElement, LayoutPreviewProps>(({
  length,
  width,
  items,
  editable = false,
  selectedItemId = null,
  zoom = 1,
  className = '',
  planeRef,
  onSelectItem,
  onItemPointerDown,
  onItemResizePointerDown,
}, forwardedRef) => {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const internalPlanRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(1080);

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;
    const update = () => setAvailableWidth(Math.max(520, node.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const displayZoom = clamp(Number(zoom) || 1, 0.7, 1.6);
  const stageWidth = Math.max(760, availableWidth - 8) * displayZoom;
  const padLeft = 78;
  const padTop = 72;
  const padRight = 36;
  const padBottom = 64;
  const planWidth = stageWidth - padLeft - padRight;
  const planHeight = clamp(planWidth * (width / Math.max(length, 0.1)), 220, 430);
  const stageHeight = planHeight + padTop + padBottom;
  const warnings = useMemo(() => buildWarnings(items, length, width), [items, length, width]);
  const selectedItem = items.find((item) => item.id === selectedItemId) || null;
  const sortedItems = [...items].sort((a, b) => Number(isDivision(b)) - Number(isDivision(a)));

  const setPlanNode = (node: HTMLDivElement | null) => {
    internalPlanRef.current = node;
    if (planeRef) {
      try {
        planeRef.current = node;
      } catch {
        // readonly ref compatibility
      }
    }
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const overlayBox = (item: LayoutItem) => getVisualBox(item, length, width);

  return (
    <div className={className}>
      <RotatePhoneNotice />
      <div ref={shellRef} className="w-full overflow-auto rounded-[28px] border border-slate-700/70 bg-slate-950 p-3 shadow-2xl shadow-slate-950/30">
        <div className="relative" style={{ width: stageWidth, height: stageHeight }}>
          <Stage width={stageWidth} height={stageHeight}>
            <Layer listening={false}>
              <Rect x={0} y={0} width={stageWidth} height={stageHeight} fill="#020617" cornerRadius={22} />
              <Rect x={12} y={12} width={stageWidth - 24} height={stageHeight - 24} stroke="#334155" strokeWidth={1} cornerRadius={18} />
              <WallGrid planX={padLeft} planY={padTop} planW={planWidth} planH={planHeight} length={length} width={width} />
              <Rulers planX={padLeft} planY={padTop} planW={planWidth} planH={planHeight} length={length} width={width} />
              <KonvaText x={padLeft + 8} y={padTop - 30} text="VISTA SUPERIOR" fontSize={12} fontStyle="bold" fill="#bfdbfe" letterSpacing={1.4} />
              {sortedItems.map((item) => (
                <CadObject key={item.id} item={item} selected={item.id === selectedItemId} planX={padLeft} planY={padTop} planW={planWidth} planH={planHeight} moduleLength={length} moduleWidth={width} />
              ))}
              <SelectionLayer selectedItem={selectedItem} planX={padLeft} planY={padTop} planW={planWidth} planH={planHeight} moduleLength={length} moduleWidth={width} />
              <KonvaText x={padLeft} y={padTop + planHeight + 22} text="Escala visual proporcional · símbolos arquitectónicos · revisión técnica antes de fabricación" fontSize={11} fill="#93c5fd" />
            </Layer>
          </Stage>

          <div
            ref={setPlanNode}
            className="absolute"
            style={{ left: padLeft, top: padTop, width: planWidth, height: planHeight }}
          >
            {items.map((item) => {
              const box = overlayBox(item);
              const selected = item.id === selectedItemId;
              const canResize = editable && selected && isResizableDivision(item);
              const resizeEdge: ResizeHandle = (item.layoutOrientation || 'transversal') === 'longitudinal' ? 'right' : 'bottom';
              const depthMeters = realDepthFor(item, length, width);
              return (
                <div
                  key={item.id}
                  role={editable ? 'button' : undefined}
                  tabIndex={editable ? 0 : undefined}
                  title={`${item.itemLabel || labelFor(item.itemType)}${realSizeFor(item, length, width) ? ` · ${realSizeFor(item, length, width)}` : ''}${item.included ? ' · incluido' : item.price ? ` · ${formatCurrency(item.price)}` : ''}`}
                  className={`absolute select-none ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%`, minWidth: isWindow(item) ? 24 : 26, minHeight: isWindow(item) ? 10 : 24 }}
                  onPointerDown={editable && onItemPointerDown ? (event) => { event.stopPropagation(); onSelectItem?.(item.id); onItemPointerDown(event, item.id); } : undefined}
                  onClick={(event) => { event.stopPropagation(); onSelectItem?.(item.id); }}
                >
                  {canResize ? (
                    <button
                      type="button"
                      aria-label="Ajustar anchura"
                      className={`absolute z-50 rounded-full border border-orange-300 bg-orange-500 px-2 py-1 text-[10px] font-black text-white shadow-lg ${resizeEdge === 'right' ? 'left-full top-1/2 -translate-y-1/2 translate-x-1 cursor-ew-resize' : 'left-1/2 top-full -translate-x-1/2 translate-y-1 cursor-ns-resize'}`}
                      onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onSelectItem?.(item.id); onItemResizePointerDown?.(event, item.id, resizeEdge); }}
                    >
                      {formatMeters(depthMeters)} m
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {selectedItem ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          <span className="font-black text-slate-950">Seleccionado:</span> {selectedItem.itemLabel || labelFor(selectedItem.itemType)}
          {realSizeFor(selectedItem, length, width) ? <span className="ml-2 text-slate-500">· {realSizeFor(selectedItem, length, width)}</span> : null}
        </div>
      ) : null}
      {warnings.length ? (
        <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          <p className="font-black uppercase tracking-[0.15em]">Revisión técnica sugerida</p>
          {warnings.map((warning) => <p key={warning} className="mt-1">• {warning}</p>)}
        </div>
      ) : null}
    </div>
  );
});

LayoutPreview.displayName = 'LayoutPreview';
