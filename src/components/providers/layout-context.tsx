'use client';

import * as React from 'react';

interface LayoutContextType {
  isSidebarMode: boolean;
}

const LayoutContext = React.createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ 
  children, 
  isSidebarMode 
}: { 
  children: React.ReactNode; 
  isSidebarMode: boolean;
}) {
  return (
    <LayoutContext.Provider value={{ isSidebarMode }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = React.useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
