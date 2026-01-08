'use client';

import * as React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FilterPopoverProps {
  children: React.ReactNode;
  activeFilters?: number;
  onClear?: () => void;
  onApply?: () => void;
  triggerLabel?: string;
}

export function FilterPopover({
  children,
  activeFilters = 0,
  onClear,
  onApply,
  triggerLabel = 'Filters',
}: FilterPopoverProps) {
  const [open, setOpen] = React.useState(false);

  const handleClear = () => {
    onClear?.();
  };

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          <Filter className="h-4 w-4 mr-2" />
          {triggerLabel}
          {activeFilters > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-2">
              {activeFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Filter Content */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {children}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={activeFilters === 0}
              className="flex-1"
            >
              Clear All
            </Button>
            {onApply && (
              <Button
                size="sm"
                onClick={handleApply}
                className="flex-1"
              >
                Apply
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
