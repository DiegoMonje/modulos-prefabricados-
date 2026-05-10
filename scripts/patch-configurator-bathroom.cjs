const fs = require('node:fs');
const path = require('node:path');

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
    `const isResizableDivision = (item: LayoutItem) => ['interior_room', 'full_bathroom'].includes(item.itemType);\nconst BATHROOM_INCLUDED_PATCH = true;\n\nconst clampChildToPlan = (item: LayoutItem, x: number, y: number) => ({\n  x: clamp(snap(x), 0, 100 - item.width),\n  y: clamp(snap(y), 0, 100 - item.height),\n});\n\nconst createBathroomIncludedItems = (bathroom: LayoutItem): LayoutItem[] => {\n  const baseY = bathroom.y + Math.max(2, bathroom.height * 0.08);\n  const midY = bathroom.y + Math.max(6, bathroom.height * 0.42);\n  const lowY = bathroom.y + Math.max(8, bathroom.height * 0.68);\n  const doorWidth = 12;\n  const windowWidth = 13;\n  const utilitySize = 7;\n\n  const makeChild = (item: Omit<LayoutItem, 'id' | 'parentId' | 'source' | 'included' | 'price' | 'zone'>): LayoutItem => {\n    const draft: LayoutItem = {\n      ...item,\n      id: crypto.randomUUID(),\n      parentId: bathroom.id,\n      source: 'bathroom',\n      included: true,\n      price: 0,\n      zone: 'inside',\n    };\n    return { ...draft, ...clampChildToPlan(draft, draft.x, draft.y) };\n  };\n\n  return [\n    makeChild({\n      itemType: 'additional_door',\n      itemLabel: 'Puerta incluida baño',\n      x: bathroom.x + Math.max(4, bathroom.width * 0.12),\n      y: baseY,\n      width: doorWidth,\n      height: 7,\n      rotation: 0,\n    }),\n    makeChild({\n      itemType: 'window_80x80',\n      itemLabel: 'Ventana 80x80 incluida baño',\n      x: bathroom.x + Math.max(18, bathroom.width * 0.60),\n      y: baseY,\n      width: windowWidth,\n      height: 5,\n      rotation: 0,\n    }),\n    makeChild({\n      itemType: 'base_light_point',\n      itemLabel: 'Punto de luz incluido baño',\n      x: bathroom.x + Math.max(12, bathroom.width * 0.48),\n      y: midY,\n      width: utilitySize,\n      height: utilitySize,\n      rotation: 0,\n    }),\n    makeChild({\n      itemType: 'additional_socket',\n      itemLabel: 'Enchufe incluido baño',\n      x: bathroom.x + Math.max(22, bathroom.width * 0.74),\n      y: lowY,\n      width: utilitySize,\n      height: utilitySize,\n      rotation: 0,\n    }),\n  ];\n};\n`,
    'helpers',
  );

  ensureReplace(
    "  if (item.zone === 'edge') {\n",
    `  if (item.parentId || item.source) {\n    return {\n      ...clampChildToPlan(item, proposedX, proposedY),\n      rotation: item.rotation,\n    };\n  }\n\n  if (item.zone === 'edge') {\n`,
    'normalize child items',
  );

  const addLayoutItemRegex = /  const addLayoutItem = \(itemType: LayoutItemType\) => \{[\s\S]*?  \};\n\n  const changeLayoutItemOrientation/;
  const addLayoutItemReplacement = `  const addLayoutItem = (itemType: LayoutItemType) => {\n    const snapshot = cloneLayout(config.layoutItems);\n    const spec = LAYOUT_ITEM_CATALOG[itemType];\n    const amount = config.layoutItems.filter((item) => item.itemType === itemType).length;\n    const isDivision = ['interior_room', 'full_bathroom', 'wall_partition'].includes(itemType);\n    const rawX = spec.zone === 'edge' ? 12 + amount * 10 : isDivision ? 0 : 16 + amount * 6;\n    const rawY = spec.zone === 'edge' ? 0 : isDivision ? 55 + amount * 6 : 18 + amount * 6;\n\n    const draft: LayoutItem = {\n      id: crypto.randomUUID(),\n      itemType,\n      itemLabel: spec.label,\n      x: rawX,\n      y: rawY,\n      width: spec.width,\n      height: spec.height,\n      rotation: 0,\n      price: spec.price,\n      zone: spec.zone,\n      included: false,\n      layoutOrientation: isDivision ? 'transversal' : undefined,\n    };\n\n    const oriented = isDivision ? applyDivisionOrientation(draft, 'transversal') : draft;\n    const normalized = normalizeItemPosition(oriented, rawX, rawY);\n    const next: LayoutItem = { ...oriented, ...normalized };\n    const includedChildren = itemType === 'full_bathroom' ? createBathroomIncludedItems(next) : [];\n    replaceLayoutItems([...config.layoutItems, next, ...includedChildren], { recordHistory: true, snapshot });\n    setSelectedLayoutItemId(next.id);\n  };\n\n  const changeLayoutItemOrientation`;
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
  const duplicateLayoutItemReplacement = `  const duplicateLayoutItem = (id: string) => {\n    const item = config.layoutItems.find((entry) => entry.id === id);\n    if (!item || item.included) return;\n    const snapshot = cloneLayout(config.layoutItems);\n    const copyDraft = { ...item, id: crypto.randomUUID(), included: false, parentId: undefined, source: undefined };\n    const normalized = normalizeItemPosition(copyDraft, item.x + 6, item.y + 6);\n    const copy = { ...copyDraft, ...normalized };\n    const deltaX = copy.x - item.x;\n    const deltaY = copy.y - item.y;\n    const childCopies = config.layoutItems\n      .filter((entry) => entry.parentId === item.id)\n      .map((child) => {\n        const childDraft: LayoutItem = { ...child, id: crypto.randomUUID(), parentId: copy.id, included: true, source: 'bathroom', price: 0 };\n        return { ...childDraft, ...clampChildToPlan(childDraft, child.x + deltaX, child.y + deltaY) };\n      });\n    const generatedChildren = item.itemType === 'full_bathroom' && childCopies.length === 0 ? createBathroomIncludedItems(copy) : childCopies;\n    replaceLayoutItems([...config.layoutItems, copy, ...generatedChildren], { recordHistory: true, snapshot });\n    setSelectedLayoutItemId(copy.id);\n  };\n\n  const undoLayoutChange`;
  if (!duplicateLayoutItemRegex.test(source)) {
    throw new Error('No se pudo aplicar el parche del baño: duplicateLayoutItem no encontrado.');
  }
  source = source.replace(duplicateLayoutItemRegex, duplicateLayoutItemReplacement);

  const dragReplaceFrom = `      setConfig((prev) => ({\n        ...prev,\n        layoutItems: prev.layoutItems.map((item) => {\n          if (item.id !== dragging.id) return item;\n          const proposedX = ((event.clientX - rect.left - dragging.offsetX) / rect.width) * 100;\n          const proposedY = ((event.clientY - rect.top - dragging.offsetY) / rect.height) * 100;\n          const normalized = normalizeItemPosition(item, proposedX, proposedY);\n          return { ...item, ...normalized };\n        }),\n      }));`;
  const dragReplaceTo = `      setConfig((prev) => {\n        const draggedItem = prev.layoutItems.find((item) => item.id === dragging.id);\n        if (!draggedItem) return prev;\n        const proposedX = ((event.clientX - rect.left - dragging.offsetX) / rect.width) * 100;\n        const proposedY = ((event.clientY - rect.top - dragging.offsetY) / rect.height) * 100;\n        const normalized = normalizeItemPosition(draggedItem, proposedX, proposedY);\n        const deltaX = normalized.x - draggedItem.x;\n        const deltaY = normalized.y - draggedItem.y;\n\n        return {\n          ...prev,\n          layoutItems: prev.layoutItems.map((item) => {\n            if (item.id === dragging.id) return { ...item, ...normalized };\n            if (item.parentId === dragging.id) {\n              return { ...item, ...clampChildToPlan(item, item.x + deltaX, item.y + deltaY) };\n            }\n            return item;\n          }),\n        };\n      });`;
  ensureReplace(dragReplaceFrom, dragReplaceTo, 'drag parent with children');
}

fs.writeFileSync(filePath, source);
console.log('Bathroom CAD patch applied.');
