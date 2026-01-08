'use server';

import { getAvailableCrops, getAvailableLots, getDashboardMetrics } from '@/lib/queries';

export type FormState = {
  message: string;
  success: boolean;
  data?: Record<string, any>;
};

export async function fetchCrops() {
    return await getAvailableCrops();
}

export async function fetchLots() {
    return await getAvailableLots();
}

export async function fetchDashboardMetrics() {
    return await getDashboardMetrics();
}
