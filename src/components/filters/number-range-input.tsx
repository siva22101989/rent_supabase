'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NumberRangeInputProps {
  label?: string;
  min: number | null;
  max: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  className?: string;
}

export function NumberRangeInput({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
  className,
}: NumberRangeInputProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onMinChange(value === '' ? null : Number(value));
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onMaxChange(value === '' ? null : Number(value));
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder={minPlaceholder}
          value={min ?? ''}
          onChange={handleMinChange}
          className="w-full"
          min={0}
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="number"
          placeholder={maxPlaceholder}
          value={max ?? ''}
          onChange={handleMaxChange}
          className="w-full"
          min={min ?? 0}
        />
      </div>
    </div>
  );
}
