import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-accent drop-shadow-[0_0_6px_hsl(var(--accent)/0.4)]', className)}>
      <BadgeCheck className="h-3.5 w-3.5" />
      Verificado
    </span>
  );
}
