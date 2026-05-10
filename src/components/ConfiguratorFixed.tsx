import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react';
import {
  ConfiguratorState,
  ContactFormState,
  DeliveryTimeline,
  LayoutItem,
  LayoutItemType,
  PanelChoice,
  UseType,
} from '../types';
import {
  BATHROOM_INCLUDED_FEATURES,
  calculatePrice,
  createBaseLayoutItems,
  formatCurrency,
  LAYOUT_ITEM_CATALOG,
  ROOM_INCLUDED_FEATURES,
} from '../utils/pricing';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { createLead } from '../services/leads';
import { downloadConfiguratorPdf } from '../utils/pdf';
import { Button, Card, Field, Input } from './Ui';
import { LayoutPreview } from './LayoutPreview';
import { InteractivePlanCanvas } from './plan';

type ResizeHandle = 'bottom' | 'right';

const lengthOptions = [3, 4, 5, 6, 7, 8];
const widthOptions = [
  { label: '2,40 metros', value: 2.4, helper: 'Ancho estándar' },
  { label: '2,50 metros', value: 2.5, helper: 'Opción habitual' },
  { label: 'Otro ancho', value: null, helper: 'Bajo consulta' },
] as const;
const panelChoices: PanelChoice[] = ['Panel sándwich blanco 30 mm', 'Otro grosor de panel', 'Otro color de panel', 'Otro grosor y otro color'];
const uses: UseType[] = ['Caseta de obra', 'Oficina', 'Almacén', 'Vestuario', 'Caseta para finca', 'Local comercial', 'Otro'];
const timelines: DeliveryTimeline[] = ['Lo antes posible', 'En menos de 1 mes', 'En 1-3 meses', 'Más adelante', 'Solo estoy mirando precios'];

const GRID_SIZE = 2;
const MIN_ROOM_DEPTH_PERCENT = 16;

const cloneLayout = (items: LayoutItem[]) => items.map((item) => ({ ...item }));
const sameLayout = (a: LayoutItem[], b: LayoutItem[]) => JSON.stringify(a) === JSON.stringify(b);
const snap = (value: number, step = GRID_SIZE) => Math.round(value / step) * step;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const isArchitecturalDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom', 'wall_partition'].includes(item.itemType);
const isResizableDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom'].includes(item.itemType);

