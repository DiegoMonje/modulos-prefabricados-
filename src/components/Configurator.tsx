import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Focus,
  MessageCircle,
  Move,
  Redo2,
  RotateCw,
  Sparkles,
  Trash2,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ConfiguratorState, ContactFormState, DeliveryTimeline, LayoutItem, LayoutItemType, PanelChoice, UseType } from '../types';
import { calculatePrice, createBaseLayoutItems, formatCurrency, LAYOUT_ITEM_CATALOG } from '../utils/pricing';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { createLead } from '../services/leads';
import { downloadConfiguratorPdf } from '../utils/pdf';
import { Button, Card, Field, Input } from './Ui';
import { LayoutPreview } from './LayoutPreview';

const lengthOptions = [3, 4, 5, 6, 7, 8];
const widthOptions = [
  { label: '2,40 metros', value: 2.4, helper: 'Ancho estándar' },
  { label: '2,50 metros', value: 2.5, helper: 'Opción habitual' },
  { label: 'Otro ancho', value: null, helper: 'Bajo consulta' },
] as const;
const panelChoices: PanelChoice[] = ['Panel sándwich blanco 30 mm', 'Otro grosor de panel', 'Otro color de panel', 'Otro grosor y otro color'];
const uses: UseType[] = ['Caseta de obra', 'Oficina', 'Almacén', 'Vestuario', 'Caseta para finca', 'Local comercial', 'Otro'];
const timelines: DeliveryTimeline[] = ['Lo antes posible', 'En menos de 1 mes', 'En 1-3 meses', 'Más adelante', 'Solo estoy mirando precios'];
const catalogOrder: LayoutItemType[] = ['additional_socket', 'additional_door', 'window_80x80', 'large_window', 'wall_partition', 'interior_room', 'full_bathroom', 'air_conditioning'];
const GRID_SIZE = 2;

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

const cloneLayout = (items: LayoutItem[]) => items.map((item) => ({ ...item }));
const sameLayout = (a: LayoutItem[], b: LayoutItem[]) => JSON.stringify(a) === JSON.stringify(b);
const snap = (value: number, step = GRID_SIZE) => Math.round(value / step) * step;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const isArchitecturalDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom', 'wall_partition'].includes(item.itemType);
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
    const min = Math.min(topDistance, bottomDistance, leftDistance, rightDistance);

    if (min === topDistance) {
      return { x: clamp(snap(proposedX), 0, 100 - item.width), y: 0, rotation: 0 as const };
    }
    if (min === bottomDistance) {
      return { x: clamp(snap(proposedX), 0, 100 - item.width), y: 100 - item.height, rotation: 180 as const };
    }
    if (min === leftDistance) {
      return { x: 0, y: clamp(snap(proposedY), 0, 100 - item.height), rotation: 270 as const };
    }
    return { x: 100 - item.width, y: clamp(snap(proposedY), 0, 100 - item.height), rotation: 90 as const };
  }

  return {
    x: clamp(snap(proposedX), 0, 100 - item.width),
    y: clamp(snap(proposedY), 0, 100 - item.height),
    rotation: item.rotation,
  };
};

const toolDescriptions: Record<LayoutItemType, string> = {
  additional_socket: 'Añadir enchufe adicional · +50 €',
  additional_door: 'Añadir puerta adicional · +120 €',
  window_80x80: 'Añadir ventana 80x80 · +200 €',
  large_window: 'Añadir ventana grande · +250 €',
  wall_partition: 'Añadir tabique interior · sin coste automático',
  interior_room: 'Añadir habitación interior · +300 €',
  full_bathroom: 'Añadir baño completo · +1.500 €',
  air_conditioning: 'Añadir aire acondicionado · +600 €',
  base_door: 'Puerta incluida',
  base_window_80x80: 'Ventana incluida',
  base_socket: 'Enchufe incluido',
  base_light_point: 'Punto de luz incluido',
  base_electrical_panel: 'Cuadro eléctrico incluido',
};

