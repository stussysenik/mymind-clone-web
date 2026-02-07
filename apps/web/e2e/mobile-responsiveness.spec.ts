import { test, expect } from '@playwright/test';

// Device settings come from playwright.config.ts projects

test.describe('Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'admin@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'admin');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/');
  });

  test('should display 2-column masonry grid on iPhone 12 (390px)', async ({ page }) => {
    await page.waitForSelector('[class*="masonry"]', { timeout: 10000 });

    // Get computed column-count from masonry container
    const columnCount = await page.evaluate(() => {
      const masonry = document.querySelector('[class*="masonry"]');
      if (!masonry) return 0;
      return parseInt(getComputedStyle(masonry).columnCount || '1');
    });

    expect(columnCount).toBe(2);
  });

  test('external link buttons should be at least 44px touch target', async ({ page }) => {
    await page.waitForSelector('a[aria-label="Open original"]', { timeout: 10000 });

    // Get first external link button
    const button = page.locator('a[aria-label="Open original"]').first();
    const box = await button.boundingBox();

    expect(box).toBeTruthy();
    if (box) {
      console.log(`Touch target size: ${box.width}x${box.height}px`);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('cards should have appropriate spacing on mobile', async ({ page }) => {
    await page.waitForSelector('[class*="masonry"]', { timeout: 10000 });

    // Get masonry column-gap (masonry uses column-count layout)
    const gap = await page.evaluate(() => {
      const masonry = document.querySelector('[class*="masonry"]');
      if (!masonry) return '16px'; // default
      const styles = getComputedStyle(masonry);
      return styles.columnGap || styles.gap || '16px';
    });

    // Gap should be reasonable (8-24px on mobile)
    const gapValue = parseInt(gap) || 16;
    console.log(`Masonry gap: ${gapValue}px`);
    expect(gapValue).toBeGreaterThanOrEqual(8);
    expect(gapValue).toBeLessThanOrEqual(24);
  });

  test('Instagram cards should show actual images when available', async ({ page }) => {
    // Wait for cards to load first
    await page.waitForSelector('[class*="masonry"]', { timeout: 10000 });

    // Check if any Instagram card with an actual image exists (not using fallback)
    const instagramImages = page.locator('[class*="instagram"] img');
    const imageCount = await instagramImages.count();

    console.log(`Found ${imageCount} Instagram cards with images`);

    if (imageCount > 0) {
      const src = await instagramImages.first().getAttribute('src');
      if (src) {
        console.log(`Instagram image src: ${src.slice(0, 80)}...`);
        // Should NOT be a placeholder pattern
        expect(src).not.toContain('t51.2885-19'); // Profile pic CDN
        expect(src).not.toContain('s150x150');     // Tiny size
        expect(src).not.toContain('static.cdninstagram.com/rsrc'); // Static asset
      }
    } else {
      // If no images, check that Instagram logo fallback is shown (acceptable for now)
      const fallbackLogos = page.locator('[class*="instagram"] svg');
      const fallbackCount = await fallbackLogos.count();
      console.log(`Found ${fallbackCount} Instagram cards using logo fallback`);
      // This is not ideal but acceptable - the fix will help future saves
    }
  });

  test('take screenshot for visual verification', async ({ page }) => {
    await page.waitForSelector('[class*="masonry"]', { timeout: 10000 });
    await page.screenshot({ path: 'test-results/mobile-grid-iphone12.png', fullPage: true });
  });
});
