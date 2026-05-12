import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const tierStyles: Record<string, string> = {
  Bronze: 'bg-gradient-to-b from-amber-700 to-amber-900 text-amber-50 border-amber-800',
  Prata:  'bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 border-slate-400',
  Ouro:   'bg-gradient-to-b from-yellow-300 to-yellow-500 text-yellow-900 border-yellow-500',
};

const lockSize: Record<'xs' | 'sm' | 'md', string> = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
};

export function TierBadge({
  name,
  size = 'sm',
  locked = false,
  className,
}: {
  name: string;
  size?: 'xs' | 'sm' | 'md';
  locked?: boolean;
  className?: string;
}) {
  const sizeClass =
    size === 'xs' ? 'text-[10px] px-1.5 py-0.5' :
    size === 'md' ? 'text-sm px-3 py-1' :
                    'text-xs px-2 py-0.5';
  const style = tierStyles[name] ?? 'bg-secondary text-foreground border-border';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide',
        sizeClass,
        style,
        className,
      )}
      title={locked ? `Tier ${name} (fixado)` : `Tier ${name}`}
    >
      {name}
      {locked && <Lock className={lockSize[size]} aria-hidden />}
    </span>
  );
}