export const Configurator = ({ onBack, onAdmin }: { onBack: () => void; onAdmin: () => void }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ConfiguratorState>(makeInitialConfig());
  const [contact, setContact] = useState<ContactFormState>(initialContact);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedLayoutItemId, setSelectedLayoutItemId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number; initialLayout: LayoutItem[] } | null>(null);
  const [undoStack, setUndoStack] = useState<LayoutItem[][]>([]);
  const [redoStack, setRedoStack] = useState<LayoutItem[][]>([]);
  const [planeZoom, setPlaneZoom] = useState(1);
  const planeRef = useRef<HTMLDivElement | null>(null);

  const price = useMemo(() => calculatePrice(config), [config]);
  const totalSteps = 7;
  const selectedLayoutItem = config.layoutItems.find((item) => item.id === selectedLayoutItemId) || null;

  const pushUndoSnapshot = (snapshot: LayoutItem[]) => {
    setUndoStack((prev) => [...prev.slice(-24), cloneLayout(snapshot)]);
    setRedoStack([]);
  };

  const setConfigValue = <K extends keyof ConfiguratorState>(key: K, value: ConfiguratorState[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const setContactValue = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => {
    setContact((prev) => ({ ...prev, [key]: value }));
  };

  const replaceLayoutItems = (nextItems: LayoutItem[], options?: { recordHistory?: boolean; snapshot?: LayoutItem[] }) => {
    if (options?.recordHistory) {
      pushUndoSnapshot(options.snapshot ?? config.layoutItems);
    }
    setConfig((prev) => ({ ...prev, layoutItems: nextItems }));
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
      panelColor = 'Blanco';
      isSpecialPanel = true;
    } else if (choice === 'Otro color de panel') {
      panelType = 'Panel sándwich especial';
      panelThickness = '30 mm';
      panelColor = overrides?.color || config.specialColor || '';
      isSpecialPanel = true;
    } else if (choice === 'Otro grosor y otro color') {
      panelType = 'Panel sándwich especial';
      panelThickness = overrides?.thickness || config.specialThickness || '';
      panelColor = overrides?.color || config.specialColor || '';
      isSpecialPanel = true;
    }

    setConfig((prev) => ({
      ...prev,
      panelChoice: choice,
      panelType,
      panelThickness,
      panelColor,
      isSpecialPanel,
    }));
  };

  const addLayoutItem = (itemType: LayoutItemType) => {
    const snapshot = cloneLayout(config.layoutItems);
    const spec = LAYOUT_ITEM_CATALOG[itemType];
    const amount = config.layoutItems.filter((item) => item.itemType === itemType).length;
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
    };

    const oriented = isDivision ? applyDivisionOrientation(draft, 'transversal') : draft;
    const normalized = normalizeItemPosition(oriented, rawX, rawY);
    const next: LayoutItem = { ...oriented, ...normalized };
    replaceLayoutItems([...config.layoutItems, next], { recordHistory: true, snapshot });
    setSelectedLayoutItemId(next.id);
  };

  const changeLayoutItemOrientation = (id: string, orientation: 'transversal' | 'longitudinal') => {
    const snapshot = cloneLayout(config.layoutItems);
    replaceLayoutItems(config.layoutItems.map((item) => item.id === id ? applyDivisionOrientation(item, orientation) : item), { recordHistory: true, snapshot });
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
      config.layoutItems.map((item) => {
        if (item.id !== id) return item;
        const nextRotation = (((item.rotation || 0) + 90) % 360) as 0 | 90 | 180 | 270;
        return { ...item, rotation: nextRotation };
      }),
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
          const normalized = normalizeItemPosition(item, proposedX, proposedY);
          return { ...item, ...normalized };
        }),
      }));
    };

    const up = () => {
      setDragging((current) => {
        if (current && !sameLayout(current.initialLayout, config.layoutItems)) {
          pushUndoSnapshot(current.initialLayout);
        }
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
      if (config.length > 8) nextErrors.length = 'Para más de 8 m debes consultar directamente por WhatsApp.';
    }

    if (step === 2) {
      if ((config.panelChoice === 'Otro grosor de panel' || config.panelChoice === 'Otro grosor y otro color') && !config.specialThickness.trim()) {
        nextErrors.specialThickness = 'Indica el grosor deseado.';
      }
      if ((config.panelChoice === 'Otro color de panel' || config.panelChoice === 'Otro grosor y otro color') && !config.specialColor.trim()) {
        nextErrors.specialColor = 'Indica el color deseado.';
      }
    }

    if (step === 5 || step === 7) {
      if (!config.province.trim()) nextErrors.province = 'La provincia es obligatoria.';
      if (!config.city.trim()) nextErrors.city = 'La localidad es obligatoria.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const previous = () => setStep((prev) => Math.max(prev - 1, 1));

  const openDownloadModal = () => {
    if (!validateStep()) return;
    setErrors({});
    setShowDownloadModal(true);
  };

  const validateDownloadForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!contact.fullName.trim()) nextErrors.fullName = 'El nombre completo es obligatorio.';
    if (!contact.email.trim()) nextErrors.email = 'El email es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) nextErrors.email = 'Introduce un email válido.';
    if (!contact.phone.trim()) nextErrors.phone = 'El teléfono es obligatorio.';
    if (!config.province.trim()) nextErrors.province = 'La provincia es obligatoria.';
    if (!config.city.trim()) nextErrors.city = 'La localidad es obligatoria.';
    if (!contact.accepted) nextErrors.accepted = 'Debes aceptar la política de privacidad.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validateDownloadForm()) return;
    setIsSubmitting(true);
    try {
      await createLead({ contact, config, price });
      downloadConfiguratorPdf(contact, config, price);
      setShowDownloadModal(false);
      setSuccess(true);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'No se pudo guardar la solicitud o generar el PDF.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappUrl = buildWhatsAppUrl(contact, config, price);

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

        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-orange">Configurador visual 2D</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Diseña tu módulo prefabricado</h1>
              <p className="mt-3 max-w-3xl text-slate-600">Configura medidas, distribución y elementos principales en un plano 2D sencillo. Recibe tu presupuesto personalizado.</p>
            </div>
            <button onClick={selectBestSeller} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition hover:border-amber-300">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-800"><Sparkles size={16} /> Modelo recomendado</p>
              <p className="mt-1 text-lg font-black text-slate-900">6 x 2,40 m · 4.750 € sin IVA</p>
            </button>
          </div>
        </div>

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
                      <button
                        key={option.label}
                        onClick={() => {
                          if (option.value === null) updateMeasureFlags(config.length, Number(config.customWidth) || config.width, 'Otro ancho');
                          else updateMeasureFlags(config.length, option.value, option.value === 2.4 ? '2.40 m' : '2.50 m');
                        }}
                        className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 hover:border-slate-300'}`}
                      >
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
                {config.isSpecialMeasure && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Esta medida requiere revisión personalizada. Te contactaremos para confirmar viabilidad, transporte y precio final.</p>}
              </Step>
            )}

            {step === 2 && (
              <Step title="Selecciona el panel sándwich">
                <div className="grid gap-3 sm:grid-cols-2">
                  {panelChoices.map((choice) => (
                    <button key={choice} onClick={() => applyPanelChoice(choice)} className={`rounded-2xl border p-4 text-left transition ${config.panelChoice === choice ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-bold">{choice}</p>
                      <p className="mt-1 text-xs text-slate-500">{choice === 'Panel sándwich blanco 30 mm' ? 'Opción estándar' : 'Bajo consulta'}</p>
                    </button>
                  ))}
                </div>
                {(config.panelChoice === 'Otro grosor de panel' || config.panelChoice === 'Otro grosor y otro color') && (
                  <div className="mt-5 max-w-sm"><Field label="Grosor deseado" error={errors.specialThickness}><Input value={config.specialThickness} onChange={(e) => { setConfigValue('specialThickness', e.target.value); applyPanelChoice(config.panelChoice, { thickness: e.target.value }); }} placeholder="Ej. 40 mm" /></Field></div>
                )}
                {(config.panelChoice === 'Otro color de panel' || config.panelChoice === 'Otro grosor y otro color') && (
                  <div className="mt-5 max-w-sm"><Field label="Color deseado" error={errors.specialColor}><Input value={config.specialColor} onChange={(e) => { setConfigValue('specialColor', e.target.value); applyPanelChoice(config.panelChoice, { color: e.target.value }); }} placeholder="Ej. Gris antracita" /></Field></div>
                )}
                {config.isSpecialPanel && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Trabajamos normalmente con panel sándwich blanco de 30 mm. Otros grosores o colores requieren consulta personalizada para confirmar disponibilidad, precio y plazo.</p>}
              </Step>
            )}

            {step === 3 && (
              <Step title="¿Qué uso tendrá el módulo?">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {uses.map((use) => (
                    <button key={use} onClick={() => setConfigValue('useType', use)} className={`rounded-2xl border p-4 text-left font-bold transition ${config.useType === use ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 hover:border-slate-300'}`}>{use}</button>
                  ))}
                </div>
              </Step>
            )}

            {step === 4 && (
              <Step title="Diseña la distribución de tu módulo">
                <div className="mb-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-bold text-slate-900">Plano 2D de tu módulo</p>
                  <p className="mt-1">Puedes seleccionar, mover, rotar, duplicar y eliminar elementos. Las habitaciones, baños y tabiques pueden ponerse a lo ancho o a lo largo del módulo, creando divisiones reales de pared a pared.</p>
                </div>
                <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-3 text-sm font-bold text-slate-900">Herramientas</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setSelectedLayoutItemId(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue">Seleccionar</button>
                        <button onClick={centerView} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue">Centrar</button>
                        <button onClick={() => setPlaneZoom((prev) => Math.max(0.8, Number((prev - 0.1).toFixed(2))))} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue"><ZoomOut size={16} /> Zoom -</button>
                        <button onClick={() => setPlaneZoom((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))))} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue"><ZoomIn size={16} /> Zoom +</button>
                        <button onClick={undoLayoutChange} disabled={!undoStack.length} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-50"><Undo2 size={16} /> Deshacer</button>
                        <button onClick={redoLayoutChange} disabled={!redoStack.length} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-50"><Redo2 size={16} /> Rehacer</button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-3 text-sm font-bold text-slate-900">Añadir elementos</p>
                      <div className="grid gap-3">
                        {catalogOrder.map((type) => {
                          const spec = LAYOUT_ITEM_CATALOG[type];
                          return (
                            <button key={type} onClick={() => addLayoutItem(type)} className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-orange hover:bg-orange-50">
                              <p className="font-bold text-slate-900">{spec.label}</p>
                              <p className="text-sm text-slate-500">{toolDescriptions[type]}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <LayoutPreview
                      length={config.length}
                      width={config.width}
                      items={config.layoutItems}
                      editable
                      planeRef={planeRef}
                      zoom={planeZoom}
                      selectedItemId={selectedLayoutItemId}
                      onSelectItem={(id) => setSelectedLayoutItemId(id || null)}
                      onItemPointerDown={handleItemPointerDown}
                    />

                    {selectedLayoutItem ? (
                      <div className="mt-4 rounded-2xl border border-brand-orange bg-orange-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-black text-slate-900">Elemento seleccionado</p>
                            <p className="mt-1 text-sm text-slate-700">{selectedLayoutItem.itemLabel} · {selectedLayoutItem.layoutOrientation ? `orientación ${selectedLayoutItem.layoutOrientation}` : `rotación ${selectedLayoutItem.rotation || 0}°`} · {selectedLayoutItem.included ? 'Incluido en la configuración base' : selectedLayoutItem.price ? `Extra ${formatCurrency(selectedLayoutItem.price)}` : 'Sin coste automático'}</p>
                            {['interior_room', 'full_bathroom', 'wall_partition'].includes(selectedLayoutItem.itemType) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button type="button" onClick={() => changeLayoutItemOrientation(selectedLayoutItem.id, 'transversal')} variant={selectedLayoutItem.layoutOrientation === 'transversal' ? 'primary' : 'outline'}>A lo ancho</Button>
                                <Button type="button" onClick={() => changeLayoutItemOrientation(selectedLayoutItem.id, 'longitudinal')} variant={selectedLayoutItem.layoutOrientation === 'longitudinal' ? 'primary' : 'outline'}>A lo largo</Button>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" onClick={() => rotateLayoutItem(selectedLayoutItem.id)} variant="outline" className="flex items-center gap-2"><RotateCw size={16} /> Rotar</Button>
                            {!selectedLayoutItem.included && <Button type="button" onClick={() => duplicateLayoutItem(selectedLayoutItem.id)} variant="outline" className="flex items-center gap-2"><Copy size={16} /> Duplicar</Button>}
                            {!selectedLayoutItem.included && <Button type="button" onClick={() => removeLayoutItem(selectedLayoutItem.id)} variant="danger" className="flex items-center gap-2"><Trash2 size={16} /> Eliminar</Button>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                        Haz clic en cualquier elemento del plano para moverlo, rotarlo o editarlo.
                      </div>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <InfoPill label="Largo" value={`${config.length} m`} />
                      <InfoPill label="Ancho" value={`${config.width} m`} />
                      <InfoPill label="Superficie" value={`${price.squareMeters} m²`} />
                    </div>
                  </div>
                </div>
              </Step>
            )}

            {step === 5 && (
              <Step title="Indica la ubicación">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Provincia" error={errors.province}><Input value={config.province} onChange={(e) => setConfigValue('province', e.target.value)} placeholder="Sevilla" /></Field>
                  <Field label="Localidad" error={errors.city}><Input value={config.city} onChange={(e) => setConfigValue('city', e.target.value)} placeholder="San José de la Rinconada" /></Field>
                  <Field label="Código postal"><Input value={config.postalCode} onChange={(e) => setConfigValue('postalCode', e.target.value)} placeholder="41300" /></Field>
                </div>
              </Step>
            )}

            {step === 6 && (
              <Step title="¿Cuándo necesitas tu módulo?">
                <div className="grid gap-3 sm:grid-cols-2">
                  {timelines.map((timeline) => (
                    <button key={timeline} onClick={() => setConfigValue('deliveryTimeline', timeline)} className={`rounded-2xl border p-4 text-left font-bold transition ${config.deliveryTimeline === timeline ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-slate-200 hover:border-slate-300'}`}>{timeline}</button>
                  ))}
                </div>
              </Step>
            )}

            {step === 7 && (
              <Step title="Descarga tu plano y presupuesto">
                <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <h2 className="text-xl font-black text-slate-900">Tu módulo ya está listo</h2>
                    <p className="mt-2 text-sm text-slate-600">Revisa el plano 2D, las medidas, los elementos incluidos, los extras añadidos y el precio estimado antes de descargar el presupuesto.</p>
                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <p><strong>Medidas:</strong> {config.length} x {config.width} m ({price.squareMeters} m²)</p>
                      <p><strong>Panel:</strong> {config.panelType} {config.panelColor} {config.panelThickness}</p>
                      <p><strong>Configuración base:</strong> {price.summary.includedList.join(', ')}</p>
                      <p><strong>Extras:</strong> {price.summary.extrasList.length ? price.summary.extrasList.join(', ') : 'Sin extras añadidos'}</p>
                      <p><strong>Precio estimado sin IVA:</strong> {formatCurrency(price.estimatedPriceWithoutVat)}</p>
                      <p><strong>IVA 21%:</strong> {formatCurrency(price.vatAmount)}</p>
                      <p><strong>Total estimado con IVA:</strong> {formatCurrency(price.estimatedPriceWithVat)}</p>
                    </div>
                    <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Para descargar el plano y el presupuesto debes dejar tus datos y aceptar la política de privacidad. La suscripción a la newsletter es opcional.</p>
                    <Button onClick={openDownloadModal} className="mt-5 flex items-center gap-2"><Download size={18} /> Descargar plano + presupuesto</Button>
                    {errors.submit && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors.submit}</p>}
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <LayoutPreview length={config.length} width={config.width} items={config.layoutItems} />
                  </div>
                </div>
              </Step>
            )}

            <div className="mt-8 flex justify-between gap-3">
              <Button variant="outline" onClick={previous} disabled={step === 1} className="flex items-center gap-2"><ArrowLeft size={18} /> Anterior</Button>
              {step < totalSteps ? <Button onClick={next} className="flex items-center gap-2">Siguiente <ArrowRight size={18} /></Button> : <Button onClick={openDownloadModal} className="flex items-center gap-2"><Download size={18} /> Descargar plano + presupuesto</Button>}
            </div>
          </Card>

          <Card className="h-fit lg:sticky lg:top-6">
            <h2 className="mb-4 text-xl font-black text-slate-900">Resumen en tiempo real</h2>
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>Medida:</strong> {config.length} x {config.width} m</p>
              <p><strong>Superficie:</strong> {price.squareMeters} m²</p>
              <p><strong>Panel:</strong> {config.panelType} {config.panelColor} {config.panelThickness}</p>
              <p><strong>Configuración base:</strong> {price.summary.includedList.join(', ')}</p>
              <p><strong>Enchufes extra:</strong> {price.summary.additionalSockets}</p>
              <p><strong>Puertas extra:</strong> {price.summary.additionalDoors}</p>
              <p><strong>Ventanas 80x80 extra:</strong> {price.summary.windows80x80}</p>
              <p><strong>Ventanas grandes:</strong> {price.summary.largeWindows}</p>
              <p><strong>Habitaciones:</strong> {price.summary.interiorRooms}</p>
              <p><strong>Baño:</strong> {price.summary.hasFullBathroom ? 'Sí' : 'No'}</p>
              <p><strong>Aire acondicionado:</strong> {price.summary.hasAirConditioning ? 'Sí' : 'No'}</p>
            </div>
            <div className="mt-5 rounded-2xl bg-orange-50 p-4">
              <p className="text-sm font-semibold text-orange-700">Precio estimado sin IVA</p>
              <p className="mt-1 text-3xl font-black text-brand-orange">{formatCurrency(price.estimatedPriceWithoutVat)}</p>
              <p className="mt-1 text-sm text-orange-700">IVA no incluido</p>
              <div className="mt-3 border-t border-orange-100 pt-3 text-sm text-orange-800">
                <p>Precio base: {formatCurrency(price.basePrice)}</p>
                <p>Extras: {formatCurrency(price.extrasPrice)}</p>
                <p>IVA 21%: {formatCurrency(price.vatAmount)}</p>
                <p className="font-bold">Total con IVA: {formatCurrency(price.estimatedPriceWithVat)}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">El precio mostrado es estimado y no incluye IVA. El presupuesto final puede variar según transporte, montaje, distribución interior, acabados y revisión técnica.</p>
            {(config.isSpecialMeasure || config.isSpecialPanel) && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Esta configuración requiere revisión personalizada para confirmar disponibilidad, transporte, montaje, precio y plazo final.</p>}
          </Card>
        </div>

        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Recibe tu plano y presupuesto orientativo</h2>
                  <p className="mt-2 text-sm text-slate-600">Déjanos tus datos y podrás descargar tu plano junto con el presupuesto estimado de tu módulo. También podrás recibir ideas, novedades y ofertas sobre casetas prefabricadas si aceptas suscribirte.</p>
                </div>
                <button onClick={() => setShowDownloadModal(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><X size={20} /></button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre completo" error={errors.fullName}><Input value={contact.fullName} onChange={(e) => setContactValue('fullName', e.target.value)} /></Field>
                <Field label="Email" error={errors.email}><Input type="email" value={contact.email} onChange={(e) => setContactValue('email', e.target.value)} /></Field>
                <Field label="Teléfono" error={errors.phone}><Input value={contact.phone} onChange={(e) => setContactValue('phone', e.target.value)} /></Field>
                <Field label="Provincia" error={errors.province}><Input value={config.province} onChange={(e) => setConfigValue('province', e.target.value)} /></Field>
                <Field label="Localidad" error={errors.city}><Input value={config.city} onChange={(e) => setConfigValue('city', e.target.value)} /></Field>
                <Field label="Comentario opcional"><Input value={contact.comments} onChange={(e) => setContactValue('comments', e.target.value)} placeholder="Ej. Quiero entrega rápida" /></Field>
              </div>

              <div className="mt-5 space-y-4">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                  <input type="checkbox" checked={contact.accepted} onChange={(e) => setContactValue('accepted', e.target.checked)} className="mt-1" />
                  <span>Acepto la política de privacidad y que Módulos Prefabricados San José S.L. trate mis datos para enviarme el plano y presupuesto solicitado.</span>
                </label>
                {errors.accepted && <p className="text-sm text-red-600">{errors.accepted}</p>}

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                  <input type="checkbox" checked={contact.newsletterSubscribed} onChange={(e) => setContactValue('newsletterSubscribed', e.target.checked)} className="mt-1" />
                  <span>Acepto recibir comunicaciones comerciales, novedades y ofertas de Módulos Prefabricados San José S.L.</span>
                </label>
              </div>

              <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">Responsable: Módulos Prefabricados San José S.L. Finalidad: gestionar tu solicitud de presupuesto y, si lo aceptas, enviarte comunicaciones comerciales. Puedes solicitar la baja o ejercer tus derechos escribiendo a contacto@modulosprefabricadossanjose.com.</p>
              {errors.submit && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors.submit}</p>}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setShowDownloadModal(false)}>Cancelar</Button>
                <Button onClick={submit} disabled={isSubmitting} className="flex items-center justify-center gap-2"><Download size={18} /> {isSubmitting ? 'Generando...' : 'Enviar y descargar presupuesto'}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Step = ({ title, children }: { title: string; children: React.ReactNode }) => <div><h1 className="mb-6 text-2xl font-black text-slate-900 md:text-3xl">{title}</h1>{children}</div>;
const InfoPill = ({ label, value }: { label: string; value: string }) => <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-900">{value}</p></div>;
