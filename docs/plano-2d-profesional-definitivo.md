# Rediseño definitivo del plano 2D profesional

## Contexto

La web de Módulos Prefabricados San José S.L. tiene un configurador de casetas/módulos prefabricados con un plano 2D orientativo. El plano actual funciona, pero la edición visual no debe seguir resolviéndose con parches sobre el DOM ni iconos superpuestos.

El objetivo es sustituir o refactorizar el editor actual por una herramienta profesional, moderna y limpia, parecida en calidad visual a un plano técnico tipo AutoCAD, pero sin la complejidad de AutoCAD.

El cliente solo debe poder:

- añadir elementos,
- quitar elementos permitidos,
- mover elementos,
- seleccionar elementos,
- rotar cuando tenga sentido,
- cambiar orientación de habitación/baño/tabique,
- activar/desactivar opciones simples como el plato de ducha.

No debe haber herramientas complejas de dibujo técnico.

## Objetivo principal

Crear un plano 2D profesional, robusto, limpio y fácil de usar, con bloques inteligentes para habitación y baño.

El plano debe transmitir calidad, confianza y profesionalidad. No se aceptan soluciones mediante manipulación del DOM renderizado, overlays externos o iconos pegados encima después de pintar el plano.

## Stack recomendado

El proyecto está en React + Vite + TypeScript + Tailwind.

Para el nuevo plano se puede usar una librería profesional si mejora la calidad y mantenibilidad:

- Opción recomendada: `react-konva` + `konva`.
- Alternativa aceptable: `fabric.js`.
- Alternativa si se prefiere no añadir dependencia: SVG puro con componentes React bien estructurados.

La prioridad es que sea estable, fácil de mantener y visualmente profesional.

## Requisitos de negocio

### Precios correctos

- Tabique simple: **300 €**.
  - Incluye 3 paneles + mano de obra.
- Habitación interior: **700 €**.
  - Incluye puerta + ventana 80x80 + punto de luz + enchufe.
- Baño completo con plato de ducha: **1.500 €**.
  - Incluye puerta + ventana 40x40 + punto de luz + enchufe interior + enchufe exterior para termo + lavabo + váter + plato de ducha.
- Baño completo sin plato de ducha: **1.400 €**.
  - Si el cliente elimina el plato de ducha, se descuenta **100 €**.

## Elementos del plano

### Elementos simples

- Puerta incluida.
- Puerta adicional.
- Ventana 80x80 incluida.
- Ventana 80x80 extra.
- Ventana grande.
- Enchufe incluido.
- Enchufe adicional.
- Punto de luz incluido.
- Cuadro eléctrico.
- Aire acondicionado.
- Tabique simple.

### Bloque inteligente: Habitación interior

La habitación no debe ser un rectángulo vacío. Debe ser un bloque inteligente que contiene gráficamente:

- puerta,
- ventana 80x80,
- punto de luz,
- enchufe.

Estos elementos deben dibujarse dentro del bloque de la habitación y moverse con ella.

Comportamiento esperado:

- La habitación se puede seleccionar.
- Se puede mover.
- Se puede cambiar orientación: transversal / longitudinal.
- Se puede eliminar.
- Se puede duplicar si la lógica de negocio lo permite.
- Sus elementos internos son visibles siempre o, como mínimo, claramente visibles al seleccionar la habitación.
- Los elementos internos forman parte del bloque, no se deben crear como elementos sueltos en `layoutItems` salvo que se decida modelarlos explícitamente como hijos.

Precio:

- Siempre debe mostrar **+700 €**.

Texto de ayuda:

- “Incluye puerta, ventana 80x80, punto de luz y enchufe.”

### Bloque inteligente: Baño completo

El baño no debe ser un rectángulo vacío. Debe ser un bloque inteligente que contiene gráficamente:

- puerta,
- ventana 40x40,
- punto de luz,
- enchufe interior,
- enchufe exterior para termo eléctrico,
- lavabo,
- váter,
- plato de ducha.

Comportamiento esperado:

