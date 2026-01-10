'use client';

import { useState, useCallback } from 'react';

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  offset: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetPage: () => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: (totalItems: number) => boolean;
  canGoPrev: boolean;
  totalPages: (totalItems: number) => number;
}

export function usePagination(defaultPageSize = 20): UsePaginationReturn {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const offset = (page - 1) * pageSize;

  const resetPage = useCallback(() => setPage(1), []);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);

  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);

  const canGoNext = useCallback(
    (totalItems: number) => page * pageSize < totalItems,
    [page, pageSize]
  );

  const canGoPrev = page > 1;

  const totalPages = useCallback(
    (totalItems: number) => Math.ceil(totalItems / pageSize),
    [pageSize]
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1); // Reset to first page when changing page size
  }, []);

  return {
    page,
    pageSize,
    offset,
    setPage,
    setPageSize: handlePageSizeChange,
    resetPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    totalPages,
  };
}
