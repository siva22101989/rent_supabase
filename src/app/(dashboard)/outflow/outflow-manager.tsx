'use client';

import { useOptimistic } from 'react';
import { OutflowForm } from '@/components/outflow/outflow-form';
import { OutflowListClient } from './outflow-list-client';

interface OutflowManagerProps {
    initialOutflows: any[];
}

export function OutflowManager({ initialOutflows }: OutflowManagerProps) {
    const [optimisticOutflows, addOptimisticOutflow] = useOptimistic(
        initialOutflows,
        (state, newOutflow: any) => [newOutflow, ...state]
    );

    return (
        <>
            <OutflowForm 
                records={[]} // Still needs the dropdown records if applicable, or we fetch them in the manager
                onSuccess={(newOutflow) => {
                    addOptimisticOutflow(newOutflow);
                }}
            />
            <OutflowListClient outflows={optimisticOutflows} />
        </>
    );
}
