import { test, expect } from '@playwright/test';

test('should navigate to the login page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/.*\/auth\/signin/);
});