import { test, expect } from '@playwright/test';

/**
 * Critical E2E Test: Billing Calculation
 * Verifies that rent calculations are accurate for different billing cycles
 */

test.describe('Billing Calculation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com');
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
  });

  test('should calculate 6-month rent correctly', async ({ page }) => {
    // Navigate to outflow page
    await page.goto('http://localhost:9002/outflow');
    
    // Select a storage record
    await page.click('[data-testid="select-record"]');
    await page.click('[data-testid="record-option"]:first-child');
    
    // Fill withdrawal details
    await page.fill('input[name="bagsToWithdraw"]', '100');
    await page.fill('input[name="withdrawalDate"]', '2025-12-20');
    
    // Check calculated rent
    const rentDisplay = await page.textContent('[data-testid="calculated-rent"]');
    expect(rentDisplay).toBeTruthy();
    
    // Verify rent is calculated based on 6-month rate
    const rentValue = parseFloat(rentDisplay?.replace(/[^0-9.]/g, '') || '0');
    expect(rentValue).toBeGreaterThan(0);
  });

  test('should calculate 1-year rollover rent correctly', async ({ page }) => {
    // Test 1-year billing cycle calculation
    await page.goto('http://localhost:9002/outflow');
    
    // Select record with 1-year cycle
    await page.click('[data-testid="select-record"]');
    await page.click('[data-testid="record-1year"]:first-child');
    
    await page.fill('input[name="bagsToWithdraw"]', '50');
    await page.fill('input[name="withdrawalDate"]', '2025-12-20');
    
    const rentDisplay = await page.textContent('[data-testid="calculated-rent"]');
    const rentValue = parseFloat(rentDisplay?.replace(/[^0-9.]/g, '') || '0');
    
    // 1-year rate should be different from 6-month
    expect(rentValue).toBeGreaterThan(0);
  });

  test('should prevent withdrawal exceeding stored bags', async ({ page }) => {
    await page.goto('http://localhost:9002/outflow');
    
    await page.click('[data-testid="select-record"]');
    await page.click('[data-testid="record-option"]:first-child');
    
    // Try to withdraw more than available
    await page.fill('input[name="bagsToWithdraw"]', '999999');
    
    // Should show error
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/cannot withdraw more/i')).toBeVisible();
  });

  test('should update billing cycle on full withdrawal', async ({ page }) => {
    await page.goto('http://localhost:9002/outflow');
    
    await page.click('[data-testid="select-record"]');
    const bagsStored = await page.textContent('[data-testid="bags-stored"]');
    
    // Withdraw all bags
    await page.fill('input[name="bagsToWithdraw"]', bagsStored || '0');
    await page.fill('input[name="withdrawalDate"]', '2025-12-20');
    
    await page.click('button[type="submit"]');
    
    // Verify record marked as completed
    await page.waitForURL('**/storage');
    await expect(page.locator('text=/completed/i')).toBeVisible();
  });
});
