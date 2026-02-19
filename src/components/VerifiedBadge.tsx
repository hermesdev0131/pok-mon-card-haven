import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-success', className)}>
      <BadgeCheck className="h-3.5 w-3.5" />
      Verificado
    </span>
  );
}
