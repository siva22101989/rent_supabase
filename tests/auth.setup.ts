import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adminFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  // 1. Navigate to login
  await page.goto('/login');

  // 2. Perform login
  // Uses configured admin email or fallback to known test admin
  await page.getByLabel(/Email|Mobile/i).fill('admin@gmail.com');
  await page.getByLabel('Password', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Login' }).click();

  // 3. Wait for dashboard and verify
  await page.waitForURL(/\/dashboard|^\/$/i);
  await expect(page.getByText(/Dashboard|Overview/i).first()).toBeVisible();

  // 4. Save storage state (cookies, local storage)
  await page.context().storageState({ path: adminFile });
});
