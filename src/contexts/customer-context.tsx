'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCustomers } from '@/lib/actions';
import { type Customer } from '@/lib/definitions';
import { toast } from '@/hooks/use-toast';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { createClient } from '@/utils/supabase/client';

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

  // Use a ref to access the latest cache value without triggering useCallback recreations
  const cacheRef = React.useRef(customerCache);
  useEffect(() => {
    cacheRef.current = customerCache;
  }, [customerCache]);
  
  const refreshCustomers = useCallback(async (force = false) => {
    const currentCache = cacheRef.current;
    
    // If not forced and cache is fresh, don't fetch
    if (!force) {
        if (currentCache) {
            try {
                const { data, timestamp } = currentCache;
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
  }, [setCustomerCache]);

  // 1. Initial load
  useEffect(() => {
     refreshCustomers();
  }, [refreshCustomers]);

  const refreshRef = React.useRef(refreshCustomers);
  useEffect(() => {
    refreshRef.current = refreshCustomers;
  }, [refreshCustomers]);

  // 2. Auth Listener
  useEffect(() => {
    const supabase = createClient();
    let lastSessionId: string | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentSessionId = session?.user?.id || null;
      
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (currentSessionId !== lastSessionId) {
          lastSessionId = currentSessionId;
          refreshRef.current(true);
        }
      } else if (event === 'SIGNED_OUT') {
        lastSessionId = null;
        setCustomers([]);
        setCustomerCache(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setCustomerCache]); 

  // 3. Realtime Subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-customers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCustomer = payload.new as any; // Cast 'new' to any or specific DB type
            setCustomers((prev) => {
                if (prev.find(c => c.id === newCustomer.id)) return prev;
                const mapped: Customer = {
                    id: newCustomer.id,
                    name: newCustomer.name,
                    email: newCustomer.email || '',
                    phone: newCustomer.phone,
                    address: newCustomer.address,
                    fatherName: newCustomer.father_name || '',
                    village: newCustomer.village || '',
                    updatedAt: newCustomer.updated_at
                };
                const updated = [...prev, mapped].sort((a,b) => a.name.localeCompare(b.name));
                return updated;
            });
            
          } else if (payload.eventType === 'UPDATE') {
             const updatedRaw = payload.new as any;
             setCustomers((prev) => prev.map(c => {
                 if (c.id === updatedRaw.id) {
                     return {
                        ...c,
                        name: updatedRaw.name,
                        email: updatedRaw.email || '',
                        phone: updatedRaw.phone,
                        address: updatedRaw.address,
                        fatherName: updatedRaw.father_name || '',
                        village: updatedRaw.village || '',
                        updatedAt: updatedRaw.updated_at
                     };
                 }
                 return c;
             }));
          } else if (payload.eventType === 'DELETE') {
             // payload.old has 'id' only for delete if replica identity is set, 
             // but usually ID is available if 'old' is present.
             const oldRecord = payload.old as any;
             if (oldRecord && oldRecord.id) {
                 setCustomers((prev) => prev.filter(c => c.id !== oldRecord.id));
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Run once on mount, relies on RLS for security.
  
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
