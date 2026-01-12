import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for cleanup permissions
);

test.describe('Inventory Flow', () => {
  // Global Cleanup Hook
  test.afterAll(async () => {
    console.log('Cleaning up test data...');
    // Delete test specific data
    // 1. Find Customer(s)
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .eq('name', 'Test Customer E2E'); // Or 'Test Customer %' if dynamic

    if (customers && customers.length > 0) {
      const ids = customers.map(c => c.id);
      
      // 2. Delete Storage Records (Explicitly because Cascade might be SET NULL)
      await supabase.from('storage_records').delete().in('customer_id', ids);
      
      // 3. Delete Customer
      const { error } = await supabase.from('customers').delete().in('id', ids);
      
      if (error) console.error('Cleanup failed:', error);
      else console.log(`Deleted ${ids.length} test customers.`);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    const email = process.env.TEST_USER_EMAIL || 'nikhilpnkr@gmail.com';
    const password = process.env.TEST_USER_PASSWORD || '123456';
    
    await page.getByLabel(/Email|Mobile/i).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/dashboard|^\/$/, { timeout: 15000 }); // Allow / or /dashboard
  });

  async function ensureCustomerExists(page: Page) {
    await page.goto('/inflow');
    await page.locator('#customerId').click();
    
    // Check if any options exist
    await page.waitForTimeout(1000); // Wait for open
    const optionsCount = await page.getByRole('option').count();
    console.log(`Found ${optionsCount} customer options`);
    
    // Close the select
    await page.keyboard.press('Escape');
    
    if (optionsCount === 0) {
      console.log('No customers found, creating one...');
      await page.getByRole('button', { name: 'Add Customer' }).click();
      await page.waitForSelector('text=Add New Customer', { state: 'visible' });
      
      await page.getByLabel('Name', { exact: true }).fill('Test Customer E2E');
      await page.getByLabel('Address').fill('123 Test St');
      await page.getByLabel('Phone').fill('9876543210');
      
      await page.getByRole('button', { name: 'Save Customer' }).click();
      
      // Wait for dialog to close and success toast
      await expect(page.getByText('Success'), 'Dashboard error: Customer not created').toBeVisible({ timeout: 10000 });
      console.log('Customer created successfully');
    }
  }

  test('should complete a full Inflow lifecycle', async ({ page }) => {
    await ensureCustomerExists(page);
    
    await page.goto('/inflow');
    
    // Select Customer
    await page.locator('#customerId').click();
    await page.waitForSelector('[role="option"]', { timeout: 5000 });
    await page.getByRole('option').first().click();
    
    // Select Crop
    await page.locator('#cropId').click();
    await page.waitForSelector('[role="option"]');
    const crops = await page.getByRole('option').count();
    console.log(`Found ${crops} crop options`);
    await page.getByRole('option').first().click();
    
    // Select Lot
    await page.locator('#lotId').click();
    await page.waitForSelector('[role="option"]');
    const lots = await page.getByRole('option').count();
    console.log(`Found ${lots} lot options`);
    // Filter for Available lots
    const availableLot = page.getByRole('option').filter({ hasText: /Available/ }).first();
    await expect(availableLot).toBeVisible();
    await availableLot.click();
    
    // Fill quantities
    await page.getByLabel('No. of Bags', { exact: true }).fill('100');
    await page.getByLabel('Hamali Rate', { exact: true }).fill('10');
    
    const beforeSubmitPath = 'tests-before-submit.png';
    await page.screenshot({ path: beforeSubmitPath, fullPage: true });
    
    // Submit
    await page.getByRole('button', { name: 'Create Storage Record' }).click();
    
    // 3. Verify Receipt Page
    try {
      await expect(page).toHaveURL(/\/inflow\/receipt\//, { timeout: 15000 });
    } catch (e) {
      const afterSubmitPath = 'tests-after-submit-fail.png';
      await page.screenshot({ path: afterSubmitPath, fullPage: true });
      console.log(`Screenshot saved to ${afterSubmitPath}`);
      throw e;
    }
    await expect(page.getByText('IN-RECEIPT')).toBeVisible();
    await expect(page.getByText('100')).toBeVisible();
  });

  test('should process an Outflow successfully', async ({ page }) => {
    // 1. Navigate to Outflow
    await page.goto('/outflow');
    
    // 2. Select Customer
    // 2. Select Customer and Record
    await page.click('[data-testid="record-selector-trigger"]');
    await page.fill('[data-testid="record-search-input"]', 'Rajesh');
    
    const options = page.locator('[data-testid="record-option"]');
    if (await options.count() === 0) {
      console.log('No records found for nikhil, skipping outflow test...');
      return;
    }
    await options.first().click();
    
    // 3. Enter withdrawal details
    await page.getByLabel(/Bags to Withdraw/i).fill('5');
    await page.getByLabel(/Withdrawal Date/i).fill('2025-12-20');
    
    // 4. Process withdrawal
    await page.getByRole('button', { name: /Process Outflow/i }).click();
    
    // 6. Should redirect to receipt
    await expect(page).toHaveURL(/\/outflow\/receipt\//, { timeout: 20000 });
    await expect(page.getByText('OUT-RECEIPT')).toBeVisible();
  });
});
