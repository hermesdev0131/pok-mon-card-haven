import Image from 'next/image';
import { cn } from '@/lib/utils';

export type SlabVariant = 'nacional' | 'internacional' | 'misto';

interface SlabFrameProps {
  variant: SlabVariant;
  // The card image element (or placeholder) to render inside the slab's inner window.
  children: React.ReactNode;
  className?: string;
  // next/image sizes attribute for the slab background, tuned to the container's display size.
  slabSizes?: string;
}

// Per-slab inner window position as percentages of the 1200×1680 PNG.
// The slab has a logo strip at the top (~0-21%) and an inner empty area below
// where the actual card image sits.
const WINDOW = {
  top: '22%',
  left: '10%',
  right: '10%',
  bottom: '5%',
};

export function SlabFrame({ variant, children, className, slabSizes }: SlabFrameProps) {
  return (
    <div className={cn('relative aspect-[5/7] overflow-hidden', className)}>
      {/* Slab background PNG */}
      <Image
        src={`/slabs/${variant}.png`}
        alt=""
        fill
        priority={false}
        className="object-contain pointer-events-none select-none"
        sizes={slabSizes ?? '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw'}
      />
      {/* Inner card window — children render absolutely positioned here */}
      <div
        className="absolute"
        style={{ top: WINDOW.top, left: WINDOW.left, right: WINDOW.right, bottom: WINDOW.bottom }}
      >
        {children}
      </div>
    </div>
  );
}
