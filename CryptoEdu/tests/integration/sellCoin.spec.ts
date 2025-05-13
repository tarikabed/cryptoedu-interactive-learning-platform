import { test, expect } from '@playwright/test';

test('selects Bitcoin and places a buy bid of 0.01 BTC', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[placeholder="Email"]', 'hb01395@surrey.ac.uk');
  await page.fill('input[placeholder="Password"]', 'hasoor123');
  await page.click('button:has-text("Login")');

  // Wait for redirect and page load
  await page.waitForURL('**/home', { timeout: 15000 });

  // Navigate to trader
  await page.goto('http://localhost:3000/trader');

  // Wait for Bitcoin card and click it
  const bitcoinCard = page.getByText('Bitcoin', { exact: true });
  await expect(bitcoinCard).toBeVisible({ timeout: 10000 });
  await bitcoinCard.click();

  // Confirm trading panel is loaded
  await page.waitForTimeout(5000);
  await expect(page.getByText(/Live Chart/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Trading Panel/i)).toBeVisible({ timeout: 10000 });

  // Wait for prices and balance to be visible
  const askPrice = page.locator('div:has-text("Ask Price") + div');
  await expect(askPrice).toContainText('$');

  await expect(page.getByText(/Available CryptoBux/i)).toBeVisible();

  // Click Buy tab (not submit)
  const sellTab = page.getByRole('button', { name: 'Sell', exact: true });
  await sellTab.click();
  
  // Fill quantity
  const quantityInput = page.locator('input[type="number"]');
  await quantityInput.fill('0.01');

  // Submit buy
  const sellSubmitButton = page.locator('button[type="submit"]');
  await sellSubmitButton.click();

  // Optional: Wait a bit for backend to process
  await page.waitForTimeout(5000);

  // Screenshot for debug
  await page.screenshot({ path: 'after-trade.png' });

  // Check success message
  await expect(page.locator('text=Successfully sold 0.01 bitcoin')).toBeVisible({ timeout: 10000 });
});
