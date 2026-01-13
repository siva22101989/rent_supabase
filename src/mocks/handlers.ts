import { http, HttpResponse } from 'msw';

export const handlers = [
  // Example: Mocking a Supabase RPC or API call
  http.get('*/rest/v1/rpc/get_dashboard_stats', () => {
    return HttpResponse.json([
      {
        total_bags: 1250,
        revenue: 50000,
        outflow: 300,
        active_customers: 45
      }
    ]);
  }),

  // Add more handlers here (e.g., auth, customer search)
];
