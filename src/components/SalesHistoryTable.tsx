"use client";

import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GradeBadge } from './GradeBadge';
import { FlagIcon } from './FlagIcon';
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
        <div className="overflow-x-auto">
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
              {filteredSales.map((sale, i) => (
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
      )}
    </div>
  );
}
