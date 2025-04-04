import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to sign in page from home page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign In' }).first().click();
    await expect(page).toHaveURL('/auth/signin');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should navigate to sign up page from home page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL('/auth/signup');
    await expect(page.getByRole('heading', { name: 'Create an Account' })).toBeVisible();
  });

  test('should show validation errors on sign up form', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Submit empty form
    await page.getByRole('button', { name: 'Sign Up' }).click();
    
    // Check for validation messages
    await expect(page.getByText('Please fill out this field')).toBeVisible();
  });

  test('should show validation errors on sign in form', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Check for validation messages
    await expect(page.getByText('Please fill out this field')).toBeVisible();
  });

  test('should sign in with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill in the form with test user credentials
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('password');
    
    // Submit the form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Check redirection to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});