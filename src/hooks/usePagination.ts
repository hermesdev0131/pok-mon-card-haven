import { useState, useEffect, useCallback } from 'react';

export function usePagination<T>(items: T[], defaultPageSize: number = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  // Reset to page 1 whenever the items array reference changes (new search/fetch)
  useEffect(() => {
    setPage(1);
  }, [items]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return { page: currentPage, setPage, totalPages, paged, total: items.length, pageSize, setPageSize };
}
