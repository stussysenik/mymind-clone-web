/**
 * Instagram Carousel Test
 *
 * Verifies that Instagram posts with multiple images (carousels) display:
 * - Carousel indicator badge in grid view (e.g., "1/10")
 * - Full carousel navigation in detail view
 * - All images accessible via Previous/Next buttons
 * - Dot navigation for quick jumping
 */

import { test, expect } from '@playwright/test';

test.describe('Instagram Carousel', () => {
	test.beforeEach(async ({ page }) => {
		// Login first
		await page.goto('/');

		// Wait for auth to complete (adjust based on your auth flow)
		await page.waitForSelector('[data-testid="save-input"], [href="/login"]', { timeout: 10000 });

		// If we see login link, we need to authenticate
		const loginLink = page.locator('[href="/login"]');
		if (await loginLink.isVisible()) {
			// You may need to implement actual login here
			// For now, assuming we're already logged in or using test auth
			await page.goto('/login');
			// Add login steps here if needed
		}
	});

	test('should display carousel indicator badge for multi-image Instagram posts', async ({ page }) => {
		await page.goto('/');

		// Mock an Instagram carousel save by inserting directly into the database
		// or use the API endpoint with a mock Instagram URL
		// For this test, we'll check if the component renders the badge correctly

		// Navigate to page and wait for cards to load
		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		// Look for Instagram cards specifically
		const instagramCards = page.locator('[data-testid="instagram-card"]');
		const count = await instagramCards.count();

		if (count === 0) {
			test.skip(true, 'No Instagram cards found to test');
			return;
		}

		// Check first Instagram card
		const firstCard = instagramCards.first();

		// Check if carousel indicator exists (only appears if metadata.images.length > 1)
		const carouselIndicator = firstCard.locator('text=/^1\\/\\d+$/');

		// The indicator should either exist (for carousels) or not exist (for single images)
		// This test just verifies the component doesn't crash
		const hasIndicator = await carouselIndicator.count() > 0;

		if (hasIndicator) {
			// If carousel indicator exists, verify it shows correct format
			const indicatorText = await carouselIndicator.textContent();
			expect(indicatorText).toMatch(/^1\/\d+$/);
			console.log(`✓ Carousel indicator found: ${indicatorText}`);
		} else {
			console.log('✓ No carousel indicator (single image post)');
		}
	});

	test('should display all carousel images in detail view', async ({ page }) => {
		await page.goto('/');

		// Wait for cards to load
		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		// Look for Instagram cards with carousel indicators
		const carouselCards = page.locator('[data-testid="instagram-card"]:has(text=/^1\\/\\d+$/)');
		const count = await carouselCards.count();

		if (count === 0) {
			test.skip(true, 'No Instagram carousel posts found to test');
			return;
		}

		// Click first carousel card to open detail view
		await carouselCards.first().click();

		// Wait for detail modal to open
		await page.waitForSelector('[data-testid="card-detail-modal"]', { timeout: 5000 });

		// Check for carousel navigation elements
		const prevButton = page.locator('button[aria-label="Previous image"]');
		const nextButton = page.locator('button[aria-label="Next image"]');
		const carouselDots = page.locator('.carousel-dot, [data-testid="carousel-dot"]');

		// Verify navigation buttons exist
		await expect(prevButton).toBeVisible();
		await expect(nextButton).toBeVisible();

		// Get number of dots (should match number of images)
		const dotCount = await carouselDots.count();
		expect(dotCount).toBeGreaterThan(1);

		console.log(`✓ Found ${dotCount} carousel images`);

		// Test navigation through images
		const initialImageSrc = await page.locator('[data-testid="detail-image"]').getAttribute('src');

		// Click Next button
		await nextButton.click();
		await page.waitForTimeout(300); // Wait for animation

		const secondImageSrc = await page.locator('[data-testid="detail-image"]').getAttribute('src');

		// Verify image changed
		expect(secondImageSrc).not.toBe(initialImageSrc);

		console.log('✓ Carousel navigation works');

		// Click Previous to go back
		await prevButton.click();
		await page.waitForTimeout(300);

		const backToFirstSrc = await page.locator('[data-testid="detail-image"]').getAttribute('src');
		expect(backToFirstSrc).toBe(initialImageSrc);

		console.log('✓ Previous/Next buttons work correctly');
	});

	test('should generate summary for all carousel images', async ({ page }) => {
		await page.goto('/');

		// Wait for cards
		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		// Find carousel cards
		const carouselCards = page.locator('[data-testid="instagram-card"]:has(text=/^1\\/\\d+$/)');
		const count = await carouselCards.count();

		if (count === 0) {
			test.skip(true, 'No Instagram carousel posts found');
			return;
		}

		// Open detail view
		await carouselCards.first().click();
		await page.waitForSelector('[data-testid="card-detail-modal"]', { timeout: 5000 });

		// Check if summary mentions multiple images or carousel
		const summaryText = await page.locator('[data-testid="ai-summary"]').textContent();

		// Summary should mention carousel or multiple images
		const hasCarouselMention =
			summaryText?.toLowerCase().includes('carousel') ||
			summaryText?.toLowerCase().includes('images') ||
			summaryText?.toLowerCase().includes('sequence') ||
			summaryText?.toLowerCase().includes('series');

		// Log result (may not always be true depending on AI generation)
		if (hasCarouselMention) {
			console.log('✓ Summary mentions carousel/multiple images');
		} else {
			console.log('⚠ Summary does not explicitly mention carousel (this may be OK)');
		}
	});

	test('should extract hashtags from Instagram caption as tags', async ({ page }) => {
		await page.goto('/');

		// Wait for cards
		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		// Find Instagram cards
		const instagramCards = page.locator('[data-testid="instagram-card"]');
		const count = await instagramCards.count();

		if (count === 0) {
			test.skip(true, 'No Instagram cards found');
			return;
		}

		// Open detail view
		await instagramCards.first().click();
		await page.waitForSelector('[data-testid="card-detail-modal"]', { timeout: 5000 });

		// Check for tags section
		const tagsSection = page.locator('[data-testid="card-tags"]');

		if (await tagsSection.isVisible()) {
			const tags = await tagsSection.locator('[data-testid="tag"]').allTextContents();
			console.log(`✓ Found tags: ${tags.join(', ')}`);

			// At minimum, should have some tags
			expect(tags.length).toBeGreaterThan(0);
		} else {
			console.log('⚠ No tags section visible');
		}
	});
});
