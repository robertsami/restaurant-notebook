import { test, expect } from '@playwright/test';

test.describe('AI Features', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/auth/signin');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should summarize a note', async ({ page }) => {
    // Navigate to a restaurant with a note
    await page.goto('/dashboard');
    await page.getByText('Chicago Eats').click();
    await page.getByText('Lou Malnati\'s Pizzeria').click();
    
    // Check if there's a note
    await expect(page.getByText('Best deep dish pizza in Chicago!')).toBeVisible();
    
    // Click summarize button
    await page.getByRole('button', { name: 'Summarize Note' }).click();
    
    // Check if summary is displayed
    await expect(page.getByText('Summary')).toBeVisible();
    await expect(page.getByTestId('note-summary')).not.toBeEmpty();
  });

  test('should generate tags for a restaurant', async ({ page }) => {
    // Navigate to a restaurant
    await page.goto('/dashboard');
    await page.getByText('Chicago Eats').click();
    await page.getByText('Lou Malnati\'s Pizzeria').click();
    
    // Click generate tags button
    await page.getByRole('button', { name: 'Generate Tags' }).click();
    
    // Check if tags are generated
    await expect(page.getByTestId('ai-generated-tags')).toBeVisible();
    await expect(page.getByText('AI Generated')).toBeVisible();
  });

  test('should suggest new restaurants', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Click on restaurant suggestions
    await page.getByRole('link', { name: 'Get Suggestions' }).click();
    
    // Check if suggestions page is loaded
    await expect(page.getByRole('heading', { name: 'Restaurant Suggestions' })).toBeVisible();
    
    // Click generate suggestions button
    await page.getByRole('button', { name: 'Generate Suggestions' }).click();
    
    // Check if suggestions are displayed
    await expect(page.getByTestId('restaurant-suggestions')).toBeVisible();
    await expect(page.getByText('Based on your preferences')).toBeVisible();
  });
});