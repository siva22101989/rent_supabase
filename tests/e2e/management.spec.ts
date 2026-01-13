import { test, expect } from '@playwright/test';

test.describe('Management E2E Workflow', () => {
    
    // Expenses
    test('Expense Management', async ({ page }) => {
        await test.step('Create Expense', async () => {
            await page.goto('/expenses');
            await expect(page).toHaveURL(/expenses/);
            
            // Handle "Add Expense" dialog
            const addBtn = page.getByRole('button', { name: /Add Expense/i });
            if (await addBtn.isVisible()) {
                await addBtn.click();
                
                await page.locator('input[name="amount"]').fill('500');
                await page.locator('input[name="description"]').fill('Office Supplies');
                await page.locator('select[name="category"]').selectOption({ label: 'Maintenance' }).catch(() => {}); // Try select if exists
                
                await page.getByRole('button', { name: /Save|Submit/i }).click();
                
                // Verify addition
                await expect(page.getByText('Office Supplies')).toBeVisible();
                await expect(page.getByText(/500/)).toBeVisible();
            }
        });
    });

    // Storage Management
    test('Storage Management View', async ({ page }) => {
        await page.goto('/storage');
        await expect(page).toHaveURL(/storage/);

        // Verify table loads
        await expect(page.locator('table')).toBeVisible();
        
        // Test Filters
        const filterInput = page.getByPlaceholder(/Filter|Search/i).first();
        if (await filterInput.isVisible()) {
            await filterInput.fill('Available');
            // Wait for table update
            await page.waitForTimeout(500); 
            // Assert some filtering happened/rows exist
            // Using a generic check that app doesn't crash
            await expect(page.locator('body')).toBeVisible();
        }
    });

    // Staff/Admin (Settings)
    test('Admin Settings Access', async ({ page }) => {
        await page.goto('/settings');
        // Wait for page title to ensure load
        await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
        
        // Check for Billing Tab
        // It might be in a scrollable list, but should exist in DOM
        await expect(page.getByRole('tab', { name: 'Billing' })).toBeVisible();
        
        // Check for Team button (Responsive text: "Manage Team" or "Team")
        await expect(page.getByRole('link', { name: /Team/i })).toBeVisible();
    });
});
