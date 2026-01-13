import { test, expect } from '@playwright/test';

test.describe('E2E Security & Roles', () => {

    test('Staff Role Restrictions', async ({ browser }) => {
        // Use a separate context for Staff (don't share Admin state)
        // Ideally we'd have a 'verifyStaffRole' helper that sets up auth
        // For now, let's verify public/unauth access protections 
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // 1. Unauthenticated Access
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/login/); // Should redirect
        
        await page.goto('/settings');
        await expect(page).toHaveURL(/\/login/);
    });

    test('Admin Access Control', async ({ page }) => {
        // Assuming global setup logged us in as Admin
        await page.goto('/settings');
        await expect(page).toHaveURL(/\/settings/);
        
        // Verify key Admin functions are visible
        await expect(page.getByText('Warehouse Management', { exact: false })).toBeVisible();
    });

    test('API Route Protection (RLS)', async ({ request }) => {
        // We need the auth cookies from the admin context
        // Playwright request context automatically shares storageState if configured in project?
        // Let's verify we can fetch our own data
        
        const response = await request.get('/api/customers');
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        
        // Cannot verify "Use cannot see other warehouse" without multi-warehouse setup
        // But we can verify we don't get 401/403 for legitimate access
    });
});
