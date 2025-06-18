import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility tests', () => {
  test('Homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');
    
    // Run axe on the page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Logo generation interface should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Fill in a test prompt
    await page.getByRole('textbox').fill('Create a minimalist logo for a tech startup called "Quantum"');
    await page.getByRole('button', { name: /Generate/i }).click();
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="logo-preview"]', { timeout: 60000 });
    
    // Run axe on the page with results visible
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    
    // Run axe specifically checking for color contrast issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      .analyze();
    
    // Filter to only get color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    // Assert no contrast violations
    expect(contrastViolations).toEqual([]);
  });
});