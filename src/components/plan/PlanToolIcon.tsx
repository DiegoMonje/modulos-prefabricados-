import { Bath, DoorOpen, Grid2X2, PlugZap, Snowflake, SquareSplitHorizontal, SunMedium, ToggleLeft, Wind } from 'lucide-react';
import type { PlanToolDefinition } from './planUtils';

const iconClassName = 'h-4 w-4';

export const PlanToolIcon = ({ icon }: { icon: PlanToolDefinition['icon'] }) => {
  if (icon === 'door') return <DoorOpen className={iconClassName} />;
  if (icon === 'window') return <Grid2X2 className={iconClassName} />;
  if (icon === 'socket') return <PlugZap className={iconClassName} />;
  if (icon === 'light') return <SunMedium className={iconClassName} />;
  if (icon === 'panel') return <ToggleLeft className={iconClassName} />;
  if (icon === 'wall') return <SquareSplitHorizontal className={iconClassName} />;
  if (icon === 'room') return <Wind className={iconClassName} />;
  if (icon === 'bath') return <Bath className={iconClassName} />;
  return <Snowflake className={iconClassName} />;
};
