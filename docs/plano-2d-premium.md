# Plano 2D premium del configurador

Esta mejora prepara una arquitectura modular para que el plano 2D del configurador se convierta en una herramienta visual más moderna, fluida y profesional sin convertirlo en un programa complejo tipo AutoCAD.

## Componentes añadidos

- `src/components/plan/PremiumPlanWorkbench.tsx`
  - Contenedor visual premium para envolver el plano actual.
  - Añade cabecera comercial, zona de herramientas, zona de canvas y panel de propiedades.

- `src/components/plan/PlanToolbar.tsx`
  - Barra lateral de herramientas con categorías:
    - Aberturas.
    - Electricidad.
    - Distribución.
    - Confort.
  - Cada herramienta muestra icono, nombre, descripción y precio.

- `src/components/plan/SelectedItemPanel.tsx`
  - Panel de propiedades para el elemento seleccionado.
  - Muestra estado, precio, posición, rotación, ayuda comercial y acciones disponibles.

- `src/components/plan/PlanZoomControls.tsx`
  - Controles reutilizables de zoom, alejar y centrar.

- `src/components/plan/PlanToolIcon.tsx`
  - Iconos reutilizables para las herramientas del plano.

- `src/components/plan/planUtils.ts`
  - Definiciones de herramientas.
  - Categorías.
  - Reglas de acciones permitidas.
  - Labels comerciales y textos de ayuda.

- `src/components/plan/index.ts`
  - Exportación centralizada.

## Integración recomendada en `Configurator.tsx`

El archivo `Configurator.tsx` contiene actualmente mucha lógica del plano. Para evitar romper precios, PDF, WhatsApp o leads, la integración recomendada es envolver el bloque del plano editable existente con `PremiumPlanWorkbench`.

Ejemplo orientativo:

```tsx
import { PremiumPlanWorkbench } from './plan';

<PremiumPlanWorkbench
  selectedItem={selectedLayoutItem}
  zoom={planeZoom}
  onAddItem={addLayoutItem}
  onZoomIn={() => setPlaneZoom((value) => Math.min(value + 0.1, 1.8))}
  onZoomOut={() => setPlaneZoom((value) => Math.max(value - 0.1, 0.75))}
  onResetZoom={centerView}
  onRotate={rotateLayoutItem}
  onDuplicate={duplicateLayoutItem}
  onRemove={removeLayoutItem}
  onChangeOrientation={changeLayoutItemOrientation}
>
  {/* Aquí debe ir el LayoutPreview/plano editable actual */}
</PremiumPlanWorkbench>
```

## Reglas de negocio conservadas

Los nuevos componentes no modifican:

- `calculatePrice`.
- `LAYOUT_ITEM_CATALOG`.
- `LayoutItem`.
- `ConfiguratorState`.
- Generación de PDF.
- Mensaje de WhatsApp.
- Guardado de leads.

Por eso son seguros como primera fase de refactor visual.

## Pendiente recomendado

1. Integrar `PremiumPlanWorkbench` dentro del paso del plano en `Configurator.tsx`.
2. Mover gradualmente la lógica visual de `LayoutPreview.tsx` hacia componentes más pequeños.
3. Mantener `LayoutPreview.tsx` como vista compartida para PDF/resumen si se usa en más sitios.
4. Ejecutar `npm run build` tras integrar el wrapper.
5. Probar manualmente:
   - añadir extra,
   - mover extra,
   - rotar,
   - duplicar,
   - eliminar,
   - deshacer,
   - rehacer,
   - generar PDF,
   - abrir WhatsApp,
   - guardar lead.

## Criterio visual

La experiencia final debe sentirse como un configurador moderno:

- fácil de usar,
- rápido,
- limpio,
- táctil en móvil/tablet,
- comercialmente confiable,
- técnico sin ser complicado.
