'use client';

import { useOptimistic } from 'react';
import { InflowForm } from '@/components/inflow/inflow-form';
import { InflowListClient } from './inflow-list-client';

interface InflowManagerProps {
    initialInflows: any[];
    nextSerialNumber: string;
    smsEnabledDefault: boolean;
    customers: any[];
    crops: any[];
    lots: any[];
    unloadedRecords: any[];
    selectedUnloadingId?: string;
}

export function InflowManager({ 
    initialInflows, 
    nextSerialNumber, 
    smsEnabledDefault,
    customers,
    crops,
    lots,
    unloadedRecords,
    selectedUnloadingId
}: InflowManagerProps) {
    const [optimisticInflows, addOptimisticInflow] = useOptimistic(
        initialInflows,
        (state, newInflow: any) => [newInflow, ...state]
    );

    return (
        <>
            <InflowForm 
                nextSerialNumber={nextSerialNumber} 
                smsEnabledDefault={smsEnabledDefault}
                customers={customers}
                crops={crops}
                lots={lots}
                initialUnloadingRecords={unloadedRecords}
                selectedUnloadingId={selectedUnloadingId}
                onSuccess={(newInflow) => {
                    addOptimisticInflow(newInflow);
                }}
            />
            <InflowListClient inflows={optimisticInflows} />
        </>
    );
}
