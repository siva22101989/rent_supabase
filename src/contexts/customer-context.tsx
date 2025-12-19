'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCustomers } from '@/lib/actions';
import { type Customer } from '@/lib/definitions';
import { toast } from '@/hooks/use-toast';
import { useLocalStorage } from "@/hooks/use-local-storage";

type CustomerContextType = {
  customers: Customer[];
  refreshCustomers: (force?: boolean) => Promise<void>;
  isLoading: boolean;
};

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const CACHE_KEY = 'bagbill_customers';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customerCache, setCustomerCache] = useLocalStorage<any>(CACHE_KEY, null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const refreshCustomers = useCallback(async (force = false) => {
    // If not forced and cache is fresh, don't fetch
    if (!force) {
        if (customerCache) {
            try {
                const { data, timestamp } = customerCache;
                const age = Date.now() - timestamp;
                if (age < CACHE_DURATION) {
                     // Check if valid array
                     if (Array.isArray(data)) {
                        setCustomers(data);
                        setIsLoading(false);
                        return;
                     }
                }
            } catch (e) {
                console.error("Customer cache read error", e);
            }
        }
    }

    setIsLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
      
      // Update cache
      setCustomerCache({
          data,
          timestamp: Date.now()
      });
      
    } catch (err) {
      console.error('Customer fetch error:', err);
      toast({
          title: "Error fetching customers",
          description: "Could not load customer list.",
          variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [customerCache, setCustomerCache]);

  // Initial load
  useEffect(() => {
     refreshCustomers();
  }, [refreshCustomers]);
  
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
