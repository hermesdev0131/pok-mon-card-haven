import Image from 'next/image';
import Link from 'next/link';
import type { CardBaseWithStats } from '@/types';

interface CardBaseCardProps {
  item: CardBaseWithStats;
}

export function CardBaseCard({ item }: CardBaseCardProps) {
  const { cardBase, listingCount, lowestPrice } = item;

  return (
    <Link href={`/card/${cardBase.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] transition-all duration-300 hover:border-accent/30 hover:shadow-[0_4px_40px_hsl(var(--accent)/0.1)] hover:-translate-y-1">
        {/* Generic card image */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center overflow-hidden">
          {cardBase.imageUrl ? (
            <Image
              src={cardBase.imageUrl}
              alt={cardBase.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="text-7xl opacity-30 group-hover:scale-110 transition-transform duration-500">🃏</div>
          )}

          {/* Listing count badge — top-right */}
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] px-2.5 py-1 text-[10px] font-semibold text-foreground/80 z-10">
            {listingCount} {listingCount === 1 ? 'anúncio' : 'anúncios'}
          </div>

          {/* Set code badge — top-left */}
          <div className="absolute top-3 left-3 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] px-2.5 py-1 text-[10px] font-semibold text-foreground/80 uppercase tracking-wider z-10">
            {cardBase.setCode}
          </div>

          {/* Hover action */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground py-2.5 text-sm font-semibold shadow-lg shadow-accent/20">
              Ver anúncios
            </div>
          </div>
        </div>

        {/* Card info */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1">{cardBase.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{cardBase.set} · #{cardBase.number}</p>

          {/* Price — "A partir de" */}
          <p className="text-lg font-bold text-accent">
            R$ {lowestPrice.toLocaleString('pt-BR')}
          </p>
          <p className="text-[11px] text-muted-foreground -mt-1">a partir de</p>
        </div>
      </div>
    </Link>
  );
}