- El baño se puede seleccionar.
- Se puede mover.
- Se puede cambiar orientación: transversal / longitudinal.
- Se puede eliminar.
- El plato de ducha se puede activar/desactivar desde el panel de propiedades del baño.
- Si el plato de ducha está activo, el baño cuesta **1.500 €**.
- Si el plato de ducha está desactivado, el baño cuesta **1.400 €**.
- Al desactivar el plato, el dibujo debe ocultar o marcar como eliminado el plato de ducha.
- La información debe reflejarse en precio, resumen, PDF y WhatsApp.

Texto de ayuda:

- “Incluye puerta, ventana 40x40, punto de luz, enchufe interior, enchufe exterior para termo, lavabo, váter y plato de ducha opcional.”

## Modelo de datos recomendado

Mantener compatibilidad con el tipo `LayoutItem`, pero ampliar bien el modelo.

Actualmente existe:

```ts
export interface LayoutItem {
  id: string;
  itemType: LayoutItemType;
  itemLabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  price: number;
  zone: 'edge' | 'inside';
  included?: boolean;
  layoutOrientation?: 'transversal' | 'longitudinal';
  roomWidthMeters?: number;
  showerTrayWidthMeters?: 0.9 | 1 | null;
  hasShowerTray?: boolean;
  includedFeatures?: string[];
}
```

Para habitación y baño, usar:

```ts
{
  itemType: 'interior_room',
  price: 700,
  includedFeatures: ['door', 'window_80x80', 'light_point', 'socket']
}
```

```ts
{
  itemType: 'full_bathroom',
  price: 1500,
  hasShowerTray: true,
  includedFeatures: [
    'door',
    'window_40x40',
    'light_point',
    'inside_socket',
    'water_heater_socket',
    'sink',
    'toilet',
    'shower_tray'
  ]
}
```

Si `hasShowerTray` pasa a `false`, el cálculo debe descontar 100 €.

## Arquitectura recomendada

Crear una carpeta nueva o refactorizar la existente:

```text
src/components/plan-editor/
  PlanEditor.tsx
  PlanCanvas.tsx
  PlanToolbar.tsx
  PlanPropertiesPanel.tsx
  PlanElement.tsx
  SmartRoomBlock.tsx
  SmartBathroomBlock.tsx
  WallPartitionElement.tsx
  OpeningElement.tsx
  ElectricalElement.tsx
  planGeometry.ts
  planDrawing.ts
  planTypes.ts
```

### `PlanEditor.tsx`

Componente principal del editor.

Recibe:

```ts
items: LayoutItem[]
length: number
width: number
selectedItemId?: string
onItemsChange(items: LayoutItem[]): void
```

Debe gestionar:

- selección,
- drag,
- snap,
- zoom,
- historial,
- duplicar,
- eliminar,
- rotar,
- orientación,
- activar/desactivar plato de ducha.

### `SmartRoomBlock.tsx`

Dibuja la habitación con sus elementos internos:

- contorno de la estancia,
- puerta,
- ventana 80x80,
- punto de luz,
- enchufe,
- etiqueta “Habitación”,
- precio +700 €.

La posición de puerta/ventana/luz/enchufe debe ser coherente y proporcional al tamaño del bloque.

### `SmartBathroomBlock.tsx`

Dibuja el baño con sus elementos internos:

- contorno,
- puerta,
- ventana 40x40,
- punto de luz,
- enchufe interior,
- enchufe exterior termo,
- lavabo,
- váter,
- plato de ducha si `hasShowerTray !== false`,
- etiqueta “Baño”,
- precio +1500 € o +1400 € según corresponda.

### `PlanPropertiesPanel.tsx`

Cuando se selecciona una habitación, debe mostrar:

- nombre: Habitación interior,
- precio: 700 €,
- orientación,
- elementos incluidos:
  - puerta,
  - ventana 80x80,
  - punto de luz,
  - enchufe,
- botones:
  - rotar/cambiar orientación,
  - duplicar,
  - eliminar.

