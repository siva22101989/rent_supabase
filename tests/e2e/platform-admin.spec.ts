import { test, expect } from '@playwright/test';

test.describe('Platform Admin (Super Admin) E2E', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin');
    });

    test('Admin Dashboard Overview', async ({ page }) => {
        await expect(page).toHaveURL(/admin/);
        // Fix strict mode violation: Use exact heading or first match
        await expect(page.getByRole('heading', { name: /Admin Panel/i })).toBeVisible();
        
        // Verify Stats Cards
        await expect(page.getByText(/Active Users|Warehouses/i).first()).toBeVisible();
    });

    test('Warehouse Management', async ({ page }) => {
        // Switch to Warehouses Tab (Default)
        await page.getByRole('tab', { name: /Warehouses/i }).click();
        
        // Check Table Exists
        await expect(page.getByRole('table')).toBeVisible();
        
        // Check filtering
        const searchBox = page.getByPlaceholder(/Search warehouses/i);
        if (await searchBox.isVisible()) {
            await searchBox.fill('Test');
            await page.waitForTimeout(500); 
            // Ensure table didn't crash
            await expect(page.getByRole('table')).toBeVisible();
        }
    });

    test('User Directory', async ({ page }) => {
         await page.getByRole('tab', { name: /Users/i }).click();
         await expect(page.getByRole('table')).toBeVisible();
         
         // Verify columns
         await expect(page.getByText(/Role|Email/i).first()).toBeVisible();
    });

    test('Audit Logs Access', async ({ page }) => {
        await page.getByRole('tab', { name: /Audit Logs|Activity/i }).click();
        // Check for log activity feed
        await expect(page.getByText(/Global Audit Log/i)).toBeVisible();
    });
});
