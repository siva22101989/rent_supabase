'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserWarehouses, getActiveWarehouseId } from '@/lib/warehouse-actions';

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

      // Cache in localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: list,
        timestamp: Date.now(),
        activeId
      }));
    } catch (err) {
      console.error('Warehouse fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Try to load from cache first
      const cached = localStorage.getItem(CACHE_KEY);
      
      if (cached) {
        try {
          const { data, timestamp, activeId } = JSON.parse(cached);
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
          console.error('Cache parse error:', e);
        }
      }

      // Fetch fresh data if no cache or cache expired
      await refreshWarehouses();
    };

    init();
  }, []);

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
