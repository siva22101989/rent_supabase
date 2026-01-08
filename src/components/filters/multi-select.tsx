'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export interface MultiSelectOption {
  label: string;
  value: string;
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
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
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

  const selectedLabels = options
    .filter((opt) => selected.includes(opt.value))
    .map((opt) => opt.label);

  const displayText = React.useMemo(() => {
    if (selected.length === 0) return placeholder;
    if (selected.length <= maxDisplay) {
      return selectedLabels.join(', ');
    }
    return `${selectedLabels.slice(0, maxDisplay).join(', ')} +${selected.length - maxDisplay}`;
  }, [selected, selectedLabels, maxDisplay, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
        >
          <span className="truncate">{displayText}</span>
          <div className="flex items-center gap-1 ml-2">
            {selected.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1 text-xs">
                {selected.length}
              </Badge>
            )}
            {selected.length > 0 ? (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Search...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={handleSelectAll}
                className="font-medium"
              >
                <Checkbox
                  checked={selected.length === options.length}
                  onCheckedChange={handleSelectAll}
                  className="mr-2"
                />
                Select All ({options.length})
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleToggle(option.value)}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    onCheckedChange={() => handleToggle(option.value)}
                    className="mr-2"
                  />
                  <span>{option.label}</span>
                  {selected.includes(option.value) && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
