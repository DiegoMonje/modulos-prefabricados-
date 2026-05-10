import { useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  ArrowLeft,
  Bath,
  CheckCircle2,
  Copy,
  DoorOpen,
  Download,
  Grid2X2,
  Home,
  Lightbulb,
  MessageCircle,
  Move,
  PlugZap,
  RotateCw,
  ShowerHead,
  Snowflake,
  Trash2,
  Undo2,
  Zap,
} from 'lucide-react';
import {
  ConfiguratorState,
  ContactFormState,
  DeliveryTimeline,
  LayoutItem,
  LayoutItemType,
  PanelChoice,
  PlanChildElement,
  PlanChildType,
  UseType,
} from '../types';
import {
  calculatePrice,
  createBaseLayoutItems,
  formatCurrency,
  getLayoutItemPrice,
  LAYOUT_ITEM_CATALOG,
  SHOWER_TRAY_DISCOUNT,
} from '../utils/pricing';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { createLead } from '../services/leads';
import { downloadConfiguratorPdf } from '../utils/pdf';
import { Button, Card, Field, Input, Select, Textarea } from './Ui';

type Selection =
  | { kind: 'item'; itemId: string }
  | { kind: 'child'; itemId: string; childId: string }
  | null;

type DragState =
  | { kind: 'item'; itemId: string; offsetX: number; offsetY: number; snapshot: LayoutItem[] }
  | { kind: 'child'; itemId: string; childId: string; offsetX: number; offsetY: number; snapshot: LayoutItem[] };

