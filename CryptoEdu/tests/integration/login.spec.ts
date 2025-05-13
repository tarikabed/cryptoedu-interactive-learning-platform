import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('renders login form', async ({ page }) => {
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.fill('input[placeholder="Email"]', 'hb01395@surrey.uk'); //wrong email
    await page.fill('input[placeholder="Password"]', 'hasoor123');
    await page.click('button:has-text("Login")');

    // Wait and check for the error message
    await expect(page.locator('text=Invalid login credentials')).toBeVisible();
  });

  test('logs in and redirects to /home with real Supabase user', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  
    await page.fill('input[placeholder="Email"]', 'hb01395@surrey.ac.uk');
    await page.fill('input[placeholder="Password"]', 'hasoor123');
    await page.click('button:has-text("Login")');
  
    await page.waitForURL('**/home', { timeout: 10000 });
    await expect(page).toHaveURL(/\/home/);
  });
  
});3
