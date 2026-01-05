'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InflowManager } from "./inflow-manager";
import { UnloadingForm } from "@/components/inflow/unloading-form";
import { UnloadedInventory } from "@/components/inflow/unloaded-inventory";

interface InflowDashboardProps {
  initialInflows: any[];
  nextSerialNumber: string;
  smsEnabled: boolean;
  customers: any[];
  crops: any[];
  lots: any[];
  unloadedRecords: any[];
}

export function InflowDashboard({
  initialInflows,
  nextSerialNumber,
  smsEnabled,
  customers,
  crops,
  lots,
  unloadedRecords
}: InflowDashboardProps) {
  const [activeTab, setActiveTab] = useState("arrivals"); // Default to arrivals to see truck entries first? Or keep "inflow"? User guide says "Truck Arrivals" -> "Move".
  // Keeping "inflow" default as per existing page, or maybe "arrivals" if they want optimization?
  // Use "inflow" to match existing behavior.
  
  const [selectedUnloadingId, setSelectedUnloadingId] = useState<string>("");

  const handleMoveToStorage = (id: string) => {
      setSelectedUnloadingId(id);
      setActiveTab("inflow");
  };

  return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="inflow">Plot/Quick Inflow</TabsTrigger>
          <TabsTrigger value="arrivals">Truck Arrivals</TabsTrigger>
        </TabsList>

        <TabsContent value="arrivals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UnloadingForm
              customers={customers}
              crops={crops}
            />
            <UnloadedInventory
              records={unloadedRecords}
              onMoveToStorage={handleMoveToStorage}
            />
          </div>
        </TabsContent>

        <TabsContent value="inflow">
          <InflowManager
            initialInflows={initialInflows}
            nextSerialNumber={nextSerialNumber}
            smsEnabledDefault={smsEnabled}
            customers={customers}
            crops={crops}
            lots={lots}
            unloadedRecords={unloadedRecords}
            selectedUnloadingId={selectedUnloadingId}
          />
        </TabsContent>
      </Tabs>
  );
}
