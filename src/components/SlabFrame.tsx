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

// Per-slab inner window position as percentages of the 870×1419 cropped PNG.
// The slab has a logo strip at the top (~0-27%) and an inner empty area below
// where the actual card image sits. Inner window aspect (~0.72) closely matches
// standard Pokémon card aspect (5/7 ≈ 0.714).
const WINDOW = {
  top: '27%',
  left: '12%',
  right: '12%',
  bottom: '8%',
};

export function SlabFrame({ variant, children, className, slabSizes }: SlabFrameProps) {
  return (
    <div className={cn('relative aspect-[870/1419] overflow-hidden', className)}>
      {/* Slab background PNG (cropped to visible content, fills the container) */}
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
