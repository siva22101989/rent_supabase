'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "@/hooks/use-toast";
import { fetchCrops, fetchLots, fetchCustomers } from '@/lib/actions';
import { createClient } from '@/utils/supabase/client';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for static data

type StaticDataContextType = {
  crops: any[];
  lots: any[];
  customers: any[];
  loading: boolean;
  refresh: (showToast?: boolean) => Promise<void>;
};

const StaticDataContext = createContext<StaticDataContextType | undefined>(undefined);

export function StaticDataProvider({ children }: { children: React.ReactNode }) {
  const [cropsCache, setCropsCache] = useLocalStorage<any>('bagbill_crops', null);
  const [lotsCache, setLotsCache] = useLocalStorage<any>('bagbill_lots', null);
  const [customersCache, setCustomersCache] = useLocalStorage<any>('bagbill_customers', null);
  
  const [crops, setCrops] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cropsCacheRef = useRef(cropsCache);
  const lotsCacheRef = useRef(lotsCache);
  const customersCacheRef = useRef(customersCache);

  useEffect(() => {
    cropsCacheRef.current = cropsCache;
    lotsCacheRef.current = lotsCache;
    customersCacheRef.current = customersCache;
  }, [cropsCache, lotsCache, customersCache]);

  // 1. Initial Load from Cache
  useEffect(() => {
    async function load() {
       try {
           // Check if user is logged in before loading data
           const supabase = createClient();
           const { data: { user } } = await supabase.auth.getUser();
           
           if (!user) {
               // User not authenticated, skip data loading
               setLoading(false);
               return;
           }

           // Crops
           let cropsData = null;
           const currentCropsCache = cropsCacheRef.current;
           if (currentCropsCache) {
               const { data, timestamp } = currentCropsCache;
               if (data && timestamp && (Date.now() - timestamp < CACHE_DURATION)) {
                   cropsData = data;
               }
           }
           
           if (!cropsData) {
               cropsData = await fetchCrops();
               setCropsCache({ data: cropsData, timestamp: Date.now() });
           }
           setCrops(cropsData);

           // Lots
           let lotsData = null;
           const currentLotsCache = lotsCacheRef.current;
           if (currentLotsCache) {
               const { data, timestamp } = currentLotsCache;
               if (data && timestamp && (Date.now() - timestamp < CACHE_DURATION)) {
                   lotsData = data;
               }
           }
           
           if (!lotsData) {
               lotsData = await fetchLots();
               setLotsCache({ data: lotsData, timestamp: Date.now() });
           }
           setLots(lotsData);

           // Customers
           let customersData = null;
           const currentCustomersCache = customersCacheRef.current;
           if (currentCustomersCache) {
               const { data, timestamp } = currentCustomersCache;
               if (data && timestamp && (Date.now() - timestamp < CACHE_DURATION)) {
                   customersData = data;
               }
           }
           
           if (!customersData) {
               customersData = await fetchCustomers();
               setCustomersCache({ data: customersData, timestamp: Date.now() });
           }
           setCustomers(customersData);
           
       } catch (e) {
           console.error("Error loading static data", e);
       } finally {
           setLoading(false);
       }
    }
    load();
  }, [setCropsCache, setLotsCache, setCustomersCache]);

  // Manual Refresh
  const refresh = useCallback(async (showToast = true) => {
    setLoading(true);
    try {
        const [newCrops, newLots, newCustomers] = await Promise.all([
            fetchCrops(),
            fetchLots(),
            fetchCustomers()
        ]);
        
        setCropsCache({ data: newCrops, timestamp: Date.now() });
        setLotsCache({ data: newLots, timestamp: Date.now() });
        setCustomersCache({ data: newCustomers, timestamp: Date.now() });
        
        setCrops(newCrops);
        setLots(newLots);
        setCustomers(newCustomers);
        if (showToast) {
            toast({ title: "Data Refreshed", description: "All data updated successfully." });
        }
    } catch (e) {
        console.error("Error refreshing data", e);
        if (showToast) {
            toast({ title: "Error", description: "Failed to refresh data.", variant: "destructive" });
        }
    } finally {
        setLoading(false);
    }
  }, [setCropsCache, setLotsCache, setCustomersCache]);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // 2. Auth Listener
  useEffect(() => {
    const supabase = createClient();
    let lastSessionId: string | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        const currentSessionId = session?.user?.id || null;
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
             if (currentSessionId !== lastSessionId) {
                lastSessionId = currentSessionId;
                // Silently refresh on login
                refreshRef.current(false).catch(() => {
                  // Ignore errors during auth transitions
                });
             }
        } else if (event === 'SIGNED_OUT') {
             lastSessionId = null;
             setCropsCache(null);
             setLotsCache(null);
             setCustomersCache(null);
             setCrops([]);
             setLots([]);
             setCustomers([]);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [setCropsCache, setLotsCache, setCustomersCache]);

  // 3. Realtime Subscriptions
  useEffect(() => {
    const supabase = createClient();
    
    const lotsChannel = supabase
      .channel('realtime-lots')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'warehouse_lots' },
        (payload) => {
            if (payload.eventType === 'UPDATE') {
                const updatedLot = payload.new as any;
                setLots((prev) => prev.map(lot => {
                    if (lot.id === updatedLot.id) {
                        return { ...lot, ...updatedLot };
                    }
                    return lot;
                }));
            } else if (payload.eventType === 'INSERT') {
                setLots((prev) => {
                    if (prev.find(l => l.id === (payload.new as any).id)) return prev;
                    return [...prev, payload.new as any];
                });
            } else if (payload.eventType === 'DELETE') {
                 if (payload.old && (payload.old as any).id) {
                     setLots(prev => prev.filter(l => l.id !== (payload.old as any).id));
                 }
            }
        }
      )
      .subscribe();

    const cropsChannel = supabase
      .channel('realtime-crops')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crops' },
        (payload) => {
            if (payload.eventType === 'INSERT') {
                 setCrops((prev) => {
                    if (prev.find(c => c.id === (payload.new as any).id)) return prev;
                    return [...prev, payload.new as any];
                 });
            } else if (payload.eventType === 'UPDATE') {
                 const updated = payload.new as any;
                 setCrops(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
            } else if (payload.eventType === 'DELETE') {
                 if (payload.old && (payload.old as any).id) {
                     setCrops(prev => prev.filter(c => c.id !== (payload.old as any).id));
                 }
            }
        }
      )
      .subscribe();

    const customersChannel = supabase
      .channel('realtime-customers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
            if (payload.eventType === 'INSERT') {
                const newCustomer = payload.new as any;
                setCustomers((prev) => {
                    if (prev.find(c => c.id === newCustomer.id)) return prev;
                    // Note: We might need to map snake_case to camelCase here if fetchCustomers does that
                    const mapped = {
                         id: newCustomer.id,
                         name: newCustomer.name,
                         phone: newCustomer.phone,
                         email: newCustomer.email,
                         address: newCustomer.address,
                         fatherName: newCustomer.father_name,
                         village: newCustomer.village,
                         updatedAt: newCustomer.updated_at
                    };
                    return [...prev, mapped].sort((a,b) => a.name.localeCompare(b.name));
                });
            } else if (payload.eventType === 'UPDATE') {
                const updatedRaw = payload.new as any;
                setCustomers((prev) => prev.map(c => {
                    if (c.id === updatedRaw.id) {
                        return {
                            ...c,
                            name: updatedRaw.name,
                            phone: updatedRaw.phone,
                            email: updatedRaw.email,
                            address: updatedRaw.address,
                            fatherName: updatedRaw.father_name,
                            village: updatedRaw.village,
                            updatedAt: updatedRaw.updated_at
                        };
                    }
                    return c;
                }));
            } else if (payload.eventType === 'DELETE') {
                const oldRecord = payload.old as any;
                if (oldRecord && oldRecord.id) {
                    setCustomers((prev) => prev.filter(c => c.id !== oldRecord.id));
                }
            }
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(lotsChannel);
        supabase.removeChannel(cropsChannel);
        supabase.removeChannel(customersChannel);
    };
  }, []);

  return (
    <StaticDataContext.Provider value={{ crops, lots, customers, loading, refresh }}>
      {children}
    </StaticDataContext.Provider>
  );
}

export function useStaticData() {
  const context = useContext(StaticDataContext);
  if (context === undefined) {
    throw new Error('useStaticData must be used within a StaticDataProvider');
  }
  return context;
}
