import { useState, useEffect } from 'react';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { fetchTeamMembers } from '@/lib/actions';

const CACHE_KEY = 'bagbill_team_members';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

export function useTeamMembers() {
    const [teamCache, setTeamCache] = useLocalStorage<any>(CACHE_KEY, null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                let teamData = null;
                if (teamCache) {
                    const { data, timestamp } = teamCache;
                    if (data && timestamp && (Date.now() - timestamp < CACHE_DURATION)) {
                        teamData = data;
                    }
                }

                if (!teamData) {
                    teamData = await fetchTeamMembers();
                    setTeamCache({ 
                        data: teamData, 
                        timestamp: Date.now() 
                    });
                }
                setMembers(teamData || []);
            } catch (e) {
                console.error("Error loading team members", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [teamCache, setTeamCache]);

    // Function to manually refresh cache (e.g. after adding member)
    const refreshMembers = async () => {
        setLoading(true);
        try {
            const teamData = await fetchTeamMembers();
            setTeamCache({ 
                data: teamData, 
                timestamp: Date.now() 
            });
            setMembers(teamData || []);
        } catch(e) {
             console.error("Error refreshing team members", e);
        } finally {
            setLoading(false);
        }
    };

    return { members, loading, refreshMembers };
}
