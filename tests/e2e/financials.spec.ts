import { test, expect } from '@playwright/test';
import { cleanupTestData } from '../utils/seed-data';

test.describe('Financials E2E Workflow', () => {
    const customerName = `FinTest_User_${Date.now()}`;

    test.afterAll(async () => {
        await cleanupTestData('FinTest_%');
    });

    test('Rent Calculation & Payment Logic', async ({ page }) => {
        // 1. Setup Data: Create Customer & Inflow
        await test.step('Setup: Create Customer & Stock', async () => {
            await page.goto('/customers');
            const addButton = page.getByRole('button', { name: 'Add Customer' });
            await expect(addButton).toBeVisible();
            await addButton.click();
            
            const dialog = page.locator('[role="dialog"]');
            await dialog.getByLabel('Name').fill(customerName);
            await dialog.getByLabel("Father's Name").fill('Test Father');
            await dialog.getByLabel('Village').fill('Test Village');
            await dialog.getByLabel('Address').fill('Test Address');
            await dialog.getByLabel('Phone').fill('1234567890');
            await dialog.getByRole('button', { name: 'Save Customer' }).click();
            await expect(page.getByText('Success')).toBeVisible();

            // Create Inflow
            await page.goto('/inflow');
            await expect(page.locator('form')).toBeVisible();
            await page.getByRole('combobox').first().click();
            await page.getByRole('option', { name: customerName }).first().click();
            
            await page.locator('#cropId').click();
            await page.getByRole('option').first().click();
            
            await page.locator('#lotId').click();
            const availableLot = page.getByRole('option').filter({ hasText: /Available/ }).first();
            await availableLot.click();
            
            await page.getByLabel('No. of Bags').fill('100');
            await page.getByLabel('Hamali Rate').fill('10'); // 10 * 100 = 1000 Hamali
            await page.getByRole('button', { name: 'Create Storage Record' }).click();
            await expect(page).toHaveURL(/\/inflow\/receipt\//);
        });

        // 2. Validate Initial Dues (Hamali)
        await test.step('Validate Initial Hamali Dues', async () => {
             await page.goto('/customers');
             await page.getByPlaceholder(/Search/i).fill(customerName);
             await page.keyboard.press('Enter');
             await page.getByText(customerName).first().click();
             
             // Check Hamali Due (Selector based on previous tests, might need adjustment)
             // Using text locator for resilience
             await expect(page.locator('text=₹1,000')).toBeVisible(); 
        });

        // 3. Negative Payment Validation
        await test.step('Validate Negative Payment', async () => {
            const payBtn = page.getByRole('button', { name: /Record Payment|Add Payment/i });
             // Need to ensure we are on the right screen
             if (await payBtn.isVisible()) {
                 await payBtn.click();
                 await page.locator('input[name="amount"]').fill('-100');
                 await page.getByRole('button', { name: /Submit|Save/i }).click();
                 await expect(page.getByText(/invalid|positive/i)).toBeVisible();
                 await page.keyboard.press('Escape'); // Close dialog
             }
        });

        // 4. Record Partial Payment
        await test.step('Record Payment', async () => {
             const payBtn = page.getByRole('button', { name: /Record Payment|Add Payment/i });
             await payBtn.click();
             await page.locator('input[name="amount"]').fill('500');
             await page.getByRole('button', { name: /Submit|Save/i }).click();
             
             // Wait for balance update
             await expect(page.locator('text=₹500')).toBeVisible(); // 1000 - 500 = 500 Remaining
        });
    });
});
