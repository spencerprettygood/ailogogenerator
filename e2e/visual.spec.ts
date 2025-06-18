import { test, expect } from '@playwright/test';

test.describe('Visual regression tests', () => {
  test('Homepage should match visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
    
    // Take a screenshot for comparison
    const screenshot = await page.screenshot();
    
    // Compare with baseline (first run will create the baseline)
    expect(screenshot).toMatchSnapshot('homepage.png');
  });

  test('Header should match visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Capture just the header
    const headerScreenshot = await page.locator('header').screenshot();
    
    // Compare with baseline
    expect(headerScreenshot).toMatchSnapshot('header.png');
  });

  test('Button styles should match visual baseline', async ({ page }) => {
    // Go to component test page (you'll need to create this)
    await page.goto('/ui-test');
    
    // Find the button container
    const buttonContainer = page.locator('[data-testid="button-showcase"]');
    
    // Take screenshot of just the buttons
    const buttonScreenshot = await buttonContainer.screenshot();
    
    // Compare with baseline
    expect(buttonScreenshot).toMatchSnapshot('buttons.png');
  });

  test('Dark mode should match visual baseline', async ({ page }) => {
    await page.goto('/');
    
    // Toggle dark mode
    await page.locator('button[aria-label="Toggle theme"]').click();
    
    // Wait for theme to apply
    await page.waitForTimeout(500);
    
    // Take a screenshot
    const darkModeScreenshot = await page.screenshot();
    
    // Compare with baseline
    expect(darkModeScreenshot).toMatchSnapshot('homepage-dark.png');
  });
});