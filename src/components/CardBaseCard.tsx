import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { SlabFrame, type SlabVariant } from '@/components/SlabFrame';
import type { CardBaseWithStats } from '@/types';

interface CardBaseCardProps {
  item: CardBaseWithStats;
  gradingGroup?: 'nacional' | 'internacional';
  slabVariant?: SlabVariant;
}

export function CardBaseCard({ item, gradingGroup, slabVariant }: CardBaseCardProps) {
  const { cardBase, listingCount, lowestPrice } = item;
  const href = gradingGroup ? `/card/${cardBase.id}?group=${gradingGroup}` : `/card/${cardBase.id}`;
  const effectiveVariant: SlabVariant = slabVariant ?? 'misto';

  return (
    <Link href={href} className="group block">
      <div className="overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:border-accent/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1">
        <div className="relative">
          <SlabFrame variant={effectiveVariant}>
            {cardBase.imageUrl ? (
              <Image
                src={cardBase.imageUrl}
                alt={cardBase.name}
                fill
                quality={95}
                className="object-contain"
                sizes="(max-width: 768px) 40vw, (max-width: 1024px) 26vw, 16vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-30">
                🃏
              </div>
            )}
          </SlabFrame>

          {/* Rarity — top-left, solid accent */}
          {cardBase.rarity && (
            <div className="absolute top-2 left-2 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-accent-foreground uppercase tracking-wide z-10">
              {cardBase.rarity}
            </div>
          )}

          {/* Listing count — top-right, solid accent */}
          <div className="absolute top-2 right-2 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-accent-foreground z-10">
            {listingCount} {listingCount === 1 ? 'anúncio' : 'anúncios'}
          </div>

          {/* Hover action */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground py-2.5 text-sm font-semibold shadow-lg shadow-accent/20">
              Ver anúncios
            </div>
          </div>
        </div>

        {/* Card info */}
        <div className="p-4 space-y-1.5">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1">{cardBase.name}</h3>
          <p className="text-[11px] text-muted-foreground line-clamp-1">{cardBase.set} · #{cardBase.number}</p>

          <div className="pt-1">
            <p className="text-sm font-bold text-accent">
              a partir de R$ {formatPrice(lowestPrice)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
