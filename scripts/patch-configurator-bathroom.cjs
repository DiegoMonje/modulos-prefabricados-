const fs = require('node:fs');
const path = require('node:path');

const patchConfigurator = () => {
  const filePath = path.join(process.cwd(), 'src', 'components', 'Configurator.tsx');
  let source = fs.readFileSync(filePath, 'utf8');

  const ensureReplace = (from, to, label) => {
    if (!source.includes(from)) {
      throw new Error(`No se pudo aplicar el parche del baño: bloque no encontrado (${label}).`);
    }
    source = source.replace(from, to);
  };

  if (!source.includes('BATHROOM_INCLUDED_PATCH')) {
    ensureReplace(
      "const isResizableDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom'].includes(item.itemType);\n",
      `const isResizableDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom'].includes(item.itemType);\nconst BATHROOM_INCLUDED_PATCH = true;\n\nconst clampChildToPlan = (item: LayoutItem, x: number, y: number) => ({\n  x: clamp(snap(x), 0, 100 - item.width),\n  y: clamp(snap(y), 0, 100 - item.height),\n});\n\nconst createBathroomIncludedItems = (bathroom: LayoutItem, moduleLength: number, moduleWidth: number): LayoutItem[] => {\n  const meterToXPct = (meters: number) => (meters / Math.max(moduleLength, 0.1)) * 100;\n  const meterToYPct = (meters: number) => (meters / Math.max(moduleWidth, 0.1)) * 100;\n\n  // Medidas reales en planta:\n  // - puerta de baño: 80 cm\n  // - ventana de baño: 40x40 cm, representada como hueco técnico de 40 cm\n  // - sanitarios y ducha: símbolos técnicos movibles, incluidos en el paquete comercial\n  const doorWidth = meterToXPct(0.8);\n  const doorSwingDepth = meterToYPct(0.8);\n  const window40Width = meterToXPct(0.4);\n  const windowMarkerDepth = Math.max(2.2, meterToYPct(0.08));\n  const utilitySize = Math.max(5.5, Math.min(7, meterToXPct(0.28)));\n  const sinkSize = Math.max(7, Math.min(9, meterToXPct(0.45)));\n  const wcWidth = Math.max(7, Math.min(9, meterToXPct(0.45)));\n  const wcHeight = Math.max(8, Math.min(11, meterToYPct(0.65)));\n  const showerWidth = Math.max(10, Math.min(14, meterToXPct(0.9)));\n  const showerHeight = Math.max(12, Math.min(16, meterToYPct(0.9)));\n\n  const baseY = bathroom.y + Math.max(2, bathroom.height * 0.08);\n  const midY = bathroom.y + Math.max(6, bathroom.height * 0.42);\n  const lowY = bathroom.y + Math.max(8, bathroom.height * 0.68);\n\n  const makeChild = (item: Omit<LayoutItem, 'id' | 'parentId' | 'source' | 'included' | 'price' | 'zone'>): LayoutItem => {\n    const draft: LayoutItem = {\n      ...item,\n      id: crypto.randomUUID(),\n      parentId: bathroom.id,\n      source: 'bathroom',\n      included: true,\n      price: 0,\n      zone: 'inside',\n    };\n    return { ...draft, ...clampChildToPlan(draft, draft.x, draft.y) };\n  };\n\n  const children: LayoutItem[] = [\n    makeChild({\n      itemType: 'additional_door',\n      itemLabel: 'Puerta 80 cm incluida baño',\n      x: bathroom.x + Math.max(1.5, bathroom.width * 0.08),\n      y: baseY,\n      width: doorWidth,\n      height: doorSwingDepth,\n      rotation: 0,\n    }),\n    makeChild({\n      itemType: 'window_80x80',\n      itemLabel: 'Ventana 40x40 incluida baño',\n      x: bathroom.x + Math.max(2, bathroom.width - window40Width - 2),\n      y: baseY,\n      width: window40Width,\n      height: windowMarkerDepth,\n      rotation: 0,\n    }),\n    makeChild({\n      itemType: 'base_light_point',\n      itemLabel: 'Punto de luz incluido baño',\n      x: bathroom.x + Math.max(5, bathroom.width * 0.48),\n      y: midY,\n      width: utilitySize,\n      height: utilitySize,\n      rotation: 0,\n    }),\n    makeChild({\n      itemType: 'additional_socket',\n      itemLabel: 'Enchufe incluido baño',\n      x: bathroom.x + Math.max(6, bathroom.width * 0.72),\n      y: lowY,\n      width: utilitySize,\n      height: utilitySize,\n      rotation: 0,\n    }),\n    makeChild({\n      itemType: 'bathroom_sink',\n      itemLabel: 'Lavabo incluido baño',\n      x: bathroom.x + Math.max(4, bathroom.width * 0.70),\n      y: bathroom.y + Math.max(4, bathroom.height * 0.28),\n      width: sinkSize,\n      height: sinkSize,\n      rotation: 0,\n    }),\n    makeChild({\n      itemType: 'bathroom_wc',\n      itemLabel: 'Váter incluido baño',\n      x: bathroom.x + Math.max(4, bathroom.width * 0.70),\n      y: bathroom.y + Math.max(7, bathroom.height * 0.52),\n      width: wcWidth,\n      height: wcHeight,\n      rotation: 0,\n    }),\n  ];\n\n  if (bathroom.hasShowerTray !== false) {\n    children.push(makeChild({\n      itemType: 'bathroom_shower',\n      itemLabel: 'Plato de ducha incluido baño',\n      x: bathroom.x + Math.max(2, bathroom.width * 0.10),\n      y: bathroom.y + Math.max(7, bathroom.height - showerHeight - 2),\n      width: showerWidth,\n      height: showerHeight,\n      rotation: 0,\n    }));\n  }\n\n  return children;\n};\n`,
      'helpers',
    );

    ensureReplace(
      "  if (item.zone === 'edge') {\n",
      `  if (item.parentId || item.source) {\n    return {\n      ...clampChildToPlan(item, proposedX, proposedY),\n      rotation: item.rotation,\n    };\n  }\n\n  if (item.zone === 'edge') {\n`,
      'normalize child items',
    );

    ensureReplace(
      "  base_electrical_panel: 'Cuadro eléctrico incluido',\n};\n",
      "  base_electrical_panel: 'Cuadro eléctrico incluido',\n  bathroom_sink: 'Lavabo incluido baño',\n  bathroom_wc: 'Váter incluido baño',\n  bathroom_shower: 'Plato de ducha incluido baño',\n};\n",
      'toolDescriptions exhaustive bathroom items',
    );

    const addLayoutItemRegex = /  const addLayoutItem = \(itemType: LayoutItemType\) => \{[\s\S]*?  \};\n\n  const changeLayoutItemOrientation/;
    const addLayoutItemReplacement = `  const addLayoutItem = (itemType: LayoutItemType) => {\n    const snapshot = cloneLayout(config.layoutItems);\n    const spec = LAYOUT_ITEM_CATALOG[itemType];\n    const amount = config.layoutItems.filter((item) => item.itemType === itemType).length;\n    const isDivision = ['interior_room', 'full_bathroom', 'wall_partition'].includes(itemType);\n    const rawX = spec.zone === 'edge' ? 12 + amount * 10 : isDivision ? 0 : 16 + amount * 6;\n    const rawY = spec.zone === 'edge' ? 0 : isDivision ? 55 + amount * 6 : 18 + amount * 6;\n\n    const draft: LayoutItem = {\n      id: crypto.randomUUID(),\n      itemType,\n      itemLabel: spec.label,\n      x: rawX,\n      y: rawY,\n      width: spec.width,\n      height: spec.height,\n      rotation: 0,\n      price: spec.price,\n      zone: spec.zone,\n      included: false,\n      layoutOrientation: isDivision ? 'transversal' : undefined,\n    };\n\n    const oriented = isDivision ? applyDivisionOrientation(draft, 'transversal') : draft;\n    const normalized = normalizeItemPosition(oriented, rawX, rawY);\n    const next: LayoutItem = { ...oriented, ...normalized };\n    const includedChildren = itemType === 'full_bathroom' ? createBathroomIncludedItems(next, config.length, config.width) : [];\n    replaceLayoutItems([...config.layoutItems, next, ...includedChildren], { recordHistory: true, snapshot });\n    setSelectedLayoutItemId(next.id);\n  };\n\n  const changeLayoutItemOrientation`;
    if (!addLayoutItemRegex.test(source)) {
      throw new Error('No se pudo aplicar el parche del baño: addLayoutItem no encontrado.');
    }
    source = source.replace(addLayoutItemRegex, addLayoutItemReplacement);

    const removeLayoutItemRegex = /  const removeLayoutItem = \(id: string\) => \{[\s\S]*?  \};\n\n  const rotateLayoutItem/;
    const removeLayoutItemReplacement = `  const removeLayoutItem = (id: string) => {\n    const item = config.layoutItems.find((entry) => entry.id === id);\n    if (!item || item.included) return;\n    const snapshot = cloneLayout(config.layoutItems);\n    replaceLayoutItems(config.layoutItems.filter((entry) => entry.id !== id && entry.parentId !== id), { recordHistory: true, snapshot });\n    setSelectedLayoutItemId(null);\n  };\n\n  const rotateLayoutItem`;
    if (!removeLayoutItemRegex.test(source)) {
      throw new Error('No se pudo aplicar el parche del baño: removeLayoutItem no encontrado.');
    }
    source = source.replace(removeLayoutItemRegex, removeLayoutItemReplacement);

    const duplicateLayoutItemRegex = /  const duplicateLayoutItem = \(id: string\) => \{[\s\S]*?  \};\n\n  const undoLayoutChange/;
    const duplicateLayoutItemReplacement = `  const duplicateLayoutItem = (id: string) => {\n    const item = config.layoutItems.find((entry) => entry.id === id);\n    if (!item || item.included) return;\n    const snapshot = cloneLayout(config.layoutItems);\n    const copyDraft = { ...item, id: crypto.randomUUID(), included: false, parentId: undefined, source: undefined };\n    const normalized = normalizeItemPosition(copyDraft, item.x + 6, item.y + 6);\n    const copy = { ...copyDraft, ...normalized };\n    const deltaX = copy.x - item.x;\n    const deltaY = copy.y - item.y;\n    const childCopies = config.layoutItems\n      .filter((entry) => entry.parentId === item.id)\n      .map((child) => {\n        const childDraft: LayoutItem = { ...child, id: crypto.randomUUID(), parentId: copy.id, included: true, source: 'bathroom', price: 0 };\n        return { ...childDraft, ...clampChildToPlan(childDraft, child.x + deltaX, child.y + deltaY) };\n      });\n    const generatedChildren = item.itemType === 'full_bathroom' && childCopies.length === 0 ? createBathroomIncludedItems(copy, config.length, config.width) : childCopies;\n    replaceLayoutItems([...config.layoutItems, copy, ...generatedChildren], { recordHistory: true, snapshot });\n    setSelectedLayoutItemId(copy.id);\n  };\n\n  const undoLayoutChange`;
    if (!duplicateLayoutItemRegex.test(source)) {
      throw new Error('No se pudo aplicar el parche del baño: duplicateLayoutItem no encontrado.');
    }
    source = source.replace(duplicateLayoutItemRegex, duplicateLayoutItemReplacement);

    const dragReplaceFrom = `      setConfig((prev) => ({\n        ...prev,\n        layoutItems: prev.layoutItems.map((item) => {\n          if (item.id !== dragging.id) return item;\n          const proposedX = ((event.clientX - rect.left - dragging.offsetX) / rect.width) * 100;\n          const proposedY = ((event.clientY - rect.top - dragging.offsetY) / rect.height) * 100;\n          const normalized = normalizeItemPosition(item, proposedX, proposedY);\n          return { ...item, ...normalized };\n        }),\n      }));`;
    const dragReplaceTo = `      setConfig((prev) => {\n        const draggedItem = prev.layoutItems.find((item) => item.id === dragging.id);\n        if (!draggedItem) return prev;\n        const proposedX = ((event.clientX - rect.left - dragging.offsetX) / rect.width) * 100;\n        const proposedY = ((event.clientY - rect.top - dragging.offsetY) / rect.height) * 100;\n        const normalized = normalizeItemPosition(draggedItem, proposedX, proposedY);\n        const deltaX = normalized.x - draggedItem.x;\n        const deltaY = normalized.y - draggedItem.y;\n\n        return {\n          ...prev,\n          layoutItems: prev.layoutItems.map((item) => {\n            if (item.id === dragging.id) return { ...item, ...normalized };\n            if (item.parentId === dragging.id) {\n              return { ...item, ...clampChildToPlan(item, item.x + deltaX, item.y + deltaY) };\n            }\n            return item;\n          }),\n        };\n      });`;
    ensureReplace(dragReplaceFrom, dragReplaceTo, 'drag parent with children');
  }

  fs.writeFileSync(filePath, source);
};

