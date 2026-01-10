'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    showPageInfo?: boolean;
}

export function Pagination({ 
    currentPage, 
    totalPages, 
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    showPageInfo = true,
}: PaginationProps) {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    // Calculate display info
    const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
    const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;
    
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
            {/* Page Size Selector */}
            {onPageSizeChange && pageSize && (
                <div className="flex items-center gap-2">
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size} rows
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground hidden sm:inline">per page</span>
                </div>
            )}

            {/* Page Info */}
            {showPageInfo && totalItems && startItem && endItem && (
                <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{startItem}</span> to{' '}
                    <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{totalItems}</span>
                </div>
            )}

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                </Button>
                
                <div className="flex items-center gap-1 sm:hidden px-4 text-sm font-medium">
                    {currentPage} <span className="text-muted-foreground mx-1">/</span> {totalPages}
                </div>

                <div className="hidden sm:flex items-center gap-2">
                    {startPage > 1 && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(1)}
                            >
                                1
                            </Button>
                            {startPage > 2 && <span className="px-2">...</span>}
                        </>
                    )}
                    
                    {pages.map(page => (
                        <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </Button>
                    ))}
                    
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="px-2">...</span>}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(totalPages)}
                            >
                                {totalPages}
                            </Button>
                        </>
                    )}
                </div>
                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

