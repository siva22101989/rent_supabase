import { test, expect } from '@playwright/test';

test.describe('Full Scale Regression Suite', () => {
    
    // Setup: Login once before all tests
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        // Fill credentials (these should be in .env.test or generic test account)
        await page.getByLabel(/Email|Mobile/i).fill('nikhilpnkr@gmail.com');
        await page.getByLabel('Password', { exact: true }).fill('123456');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL('/', { timeout: 15000 });
    });

    test('End-to-End Warehouse Lifecycle', async ({ page }) => {
        // --- 1. Customer Creation ---
        console.log('Step 1: Create Customer');
        const customerName = `RegUser_${Date.now()}`;
        await page.goto('/inflow'); // Use inflow shortcut to add customer
        
        // Open Customer Select
        await page.locator('#customerId').click();
        
        // Click Add Customer
        await page.getByRole('button', { name: 'Add Customer' }).click();
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        await dialog.getByLabel('Name').fill(customerName);
        await dialog.getByLabel('Address').fill('123 Test Lane');
        await dialog.getByLabel('Phone').fill('9998887777'); // Fixed test number
        await dialog.getByRole('button', { name: 'Save Customer' }).click();
        
        await expect(page.getByText('Success')).toBeVisible();
        await expect(dialog).toBeHidden();

        // --- 2. Inflow (deposit) ---
        console.log('Step 2: Create Inflow');
        // Select the newly created customer (it usually auto-selects or appears first)
        await page.locator('#customerId').click();
        await page.locator('#customerId').fill(customerName); // Search
        await page.keyboard.press('Enter');

        // Select Crop
        await page.locator('#cropId').click();
        await page.getByRole('option').first().click();

        // Select Lot (Available)
        await page.locator('#lotId').click();
        const availableLot = page.getByRole('option').filter({ hasText: /Available/ }).first();
        await availableLot.click();

        // Fill Details
        const bagsIn = '50';
        await page.getByLabel('No. of Bags').fill(bagsIn);
        await page.getByLabel('Hamali Rate').fill('10');
        await page.getByRole('button', { name: 'Create Storage Record' }).click();

        // Verify Receipt
        await expect(page).toHaveURL(/\/inflow\/receipt\//);
        const receiptId = await page.getByText(/REC-\d+/).first().innerText();
        console.log(`Receipt Created: ${receiptId}`);

        // --- 3. Dashboard Verification ---
        console.log('Step 3: Verify Dashboard');
        await page.goto('/');
        // Ensure "Recent Activity" shows our new record
        await expect(page.getByText(customerName)).toBeVisible();
        await expect(page.getByText(bagsIn)).toBeVisible();

        // --- 4. Outflow (Withdrawal) & Billing ---
        console.log('Step 4: Process Outflow');
        await page.goto('/outflow');
        
        // Select Customer
        await page.locator('#customerId').click();
        await page.getByRole('option', { name: customerName }).click();

        // Select Record
        await page.locator('#recordId').click();
        await page.getByRole('option').first().click(); // Should be our record

        // Validate Bags Available displayed
        await expect(page.getByText(`Available: ${bagsIn}`)).toBeVisible();

        // Withdraw Half
        const bagsOut = '25';
        await page.getByLabel('Bags to Withdraw').fill(bagsOut);
        
        // Check Billing Preview (if implemented) or just Submit
        await page.getByRole('button', { name: 'Process Withdrawal' }).click();

        // --- 5. Verify Invoice ---
        console.log('Step 5: Verify Invoice');
        await expect(page).toHaveURL(/\/outflow\/receipt\//);
        await expect(page.getByText('Total Rent')).toBeVisible();
        
        // Calculate expected rent (roughly)
        // 25 bags * duration (approx 0 months) * rate
        // Usually min rent applies or 0 if immediate.
        
        console.log('✅ Full E2E Cycle Completed Successfully');
    });
});
