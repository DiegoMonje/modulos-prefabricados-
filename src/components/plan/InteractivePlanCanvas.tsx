import type { ComponentProps } from 'react';
import { LayoutItem, LayoutItemType } from '../../types';
import { LayoutPreview } from '../LayoutPreview';
import { PremiumPlanWorkbench } from './PremiumPlanWorkbench';

type LayoutPreviewProps = ComponentProps<typeof LayoutPreview>;

type InteractivePlanCanvasProps = LayoutPreviewProps & {
  selectedItem: LayoutItem | null;
  workbenchZoom: number;
  onAddItem: (type: LayoutItemType) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRotate?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRemove?: (id: string) => void;
  onChangeOrientation?: (id: string, orientation: 'transversal' | 'longitudinal') => void;
  disabledTools?: boolean;
};

export const InteractivePlanCanvas = ({
  selectedItem,
  workbenchZoom,
  onAddItem,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRotate,
  onDuplicate,
  onRemove,
  onChangeOrientation,
  disabledTools,
  ...layoutPreviewProps
}: InteractivePlanCanvasProps) => (
  <PremiumPlanWorkbench
    selectedItem={selectedItem}
    zoom={workbenchZoom}
    onAddItem={onAddItem}
    onZoomIn={onZoomIn}
    onZoomOut={onZoomOut}
    onResetZoom={onResetZoom}
    onRotate={onRotate}
    onDuplicate={onDuplicate}
    onRemove={onRemove}
    onChangeOrientation={onChangeOrientation}
    disabledTools={disabledTools}
  >
    <LayoutPreview {...layoutPreviewProps} />
  </PremiumPlanWorkbench>
);