const makeInitialConfig = (): ConfiguratorState => ({
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
  useType: 'Caseta de obra',
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

const applyDivisionOrientation = (item: LayoutItem, orientation: 'transversal' | 'longitudinal'): LayoutItem => {
  if (!isArchitecturalDivision(item)) return item;

  if (item.itemType === 'wall_partition') {
    return orientation === 'transversal'
      ? { ...item, layoutOrientation: orientation, x: 0, width: 100, height: 2.2, y: clamp(item.y || 45, 0, 97.8), rotation: 0 }
      : { ...item, layoutOrientation: orientation, y: 0, height: 100, width: 2.2, x: clamp(item.x || 45, 0, 97.8), rotation: 90 };
  }

  const defaultDepth = item.itemType === 'full_bathroom' ? 28 : 30;
  return orientation === 'transversal'
    ? { ...item, layoutOrientation: orientation, x: 0, width: 100, height: defaultDepth, y: clamp(item.y || 62, 0, 100 - defaultDepth), rotation: 0 }
    : { ...item, layoutOrientation: orientation, y: 0, height: 100, width: defaultDepth, x: clamp(item.x || 60, 0, 100 - defaultDepth), rotation: 90 };
};

const normalizeItemPosition = (item: LayoutItem, proposedX: number, proposedY: number) => {
  if (isArchitecturalDivision(item)) {
    if ((item.layoutOrientation || 'transversal') === 'transversal') {
      return { x: 0, y: clamp(snap(proposedY), 0, 100 - item.height), rotation: 0 as const };
    }
    return { x: clamp(snap(proposedX), 0, 100 - item.width), y: 0, rotation: 90 as const };
  }

  if (item.zone === 'edge') {
    const topDistance = Math.abs(proposedY);
    const bottomDistance = Math.abs(100 - (proposedY + item.height));
    const leftDistance = Math.abs(proposedX);
    const rightDistance = Math.abs(100 - (proposedX + item.width));
    const nearestEdge = Math.min(topDistance, bottomDistance, leftDistance, rightDistance);

    if (nearestEdge === topDistance) return { x: clamp(snap(proposedX), 0, 100 - item.width), y: 0, rotation: 0 as const };
    if (nearestEdge === bottomDistance) return { x: clamp(snap(proposedX), 0, 100 - item.width), y: 100 - item.height, rotation: 180 as const };
    if (nearestEdge === leftDistance) return { x: 0, y: clamp(snap(proposedY), 0, 100 - item.height), rotation: 270 as const };
    return { x: 100 - item.width, y: clamp(snap(proposedY), 0, 100 - item.height), rotation: 90 as const };
  }

  return {
    x: clamp(snap(proposedX), 0, 100 - item.width),
    y: clamp(snap(proposedY), 0, 100 - item.height),
    rotation: item.rotation,
  };
};

const buildNewLayoutItem = (itemType: LayoutItemType, existingItems: LayoutItem[]): LayoutItem => {
  const spec = LAYOUT_ITEM_CATALOG[itemType];
  const amount = existingItems.filter((item) => item.itemType === itemType).length;
  const isDivision = ['interior_room', 'full_bathroom', 'wall_partition'].includes(itemType);
  const rawX = spec.zone === 'edge' ? 12 + amount * 10 : isDivision ? 0 : 16 + amount * 6;
  const rawY = spec.zone === 'edge' ? 0 : isDivision ? 55 + amount * 6 : 18 + amount * 6;

  const draft: LayoutItem = {
    id: crypto.randomUUID(),
    itemType,
    itemLabel: spec.label,
    x: rawX,
    y: rawY,
    width: spec.width,
    height: spec.height,
    rotation: 0,
    price: spec.price,
    zone: spec.zone,
    included: false,
    layoutOrientation: isDivision ? 'transversal' : undefined,
    hasShowerTray: itemType === 'full_bathroom' ? true : undefined,
    includedFeatures:
      itemType === 'interior_room'
        ? ROOM_INCLUDED_FEATURES
        : itemType === 'full_bathroom'
          ? BATHROOM_INCLUDED_FEATURES
          : undefined,
  };

  const oriented = isDivision ? applyDivisionOrientation(draft, 'transversal') : draft;
  const normalized = normalizeItemPosition(oriented, rawX, rawY);
  return { ...oriented, ...normalized };
};

export const Configurator = ({ onBack, onAdmin }: { onBack: () => void; onAdmin: () => void }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ConfiguratorState>(makeInitialConfig());
  const [contact, setContact] = useState<ContactFormState>(initialContact);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedLayoutItemId, setSelectedLayoutItemId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number; initialLayout: LayoutItem[] } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; edge: ResizeHandle; initialLayout: LayoutItem[] } | null>(null);
  const [undoStack, setUndoStack] = useState<LayoutItem[][]>([]);
  const [redoStack, setRedoStack] = useState<LayoutItem[][]>([]);
  const [planeZoom, setPlaneZoom] = useState(1);
  const planeRef = useRef<HTMLDivElement | null>(null);

  const price = useMemo(() => calculatePrice(config), [config]);
  const totalSteps = 6;
  const selectedLayoutItem = config.layoutItems.find((item) => item.id === selectedLayoutItemId) || null;
  const whatsappUrl = buildWhatsAppUrl(contact, config, price);

  const pushUndoSnapshot = (snapshot: LayoutItem[]) => {
    setUndoStack((prev) => [...prev.slice(-24), cloneLayout(snapshot)]);
    setRedoStack([]);
  };

  const replaceLayoutItems = (nextItems: LayoutItem[], options?: { recordHistory?: boolean; snapshot?: LayoutItem[] }) => {
    if (options?.recordHistory) pushUndoSnapshot(options.snapshot ?? config.layoutItems);
    setConfig((prev) => ({ ...prev, layoutItems: nextItems }));
  };

  const setConfigValue = <K extends keyof ConfiguratorState>(key: K, value: ConfiguratorState[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const setContactValue = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => {
    setContact((prev) => ({ ...prev, [key]: value }));
  };

  const updateMeasureFlags = (length: number, width: number, widthOption: ConfiguratorState['widthOption']) => {
    const isSpecialMeasure = length === 8 || widthOption === 'Otro ancho' || width < 2 || width > 3;
    setConfig((prev) => ({ ...prev, length, width, widthOption, isSpecialMeasure }));
  };

  const selectBestSeller = () => {
    setConfig((prev) => ({ ...prev, length: 6, width: 2.4, widthOption: '2.40 m', customWidth: '', isSpecialMeasure: false }));
  };

  const applyPanelChoice = (choice: PanelChoice, overrides?: { thickness?: string; color?: string }) => {
    let panelType = 'Panel sándwich';
    let panelThickness = '30 mm';
    let panelColor = 'Blanco';
    let isSpecialPanel = false;

    if (choice === 'Otro grosor de panel') {
      panelType = 'Panel sándwich especial';
      panelThickness = overrides?.thickness || config.specialThickness || '';
      isSpecialPanel = true;
    }
    if (choice === 'Otro color de panel') {
      panelType = 'Panel sándwich especial';
      panelColor = overrides?.color || config.specialColor || '';
      isSpecialPanel = true;
    }
    if (choice === 'Otro grosor y otro color') {
      panelType = 'Panel sándwich especial';
      panelThickness = overrides?.thickness || config.specialThickness || '';
      panelColor = overrides?.color || config.specialColor || '';
      isSpecialPanel = true;
    }

    setConfig((prev) => ({ ...prev, panelChoice: choice, panelType, panelThickness, panelColor, isSpecialPanel }));
  };

  const addLayoutItem = (itemType: LayoutItemType) => {
    const snapshot = cloneLayout(config.layoutItems);
    const next = buildNewLayoutItem(itemType, config.layoutItems);
    replaceLayoutItems([...config.layoutItems, next], { recordHistory: true, snapshot });
    setSelectedLayoutItemId(next.id);
  };

  const changeLayoutItemOrientation = (id: string, orientation: 'transversal' | 'longitudinal') => {
    const snapshot = cloneLayout(config.layoutItems);
    replaceLayoutItems(config.layoutItems.map((item) => (item.id === id ? applyDivisionOrientation(item, orientation) : item)), { recordHistory: true, snapshot });
  };

  const toggleShowerTray = (id: string, hasShowerTray: boolean) => {
    const snapshot = cloneLayout(config.layoutItems);
    replaceLayoutItems(
      config.layoutItems.map((item) => (item.id === id && item.itemType === 'full_bathroom' ? { ...item, hasShowerTray } : item)),
      { recordHistory: true, snapshot },
    );
  };

  const removeLayoutItem = (id: string) => {
    const item = config.layoutItems.find((entry) => entry.id === id);
    if (!item || item.included) return;
    const snapshot = cloneLayout(config.layoutItems);
    replaceLayoutItems(config.layoutItems.filter((entry) => entry.id !== id), { recordHistory: true, snapshot });
    setSelectedLayoutItemId(null);
  };

  const rotateLayoutItem = (id: string) => {
    const snapshot = cloneLayout(config.layoutItems);
    replaceLayoutItems(
      config.layoutItems.map((item) => (item.id === id ? { ...item, rotation: (((item.rotation || 0) + 90) % 360) as 0 | 90 | 180 | 270 } : item)),
      { recordHistory: true, snapshot },
    );
  };

  const duplicateLayoutItem = (id: string) => {
    const item = config.layoutItems.find((entry) => entry.id === id);
    if (!item || item.included) return;
    const snapshot = cloneLayout(config.layoutItems);
    const copyDraft = { ...item, id: crypto.randomUUID(), included: false };
    const normalized = normalizeItemPosition(copyDraft, item.x + 6, item.y + 6);
    const copy = { ...copyDraft, ...normalized };
    replaceLayoutItems([...config.layoutItems, copy], { recordHistory: true, snapshot });
    setSelectedLayoutItemId(copy.id);
  };

  const undoLayoutChange = () => {
    if (!undoStack.length) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, cloneLayout(config.layoutItems)]);
    setConfig((prev) => ({ ...prev, layoutItems: cloneLayout(previous) }));
    setSelectedLayoutItemId(null);
  };

  const redoLayoutChange = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, cloneLayout(config.layoutItems)]);
    setConfig((prev) => ({ ...prev, layoutItems: cloneLayout(next) }));
    setSelectedLayoutItemId(null);
  };

  const centerView = () => setPlaneZoom(1);

  const handleItemPointerDown = (event: React.PointerEvent<HTMLDivElement>, id: string) => {
    const plane = planeRef.current;
    if (!plane) return;
    const rect = plane.getBoundingClientRect();
    const item = config.layoutItems.find((entry) => entry.id === id);
    if (!item) return;
    setDragging({
      id,
      offsetX: event.clientX - rect.left - (item.x / 100) * rect.width,
      offsetY: event.clientY - rect.top - (item.y / 100) * rect.height,
      initialLayout: cloneLayout(config.layoutItems),
    });
  };

  const handleItemResizePointerDown = (event: React.PointerEvent<HTMLButtonElement>, id: string, edge: ResizeHandle) => {
    const item = config.layoutItems.find((entry) => entry.id === id);
    if (!item || !isResizableDivision(item)) return;
    event.stopPropagation();
    setDragging(null);
    setSelectedLayoutItemId(id);
    setResizing({ id, edge, initialLayout: cloneLayout(config.layoutItems) });
  };

  useEffect(() => {
    if (!resizing) return;

    const move = (event: PointerEvent) => {
      const plane = planeRef.current;
      if (!plane) return;
      const rect = plane.getBoundingClientRect();
      const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
      const pointerY = ((event.clientY - rect.top) / rect.height) * 100;

      setConfig((prev) => ({
        ...prev,
        layoutItems: prev.layoutItems.map((item) => {
          if (item.id !== resizing.id || !isResizableDivision(item)) return item;
          const orientation = item.layoutOrientation || 'transversal';
          if (orientation === 'transversal') return { ...item, height: clamp(snap(pointerY - item.y), MIN_ROOM_DEPTH_PERCENT, 100 - item.y) };
          return { ...item, width: clamp(snap(pointerX - item.x), MIN_ROOM_DEPTH_PERCENT, 100 - item.x) };
        }),
      }));
    };

    const up = () => {
      setResizing((current) => {
        if (current && !sameLayout(current.initialLayout, config.layoutItems)) pushUndoSnapshot(current.initialLayout);
        return null;
      });
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [resizing, config.layoutItems]);

  useEffect(() => {
    if (!dragging) return;

    const move = (event: PointerEvent) => {
      const plane = planeRef.current;
      if (!plane) return;
      const rect = plane.getBoundingClientRect();
      setConfig((prev) => ({
        ...prev,
        layoutItems: prev.layoutItems.map((item) => {
          if (item.id !== dragging.id) return item;
          const proposedX = ((event.clientX - rect.left - dragging.offsetX) / rect.width) * 100;
          const proposedY = ((event.clientY - rect.top - dragging.offsetY) / rect.height) * 100;
          return { ...item, ...normalizeItemPosition(item, proposedX, proposedY) };
        }),
      }));
    };

    const up = () => {
      setDragging((current) => {
        if (current && !sameLayout(current.initialLayout, config.layoutItems)) pushUndoSnapshot(current.initialLayout);
        return null;
      });
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [dragging, config.layoutItems]);

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (!config.length || config.length < 3) nextErrors.length = 'El largo mínimo es 3 metros.';
      if (config.widthOption === 'Otro ancho') {
        const customWidth = Number(config.customWidth);
        if (!config.customWidth || Number.isNaN(customWidth)) nextErrors.width = 'Introduce un ancho válido.';
        if (!Number.isNaN(customWidth) && (customWidth < 2 || customWidth > 3)) nextErrors.width = 'El ancho debe estar entre 2 m y 3 m.';
      }
    }

    if (step === 2) {
      if ((config.panelChoice === 'Otro grosor de panel' || config.panelChoice === 'Otro grosor y otro color') && !config.specialThickness.trim()) nextErrors.specialThickness = 'Indica el grosor deseado.';
      if ((config.panelChoice === 'Otro color de panel' || config.panelChoice === 'Otro grosor y otro color') && !config.specialColor.trim()) nextErrors.specialColor = 'Indica el color deseado.';
    }

    if (step === 5) {
      if (!config.province.trim()) nextErrors.province = 'La provincia es obligatoria.';
      if (!config.city.trim()) nextErrors.city = 'La localidad es obligatoria.';
    }

    if (step === 6) {
      if (!contact.fullName.trim()) nextErrors.fullName = 'El nombre completo es obligatorio.';
      if (!contact.phone.trim()) nextErrors.phone = 'El teléfono es obligatorio.';
      if (!contact.email.trim()) nextErrors.email = 'El email es obligatorio.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) nextErrors.email = 'Introduce un email válido.';
      if (!contact.accepted) nextErrors.accepted = 'Debes aceptar la política de privacidad.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const previous = () => setStep((prev) => Math.max(prev - 1, 1));

  const submit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      await createLead({ contact, config, price });
      downloadConfiguratorPdf(contact, config, price);
      setSuccess(true);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'No se pudo guardar la solicitud o generar el PDF.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <Card className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-brand-green" />
            <h1 className="text-3xl font-black text-slate-900">Tu plano y presupuesto se han generado correctamente</h1>
            <p className="mt-3 text-slate-600">También puedes enviarnos tu configuración por WhatsApp para recibir atención personalizada.</p>
            <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl bg-slate-50 p-5 text-left">
                <h2 className="mb-3 font-bold text-slate-900">Resumen de tu módulo</h2>
                <p><strong>Medidas:</strong> {config.length} x {config.width} m ({price.squareMeters} m²)</p>
                <p><strong>Panel:</strong> {config.panelType}, {config.panelThickness}, color {config.panelColor}</p>
                <p><strong>Configuración base:</strong> {price.summary.includedList.join(', ')}</p>
                <p><strong>Extras:</strong> {price.summary.extrasList.length ? price.summary.extrasList.join(', ') : 'Sin extras añadidos'}</p>
                <p><strong>Precio estimado sin IVA:</strong> {formatCurrency(price.estimatedPriceWithoutVat)}</p>
                <p><strong>Total estimado con IVA:</strong> {formatCurrency(price.estimatedPriceWithVat)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 text-left">
                <LayoutPreview length={config.length} width={config.width} items={config.layoutItems} />
              </div>
            </div>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={whatsappUrl} target="_blank" rel="noreferrer"><Button className="flex w-full items-center justify-center gap-2 sm:w-auto"><MessageCircle size={18} /> Abrir WhatsApp</Button></a>
              <Button variant="outline" onClick={onBack}>Volver al inicio</Button>
              <Button variant="ghost" onClick={onAdmin}>Ir al panel</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2"><ArrowLeft size={18} /> Inicio</Button>
          <Button variant="outline" onClick={onAdmin}>Panel privado</Button>
        </div>

        <section className="mb-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-orange">Configurador visual 2D</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Diseña tu módulo prefabricado</h1>
              <p className="mt-3 max-w-3xl text-slate-600">Configura medidas, panel, distribución y extras en un plano 2D profesional.</p>
            </div>
            <button onClick={selectBestSeller} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition hover:border-amber-300">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-800"><Sparkles size={16} /> Modelo recomendado</p>
              <p className="mt-1 text-lg font-black text-slate-900">6 x 2,40 m · 4.750 € sin IVA</p>
            </button>
          </div>
        </section>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
            <span>Paso {step} de {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200">
            <div className="h-3 rounded-full bg-brand-orange transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card>
            {step === 1 && (
              <Step title="Elige las medidas de tu módulo">
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-bold">Modelo más solicitado: 6 x 2,40 m</p>
                  <p className="mt-1">Ideal para fincas, oficinas pequeñas, almacenes y casetas de obra.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {lengthOptions.map((length) => (
                    <button key={length} onClick={() => updateMeasureFlags(length, config.width, config.widthOption)} className={`rounded-2xl border p-4 text-left transition ${config.length === length ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="text-lg font-black">{length} m</p>
                      <p className="text-xs font-semibold text-slate-500">{length === 6 ? 'Más vendido' : length === 8 ? 'Bajo consulta' : 'Medida habitual'}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {widthOptions.map((option) => {
                    const isSelected = option.value === null ? config.widthOption === 'Otro ancho' : config.width === option.value;
                    return (
                      <button key={option.label} onClick={() => option.value === null ? updateMeasureFlags(config.length, Number(config.customWidth) || config.width, 'Otro ancho') : updateMeasureFlags(config.length, option.value, option.value === 2.4 ? '2.40 m' : '2.50 m')} className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 hover:border-slate-300'}`}>
                        <p className="font-bold">{option.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{option.helper}</p>
                      </button>
                    );
                  })}
                </div>
                {config.widthOption === 'Otro ancho' && (
                  <div className="mt-5 max-w-xs">
                    <Field label="Ancho deseado en metros" error={errors.width}>
                      <Input value={config.customWidth} onChange={(e) => {
                        const value = e.target.value;
                        const numeric = Number(value);
                        setConfig((prev) => ({ ...prev, customWidth: value, width: Number.isNaN(numeric) ? prev.width : numeric, isSpecialMeasure: true }));
                      }} placeholder="Ej. 2.60" />
                    </Field>
                  </div>
                )}
                {errors.length && <p className="mt-3 text-sm text-red-600">{errors.length}</p>}
              </Step>
            )}

            {step === 2 && (
              <Step title="Elige el panel">
                <div className="grid gap-4 sm:grid-cols-2">
                  {panelChoices.map((choice) => (
                    <button key={choice} onClick={() => applyPanelChoice(choice)} className={`rounded-2xl border p-4 text-left transition ${config.panelChoice === choice ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-black">{choice}</p>
                      <p className="mt-1 text-sm text-slate-500">{choice === 'Panel sándwich blanco 30 mm' ? 'Configuración estándar' : 'Bajo revisión técnica'}</p>
                    </button>
                  ))}
                </div>
                {(config.panelChoice === 'Otro grosor de panel' || config.panelChoice === 'Otro grosor y otro color') && (
                  <div className="mt-5 max-w-sm">
                    <Field label="Grosor deseado" error={errors.specialThickness}>
                      <Input value={config.specialThickness} onChange={(e) => {
                        setConfigValue('specialThickness', e.target.value);
                        applyPanelChoice(config.panelChoice, { thickness: e.target.value });
                      }} placeholder="Ej. 40 mm" />
                    </Field>
                  </div>
                )}
                {(config.panelChoice === 'Otro color de panel' || config.panelChoice === 'Otro grosor y otro color') && (
                  <div className="mt-5 max-w-sm">
                    <Field label="Color deseado" error={errors.specialColor}>
                      <Input value={config.specialColor} onChange={(e) => {
                        setConfigValue('specialColor', e.target.value);
                        applyPanelChoice(config.panelChoice, { color: e.target.value });
                      }} placeholder="Ej. Gris antracita" />
                    </Field>
                  </div>
                )}
              </Step>
            )}

            {step === 3 && (
              <Step title="Uso previsto">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {uses.map((use) => (
                    <button key={use} onClick={() => setConfigValue('useType', use)} className={`rounded-2xl border p-4 text-left font-bold transition ${config.useType === use ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 hover:border-slate-300'}`}>{use}</button>
                  ))}
                </div>
              </Step>
            )}

            {step === 4 && (
              <Step title="Diseña la distribución en el plano">
                <InteractivePlanCanvas
                  length={config.length}
                  width={config.width}
                  items={config.layoutItems}
                  editable
                  selectedItemId={selectedLayoutItemId}
                  selectedItem={selectedLayoutItem}
                  workbenchZoom={planeZoom}
                  zoom={planeZoom}
                  planeRef={planeRef}
                  onAddItem={addLayoutItem}
                  onSelectItem={setSelectedLayoutItemId}
                  onItemPointerDown={handleItemPointerDown}
                  onItemResizePointerDown={handleItemResizePointerDown}
                  onZoomIn={() => setPlaneZoom((value) => Math.min(value + 0.1, 1.8))}
                  onZoomOut={() => setPlaneZoom((value) => Math.max(value - 0.1, 0.75))}
                  onResetZoom={centerView}
                  onRotate={rotateLayoutItem}
                  onDuplicate={duplicateLayoutItem}
                  onRemove={removeLayoutItem}
                  onChangeOrientation={changeLayoutItemOrientation}
                  onToggleShowerTray={toggleShowerTray}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={undoLayoutChange} disabled={!undoStack.length}>Deshacer</Button>
                  <Button variant="outline" onClick={redoLayoutChange} disabled={!redoStack.length}>Rehacer</Button>
                </div>
              </Step>
            )}

            {step === 5 && (
              <Step title="Ubicación y plazo">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Provincia" error={errors.province}><Input value={config.province} onChange={(e) => setConfigValue('province', e.target.value)} placeholder="Ej. Sevilla" /></Field>
                  <Field label="Localidad" error={errors.city}><Input value={config.city} onChange={(e) => setConfigValue('city', e.target.value)} placeholder="Ej. San José de la Rinconada" /></Field>
                  <Field label="Código postal"><Input value={config.postalCode} onChange={(e) => setConfigValue('postalCode', e.target.value)} placeholder="Ej. 41300" /></Field>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {timelines.map((timeline) => (
                    <button key={timeline} onClick={() => setConfigValue('deliveryTimeline', timeline)} className={`rounded-2xl border p-4 text-left font-bold transition ${config.deliveryTimeline === timeline ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-slate-200 hover:border-slate-300'}`}>{timeline}</button>
                  ))}
                </div>
              </Step>
            )}

            {step === 6 && (
              <Step title="Tus datos para generar el PDF">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre completo" error={errors.fullName}><Input value={contact.fullName} onChange={(e) => setContactValue('fullName', e.target.value)} placeholder="Nombre y apellidos" /></Field>
                  <Field label="Teléfono" error={errors.phone}><Input value={contact.phone} onChange={(e) => setContactValue('phone', e.target.value)} placeholder="600 000 000" /></Field>
                  <Field label="Email" error={errors.email}><Input value={contact.email} onChange={(e) => setContactValue('email', e.target.value)} placeholder="correo@email.com" /></Field>
                  <Field label="Uso concreto"><Input value={contact.intendedUse} onChange={(e) => setContactValue('intendedUse', e.target.value)} placeholder="Ej. oficina en finca" /></Field>
                </div>
                <Field label="Comentarios" className="mt-4"><textarea value={contact.comments} onChange={(e) => setContactValue('comments', e.target.value)} className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-orange focus:ring-4 focus:ring-orange-100" placeholder="Indica detalles importantes: puertas, electricidad, transporte, etc." /></Field>
                <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                  <input type="checkbox" checked={contact.accepted} onChange={(e) => setContactValue('accepted', e.target.checked)} className="mt-1" />
                  <span>Acepto la política de privacidad y autorizo el contacto para recibir presupuesto personalizado.</span>
                </label>
                {errors.accepted && <p className="mt-2 text-sm text-red-600">{errors.accepted}</p>}
                {errors.submit && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors.submit}</p>}
              </Step>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={previous} disabled={step === 1}>Anterior</Button>
              {step < totalSteps ? (
                <Button onClick={next} className="flex items-center justify-center gap-2">Siguiente <ArrowRight size={18} /></Button>
              ) : (
                <Button onClick={submit} disabled={isSubmitting}>{isSubmitting ? 'Generando...' : 'Generar PDF y guardar solicitud'}</Button>
              )}
            </div>
          </Card>

          <aside className="space-y-4">
            <Card>
              <h2 className="text-lg font-black text-slate-900">Resumen</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p><strong>Medidas:</strong> {config.length} x {config.width} m</p>
                <p><strong>Superficie:</strong> {price.squareMeters} m²</p>
                <p><strong>Panel:</strong> {config.panelType}, {config.panelThickness}, {config.panelColor}</p>
                <p><strong>Uso:</strong> {config.useType}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">Precio estimado sin IVA</p>
                <p className="text-3xl font-black text-slate-900">{formatCurrency(price.estimatedPriceWithoutVat)}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">Total con IVA: {formatCurrency(price.estimatedPriceWithVat)}</p>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-black text-slate-900">Incluido y extras</h2>
              <p className="mt-3 text-sm text-slate-600"><strong>Base:</strong> {price.summary.includedList.join(', ')}</p>
              <p className="mt-3 text-sm text-slate-600"><strong>Extras:</strong> {price.summary.extrasList.length ? price.summary.extrasList.join(', ') : 'Sin extras añadidos'}</p>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 block"><Button variant="outline" className="flex w-full items-center justify-center gap-2"><MessageCircle size={18} /> Enviar por WhatsApp</Button></a>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

const Step = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="mb-5 text-2xl font-black text-slate-900">{title}</h2>
    {children}
  </section>
);
