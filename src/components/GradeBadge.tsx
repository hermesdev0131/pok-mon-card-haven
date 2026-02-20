import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GradeBadgeProps {
  grade: number;
  company: string;
  className?: string;
}

export function GradeBadge({ grade, company, className }: GradeBadgeProps) {
  const isPerfect = grade === 10;
  return (
    <Badge
      className={cn(
        'font-bold text-xs gap-1',
        isPerfect
          ? 'bg-accent text-accent-foreground hover:bg-accent/90 animate-pulse-glow'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/90 border border-white/[0.06]',
        className
      )}
    >
      {company} {grade}
    </Badge>
  );
}