type ToolDefinition = {
  type: LayoutItemType;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const toolDefinitions: ToolDefinition[] = [
  { type: 'additional_door', title: 'Puerta adicional', description: '+120 €', icon: <DoorOpen size={18} /> },
  { type: 'window_80x80', title: 'Ventana 80x80 extra', description: '+200 €', icon: <Grid2X2 size={18} /> },
  { type: 'large_window', title: 'Ventana grande', description: '+250 €', icon: <Grid2X2 size={18} /> },
  { type: 'additional_socket', title: 'Enchufe adicional', description: '+50 €', icon: <PlugZap size={18} /> },
  { type: 'wall_partition', title: 'Tabique simple', description: '3 paneles + mano de obra · +300 €', icon: <Move size={18} /> },
  { type: 'interior_room', title: 'Habitación interior', description: 'Incluye puerta, ventana 80x80, luz y enchufe · +700 €', icon: <Home size={18} /> },
  { type: 'full_bathroom', title: 'Baño completo', description: 'Incluye sanitarios, luz, enchufes y plato opcional · +1.500 €', icon: <Bath size={18} /> },
  { type: 'air_conditioning', title: 'Aire acondicionado', description: '+600 €', icon: <Snowflake size={18} /> },
];

const initialConfig = (): ConfiguratorState => ({
  length: 6,
  width: 2.4,
  widthOption: '2.40 m',
  customWidth: '',
  isSpecialMeasure: false,
  panelChoice: 'Panel sándwich blanco 30 mm',
  panelType: 'Panel sándwich',
  panelThickness: '30 mm',
  panelColor: 'Blanco',
  specialThickness: '',
  specialColor: '',
  isSpecialPanel: false,
  useType: 'Caseta para finca',
  province: '',
  city: '',
  postalCode: '',
  deliveryTimeline: 'Lo antes posible',
  layoutItems: createBaseLayoutItems(),
});

const initialContact: ContactFormState = {
  fullName: '',
  phone: '',
  email: '',
  intendedUse: '',
  comments: '',
  accepted: false,
  newsletterSubscribed: false,
};

const useTypes: UseType[] = ['Caseta de obra', 'Oficina', 'Almacén', 'Vestuario', 'Caseta para finca', 'Local comercial', 'Otro'];
const deliveryTimelines: DeliveryTimeline[] = ['Lo antes posible', 'En menos de 1 mes', 'En 1-3 meses', 'Más adelante', 'Solo estoy mirando precios'];
const panelChoices: PanelChoice[] = ['Panel sándwich blanco 30 mm', 'Otro grosor de panel', 'Otro color de panel', 'Otro grosor y otro color'];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const snap = (value: number, step = 1) => Math.round(value / step) * step;
const cloneLayout = (items: LayoutItem[]) => items.map((item) => ({ ...item, childItems: item.childItems?.map((child) => ({ ...child })) }));
const uid = () => crypto.randomUUID();
const isRoom = (item: LayoutItem) => item.itemType === 'interior_room';
const isBathroom = (item: LayoutItem) => item.itemType === 'full_bathroom';
const isGrouped = (item: LayoutItem) => isRoom(item) || isBathroom(item);
const isEdgeElement = (item: LayoutItem) => item.zone === 'edge';
const isDoor = (type: LayoutItemType | PlanChildType) => type === 'base_door' || type === 'additional_door' || type === 'door';
const isWindow = (type: LayoutItemType | PlanChildType) => ['base_window_80x80', 'window_80x80', 'large_window', 'window_40x40'].includes(type);
const isSocket = (type: LayoutItemType | PlanChildType) => ['base_socket', 'additional_socket', 'socket', 'inside_socket', 'water_heater_socket'].includes(type);

const roomChildren = (): PlanChildElement[] => [
  { id: uid(), type: 'door', label: 'Puerta habitación', x: 8, y: 86, width: 22, height: 10, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'window_80x80', label: 'Ventana 80x80', x: 42, y: 2, width: 26, height: 9, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'light_point', label: 'Punto de luz', x: 46, y: 43, width: 12, height: 12, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'socket', label: 'Enchufe', x: 78, y: 70, width: 12, height: 12, rotation: 0, included: true, lockedToParent: true },
];

const bathroomChildren = (): PlanChildElement[] => [
  { id: uid(), type: 'door', label: 'Puerta baño', x: 8, y: 86, width: 24, height: 10, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'window_40x40', label: 'Ventana 40x40', x: 70, y: 2, width: 22, height: 8, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'light_point', label: 'Punto de luz', x: 45, y: 18, width: 12, height: 12, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'inside_socket', label: 'Enchufe interior', x: 12, y: 36, width: 11, height: 11, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'water_heater_socket', label: 'Enchufe termo', x: 78, y: 36, width: 11, height: 11, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'sink', label: 'Lavabo', x: 16, y: 68, width: 22, height: 14, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'toilet', label: 'Váter', x: 42, y: 66, width: 20, height: 18, rotation: 0, included: true, lockedToParent: true },
  { id: uid(), type: 'shower_tray', label: 'Plato de ducha', x: 66, y: 60, width: 27, height: 26, rotation: 0, included: true, lockedToParent: true, optional: true },
];

const makeLayoutItem = (type: LayoutItemType, existing: LayoutItem[]): LayoutItem => {
  const spec = LAYOUT_ITEM_CATALOG[type];
  const count = existing.filter((item) => item.itemType === type).length;
  const base: LayoutItem = {
    id: uid(),
    itemType: type,
    itemLabel: spec.label,
    x: clamp(12 + count * 5, 2, 80),
    y: spec.zone === 'edge' ? 0 : clamp(16 + count * 5, 2, 80),
    width: spec.width,
    height: spec.height,
    rotation: 0,
    price: spec.price,
    zone: spec.zone,
    included: false,
  };

  if (type === 'wall_partition') return { ...base, x: 8, y: 50, width: 84, height: 3, price: 300, layoutOrientation: 'transversal' };
  if (type === 'interior_room') return { ...base, x: 8, y: 16, width: 38, height: 56, price: 700, layoutOrientation: 'longitudinal', includedFeatures: ['puerta', 'ventana 80x80', 'punto de luz', 'enchufe'], childItems: roomChildren() };
  if (type === 'full_bathroom') return { ...base, x: 62, y: 20, width: 26, height: 50, price: 1500, layoutOrientation: 'longitudinal', hasShowerTray: true, includedFeatures: ['puerta', 'ventana 40x40', 'punto de luz', 'enchufe interior', 'enchufe exterior termo', 'lavabo', 'váter', 'plato de ducha'], childItems: bathroomChildren() };
  return base;
};

const formatPlanPrice = (item: LayoutItem) => item.included ? 'Incluido' : formatCurrency(getLayoutItemPrice(item));

const parentItemName = (item: LayoutItem) => {
  if (item.itemType === 'interior_room') return 'Habitación interior';
  if (item.itemType === 'full_bathroom') return 'Baño completo';
  if (item.itemType === 'wall_partition') return 'Tabique simple';
  return item.itemLabel;
};

const childIcon = (type: PlanChildType) => {
  if (isDoor(type)) return '🚪';
  if (type === 'window_80x80') return '🪟80';
  if (type === 'window_40x40') return '🪟40';
  if (type === 'light_point') return '💡';
  if (type === 'inside_socket' || type === 'socket') return '🔌';
  if (type === 'water_heater_socket') return '⚡';
  if (type === 'sink') return '🚰';
  if (type === 'toilet') return '🚽';
  if (type === 'shower_tray') return '🚿';
  return '•';
};

const getPointerPercent = (event: PointerEvent | React.PointerEvent<SVGSVGElement>, svg: SVGSVGElement) => {
  const rect = svg.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
  };
};

