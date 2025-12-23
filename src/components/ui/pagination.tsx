'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
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
    
    return (
        <div className="flex items-center justify-center gap-2 py-4">
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
    );
}
