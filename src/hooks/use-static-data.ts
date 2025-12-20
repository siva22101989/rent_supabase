import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "@/hooks/use-toast";
import { fetchCrops, fetchLots } from '@/lib/actions';
import { createClient } from '@/utils/supabase/client';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for static data

export function useStaticData() {
  const [cropsCache, setCropsCache] = useLocalStorage<any>('bagbill_crops', null);
  const [lotsCache, setLotsCache] = useLocalStorage<any>('bagbill_lots', null);
  
  const [crops, setCrops] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load from Cache
  useEffect(() => {
    async function load() {
       try {
           // Crops
           let cropsData = null;
           if (cropsCache) {
               const { data, timestamp } = cropsCache;
               // Check if valid structure and fresh
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
           if (lotsCache) {
               const { data, timestamp } = lotsCache;
               if (data && timestamp && (Date.now() - timestamp < CACHE_DURATION)) {
                   lotsData = data;
               }
           }
           
           if (!lotsData) {
               lotsData = await fetchLots();
               setLotsCache({ data: lotsData, timestamp: Date.now() });
           }
           setLots(lotsData);
           
       } catch (e) {
           console.error("Error loading static data", e);
       } finally {
           setLoading(false);
       }
    }
    load();
  }, [cropsCache, lotsCache, setCropsCache, setLotsCache]);

  // Manual Refresh - Wrapped in useCallback for stability
  const refresh = useCallback(async (showToast = true) => {
    setLoading(true);
    try {
        const [newCrops, newLots] = await Promise.all([
            fetchCrops(),
            fetchLots()
        ]);
        
        setCropsCache({ data: newCrops, timestamp: Date.now() });
        setLotsCache({ data: newLots, timestamp: Date.now() });
        
        setCrops(newCrops);
        setLots(newLots);
        if (showToast) {
            toast({ title: "Data Refreshed", description: "Static data updated successfully." });
        }
    } catch (e) {
        console.error("Error refreshing static data", e);
        if (showToast) {
            toast({ title: "Error", description: "Failed to refresh static data.", variant: "destructive" });
        }
    } finally {
        setLoading(false);
    }
  }, [setCropsCache, setLotsCache]);

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
             // Only refresh if session changed or data is missing
             if (currentSessionId !== lastSessionId) {
                lastSessionId = currentSessionId;
                refreshRef.current(false); // Silent refresh
             }
        } else if (event === 'SIGNED_OUT') {
             lastSessionId = null;
             setCropsCache(null);
             setLotsCache(null);
             setCrops([]);
             setLots([]);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [setCropsCache, setLotsCache]);

  // 3. Realtime Subscriptions
  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to Lots (capacity/stock changes)
    const lotsChannel = supabase
      .channel('realtime-lots')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'warehouse_lots' },
        (payload) => {
            if (payload.eventType === 'UPDATE') { // We mainly care about stock updates
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

    // Subscribe to Crops (new crops added)
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

    return () => {
        supabase.removeChannel(lotsChannel);
        supabase.removeChannel(cropsChannel);
    };
  }, []);

  return { crops, lots, loading, refresh };
}