Cuando se selecciona baño, debe mostrar:

- nombre: Baño completo,
- precio: 1500 € o 1400 €,
- orientación,
- elementos incluidos:
  - puerta,
  - ventana 40x40,
  - punto de luz,
  - enchufe interior,
  - enchufe exterior para termo,
  - lavabo,
  - váter,
  - plato de ducha,
- switch o botón:
  - “Plato de ducha incluido” / “Sin plato de ducha (-100 €)”.

## Interacción esperada

### Drag and drop

- Mover elementos dentro del módulo.
- Snap a una rejilla suave.
- No permitir que elementos se salgan del módulo.
- No permitir que habitaciones/baños se salgan del módulo.

### Zoom

- Zoom +.
- Zoom -.
- Centrar vista.
- Debe funcionar bien con drag.

### Selección

- Elemento seleccionado con borde claro.
- Panel de propiedades actualizado.
- No mostrar overlays duplicados.

### Historial

- Deshacer.
- Rehacer.

Debe funcionar para:

- añadir,
- mover,
- eliminar,
- duplicar,
- rotar,
- cambiar orientación,
- activar/desactivar plato de ducha.

## Requisitos visuales

El plano debe tener:

- fondo tipo CAD moderno,
- rejilla limpia,
- cotas visibles,
- escala real,
- bordes de módulo claros,
- bloques con contraste suficiente,
- elementos internos dibujados de forma proporcionada,
- etiquetas claras,
- sin exceso de iconos ni ruido visual.

El cliente debe sentir que está usando una herramienta profesional, no un dibujo improvisado.

## Requisitos de integración

No romper:

- cálculo de precios,
- resumen lateral,
- PDF,
- WhatsApp,
- Supabase/leads,
- navegación por pasos del configurador.

Hay que revisar:

- `src/components/Configurator.tsx`,
- `src/components/LayoutPreview.tsx`,
- `src/utils/pricing.ts`,
- `src/types/index.ts`,
- `src/utils/pdf.ts`,
- cualquier función que cree elementos `layoutItems`.

## Cambios obligatorios en precios

Verificar que el catálogo tenga:

```ts
wall_partition: { label: 'Tabique simple', price: 300, ... }
interior_room: { label: 'Habitación interior', price: 700, ... }
full_bathroom: { label: 'Baño completo', price: 1500, ... }
```

Y que el precio real del baño use:

```ts
if (item.itemType === 'full_bathroom' && item.hasShowerTray === false) {
  return item.price - 100;
}
```

## PDF y WhatsApp

El PDF y WhatsApp deben indicar:

- Habitación interior: incluye puerta, ventana 80x80, punto de luz y enchufe.
- Baño completo: incluye puerta, ventana 40x40, punto de luz, enchufe interior, enchufe exterior para termo, lavabo, váter y plato de ducha.
- Si el baño va sin plato de ducha, mostrar: “Baño completo sin plato de ducha (-100 €)”.

## Criterio de aceptación

La implementación se considera correcta si:

1. La barra lateral muestra:
   - Tabique simple +300 €.
   - Habitación interior +700 €.
   - Baño completo +1.500 €.
2. La habitación se ve con puerta, ventana 80x80, luz y enchufe dentro del bloque.
3. El baño se ve con puerta, ventana 40x40, luz, enchufes, lavabo, váter y plato de ducha dentro del bloque.
4. El plato de ducha puede quitarse desde el panel de propiedades.
5. Al quitar el plato, el precio baja 100 €.
6. No aparecen elementos duplicados ni overlays flotantes extraños.
7. El plano sigue siendo claro, profesional y fácil de usar.
8. `npm run build` pasa sin errores.
9. El PDF se genera correctamente.
10. WhatsApp envía la configuración correcta.

## Importante

No usar más parches tipo `MutationObserver`, `innerHTML` sobre DOM ya renderizado, ni correcciones visuales fuera del flujo React.

Todo debe estar implementado como componentes React reales o mediante una librería profesional de canvas/SVG.
