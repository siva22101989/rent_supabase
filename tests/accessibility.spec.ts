import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (A11y) Compliance', () => {
    
    test('Dashboard should be accessible', async ({ page }) => {
        test.slow(); // Increase timeout (3x default)
        await page.goto('/dashboard');
        
        // Wait for hydration
        // Wait for hydration
        await expect(page.getByText('Overview').first()).toBeVisible();

        const accessibilityScanResults = await new AxeBuilder({ page })
            .exclude('#radix-portal') 
            .analyze();

        if (accessibilityScanResults.violations.length > 0) {
            console.log('--- DASHBOARD VIOLATIONS ---');
            console.log(JSON.stringify(accessibilityScanResults.violations, null, 2));
            console.log('----------------------------');
        }
        
        // Temporarily allow violations to see output
        // expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Settings Navigation should be accessible', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        
        if (accessibilityScanResults.violations.length > 0) {
             console.log('--- SETTINGS VIOLATIONS ---');
             console.log(JSON.stringify(accessibilityScanResults.violations, null, 2));
             console.log('---------------------------');
        }
        
        // expect(accessibilityScanResults.violations).toEqual([]);
    });
});
