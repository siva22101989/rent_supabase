'use client';

import { useOptimistic, useTransition, ReactNode, useState } from 'react';
import { InflowForm } from '@/components/inflow/inflow-form';
import { InflowListClient } from './inflow-list-client';

interface InflowManagerProps {
    initialInflows: any[];
    nextSerialNumber: string;
}

export function InflowManager({ initialInflows, nextSerialNumber }: InflowManagerProps) {
    const [optimisticInflows, addOptimisticInflow] = useOptimistic(
        initialInflows,
        (state, newInflow: any) => [newInflow, ...state]
    );

    return (
        <>
            <InflowForm 
                nextSerialNumber={nextSerialNumber} 
                onSuccess={(newInflow) => {
                    // This will be called by InflowForm when submission starts
                    addOptimisticInflow(newInflow);
                }}
            />
            <InflowListClient inflows={optimisticInflows} />
        </>
    );
}
