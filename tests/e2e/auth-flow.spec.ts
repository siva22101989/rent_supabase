import { test, expect } from '@playwright/test';

// These tests require a fresh session, so we don't use the global admin state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should reject invalid credentials', async ({ page }) => {
        await page.getByLabel(/Email|Mobile/i).fill('wrong@test.com');
        await page.getByLabel('Password', { exact: true }).fill('wrongpass');
        await page.getByRole('button', { name: 'Login' }).click();
        
        // Expect error toast or message
        // Adjust text selector based on actual app behavior
        await expect(page.getByText(/Invalid login credentials|error/i)).toBeVisible();
        await expect(page).toHaveURL(/\/login/);
    });

    test('should validate empty fields', async ({ page }) => {
        await page.getByRole('button', { name: 'Login' }).click();
        // Native HTML validation or UI error
        // Playwright can check validationMessage for native inputs
        // Or check simply that we didn't navigate
        await expect(page).toHaveURL(/\/login/);
    });

    test('should logout successfully', async ({ page }) => {
        // 1. Perform valid login first (inline for this test)
        await page.getByLabel(/Email|Mobile/i).fill('nikhilpnkr@gmail.com');
        await page.getByLabel('Password', { exact: true }).fill('123456');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(/\/dashboard|^\/$/i);
        
        // 2. Find and click Login (Logout is usually in profile menu)
        // Adjust selector: often an Avatar or 'Logout' button
        // Looking for explicit 'Logout' or profile menu trigger
        const profileMenu = page.locator('button[aria-haspopup="menu"]').first();
        if (await profileMenu.isVisible()) {
            await profileMenu.click();
            await page.getByRole('menuitem', { name: /Logout|Log out/i }).click();
        } else {
            // Fallback: maybe exact 'Logout' button is visible
             await page.getByText(/Logout|Sign out/i).click();
        }

        // 3. Verify return to login
        await expect(page).toHaveURL(/\/login/);
    });
});
