import { LayoutItemType } from '../../types';
import { formatCurrency, LAYOUT_ITEM_CATALOG } from '../../utils/pricing';
import { PLAN_TOOL_CATEGORIES, PLAN_TOOL_DEFINITIONS, PlanToolCategoryId } from './planUtils';
import { PlanToolIcon } from './PlanToolIcon';

type PlanToolbarProps = {
  onAddItem: (type: LayoutItemType) => void;
  disabled?: boolean;
};

const categoryOrder: PlanToolCategoryId[] = ['openings', 'electricity', 'distribution', 'comfort'];

export const PlanToolbar = ({ onAddItem, disabled = false }: PlanToolbarProps) => (
  <aside className="rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-900/5 backdrop-blur">
    <div className="mb-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-orange">Herramientas del plano</p>
      <h3 className="mt-1 text-lg font-black text-slate-900">Añade elementos</h3>
      <p className="mt-1 text-sm text-slate-500">Diseña tu distribución de forma orientativa y prepara un presupuesto más preciso.</p>
    </div>

    <div className="space-y-4">
      {categoryOrder.map((categoryId) => {
        const category = PLAN_TOOL_CATEGORIES[categoryId];
        const tools = PLAN_TOOL_DEFINITIONS.filter((tool) => tool.category === categoryId);

        return (
          <section key={categoryId}>
            <div className="mb-2">
              <p className="text-sm font-black text-slate-800">{category.title}</p>
              <p className="text-xs text-slate-500">{category.description}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {tools.map((tool) => {
                const spec = LAYOUT_ITEM_CATALOG[tool.type];
                const price = spec.price > 0 ? formatCurrency(spec.price) : 'Sin coste automático';

                return (
                  <button
                    key={tool.type}
                    type="button"
                    disabled={disabled}
                    onClick={() => onAddItem(tool.type)}
                    className="group flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-orange hover:bg-orange-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm transition group-hover:bg-brand-orange">
                      <PlanToolIcon icon={tool.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-black text-slate-900">{tool.title}</span>
                        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700 group-hover:bg-white">{price}</span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{tool.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  </aside>
);