const getChildAbsoluteBox = (item: LayoutItem, child: PlanChildElement) => ({
  x: item.x + (child.x / 100) * item.width,
  y: item.y + (child.y / 100) * item.height,
  width: (child.width / 100) * item.width,
  height: (child.height / 100) * item.height,
});

const getSelected = (items: LayoutItem[], selection: Selection) => {
  if (!selection) return { item: null as LayoutItem | null, child: null as PlanChildElement | null };
  const item = items.find((entry) => entry.id === selection.itemId) || null;
  const child = selection.kind === 'child' ? item?.childItems?.find((entry) => entry.id === selection.childId) || null : null;
  return { item, child };
};

const BaseSymbol = ({ item }: { item: LayoutItem }) => {
  if (isDoor(item.itemType)) return <text x="50%" y="60%" textAnchor="middle" className="fill-orange-100 text-[6px] font-black">PUERTA</text>;
  if (isWindow(item.itemType)) return <text x="50%" y="60%" textAnchor="middle" className="fill-sky-100 text-[6px] font-black">VENTANA</text>;
  if (item.itemType === 'base_light_point') return <text x="50%" y="62%" textAnchor="middle" className="fill-yellow-100 text-[8px] font-black">💡</text>;
  if (isSocket(item.itemType)) return <text x="50%" y="62%" textAnchor="middle" className="fill-slate-100 text-[8px] font-black">🔌</text>;
  if (item.itemType === 'base_electrical_panel') return <text x="50%" y="62%" textAnchor="middle" className="fill-blue-100 text-[6px] font-black">CE</text>;
  if (item.itemType === 'air_conditioning') return <text x="50%" y="62%" textAnchor="middle" className="fill-violet-100 text-[6px] font-black">A/A</text>;
  return null;
};

