'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { type Customer } from '@/lib/definitions';

import { useStaticData } from '@/hooks/use-static-data';

type CustomerContextType = {
  customers: Customer[];
  refreshCustomers: (force?: boolean) => Promise<void>;
  isLoading: boolean;
};

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { customers, refresh, loading: isLoading } = useStaticData();

  const refreshCustomers = useCallback(async (force = false) => {
    await refresh(force);
  }, [refresh]);

  return (
    <CustomerContext.Provider value={{ customers, refreshCustomers, isLoading }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within CustomerProvider');
  }
  return context;
}
