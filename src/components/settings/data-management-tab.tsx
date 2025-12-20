'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Users, Wheat } from "lucide-react";
import { useCustomers } from "@/contexts/customer-context";
import { useTeamMembers } from "@/hooks/use-team-members";
import { useStaticData } from "@/hooks/use-static-data";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export function DataManagementTab() {
  const { refreshCustomers } = useCustomers();
  const { refreshMembers } = useTeamMembers();
  const { refresh: refreshStatic } = useStaticData();
  
  const [loading, setLoading] = useState<string | null>(null);

  const handleRefreshCustomers = async () => {
    setLoading('customers');
    await refreshCustomers(true);
    toast({ title: "Customers Synced", description: "Latest customer list fetched from server." });
    setLoading(null);
  };

  const handleRefreshTeam = async () => {
    setLoading('team');
    await refreshMembers();
    toast({ title: "Team Synced", description: "Latest team members fetched from server." });
    setLoading(null);
  };

  const handleRefreshStatic = async () => {
    setLoading('static');
    await refreshStatic();
    setLoading(null);
  };
    
  const handleRefreshAll = async () => {
      setLoading('all');
      await Promise.all([
          refreshCustomers(true),
          refreshMembers(),
          refreshStatic()
      ]);
       toast({ title: "Full Sync Complete", description: "All application data has been refreshed." });
      setLoading(null);
  }

  return (
    <div className="grid gap-6">
        <Card>
        <CardHeader>
            <CardTitle>Data Synchronization</CardTitle>
            <CardDescription>
            Manually refresh locally cached data. Use this if you suspect data is out of sync.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium">Customer Database</p>
                        <p className="text-sm text-muted-foreground">Cached for 24 hours</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshCustomers} disabled={!!loading}>
                    {loading === 'customers' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
                    Sync
                </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium">Team Members</p>
                        <p className="text-sm text-muted-foreground">Cached for 24 hours</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshTeam} disabled={!!loading}>
                    {loading === 'team' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
                    Sync
                </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Wheat className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium">Crops & Lots</p>
                        <p className="text-sm text-muted-foreground">Cached for 24 hours</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshStatic} disabled={!!loading}>
                    {loading === 'static' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
                    Sync
                </Button>
            </div>
            
            <div className="pt-4 flex justify-end">
                <Button onClick={handleRefreshAll} disabled={!!loading} className="w-full sm:w-auto">
                    {loading === 'all' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <Database className="w-4 h-4 mr-2"/>}
                    Sync All Data
                </Button>
            </div>

        </CardContent>
        </Card>

        <Card className="border-red-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                    Irreversible and destructive actions. Please be careful.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50 rounded-lg">
                    <div>
                        <p className="font-medium text-red-900">Leave Warehouse</p>
                        <p className="text-sm text-red-700">Remove yourself from this warehouse. You will lose access.</p>
                    </div>
                    <Button variant="destructive" size="sm">
                        Leave Warehouse
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
