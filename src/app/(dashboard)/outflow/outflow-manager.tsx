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
                records={[]} // Still needs the dropdown records if applicable, or we fetch them in the manager
                smsEnabledDefault={smsEnabledDefault}
                onSuccess={(newOutflow) => {
                    addOptimisticOutflow(newOutflow);
                }}
            />
            <OutflowListClient outflows={optimisticOutflows} />
        </>
    );
}