const patchLayoutPreview = () => {
  const filePath = path.join(process.cwd(), 'src', 'components', 'LayoutPreview.tsx');
  let source = fs.readFileSync(filePath, 'utf8');

  const ensureReplace = (from, to, label) => {
    if (!source.includes(from)) {
      throw new Error(`No se pudo aplicar el parche visual del baño: bloque no encontrado (${label}).`);
    }
    source = source.replace(from, to);
  };

  if (!source.includes('BATHROOM_40_WINDOW_PATCH')) {
    ensureReplace(
      "const isWindow = (item: LayoutItem) => isWindow80(item) || item.itemType === 'large_window';\n",
      "const isWindow = (item: LayoutItem) => isWindow80(item) || item.itemType === 'large_window';\nconst isBathroomWindow40 = (item: LayoutItem) => item.source === 'bathroom' && item.itemType === 'window_80x80';\nconst BATHROOM_40_WINDOW_PATCH = true;\n",
      'bathroom window helper',
    );

    ensureReplace(
      "  if (type === 'full_bathroom') return 'Baño';\n",
      "  if (type === 'full_bathroom') return 'Baño';\n  if (type === 'bathroom_sink') return 'Lavabo';\n  if (type === 'bathroom_wc') return 'Váter';\n  if (type === 'bathroom_shower') return 'Ducha';\n",
      'labels bathroom sanitary items',
    );

    ensureReplace(
      "  if (isWindow80(item)) return '0,80 x 0,80 m';\n",
      "  if (isBathroomWindow40(item)) return '0,40 x 0,40 m';\n  if (isWindow80(item)) return '0,80 x 0,80 m';\n",
      'real size label 40x40',
    );

    ensureReplace(
      "  const label = labelFor(item.itemType);\n",
      "  const label = item.itemLabel || labelFor(item.itemType);\n",
      'use item label',
    );

    ensureReplace(
      "  if (item.itemType === 'base_electrical_panel') return <ElectricalPanel color={color} />;\n",
      `  if (item.itemType === 'base_electrical_panel') return <ElectricalPanel color={color} />;\n\n  if (item.itemType === 'bathroom_sink') {\n    return (\n      <svg viewBox=\"0 0 80 80\" className=\"h-full w-full overflow-visible\">\n        <rect x=\"16\" y=\"12\" width=\"48\" height=\"18\" fill=\"none\" stroke={color} strokeWidth=\"4\" rx=\"5\" />\n        <ellipse cx=\"40\" cy=\"46\" rx=\"24\" ry=\"20\" fill=\"none\" stroke={color} strokeWidth=\"4\" />\n        <circle cx=\"40\" cy=\"24\" r=\"3\" fill={color} />\n        <line x1=\"40\" y1=\"30\" x2=\"40\" y2=\"38\" stroke={color} strokeWidth=\"3\" />\n      </svg>\n    );\n  }\n\n  if (item.itemType === 'bathroom_wc') {\n    return (\n      <svg viewBox=\"0 0 80 90\" className=\"h-full w-full overflow-visible\">\n        <rect x=\"18\" y=\"6\" width=\"44\" height=\"18\" fill=\"none\" stroke={color} strokeWidth=\"4\" rx=\"4\" />\n        <path d=\"M 22 26 C 22 56, 32 78, 40 78 C 48 78, 58 56, 58 26 Z\" fill=\"none\" stroke={color} strokeWidth=\"4\" />\n        <ellipse cx=\"40\" cy=\"49\" rx=\"13\" ry=\"18\" fill=\"none\" stroke={color} strokeWidth=\"3\" />\n      </svg>\n    );\n  }\n\n  if (item.itemType === 'bathroom_shower') {\n    return (\n      <svg viewBox=\"0 0 100 100\" className=\"h-full w-full overflow-visible\">\n        <rect x=\"8\" y=\"8\" width=\"84\" height=\"84\" fill=\"none\" stroke={color} strokeWidth=\"4\" rx=\"4\" />\n        <path d=\"M 12 88 C 42 58, 58 42, 88 12\" fill=\"none\" stroke={color} strokeWidth=\"3\" />\n        <circle cx=\"68\" cy=\"32\" r=\"4\" fill={color} />\n        <line x1=\"25\" y1=\"25\" x2=\"37\" y2=\"25\" stroke={color} strokeWidth=\"3\" />\n        <line x1=\"25\" y1=\"31\" x2=\"35\" y2=\"31\" stroke={color} strokeWidth=\"3\" />\n      </svg>\n    );\n  }\n`,
      'sanitary symbols',
    );

    ensureReplace(
      "  const scaleLabel = isDoor(item) ? '80 cm' : isWindow80(item) ? '80 x 80 cm' : item.itemType === 'large_window' ? '120 cm' : undefined;\n",
      "  const scaleLabel = isDoor(item) ? '80 cm' : isBathroomWindow40(item) ? '40 x 40 cm' : isWindow80(item) ? '80 x 80 cm' : item.itemType === 'large_window' ? '120 cm' : undefined;\n",
      'visible scale label 40x40',
    );
  }

  fs.writeFileSync(filePath, source);
};

patchConfigurator();
patchLayoutPreview();
console.log('Bathroom CAD patch applied.');
