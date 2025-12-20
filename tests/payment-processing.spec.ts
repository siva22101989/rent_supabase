import { test, expect } from '@playwright/test';

/**
 * Critical E2E Test: Payment Processing
 * Verifies that payments are correctly recorded and balances updated
 */

test.describe('Payment Processing Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com');
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
  });

  test('should record payment and update balance', async ({ page }) => {
    // Navigate to a customer's profile
    await page.goto('http://localhost:9002/customers');
    await page.click('[data-testid="customer-row"]:first-child');
    
    // Get initial balance
    const initialBalanceText = await page.textContent('[data-testid="total-due"]');
    const initialBalance = parseFloat(initialBalanceText?.replace(/[^0-9.]/g, '') || '0');
    
    // Add a payment
    await page.click('[data-testid="add-payment"]');
    await page.fill('input[name="amount"]', '1000');
    await page.fill('input[name="date"]', '2025-12-20');
    await page.selectOption('select[name="type"]', 'rent');
    await page.click('button[type="submit"]');
    
    // Wait for update
    await page.waitForTimeout(1000);
    
    // Verify balance decreased
    const newBalanceText = await page.textContent('[data-testid="total-due"]');
    const newBalance = parseFloat(newBalanceText?.replace(/[^0-9.]/g, '') || '0');
    
    expect(newBalance).toBe(initialBalance - 1000);
  });

  test('should show payment in transaction history', async ({ page }) => {
    await page.goto('http://localhost:9002/customers');
    await page.click('[data-testid="customer-row"]:first-child');
    
    // Add payment
    await page.click('[data-testid="add-payment"]');
    await page.fill('input[name="amount"]', '500');
    await page.fill('input[name="date"]', '2025-12-20');
    await page.fill('input[name="notes"]', 'Test payment');
    await page.click('button[type="submit"]');
    
    // Check payment appears in history
    await expect(page.locator('text=/Test payment/i')).toBeVisible();
    await expect(page.locator('text=/₹500/i')).toBeVisible();
  });

  test('should handle hamali payment separately from rent', async ({ page }) => {
    await page.goto('http://localhost:9002/customers');
    await page.click('[data-testid="customer-row"]:first-child');
    
    // Get initial hamali due
    const initialHamaliText = await page.textContent('[data-testid="hamali-due"]');
    const initialHamali = parseFloat(initialHamaliText?.replace(/[^0-9.]/g, '') || '0');
    
    // Add hamali payment
    await page.click('[data-testid="add-payment"]');
    await page.fill('input[name="amount"]', '200');
    await page.selectOption('select[name="type"]', 'hamali');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    
    // Verify hamali due decreased
    const newHamaliText = await page.textContent('[data-testid="hamali-due"]');
    const newHamali = parseFloat(newHamaliText?.replace(/[^0-9.]/g, '') || '0');
    
    expect(newHamali).toBe(initialHamali - 200);
  });

  test('should generate payment receipt', async ({ page }) => {
    await page.goto('http://localhost:9002/payments/pending');
    
    // Make a payment
    await page.click('[data-testid="record-payment"]:first-child');
    await page.fill('input[name="amount"]', '1500');
    await page.click('button[type="submit"]');
    
    // Download receipt
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-receipt"]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf/i);
  });

  test('should prevent negative payment amounts', async ({ page }) => {
    await page.goto('http://localhost:9002/customers');
    await page.click('[data-testid="customer-row"]:first-child');
    
    await page.click('[data-testid="add-payment"]');
    await page.fill('input[name="amount"]', '-100');
    
    // Should show validation error
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid.*amount/i')).toBeVisible();
  });

  test('should update payment records correctly', async ({ page }) => {
    await page.goto('http://localhost:9002/customers');
    await page.click('[data-testid="customer-row"]:first-child');
    
    // Add payment
    await page.click('[data-testid="add-payment"]');
    await page.fill('input[name="amount"]', '750');
    await page.fill('input[name="notes"]', 'Original payment');
    await page.click('button[type="submit"]');
    
    // Edit payment
    await page.click('[data-testid="edit-payment"]:first-child');
    await page.fill('input[name="amount"]', '800');
    await page.fill('input[name="notes"]', 'Updated payment');
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=/Updated payment/i')).toBeVisible();
    await expect(page.locator('text=/₹800/i')).toBeVisible();
  });

  test('should track payment method', async ({ page }) => {
    await page.goto('http://localhost:9002/customers');
    await page.click('[data-testid="customer-row"]:first-child');
    
    await page.click('[data-testid="add-payment"]');
    await page.fill('input[name="amount"]', '1000');
    await page.selectOption('select[name="method"]', 'upi');
    await page.fill('input[name="reference"]', 'UPI123456');
    await page.click('button[type="submit"]');
    
    // Verify payment method recorded
    await expect(page.locator('text=/UPI/i')).toBeVisible();
    await expect(page.locator('text=/UPI123456/i')).toBeVisible();
  });
});
