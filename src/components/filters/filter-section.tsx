'use client';

import * as React from 'react';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterSection({ title, children, className }: FilterSectionProps) {
  return (
    <div className={className}>
      <h4 className="text-sm font-medium mb-3">{title}</h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
