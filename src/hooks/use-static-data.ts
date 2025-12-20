import { useState, useEffect } from 'react';
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

  // 2. Auth Listener (Runs once)
  useEffect(() => {
    // Listen for auth changes to auto-sync
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
             // Force reload on login
             // We call refresh() which is defined below. 
             // Note: We need to be careful about closure, but refresh ref should be stable enough or we use a ref if needed.
             // Actually, since refresh is recreated on every render, and this effect runs once...
             // Wait, if refresh changes, we might have stale closure issues if we don't include it in deps.
             // But if we include refresh in deps, and refresh causes re-render... LOOP again?
             // No, refresh IS causing re-render.
             // Best to just call fetch directly here or wrap refresh in useCallback?
             // Let's just trigger a re-fetch logic here which is independent.
             
             // Or better yet, define 'refresh' with useCallback so it's stable?
             // But refresh uses setLoading etc.
             
             // Simpler: Just rely on the fact that if this runs once, it captures the 'refresh' from the first render.
             // But calling it will trigger state update -> re-render -> refresh function is RECREATED.
             // But the effect doesn't run again, so it holds onto the OLD refresh function.
             // Is the old refresh function still valid? Yes, it uses state setters which are stable.
             // So calling the 'stale' refresh is fine.
             refresh(); 
        } else if (event === 'SIGNED_OUT') {
             setCropsCache(null);
             setLotsCache(null);
             setCrops([]);
             setLots([]);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE on mount

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

  // Manual Refresh
  const refresh = async () => {
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
        toast({ title: "Data Refreshed", description: "Static data updated successfully." });
    } catch (e) {
        console.error("Error refreshing static data", e);
        toast({ title: "Error", description: "Failed to refresh static data.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return { crops, lots, loading, refresh };
}
