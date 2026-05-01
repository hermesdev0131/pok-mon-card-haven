"use client";

import { useMemo, useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GradeBadge } from './GradeBadge';
import { FlagIcon } from './FlagIcon';
import { Pagination } from './Pagination';
import { usePagination } from '@/hooks/usePagination';
import { formatPrice } from '@/lib/utils';
import { isNacionalCompany } from '@/lib/grading-groups';
import type { SaleRecord } from '@/types';
import type { GradeCompany } from '@/types/database';

type GradingFilter = 'all' | 'nacional' | 'internacional';
type LanguageFilter = 'all' | 'PT' | 'EN' | 'JP';

export function SalesHistoryTable({ sales }: { sales: SaleRecord[] }) {
  const [gradingFilter, setGradingFilter] = useState<GradingFilter>('all');
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const company = sale.gradeCompany as GradeCompany;
      if (gradingFilter === 'nacional' && !isNacionalCompany(company)) return false;
      if (gradingFilter === 'internacional' && isNacionalCompany(company)) return false;
      if (languageFilter !== 'all' && sale.language !== languageFilter) return false;
      return true;
    });
  }, [sales, gradingFilter, languageFilter]);

  const { page, setPage, totalPages, paged, total, pageSize, setPageSize } = usePagination(filteredSales, 10);

  useEffect(() => {
    setPage(1);
  }, [gradingFilter, languageFilter, setPage]);

  if (!sales.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">Nenhum histórico de vendas disponível.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Graduação</Label>
          <Select value={gradingFilter} onValueChange={(v) => setGradingFilter(v as GradingFilter)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="nacional">Nacional</SelectItem>
              <SelectItem value="internacional">Internacional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Idioma</Label>
          <Select value={languageFilter} onValueChange={(v) => setLanguageFilter(v as LanguageFilter)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PT">Português</SelectItem>
              <SelectItem value="EN">Inglês</SelectItem>
              <SelectItem value="JP">Japonês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">Nenhuma venda encontrada com os filtros selecionados.</p>
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Idioma</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((sale, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-sm">{sale.sellerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sale.buyerName}</TableCell>
                    <TableCell><GradeBadge grade={sale.grade} company={sale.gradeCompany} pristine={sale.pristine} /></TableCell>
                    <TableCell><FlagIcon code={sale.language} /></TableCell>
                    <TableCell className="text-right font-semibold">R$ {formatPrice(sale.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: card-based layout */}
          <div className="lg:hidden space-y-3">
            {paged.map((sale, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                {/* Top row: date + price */}
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(sale.date).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-lg font-bold text-accent">
                    R$ {formatPrice(sale.price)}
                  </span>
                </div>

                {/* Middle row: seller info + grade/flag */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Vendedor</p>
                    <p className="text-sm font-semibold truncate">{sale.sellerName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <GradeBadge grade={sale.grade} company={sale.gradeCompany} pristine={sale.pristine} />
                    <FlagIcon code={sale.language} />
                  </div>
                </div>

                {/* Bottom row: buyer (subtle) */}
                <div className="pt-2 border-t border-white/[0.04]">
                  <p className="text-xs text-muted-foreground">
                    Comprador: <span className="text-foreground/70">{sale.buyerName}</span>
                  </p>
                </div>
              </div>
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
