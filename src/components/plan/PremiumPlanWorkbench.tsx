import type { ReactNode } from 'react';
import { LayoutItem, LayoutItemType } from '../../types';
import { PlanToolbar } from './PlanToolbar';
import { PlanZoomControls } from './PlanZoomControls';
import { SelectedItemPanel } from './SelectedItemPanel';

type PremiumPlanWorkbenchProps = {
  children: ReactNode;
  selectedItem: LayoutItem | null;
  zoom: number;
  onAddItem: (type: LayoutItemType) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRotate?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRemove?: (id: string) => void;
  onChangeOrientation?: (id: string, orientation: 'transversal' | 'longitudinal') => void;
  onToggleShowerTray?: (id: string, hasShowerTray: boolean) => void;
  disabledTools?: boolean;
};

export const PremiumPlanWorkbench = ({
  children,
  selectedItem,
  zoom,
  onAddItem,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRotate,
  onDuplicate,
  onRemove,
  onChangeOrientation,
  onToggleShowerTray,
  disabledTools = false,
}: PremiumPlanWorkbenchProps) => (
  <section className="rounded-[32px] border border-slate-200 bg-slate-100/80 p-3 shadow-inner md:p-5">
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange">Editor 2D premium</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Diseña tu distribución de forma orientativa</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Mueve puertas, ventanas, instalaciones y divisiones para preparar una solicitud más precisa. La ubicación exacta se confirmará en la revisión técnica.
        </p>
      </div>
      <PlanZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onResetZoom} />
    </div>

    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <PlanToolbar onAddItem={onAddItem} disabled={disabledTools} />

      <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5 md:p-4">
        <div className="mb-3 flex flex-col gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black">Plano técnico orientativo</p>
            <p className="text-xs text-slate-300">Rejilla, medidas, selección, zoom, deshacer y edición visual.</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-100 ring-1 ring-white/15">Snap inteligente</span>
        </div>
        {children}
      </div>

      <SelectedItemPanel
        item={selectedItem}
        onRotate={onRotate}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onChangeOrientation={onChangeOrientation}
        onToggleShowerTray={onToggleShowerTray}
      />
    </div>
  </section>
);
