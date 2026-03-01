"use client";

import { CardBaseCard } from '@/components/CardBaseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCardBasesWithStats } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { CardBaseWithStats } from '@/types';

export default function Marketplace() {
  const { tokenRefreshCount } = useAuth();
  const [items, setItems] = useState<CardBaseWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCardBasesWithStats({
      search,
      sort: sort === 'price_asc' ? 'price_asc' : sort === 'price_desc' ? 'price_desc' : undefined,
    }).then((data) => {
      setItems(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [search, sort, tokenRefreshCount]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-sm text-muted-foreground">Explore cartas Pokémon graduadas de vendedores verificados</p>
      </div>

      {/* Search & filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, set ou número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 rounded-lg glass p-4">
            <div className="space-y-1">
              <Label className="text-xs">Ordenar</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="price_asc">Menor preço</SelectItem>
                  <SelectItem value="price_desc">Maior preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Nenhuma carta encontrada.</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <CardBaseCard key={item.cardBase.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
