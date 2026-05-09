import { Copy, Lock, RotateCw, Trash2 } from 'lucide-react';
import { LayoutItem } from '../../types';
import {
  canDuplicatePlanItem,
  canOrientPlanItem,
  canRemovePlanItem,
  canRotatePlanItem,
  getPlanItemHelpText,
  getPlanItemLabel,
  getPlanItemPositionLabel,
  getPlanItemPriceLabel,
  getPlanItemStatusLabel,
} from './planUtils';

type SelectedItemPanelProps = {
  item: LayoutItem | null;
  onRotate?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRemove?: (id: string) => void;
  onChangeOrientation?: (id: string, orientation: 'transversal' | 'longitudinal') => void;
};

export const SelectedItemPanel = ({
  item,
  onRotate,
  onDuplicate,
  onRemove,
  onChangeOrientation,
}: SelectedItemPanelProps) => {
  if (!item) {
    return (
      <aside className="rounded-[28px] border border-dashed border-slate-300 bg-white p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Lock size={20} />
        </div>
        <h3 className="font-black text-slate-900">Selecciona un elemento</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">Haz clic sobre una puerta, ventana, enchufe, estancia o extra para ver sus opciones.</p>
      </aside>
    );
  }

  const removable = canRemovePlanItem(item);
  const duplicable = canDuplicatePlanItem(item);
  const rotatable = canRotatePlanItem(item);
  const orientable = canOrientPlanItem(item);

  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-orange">Elemento seleccionado</p>
          <h3 className="mt-1 text-xl font-black text-slate-900">{getPlanItemLabel(item)}</h3>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{getPlanItemPriceLabel(item)}</span>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p><strong>Estado:</strong> {getPlanItemStatusLabel(item)}</p>
        <p className="mt-1"><strong>Posición:</strong> {getPlanItemPositionLabel(item)}</p>
        <p className="mt-1"><strong>Rotación:</strong> {item.rotation}°</p>
      </div>

      {orientable ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-black text-slate-900">Orientación</p>
          <div className="grid grid-cols-2 gap-2">
            {(['transversal', 'longitudinal'] as const).map((orientation) => (
              <button
                key={orientation}
                type="button"
                onClick={() => onChangeOrientation?.(item.id, orientation)}
                className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${item.layoutOrientation === orientation || (!item.layoutOrientation && orientation === 'transversal') ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
              >
                {orientation === 'transversal' ? 'Transversal' : 'Longitudinal'}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={!rotatable}
          onClick={() => onRotate?.(item.id)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCw size={15} /> Rotar
        </button>
        <button
          type="button"
          disabled={!duplicable}
          onClick={() => onDuplicate?.(item.id)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy size={15} /> Duplicar
        </button>
        <button
          type="button"
          disabled={!removable}
          onClick={() => onRemove?.(item.id)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={15} /> Eliminar
        </button>
      </div>

      {!removable ? (
        <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Este elemento forma parte de la configuración base y no se puede eliminar.</p>
      ) : null}

      <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">{getPlanItemHelpText(item)}</p>
    </aside>
  );
};
