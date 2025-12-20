'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserWarehouses, getActiveWarehouseId } from '@/lib/warehouse-actions';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { createClient } from '@/utils/supabase/client';

type Warehouse = {
  id: string;
  role: string;
  name: string;
  location: string;
};

type WarehouseContextType = {
  warehouses: Warehouse[];
  currentWarehouse: Warehouse | undefined;
  setCurrentWarehouse: (warehouse: Warehouse | undefined) => void;
  refreshWarehouses: () => Promise<void>;
  isLoading: boolean;
};

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

const CACHE_KEY = 'bagbill_warehouses';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [warehouseCache, setWarehouseCache] = useLocalStorage<any>(CACHE_KEY, null);
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const refreshWarehouses = async () => {
    try {
      const [list, activeId] = await Promise.all([
        getUserWarehouses(),
        getActiveWarehouseId()
      ]);
      
      setWarehouses(list);
      
      if (activeId) {
        const match = list.find((w: any) => w.id === activeId);
        setCurrentWarehouse(match);
      }

      // Cache
      setWarehouseCache({
        data: list,
        timestamp: Date.now(),
        activeId
      });
    } catch (err) {
      console.error('Warehouse fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Initial Load from Cache
  useEffect(() => {
    const init = async () => {
      // Try to load from cache first
      if (warehouseCache) {
        try {
          const { data, timestamp, activeId } = warehouseCache;
          const age = Date.now() - timestamp;
          
          if (age < CACHE_DURATION) {
            // Use cached data
            setWarehouses(data);
            if (activeId) {
              const match = data.find((w: any) => w.id === activeId);
              setCurrentWarehouse(match);
            }
            setIsLoading(false);
            return; // Don't fetch from server
          }
        } catch (e) {
          console.error('Cache read error:', e);
        }
      }

      // Fetch fresh data if no cache or cache expired
      await refreshWarehouses();
    };

    init();
  }, [warehouseCache]); // Keep dependency on cache for init, logic is fine as long as we don't loop.

  // 2. Auth Listener
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
             // Force refresh on login
             refreshWarehouses(); 
        } else if (event === 'SIGNED_OUT') {
             // Clear state and cache on logout
             setWarehouses([]);
             setCurrentWarehouse(undefined);
             setWarehouseCache(null);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE

  return (
    <WarehouseContext.Provider value={{ 
      warehouses, 
      currentWarehouse, 
      setCurrentWarehouse,
      refreshWarehouses,
      isLoading 
    }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouses() {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouses must be used within WarehouseProvider');
  }
  return context;
}
