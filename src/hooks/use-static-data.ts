import { useState, useEffect } from 'react';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "@/hooks/use-toast";
import { fetchCrops, fetchLots } from '@/lib/actions';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for static data

export function useStaticData() {
  const [cropsCache, setCropsCache] = useLocalStorage<any>('bagbill_crops', null);
  const [lotsCache, setLotsCache] = useLocalStorage<any>('bagbill_lots', null);
  
  const [crops, setCrops] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
