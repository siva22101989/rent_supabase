'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface MultiSelectOption {
  label: string;
  value: string;
  count?: number;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  maxDisplay?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  emptyText = 'No items found',
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const handleToggle = (value: string) => {
    // Case-insensitive check
    const isSelected = selected.some(item => item.toLowerCase() === value.toLowerCase());
    
    if (isSelected) {
      // Remove (filter out matching case-insensitive)
      const newSelected = selected.filter((item) => item.toLowerCase() !== value.toLowerCase());
      onChange(newSelected);
    } else {
      // Add (find original case from options if possible)
      const originalOption = options.find(opt => opt.value.toLowerCase() === value.toLowerCase());
      onChange([...selected, originalOption ? originalOption.value : value]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  const selectedLabels = options
    .filter((opt) => selected.some(s => s.toLowerCase() === opt.value.toLowerCase()))
    .map((opt) => opt.label);

  const displayText = React.useMemo(() => {
    if (selected.length === 0) return placeholder;
    if (selected.length <= maxDisplay) {
      return selectedLabels.join(', ');
    }
    return `${selected.length} selected`;
  }, [selected.length, selectedLabels, maxDisplay, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{displayText}</span>
          <div className="flex items-center gap-1">
            {selected.length > 0 && (
              <span
                onClick={handleClear}
                className="rounded-sm opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="border-b p-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>

          {/* Options List */}
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {/* Select All Option */}
              <div
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent transition-colors"
                onClick={handleSelectAll}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selected.length === options.length
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50'
                  )}
                >
                  {selected.length === options.length && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="font-medium">Select All ({options.length})</span>
              </div>

              {/* Individual Options */}
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selected.some(s => s.toLowerCase() === option.value.toLowerCase());
                  return (
                    <div
                      key={option.value}
                      className="flex items-center gap-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleToggle(option.value)}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50'
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <span className="flex-1">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          ({option.count})
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
