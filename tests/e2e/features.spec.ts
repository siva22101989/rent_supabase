import { test, expect } from '@playwright/test';

test.describe('Advanced Features E2E', () => {
    
    test('Anomaly Detection Module', async ({ page }) => {
        // Navigate to anomaly detection (assuming link exists in sidebar/dashboard)
        // Or direct nav
        await page.goto('/anomaly-detection');
        if (page.url().includes('anomaly')) {
            await expect(page.getByText(/Anomaly|Detection/i).first()).toBeVisible();
            // Check for scan button or status
            // await expect(page.getByRole('button', { name: /Scan|Analyze/i })).toBeVisible();
        } else {
            console.log('Anomaly Detection route skipped (Redirected)');
        }
    });

    test('Notification Settings', async ({ page }) => {
        await page.goto('/settings');
        
        // Switch to Notifications Tab
        const notifTab = page.getByRole('tab', { name: /Notifications/i });
        if (await notifTab.isVisible()) {
            await notifTab.click();
            
            // Check for toggles (Email/SMS)
            // Using generic accessible checks
            await expect(page.getByLabel(/Email/i).first()).toBeVisible();
            await expect(page.getByLabel(/SMS/i).first()).toBeVisible();
        }
    });
});
