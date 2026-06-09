"use client";

import { CardBaseCard } from '@/components/CardBaseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCardCatalog } from '@/lib/api';
import { getCompaniesForGroup } from '@/lib/grading-groups';
import { CATALOG_LANGUAGE_LABELS, CATALOG_LANGUAGES_NACIONAL, CATALOG_LANGUAGES_INTERNACIONAL } from '@/lib/card-languages';
import { useAuth } from '@/contexts/AuthContext';
import { Pagination } from '@/components/Pagination';
import type { CardBaseWithStats, CardLanguage } from '@/types';

interface MarketplaceGridProps {
  gradingGroup?: 'nacional' | 'internacional';
  title: string;
  description: string;
  emptyMessage?: string;
}

const COMPANY_DISPLAY: Record<string, string> = { ManaFix: 'Manafix', Taverna: 'Taberna', OTHER: 'Outras' };

export function MarketplaceGrid({ gradingGroup, title, description, emptyMessage }: MarketplaceGridProps) {
  const { tokenRefreshCount } = useAuth();
  const [items, setItems] = useState<CardBaseWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [group, setGroup] = useState<'all' | 'nacional' | 'internacional'>('all');
  const [company, setCompany] = useState<string>('all');
  const [language, setLanguage] = useState<'all' | CardLanguage>('all');
  const [availability, setAvailability] = useState<'available' | 'all'>('available');
  const [showFilters, setShowFilters] = useState(false);

  const activeGroup = gradingGroup ?? (group === 'all' ? undefined : group);
  const companies = activeGroup ? getCompaniesForGroup(activeGroup) : [];

  // Inactive (no-listing) cards only make sense when NOT filtering by grading
  // group — a card without listings has no grading company, so it can't be
  // classified as Nacional/Internacional. Force "available" whenever a grading
  // group is active; full catalog browsing lives on the combined view.
  const showAvailabilityToggle = !activeGroup;
  const effectiveAvailability = activeGroup ? 'available' : availability;

  // Reset to page 1 whenever filters or page size change
  useEffect(() => { setPage(1); }, [search, sort, group, company, language, availability, pageSize, tokenRefreshCount]);

  useEffect(() => {
    setLoading(true);
    getCardCatalog({
      search,
      sort: sort === 'price_asc' ? 'price_asc' : sort === 'price_desc' ? 'price_desc' : undefined,
      gradingGroup: activeGroup,
      company: company === 'all' ? undefined : company,
      language: language === 'all' ? undefined : language as CardLanguage,
      availability: effectiveAvailability,
      page,
      pageSize,
    }).then(({ data, total: t }) => {
      setItems(data);
      setTotal(t);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [search, sort, activeGroup, company, language, effectiveAvailability, page, pageSize, tokenRefreshCount]);

  useEffect(() => { setCompany('all'); }, [group]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Search & filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, set ou número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {showAvailabilityToggle && (
            <Select value={availability} onValueChange={(v) => setAvailability(v as 'available' | 'all')}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponíveis</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={language} onValueChange={(v) => setLanguage(v as 'all' | CardLanguage)}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os idiomas</SelectItem>
              {(gradingGroup === 'nacional' ? CATALOG_LANGUAGES_NACIONAL : CATALOG_LANGUAGES_INTERNACIONAL).map((lg) => (
                <SelectItem key={lg} value={lg}>{CATALOG_LANGUAGE_LABELS[lg]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!gradingGroup && (
            <Select value={group} onValueChange={(v) => setGroup(v as 'all' | 'nacional' | 'internacional')}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas graduações</SelectItem>
                <SelectItem value="nacional">Graduadas Nacionais</SelectItem>
                <SelectItem value="internacional">Graduadas Internacionais</SelectItem>
              </SelectContent>
            </Select>
          )}
          {activeGroup && (
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c} value={c}>{COMPANY_DISPLAY[c] ?? c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
          <p className="text-muted-foreground">{emptyMessage ?? 'Nenhuma carta encontrada.'}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <CardBaseCard
                key={item.cardBase.id}
                item={item}
                gradingGroup={activeGroup}
                slabVariant={gradingGroup ?? 'misto'}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={total}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