const PlanEditor = ({
  config,
  setConfig,
  selection,
  setSelection,
  pushHistory,
}: {
  config: ConfiguratorState;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguratorState>>;
  selection: Selection;
  setSelection: (selection: Selection) => void;
  pushHistory: () => void;
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const aspect = config.length / config.width;
  const { item: selectedItem, child: selectedChild } = getSelected(config.layoutItems, selection);

  const startItemDrag = (event: React.PointerEvent, item: LayoutItem) => {
    if (item.included || !svgRef.current) return;
    event.stopPropagation();
    const point = getPointerPercent(event as React.PointerEvent<SVGSVGElement>, svgRef.current);
    pushHistory();
    setSelection({ kind: 'item', itemId: item.id });
    setDrag({ kind: 'item', itemId: item.id, offsetX: point.x - item.x, offsetY: point.y - item.y, snapshot: cloneLayout(config.layoutItems) });
  };

  const startChildDrag = (event: React.PointerEvent, item: LayoutItem, child: PlanChildElement) => {
    if (!svgRef.current) return;
    event.stopPropagation();
    const point = getPointerPercent(event as React.PointerEvent<SVGSVGElement>, svgRef.current);
    const box = getChildAbsoluteBox(item, child);
    pushHistory();
    setSelection({ kind: 'child', itemId: item.id, childId: child.id });
    setDrag({ kind: 'child', itemId: item.id, childId: child.id, offsetX: point.x - box.x, offsetY: point.y - box.y, snapshot: cloneLayout(config.layoutItems) });
  };

  const handleMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || !svgRef.current) return;
    const point = getPointerPercent(event, svgRef.current);

    setConfig((prev) => ({
      ...prev,
      layoutItems: prev.layoutItems.map((item) => {
        if (drag.kind === 'item' && item.id === drag.itemId) {
          if (isEdgeElement(item)) {
            return { ...item, x: clamp(snap(point.x - drag.offsetX), 0, 100 - item.width), y: 0 };
          }
          return { ...item, x: clamp(snap(point.x - drag.offsetX), 0, 100 - item.width), y: clamp(snap(point.y - drag.offsetY), 0, 100 - item.height) };
        }

        if (drag.kind === 'child' && item.id === drag.itemId) {
          return {
            ...item,
            childItems: item.childItems?.map((child) => {
              if (child.id !== drag.childId) return child;
              const nextAbsX = point.x - drag.offsetX;
              const nextAbsY = point.y - drag.offsetY;
              return {
                ...child,
                x: clamp(snap(((nextAbsX - item.x) / item.width) * 100), 0, 100 - child.width),
                y: clamp(snap(((nextAbsY - item.y) / item.height) * 100), 0, 100 - child.height),
              };
            }),
          };
        }
        return item;
      }),
    }));
  };

  const handlePointerUp = () => setDrag(null);

  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-950 p-4 shadow-2xl shadow-slate-900/25">
      <div className="mb-4 flex flex-col gap-2 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Editor 2D profesional</p>
          <h2 className="text-2xl font-black">Plano interactivo con grupos editables</h2>
          <p className="text-sm text-slate-300">Mueve el bloque completo o selecciona sus elementos internos para colocarlos donde quiera el cliente.</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-100 ring-1 ring-white/15">{config.length} x {config.width} m</span>
      </div>

      <div className="overflow-auto rounded-3xl border border-slate-700 bg-slate-900 p-4">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="min-h-[320px] min-w-[780px] rounded-2xl border-[6px] border-slate-100 bg-slate-950 shadow-inner"
          style={{ aspectRatio: `${aspect}` }}
          onPointerMove={handleMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerDown={() => setSelection(null)}
        >
          <defs>
            <pattern id="planGrid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#1d4ed8" strokeWidth="0.12" opacity="0.7" />
            </pattern>
            <filter id="selectedGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#fb923c" floodOpacity="0.95" />
            </filter>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="#020617" />
          <rect x="0" y="0" width="100" height="100" fill="url(#planGrid)" />
          <rect x="1" y="1" width="98" height="98" fill="none" stroke="#94a3b8" strokeWidth="0.35" />

          {config.layoutItems.map((item) => {
            const selected = selectedItem?.id === item.id && !selectedChild;
            const groupColor = isRoom(item) ? '#fb923c' : isBathroom(item) ? '#2dd4bf' : isEdgeElement(item) ? '#38bdf8' : '#cbd5e1';
            return (
              <g key={item.id} filter={selected ? 'url(#selectedGlow)' : undefined}>
                <rect
                  x={item.x}
                  y={item.y}
                  width={item.width}
                  height={item.height}
                  rx={isGrouped(item) ? 1.2 : 0.7}
                  fill={isRoom(item) ? 'rgba(124,45,18,.72)' : isBathroom(item) ? 'rgba(19,78,74,.74)' : isEdgeElement(item) ? 'rgba(12,74,110,.75)' : item.itemType === 'wall_partition' ? '#e2e8f0' : 'rgba(30,41,59,.85)'}
                  stroke={groupColor}
                  strokeWidth={selected ? 0.75 : 0.35}
                  onPointerDown={(event) => startItemDrag(event, item)}
                  className={item.included ? 'cursor-default' : 'cursor-grab'}
                />

                {isGrouped(item) ? (
                  <>
                    <text x={item.x + item.width / 2} y={item.y + 4.2} textAnchor="middle" className="fill-white text-[2.4px] font-black">
                      {isRoom(item) ? 'HABITACIÓN' : 'BAÑO'} · {formatCurrency(getLayoutItemPrice(item))}
                    </text>
                    <text x={item.x + item.width / 2} y={item.y + item.height - 2.2} textAnchor="middle" className="fill-slate-200 text-[1.8px] font-bold">
                      {isRoom(item) ? 'Puerta · Ventana · Luz · Enchufe' : item.hasShowerTray === false ? 'Sin plato de ducha (-100 €)' : 'Sanitarios + plato ducha'}
                    </text>
                  </>
                ) : item.itemType === 'wall_partition' ? (
                  <text x={item.x + item.width / 2} y={item.y - 1.2} textAnchor="middle" className="fill-orange-200 text-[2px] font-black">Tabique simple · +300 €</text>
                ) : (
                  <BaseSymbol item={item} />
                )}

                {item.childItems?.filter((child) => child.type !== 'shower_tray' || item.hasShowerTray !== false).map((child) => {
                  const box = getChildAbsoluteBox(item, child);
                  const childSelected = selection?.kind === 'child' && selection.itemId === item.id && selection.childId === child.id;
                  return (
                    <g key={child.id} filter={childSelected ? 'url(#selectedGlow)' : undefined} onPointerDown={(event) => startChildDrag(event, item, child)} className="cursor-grab">
                      <rect
                        x={box.x}
                        y={box.y}
                        width={box.width}
                        height={box.height}
                        rx="0.7"
                        fill={child.type === 'shower_tray' ? 'rgba(20,184,166,.45)' : 'rgba(15,23,42,.92)'}
                        stroke={child.type === 'shower_tray' ? '#5eead4' : '#f8fafc'}
                        strokeWidth={childSelected ? 0.55 : 0.25}
                      />
                      <text x={box.x + box.width / 2} y={box.y + box.height / 2 + 0.9} textAnchor="middle" className="pointer-events-none fill-white text-[2px] font-black">
                        {childIcon(child.type)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const Configurator = ({ onBack, onAdmin }: { onBack: () => void; onAdmin: () => void }) => {
  const [config, setConfig] = useState<ConfiguratorState>(initialConfig());
  const [contact, setContact] = useState<ContactFormState>(initialContact);
  const [selection, setSelection] = useState<Selection>(null);
  const [history, setHistory] = useState<LayoutItem[][]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const price = useMemo(() => calculatePrice(config), [config]);
  const selected = getSelected(config.layoutItems, selection);
  const whatsappUrl = buildWhatsAppUrl(contact, config, price);

  const pushHistory = () => setHistory((prev) => [...prev.slice(-20), cloneLayout(config.layoutItems)]);

  const setConfigValue = <K extends keyof ConfiguratorState>(key: K, value: ConfiguratorState[K]) => setConfig((prev) => ({ ...prev, [key]: value }));
  const setContactValue = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => setContact((prev) => ({ ...prev, [key]: value }));

  const addItem = (type: LayoutItemType) => {
    pushHistory();
    const item = makeLayoutItem(type, config.layoutItems);
    setConfig((prev) => ({ ...prev, layoutItems: [...prev.layoutItems, item] }));
    setSelection({ kind: 'item', itemId: item.id });
  };

  const removeSelected = () => {
    if (!selection) return;
    pushHistory();
    if (selection.kind === 'item') {
      const item = config.layoutItems.find((entry) => entry.id === selection.itemId);
      if (!item || item.included) return;
      setConfig((prev) => ({ ...prev, layoutItems: prev.layoutItems.filter((entry) => entry.id !== selection.itemId) }));
      setSelection(null);
      return;
    }

    const parent = config.layoutItems.find((entry) => entry.id === selection.itemId);
    const child = parent?.childItems?.find((entry) => entry.id === selection.childId);
    if (parent?.itemType === 'full_bathroom' && child?.type === 'shower_tray') {
      setConfig((prev) => ({
        ...prev,
        layoutItems: prev.layoutItems.map((entry) => entry.id === parent.id ? { ...entry, hasShowerTray: false } : entry),
      }));
      setSelection({ kind: 'item', itemId: parent.id });
    }
  };

  const duplicateSelected = () => {
    if (!selected.item || selected.item.included) return;
    pushHistory();
    const copy: LayoutItem = {
      ...selected.item,
      id: uid(),
      x: clamp(selected.item.x + 4, 0, 100 - selected.item.width),
      y: clamp(selected.item.y + 4, 0, 100 - selected.item.height),
      childItems: selected.item.childItems?.map((child) => ({ ...child, id: uid() })),
    };
    setConfig((prev) => ({ ...prev, layoutItems: [...prev.layoutItems, copy] }));
    setSelection({ kind: 'item', itemId: copy.id });
  };

  const rotateSelected = () => {
    if (!selected.item) return;
    pushHistory();
    setConfig((prev) => ({
      ...prev,
      layoutItems: prev.layoutItems.map((item) => item.id === selected.item?.id ? { ...item, rotation: (((item.rotation || 0) + 90) % 360) as 0 | 90 | 180 | 270 } : item),
    }));
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((prev) => prev.slice(0, -1));
    setConfig((prev) => ({ ...prev, layoutItems: cloneLayout(last) }));
    setSelection(null);
  };

  const toggleShowerTray = () => {
    if (!selected.item || selected.item.itemType !== 'full_bathroom') return;
    pushHistory();
    setConfig((prev) => ({
      ...prev,
      layoutItems: prev.layoutItems.map((item) => item.id === selected.item?.id ? { ...item, hasShowerTray: item.hasShowerTray === false } : item),
    }));
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!contact.fullName.trim()) nextErrors.fullName = 'Indica tu nombre.';
    if (!contact.phone.trim()) nextErrors.phone = 'Indica tu teléfono.';
    if (!config.province.trim()) nextErrors.province = 'Indica la provincia.';
    if (!config.city.trim()) nextErrors.city = 'Indica la localidad.';
    if (!contact.accepted) nextErrors.accepted = 'Debes aceptar la política de privacidad.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await createLead({ contact, config, price });
    downloadConfiguratorPdf(contact, config, price);
    setSaved(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft size={16} /> Volver al inicio</button>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange">Configurador visual 2D</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Plano con habitación y baño editables</h1>
            <p className="mt-2 max-w-3xl text-slate-600">La habitación y el baño ya incluyen sus elementos internos. Puedes mover cada puerta, ventana, enchufe, luz, sanitario o plato dentro de su bloque.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={undo} disabled={!history.length}><Undo2 size={16} /> Deshacer</Button>
            <Button variant="ghost" onClick={onAdmin}>Panel privado</Button>
            <a href={whatsappUrl} target="_blank" rel="noreferrer"><Button variant="secondary"><MessageCircle size={16} /> WhatsApp</Button></a>
          </div>
        </header>

        {saved ? (
          <Card className="mb-6 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3 text-emerald-900"><CheckCircle2 /> <strong>Solicitud guardada y PDF generado.</strong></div>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)_350px]">
          <aside className="space-y-5">
            <Card>
              <h2 className="text-lg font-black text-slate-950">Herramientas</h2>
              <p className="mt-1 text-sm text-slate-500">Añade elementos al plano. Habitación y baño crean automáticamente sus elementos interactivos internos.</p>
              <div className="mt-4 space-y-2">
                {toolDefinitions.map((tool) => (
                  <button key={tool.type} onClick={() => addItem(tool.type)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-brand-orange hover:bg-orange-50 hover:shadow-md">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">{tool.icon}</span>
                    <span><strong className="block text-slate-950">{tool.title}</strong><span className="text-xs text-slate-500">{tool.description}</span></span>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-black text-slate-950">Medidas y uso</h2>
              <div className="mt-4 space-y-3">
                <Field label="Largo">
                  <Select value={config.length} onChange={(event) => setConfigValue('length', Number(event.target.value))}>{[3, 4, 5, 6, 7, 8].map((value) => <option key={value} value={value}>{value} m</option>)}</Select>
                </Field>
                <Field label="Ancho">
                  <Select value={config.width} onChange={(event) => setConfigValue('width', Number(event.target.value))}><option value={2.4}>2,40 m</option><option value={2.5}>2,50 m</option><option value={3}>3,00 m</option></Select>
                </Field>
                <Field label="Uso">
                  <Select value={config.useType} onChange={(event) => setConfigValue('useType', event.target.value as UseType)}>{useTypes.map((use) => <option key={use}>{use}</option>)}</Select>
                </Field>
                <Field label="Panel">
                  <Select value={config.panelChoice} onChange={(event) => setConfigValue('panelChoice', event.target.value as PanelChoice)}>{panelChoices.map((choice) => <option key={choice}>{choice}</option>)}</Select>
                </Field>
              </div>
            </Card>
          </aside>

          <PlanEditor config={config} setConfig={setConfig} selection={selection} setSelection={setSelection} pushHistory={pushHistory} />

          <aside className="space-y-5">
            <Card className="bg-orange-50 ring-1 ring-orange-100">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-orange">Precio orientativo</p>
              <p className="mt-2 text-4xl font-black text-slate-950">{formatCurrency(price.estimatedPriceWithoutVat)}</p>
              <p className="mt-1 text-sm text-slate-600">Sin IVA · Total con IVA: {formatCurrency(price.estimatedPriceWithVat)}</p>
              <div className="mt-4 space-y-1 text-sm text-slate-700"><p>Base: <strong>{formatCurrency(price.basePrice)}</strong></p><p>Extras: <strong>{formatCurrency(price.extrasPrice)}</strong></p></div>
            </Card>

            <Card>
              <h2 className="text-lg font-black text-slate-950">Propiedades</h2>
              {selected.item ? (
                <div className="mt-3 space-y-3">
                  <p className="font-black text-slate-900">{selected.child ? selected.child.label : parentItemName(selected.item)}</p>
                  <p className="text-sm text-slate-600">{selected.child ? 'Elemento incluido dentro del bloque. Puedes moverlo dentro de su habitación/baño.' : `Precio: ${formatPlanPrice(selected.item)}`}</p>

                  {isRoom(selected.item) && !selected.child ? <div className="rounded-2xl bg-orange-50 p-3 text-sm font-semibold text-orange-900">Incluye puerta, ventana 80x80, punto de luz y enchufe. Cada elemento se puede mover dentro de la habitación.</div> : null}
                  {isBathroom(selected.item) && !selected.child ? <div className="rounded-2xl bg-teal-50 p-3 text-sm font-semibold text-teal-900">Incluye puerta, ventana 40x40, luz, enchufes, lavabo, váter y plato de ducha opcional.</div> : null}

                  {isBathroom(selected.item) && !selected.child ? <Button variant={selected.item.hasShowerTray === false ? 'outline' : 'secondary'} onClick={toggleShowerTray} className="w-full"><ShowerHead size={16} /> {selected.item.hasShowerTray === false ? `Añadir plato de ducha (+${formatCurrency(SHOWER_TRAY_DISCOUNT)})` : `Quitar plato de ducha (-${formatCurrency(SHOWER_TRAY_DISCOUNT)})`}</Button> : null}
                  {selected.child?.type === 'shower_tray' ? <Button variant="danger" onClick={removeSelected} className="w-full"><Trash2 size={16} /> Quitar plato de ducha (-{formatCurrency(SHOWER_TRAY_DISCOUNT)})</Button> : null}

                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" onClick={rotateSelected} disabled={Boolean(selected.child)}><RotateCw size={16} /></Button>
                    <Button variant="outline" onClick={duplicateSelected} disabled={Boolean(selected.child) || Boolean(selected.item.included)}><Copy size={16} /></Button>
                    <Button variant="danger" onClick={removeSelected} disabled={Boolean(selected.item.included) && !selected.child}><Trash2 size={16} /></Button>
                  </div>
                </div>
              ) : <p className="mt-3 rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Selecciona un bloque o un elemento interno del plano.</p>}
            </Card>

            <Card>
              <h2 className="text-lg font-black text-slate-950">Datos para presupuesto</h2>
              <div className="mt-4 space-y-3">
                <Field label="Nombre" error={errors.fullName}><Input value={contact.fullName} onChange={(event) => setContactValue('fullName', event.target.value)} /></Field>
                <Field label="Teléfono" error={errors.phone}><Input value={contact.phone} onChange={(event) => setContactValue('phone', event.target.value)} /></Field>
                <Field label="Email"><Input value={contact.email} onChange={(event) => setContactValue('email', event.target.value)} /></Field>
                <Field label="Provincia" error={errors.province}><Input value={config.province} onChange={(event) => setConfigValue('province', event.target.value)} /></Field>
                <Field label="Localidad" error={errors.city}><Input value={config.city} onChange={(event) => setConfigValue('city', event.target.value)} /></Field>
                <Field label="Plazo"><Select value={config.deliveryTimeline} onChange={(event) => setConfigValue('deliveryTimeline', event.target.value as DeliveryTimeline)}>{deliveryTimelines.map((timeline) => <option key={timeline}>{timeline}</option>)}</Select></Field>
                <Field label="Comentarios"><Textarea value={contact.comments} onChange={(event) => setContactValue('comments', event.target.value)} rows={3} /></Field>
                <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={contact.accepted} onChange={(event) => setContactValue('accepted', event.target.checked)} className="mt-1" /> Acepto la política de privacidad.</label>
                {errors.accepted ? <p className="text-sm text-red-600">{errors.accepted}</p> : null}
                <Button onClick={submit} className="w-full"><Download size={16} /> Descargar PDF y guardar solicitud</Button>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};
