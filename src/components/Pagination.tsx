"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({ page, totalPages, onPageChange, total, pageSize, onPageSizeChange }: PaginationProps) {
  if (totalPages <= 1 && (!total || total === 0)) return null;

  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  const from = total && pageSize ? Math.min((page - 1) * pageSize + 1, total) : null;
  const to = total && pageSize ? Math.min(page * pageSize, total) : null;

  return (
    <div className="flex flex-col items-center gap-2 mt-8">
      {/* Top row: page size selector ← → count */}
      <div className="flex items-center justify-between w-full gap-4">
        {onPageSizeChange && pageSize !== undefined ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Por página</span>
            <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-7 w-16 text-xs px-2 border-white/[0.08] bg-white/[0.04]">
                <span>{pageSize}</span>
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(s => (
                  <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : <div />}

        {from !== null && to !== null && total !== undefined && (
          <p className="text-xs text-muted-foreground">{from}–{to} de {total}</p>
        )}
      </div>

      {/* Page buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">…</span>
            ) : (
              <Button
                key={p}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 text-sm ${p === page ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
