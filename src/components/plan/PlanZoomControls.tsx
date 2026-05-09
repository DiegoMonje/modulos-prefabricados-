import { Focus, ZoomIn, ZoomOut } from 'lucide-react';

type PlanZoomControlsProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

export const PlanZoomControls = ({ zoom, onZoomIn, onZoomOut, onReset }: PlanZoomControlsProps) => (
  <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur">
    <button
      type="button"
      onClick={onZoomOut}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      aria-label="Alejar plano"
    >
      <ZoomOut size={17} />
    </button>
    <span className="min-w-14 rounded-xl bg-slate-950 px-2 py-1 text-center text-xs font-black text-white">{Math.round(zoom * 100)}%</span>
    <button
      type="button"
      onClick={onZoomIn}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      aria-label="Acercar plano"
    >
      <ZoomIn size={17} />
    </button>
    <button
      type="button"
      onClick={onReset}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-orange-50 hover:text-brand-orange"
      aria-label="Centrar plano"
    >
      <Focus size={17} />
    </button>
  </div>
);
