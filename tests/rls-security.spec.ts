import { test, expect } from '@playwright/test';

/**
 * Critical E2E Test: RLS Security
 * Verifies that warehouses cannot access each other's data
 */

test.describe('RLS Security Tests', () => {
  test('warehouse A cannot see warehouse B data', async ({ page, context }) => {
    // Login as Warehouse A user
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', process.env.TEST_WAREHOUSE_A_EMAIL || 'warehouse-a@test.com');
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Get Warehouse A's customer count
    await page.goto('http://localhost:9002/customers');
    const warehouseACustomers = await page.locator('[data-testid="customer-row"]').count();
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=/log out/i');
    
    // Login as Warehouse B user
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', process.env.TEST_WAREHOUSE_B_EMAIL || 'warehouse-b@test.com');
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Get Warehouse B's customer count
    await page.goto('http://localhost:9002/customers');
    const warehouseBCustomers = await page.locator('[data-testid="customer-row"]').count();
    
    // Verify they see different data
    expect(warehouseACustomers).not.toBe(warehouseBCustomers);
  });

  test('cannot access other warehouse data via API', async ({ request }) => {
    // Login as Warehouse A
    const loginResponse = await request.post('http://localhost:9002/api/auth/login', {
      data: {
        email: process.env.TEST_WAREHOUSE_A_EMAIL || 'warehouse-a@test.com',
        password: process.env.TEST_PASSWORD || 'password123'
      }
    });
    
    const cookies = await loginResponse.headers()['set-cookie'];
    
    // Try to access Warehouse B's data directly
    const response = await request.get('http://localhost:9002/api/customers', {
      headers: {
        'Cookie': cookies || ''
      },
      params: {
        warehouse_id: process.env.TEST_WAREHOUSE_B_ID || 'other-warehouse-id'
      }
    });
    
    // Should return empty or error, not Warehouse B's data
    const data = await response.json();
    expect(data.length).toBe(0);
  });

  test('super admin can see all warehouses', async ({ page }) => {
    // Login as super admin
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', process.env.TEST_SUPER_ADMIN_EMAIL || 'superadmin@test.com');
    await page.fill('input[type="password"]', process.env.TEST_SUPER_ADMIN_PASSWORD || 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Navigate to admin panel
    await page.goto('http://localhost:9002/admin');
    
    // Should see multiple warehouses
    const warehouseCount = await page.locator('[data-testid="warehouse-row"]').count();
    expect(warehouseCount).toBeGreaterThan(1);
  });

  test('staff cannot access admin functions', async ({ page }) => {
    // Login as staff
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', process.env.TEST_STAFF_EMAIL || 'staff@test.com');
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Try to access admin panel
    await page.goto('http://localhost:9002/admin');
    
    // Should be redirected or show error
    await expect(page).not.toHaveURL('**/admin');
  });

  test('sequences are isolated per warehouse', async ({ page }) => {
    // Login as Warehouse A
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', process.env.TEST_WAREHOUSE_A_EMAIL || 'warehouse-a@test.com');
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    
    // Create a record and note the number
    await page.goto('http://localhost:9002/inflow');
    await page.click('[data-testid="create-record"]');
    const recordNumberA = await page.textContent('[data-testid="record-number"]');
    
    // Logout and login as Warehouse B
    await page.click('[data-testid="user-menu"]');
    await page.click('text=/log out/i');
    
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', process.env.TEST_WAREHOUSE_B_EMAIL || 'warehouse-b@test.com');
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    
    // Create a record in Warehouse B
    await page.goto('http://localhost:9002/inflow');
    await page.click('[data-testid="create-record"]');
    const recordNumberB = await page.textContent('[data-testid="record-number"]');
    
    // Verify different sequence numbers
    expect(recordNumberA).not.toBe(recordNumberB);
  });
});
