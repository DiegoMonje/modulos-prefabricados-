import { useEffect } from 'react';

const TEXT_REPLACEMENTS: Array<[string, string]> = [
  ['Añadir tabique interior · sin coste automático', 'Añadir tabique simple · +300 €'],
  ['Añadir habitación interior · +300 €', 'Añadir habitación interior · +700 €'],
  ['Tabique interior', 'Tabique simple'],
];

const FEATURE_PANEL_ID = 'runtime-plan-feature-panel';
const ROOM_FEATURES_ID = 'runtime-room-feature-icons';
const BATHROOM_FEATURES_ID = 'runtime-bathroom-feature-icons';

const replaceVisibleTexts = (root: ParentNode = document) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  nodes.forEach((node) => {
    const value = node.nodeValue || '';
    const next = TEXT_REPLACEMENTS.reduce((text, [search, replacement]) => text.replaceAll(search, replacement), value);
    if (next !== value) node.nodeValue = next;
  });
};

const findElementContaining = (text: string) => {
  const elements = Array.from(document.querySelectorAll('div, section, aside, article, p, span, h1, h2, h3, strong')) as HTMLElement[];
  return elements.find((element) => element.textContent?.includes(text));
};

const createFeaturePanel = (type: 'room' | 'bathroom') => {
  const panel = document.createElement('div');
  panel.id = FEATURE_PANEL_ID;
  panel.style.marginTop = '12px';
  panel.style.padding = '12px';
  panel.style.borderRadius = '16px';
  panel.style.border = type === 'room' ? '1px solid rgba(251,146,60,.35)' : '1px solid rgba(45,212,191,.35)';
  panel.style.background = type === 'room' ? 'rgba(255,247,237,.95)' : 'rgba(240,253,250,.95)';
  panel.style.color = '#0f172a';
  panel.style.fontSize = '13px';
  panel.style.lineHeight = '1.55';
  panel.style.boxShadow = '0 8px 18px rgba(15,23,42,.08)';

  if (type === 'room') {
    panel.innerHTML = `
      <strong style="display:block;margin-bottom:6px;color:#9a3412;">Incluido en la habitación</strong>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-weight:700;">
        <span>🚪 Puerta</span>
        <span>🪟 Ventana 80x80</span>
        <span>💡 Punto de luz</span>
        <span>🔌 Enchufe</span>
      </div>
    `;
  } else {
    panel.innerHTML = `
      <strong style="display:block;margin-bottom:6px;color:#0f766e;">Incluido en el baño</strong>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-weight:700;">
        <span>🚪 Puerta</span>
        <span>🪟 Ventana 40x40</span>
        <span>💡 Punto de luz</span>
        <span>🔌 Enchufe interior</span>
        <span>⚡ Enchufe exterior termo</span>
        <span>🚽 Váter</span>
        <span>🚰 Lavabo</span>
        <span>🚿 Plato de ducha opcional</span>
      </div>
      <p style="margin-top:8px;font-size:12px;color:#334155;font-weight:700;">Si el cliente no quiere plato de ducha, se descuentan 100 €.</p>
    `;
  }

  return panel;
};

const enhanceSelectedElementPanel = () => {
  document.getElementById(FEATURE_PANEL_ID)?.remove();

  const selectedPanel = findElementContaining('PROPIEDADES DEL ELEMENTO') || findElementContaining('Elemento seleccionado');
  if (!selectedPanel) return;

  const selectedText = selectedPanel.textContent || '';
  const isRoomSelected = selectedText.includes('Habitación') || selectedText.includes('HABITACIÓN');
  const isBathroomSelected = selectedText.includes('Baño') || selectedText.includes('BAÑO');

  if (!isRoomSelected && !isBathroomSelected) return;

  selectedPanel.appendChild(createFeaturePanel(isRoomSelected ? 'room' : 'bathroom'));
};

const createRoomIcons = () => {
  const layer = document.createElement('div');
  layer.id = ROOM_FEATURES_ID;
  layer.style.position = 'absolute';
  layer.style.left = '8%';
  layer.style.right = '8%';
  layer.style.bottom = '12%';
  layer.style.display = 'grid';
  layer.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
  layer.style.gap = '4px';
  layer.style.pointerEvents = 'none';
  layer.style.zIndex = '5';
  layer.innerHTML = ['🚪', '🪟', '💡', '🔌'].map((icon) => `<span style="display:flex;align-items:center;justify-content:center;height:24px;border-radius:999px;background:rgba(15,23,42,.78);border:1px solid rgba(251,146,60,.55);font-size:13px;box-shadow:0 4px 10px rgba(0,0,0,.25);">${icon}</span>`).join('');
  return layer;
};

const createBathroomIcons = () => {
  const layer = document.createElement('div');
  layer.id = BATHROOM_FEATURES_ID;
  layer.style.position = 'absolute';
  layer.style.left = '9%';
  layer.style.right = '9%';
  layer.style.bottom = '12%';
  layer.style.display = 'grid';
  layer.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
  layer.style.gap = '4px';
  layer.style.pointerEvents = 'none';
  layer.style.zIndex = '5';
  layer.innerHTML = ['🚪', '🪟', '💡', '🔌', '🚰', '🚽', '🚿'].map((icon) => `<span style="display:flex;align-items:center;justify-content:center;height:22px;border-radius:999px;background:rgba(15,23,42,.78);border:1px solid rgba(45,212,191,.55);font-size:12px;box-shadow:0 4px 10px rgba(0,0,0,.25);">${icon}</span>`).join('');
  return layer;
};

const enhancePlanBlocks = () => {
  const elements = Array.from(document.querySelectorAll('div')) as HTMLElement[];

  elements.forEach((element) => {
    const text = element.textContent || '';
    const rect = element.getBoundingClientRect();
    const looksLikePlanBlock = rect.width > 80 && rect.height > 60;

    if (!looksLikePlanBlock) return;

    if (text.includes('HABITACIÓN') && !element.querySelector(`#${ROOM_FEATURES_ID}`)) {
      if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
      element.appendChild(createRoomIcons());
    }

    if (text.includes('BAÑO') && !element.querySelector(`#${BATHROOM_FEATURES_ID}`)) {
      if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
      element.appendChild(createBathroomIcons());
    }
  });
};

const applyRuntimeFixes = () => {
  replaceVisibleTexts();
  enhanceSelectedElementPanel();
  enhancePlanBlocks();
};

export const ConfiguratorRuntimeFixes = () => {
  useEffect(() => {
    applyRuntimeFixes();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(applyRuntimeFixes);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
};
