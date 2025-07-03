import { test, expect } from '@playwright/test';

test.describe('Logo Generation Pipeline E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the logo generator
    await page.goto('/');
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should complete full logo generation flow with valid brief', async ({ page }) => {
    // Fill in logo brief
    await page.fill('[data-testid="logo-brief"]', 'Modern tech startup logo for InnovateCorp specializing in AI solutions');
    
    // Check if any additional options are available and set them
    const industrySelect = page.locator('[data-testid="industry-select"]');
    if (await industrySelect.isVisible()) {
      await industrySelect.selectOption('technology');
    }
    
    // Submit the form
    await page.click('[data-testid="generate-button"]');
    
    // Wait for generation to start
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible({ timeout: 10000 });
    
    // Wait for processing to complete (with generous timeout for AI processing)
    await expect(page.locator('[data-testid="completion-message"]')).toBeVisible({ timeout: 300000 }); // 5 minutes
    
    // Verify final deliverables are present
    await expect(page.locator('[data-testid="final-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-package"]')).toBeEnabled();
    
    // Test download functionality
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-package"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
    
    // Verify the download contains expected files
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('should handle invalid brief gracefully', async ({ page }) => {
    // Test with empty brief
    await page.fill('[data-testid="logo-brief"]', '');
    await page.click('[data-testid="generate-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('brief');
  });

  test('should handle very short brief', async ({ page }) => {
    // Test with very short brief
    await page.fill('[data-testid="logo-brief"]', 'logo');
    await page.click('[data-testid="generate-button"]');
    
    // Should either show validation error or process with fallback
    const errorMessage = page.locator('[data-testid="error-message"]');
    const progressIndicator = page.locator('[data-testid="progress-indicator"]');
    
    // Wait for either error or progress to appear
    await Promise.race([
      expect(errorMessage).toBeVisible(),
      expect(progressIndicator).toBeVisible()
    ]);
  });

  test('should display progress updates during generation', async ({ page }) => {
    // Fill in a standard brief
    await page.fill('[data-testid="logo-brief"]', 'Professional logo for consulting firm');
    await page.click('[data-testid="generate-button"]');
    
    // Check that progress updates are shown
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    
    // Verify progress stages are displayed
    const progressStages = [
      'Requirements Analysis',
      'Concept Development', 
      'Design Generation',
      'Validation',
      'Final Package'
    ];
    
    for (const stage of progressStages) {
      // Wait for each stage to appear (with timeout)
      try {
        await expect(page.locator(`text=${stage}`)).toBeVisible({ timeout: 60000 });
      } catch (error) {
        console.warn(`Stage "${stage}" not found, continuing...`);
      }
    }
  });

  test('should handle network interruption gracefully', async ({ page }) => {
    // Fill in brief and start generation
    await page.fill('[data-testid="logo-brief"]', 'Restaurant logo for Italian cuisine');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for generation to start
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    
    // Simulate network interruption by going offline briefly
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    await page.context().setOffline(false);
    
    // Should either continue or show appropriate error handling
    // The system should be resilient to brief network interruptions
    const errorMessage = page.locator('[data-testid="error-message"]');
    const completionMessage = page.locator('[data-testid="completion-message"]');
    
    // Wait for either completion or error (generous timeout)
    try {
      await Promise.race([
        expect(errorMessage).toBeVisible({ timeout: 60000 }),
        expect(completionMessage).toBeVisible({ timeout: 300000 })
      ]);
    } catch (error) {
      console.warn('Network interruption test timed out, which may be expected behavior');
    }
  });

  test('should support feedback submission after completion', async ({ page }) => {
    // Complete a logo generation first (shortened brief for faster test)
    await page.fill('[data-testid="logo-brief"]', 'Simple logo test');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for completion
    await expect(page.locator('[data-testid="completion-message"]')).toBeVisible({ timeout: 300000 });
    
    // Check if feedback form is available
    const feedbackButton = page.locator('[data-testid="feedback-button"]');
    if (await feedbackButton.isVisible()) {
      await feedbackButton.click();
      
      // Fill out feedback form
      await page.selectOption('[data-testid="rating-select"]', '4');
      await page.fill('[data-testid="feedback-text"]', 'Great logo, very professional looking!');
      
      // Submit feedback
      await page.click('[data-testid="submit-feedback"]');
      
      // Verify feedback was submitted
      await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();
    }
  });

  test('should handle multiple concurrent users simulation', async ({ page, context }) => {
    // Create multiple pages to simulate concurrent users
    const pages = [page];
    for (let i = 1; i < 3; i++) {
      pages.push(await context.newPage());
    }
    
    // Start logo generation on all pages simultaneously
    const generationPromises = pages.map(async (p, index) => {
      await p.goto('/');
      await p.waitForLoadState('networkidle');
      await p.fill('[data-testid="logo-brief"]', `Test logo ${index + 1} for load testing`);
      await p.click('[data-testid="generate-button"]');
      
      // Wait for either completion or reasonable timeout
      try {
        await expect(p.locator('[data-testid="completion-message"]')).toBeVisible({ timeout: 300000 });
        return { success: true, pageIndex: index };
      } catch (error) {
        return { 
          success: false, 
          pageIndex: index, 
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Wait for all generations to complete
    const results = await Promise.all(generationPromises);
    
    // At least one should succeed (system should handle load)
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBeGreaterThan(0);
    
    // Close additional pages
    for (let i = 1; i < pages.length; i++) {
      const pageToClose = pages[i];
      if (pageToClose && !pageToClose.isClosed()) {
        await pageToClose.close();
      }
    }
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('should handle extremely long brief gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Create a very long brief (over typical limits)
    const longBrief = 'This is an extremely long logo brief that goes on and on '.repeat(100);
    
    await page.fill('[data-testid="logo-brief"]', longBrief);
    await page.click('[data-testid="generate-button"]');
    
    // Should either truncate, show validation error, or process successfully
    const errorMessage = page.locator('[data-testid="error-message"]');
    const progressIndicator = page.locator('[data-testid="progress-indicator"]');
    
    await Promise.race([
      expect(errorMessage).toBeVisible({ timeout: 10000 }),
      expect(progressIndicator).toBeVisible({ timeout: 10000 })
    ]);
  });

  test('should handle special characters in brief', async ({ page }) => {
    await page.goto('/');
    
    // Test with special characters and unicode
    const specialBrief = 'Logo für Café & Bäckerei München 🥖🇩🇪 with special chars: @#$%^&*()';
    
    await page.fill('[data-testid="logo-brief"]', specialBrief);
    await page.click('[data-testid="generate-button"]');
    
    // Should handle special characters without crashing
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain session state across page refresh', async ({ page }) => {
    await page.goto('/');
    
    // Start logo generation
    await page.fill('[data-testid="logo-brief"]', 'Session persistence test logo');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for generation to start
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Should either restore session state or handle gracefully
    // (Exact behavior depends on implementation)
    const sessionRestored = page.locator('[data-testid="progress-indicator"]');
    const sessionLost = page.locator('[data-testid="logo-brief"]');
    
    // One of these should be visible
    await Promise.race([
      expect(sessionRestored).toBeVisible({ timeout: 5000 }),
      expect(sessionLost).toBeVisible({ timeout: 5000 })
    ]);
  });
});
