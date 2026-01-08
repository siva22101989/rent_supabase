import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Login', { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel(/Email|Mobile/i)).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Email|Mobile/i).fill('wrong@example.com');
    await page.getByLabel('Password', { exact: true }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // The error message comes from Supabase but is mapped to a friendly version
    await expect(page.locator('text=Incorrect email or password')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Email|Mobile/i).fill('siva01@gmail.com');
    await page.getByLabel('Password', { exact: true }).fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard|^\/$/i);
    // Check if a dashboard element is visible (e.g. "Inventory Overview" or "Dashboard")
    await expect(page.getByText(/Dashboard|Overview/i).first()).toBeVisible();
  });
});
