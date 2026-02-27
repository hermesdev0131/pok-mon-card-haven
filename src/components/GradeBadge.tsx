import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GradeBadgeProps {
  grade: number;
  company: string;
  pristine?: boolean;
  className?: string;
}

export function GradeBadge({ grade, company, pristine, className }: GradeBadgeProps) {
  const isPerfect = grade === 10;
  return (
    <Badge
      className={cn(
        'font-bold text-xs gap-1',
        pristine
          ? 'bg-gray-950 text-gold border border-gold/30 hover:border-gold/50 animate-pulse-glow-gold [text-shadow:0_0_8px_hsl(43_96%_56%/0.4)]'
          : isPerfect
            ? 'bg-accent text-accent-foreground hover:bg-accent/90 animate-pulse-glow'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/90 border border-white/[0.06]',
        className
      )}
    >
      {company} {pristine ? 'Pristine ' : ''}{grade}
    </Badge>
  );
}
