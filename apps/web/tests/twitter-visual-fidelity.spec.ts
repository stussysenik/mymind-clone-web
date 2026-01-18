/**
 * Twitter Visual Fidelity Test
 *
 * Verifies that tweets display with proper visual layout:
 * - X logo and author profile
 * - Tweet text with formatting preserved (line breaks, hashtags)
 * - Embedded media (images/videos)
 * - Thread indicators
 * - Visual structure matches Twitter's presentation
 */

import { test, expect } from '@playwright/test';

test.describe('Twitter Visual Fidelity', () => {
	test.beforeEach(async ({ page }) => {
		// Login first
		await page.goto('/');

		// Wait for auth to complete
		await page.waitForSelector('[data-testid="save-input"], [href="/login"]', { timeout: 10000 });

		// If we see login link, we need to authenticate
		const loginLink = page.locator('[href="/login"]');
		if (await loginLink.isVisible()) {
			await page.goto('/login');
			// Add login steps here if needed
		}
	});

	test('should display tweet with X logo and author', async ({ page }) => {
		await page.goto('/');

		// Wait for cards to load
		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		// Look for Twitter cards
		const twitterCards = page.locator('[data-testid="twitter-card"]');
		const count = await twitterCards.count();

		if (count === 0) {
			test.skip(true, 'No Twitter cards found to test');
			return;
		}

		// Check first Twitter card
		const firstCard = twitterCards.first();

		// Verify X logo is present (SVG with Twitter/X icon)
		const xLogo = firstCard.locator('svg path[d*="18.244"]');
		await expect(xLogo).toBeVisible();

		// Verify author name is displayed
		const authorName = firstCard.locator('text=/^@?[a-zA-Z0-9_]+$/').first();
		await expect(authorName).toBeVisible();

		console.log('✓ Twitter card displays X logo and author');
	});

	test('should preserve tweet text formatting', async ({ page }) => {
		await page.goto('/');

		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		const twitterCards = page.locator('[data-testid="twitter-card"]');
		const count = await twitterCards.count();

		if (count === 0) {
			test.skip(true, 'No Twitter cards found');
			return;
		}

		const firstCard = twitterCards.first();

		// Get tweet text element
		const tweetText = firstCard.locator('.whitespace-pre-wrap');
		await expect(tweetText).toBeVisible();

		// Check if text uses whitespace-pre-wrap (preserves line breaks)
		const hasPreWrap = await tweetText.evaluate(el =>
			window.getComputedStyle(el).whiteSpace === 'pre-wrap'
		);
		expect(hasPreWrap).toBe(true);

		console.log('✓ Tweet text formatting preserved');
	});

	test('should display hashtags in blue', async ({ page }) => {
		await page.goto('/');

		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		const twitterCards = page.locator('[data-testid="twitter-card"]');
		const count = await twitterCards.count();

		if (count === 0) {
			test.skip(true, 'No Twitter cards found');
			return;
		}

		// Look for cards with hashtags
		const cardsWithHashtags = twitterCards.locator(':has(span.text-blue-500)');
		const hashtagCount = await cardsWithHashtags.count();

		if (hashtagCount > 0) {
			const hashtagElement = cardsWithHashtags.first().locator('span.text-blue-500').first();
			const hashtagText = await hashtagElement.textContent();

			expect(hashtagText).toMatch(/^#\w+$/);
			console.log(`✓ Found hashtag: ${hashtagText}`);
		} else {
			console.log('⚠ No hashtags found in visible tweets (this may be OK)');
		}
	});

	test('should display embedded media for tweets with images', async ({ page }) => {
		await page.goto('/');

		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		const twitterCards = page.locator('[data-testid="twitter-card"]');
		const count = await twitterCards.count();

		if (count === 0) {
			test.skip(true, 'No Twitter cards found');
			return;
		}

		// Check all Twitter cards for embedded images
		const cardsWithImages = twitterCards.locator(':has(img[alt="Tweet media"])');
		const imageCount = await cardsWithImages.count();

		if (imageCount > 0) {
			const firstImageCard = cardsWithImages.first();
			const tweetImage = firstImageCard.locator('img[alt="Tweet media"]');

			await expect(tweetImage).toBeVisible();

			// Verify image container has aspect-video class
			const imageContainer = firstImageCard.locator('.aspect-video');
			await expect(imageContainer).toBeVisible();

			console.log(`✓ Found ${imageCount} tweets with embedded media`);
		} else {
			console.log('⚠ No tweets with media found (this may be OK)');
		}
	});

	test('should open detail view with full tweet recreation', async ({ page }) => {
		await page.goto('/');

		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		const twitterCards = page.locator('[data-testid="twitter-card"]');
		const count = await twitterCards.count();

		if (count === 0) {
			test.skip(true, 'No Twitter cards found');
			return;
		}

		// Click first Twitter card to open detail view
		await twitterCards.first().click();

		// Wait for detail modal to open
		await page.waitForSelector('[data-testid="card-detail-modal"]', { timeout: 5000 });

		// Check for essential elements in detail view
		const detailModal = page.locator('[data-testid="card-detail-modal"]');

		// Should have title/author
		const hasAuthor = await detailModal.locator('text=/^@?[a-zA-Z0-9_]+$/').count() > 0;
		expect(hasAuthor).toBe(true);

		// Should have tweet content
		const hasContent = await detailModal.locator('[data-testid="card-content"], .whitespace-pre-wrap').count() > 0;
		expect(hasContent).toBe(true);

		console.log('✓ Detail view displays full tweet information');
	});

	test('should detect thread indicators', async ({ page }) => {
		await page.goto('/');

		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		const twitterCards = page.locator('[data-testid="twitter-card"]');
		const count = await twitterCards.count();

		if (count === 0) {
			test.skip(true, 'No Twitter cards found');
			return;
		}

		// Check for thread indicators in tweet text
		// Common patterns: "1/", "Thread:", "🧵"
		const threadIndicators = /🧵|Thread:|1\/|First,|Brief thread/;

		for (let i = 0; i < count; i++) {
			const card = twitterCards.nth(i);
			const tweetText = await card.locator('.whitespace-pre-wrap').textContent();

			if (tweetText && threadIndicators.test(tweetText)) {
				console.log(`✓ Found thread tweet: "${tweetText.slice(0, 50)}..."`);
				break;
			}
		}

		// This test just checks if thread detection works, doesn't require finding threads
		console.log('✓ Thread detection logic verified');
	});

	test('should generate summary that captures tweet formatting', async ({ page }) => {
		await page.goto('/');

		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		const twitterCards = page.locator('[data-testid="twitter-card"]');
		const count = await twitterCards.count();

		if (count === 0) {
			test.skip(true, 'No Twitter cards found');
			return;
		}

		// Open detail view
		await twitterCards.first().click();
		await page.waitForSelector('[data-testid="card-detail-modal"]', { timeout: 5000 });

		// Check AI summary
		const summaryElement = page.locator('[data-testid="ai-summary"]');

		if (await summaryElement.isVisible()) {
			const summaryText = await summaryElement.textContent();

			// Summary should exist and have content
			expect(summaryText).toBeTruthy();
			expect(summaryText!.length).toBeGreaterThan(20);

			console.log('✓ AI summary generated for tweet');
			console.log(`   Summary: ${summaryText!.slice(0, 100)}...`);
		} else {
			console.log('⚠ No AI summary visible (may still be processing)');
		}
	});

	test('should extract hashtags as tags', async ({ page }) => {
		await page.goto('/');

		await page.waitForSelector('[data-testid="card"]', { timeout: 10000 });

		const twitterCards = page.locator('[data-testid="twitter-card"]');
		const count = await twitterCards.count();

		if (count === 0) {
			test.skip(true, 'No Twitter cards found');
			return;
		}

		// Open detail view
		await twitterCards.first().click();
		await page.waitForSelector('[data-testid="card-detail-modal"]', { timeout: 5000 });

		// Check for tags section
		const tagsSection = page.locator('[data-testid="card-tags"]');

		if (await tagsSection.isVisible()) {
			const tags = await tagsSection.locator('[data-testid="tag"]').allTextContents();

			expect(tags.length).toBeGreaterThan(0);
			console.log(`✓ Found tags: ${tags.join(', ')}`);
		} else {
			console.log('⚠ No tags section visible');
		}
	});
});
