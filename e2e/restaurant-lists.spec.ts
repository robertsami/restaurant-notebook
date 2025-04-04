import { test, expect } from '@playwright/test';

test.describe('Restaurant Lists', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/auth/signin');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display user lists on dashboard', async ({ page }) => {
    // Check if lists are displayed
    await expect(page.getByText('Chicago Eats')).toBeVisible();
    await expect(page.getByText('Date Nights')).toBeVisible();
  });

  test('should navigate to list details page', async ({ page }) => {
    // Click on a list
    await page.getByText('Chicago Eats').click();
    
    // Check if we're on the list details page
    await expect(page.getByRole('heading', { name: 'Chicago Eats' })).toBeVisible();
    
    // Check if restaurants in the list are displayed
    await expect(page.getByText('Lou Malnati\'s Pizzeria')).toBeVisible();
    await expect(page.getByText('Alinea')).toBeVisible();
  });

  test('should create a new list', async ({ page }) => {
    // Click create new list button
    await page.getByRole('link', { name: 'Create New List' }).click();
    
    // Fill in the form
    await page.getByLabel('Title').fill('Test List');
    await page.getByLabel('Description').fill('This is a test list');
    
    // Submit the form
    await page.getByRole('button', { name: 'Create List' }).click();
    
    // Check if we're redirected to the new list page
    await expect(page.getByRole('heading', { name: 'Test List' })).toBeVisible();
    
    // Check if the list is empty
    await expect(page.getByText('No restaurants in this list yet')).toBeVisible();
  });

  test('should add a restaurant to a list', async ({ page }) => {
    // Go to a list
    await page.goto('/dashboard');
    await page.getByText('Chicago Eats').click();
    
    // Click add restaurant button
    await page.getByRole('button', { name: 'Add Restaurant' }).click();
    
    // Search for a restaurant
    await page.getByLabel('Restaurant Name').fill('Nobu');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Select the restaurant from search results
    await page.getByText('Nobu, Los Angeles, CA').click();
    
    // Submit the form
    await page.getByRole('button', { name: 'Add to List' }).click();
    
    // Check if the restaurant was added
    await expect(page.getByText('Nobu')).toBeVisible();
  });
});