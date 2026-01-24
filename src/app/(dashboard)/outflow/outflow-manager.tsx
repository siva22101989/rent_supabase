'use client';

import { useOptimistic } from 'react';
import { OutflowForm } from '@/components/outflow/outflow-form';
import { OutflowListClient } from './outflow-list-client';

interface OutflowManagerProps {
    initialOutflows: any[];
    smsEnabledDefault: boolean;
}

export function OutflowManager({ initialOutflows, smsEnabledDefault }: OutflowManagerProps) {
    const [optimisticOutflows, addOptimisticOutflow] = useOptimistic(
        initialOutflows,
        (state, newOutflow: any) => [newOutflow, ...state]
    );

    return (
        <>
            <OutflowForm 
                smsEnabledDefault={smsEnabledDefault}
                onSuccess={(newOutflow) => {
                    addOptimisticOutflow(newOutflow);
                }}
            />
            <OutflowListClient outflows={optimisticOutflows} />
        </>
    );
}
