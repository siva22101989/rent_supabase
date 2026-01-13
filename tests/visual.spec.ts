import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing', () => {
    
    test('Dashboard Visual Baseline', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByText(/Overview/i)).toBeVisible();
        
        // Mask dynamic content (dates, stats that change)
        await expect(page).toHaveScreenshot('dashboard-page.png', {
            mask: [page.locator('.text-2xl.font-bold')], // Mask big numbers
            fullPage: true,
            maxDiffPixelRatio: 0.05 // Allow small rendering diffs
        });
    });

    test('Financial Reports Visual Baseline', async ({ page }) => {
        await page.goto('/reports/financial');
        await expect(page).toHaveURL(/reports\/financial/);
        
        await expect(page).toHaveScreenshot('financial-reports.png', {
             fullPage: true
        });
    });

    // Component Level Test
    test('Activity Feed Component', async ({ page }) => {
        await page.goto('/dashboard');
        const feed = page.locator('div').filter({ hasText: 'Recent Activity' }).first();
        if (await feed.isVisible()) {
             await expect(feed).toHaveScreenshot('recent-activity-widget.png', {
                mask: [page.locator('span.text-xs')] // Mask timestamps
             });
        }
    });

});
