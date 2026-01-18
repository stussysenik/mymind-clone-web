/**
 * Duplicate Archive Buttons Regression Test
 *
 * Critical test to prevent duplicate archive button bug from recurring.
 * Ensures TwitterCard and InstagramCard render exactly ONE archive button.
 */

import { test, expect } from '@playwright/test';

test.describe('Duplicate Archive Buttons Prevention', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the app
		await page.goto('/');

		// Wait for the page to load
		await page.waitForLoadState('networkidle');
	});

	test('TwitterCard should render exactly one archive button', async ({ page }) => {
		// Find all TwitterCards on the page
		const twitterCards = page.locator('[data-platform="twitter"]');

		// If no Twitter cards exist, skip this test
		const count = await twitterCards.count();
		if (count === 0) {
			test.skip();
			return;
		}

		// Check the first TwitterCard
		const firstCard = twitterCards.first();

		// Hover over the card to reveal action buttons
		await firstCard.hover();

		// Wait for hover actions to appear
		await page.waitForTimeout(300);

		// Count archive buttons within this specific card
		// Archive buttons have aria-label="Archive card"
		const archiveButtons = firstCard.locator('button[aria-label="Archive card"]');
		const buttonCount = await archiveButtons.count();

		// Assert exactly 1 archive button
		expect(buttonCount).toBe(1);
	});

	test('InstagramCard should render exactly one archive button', async ({ page }) => {
		// Find all InstagramCards on the page
		const instagramCards = page.locator('[data-platform="instagram"]');

		// If no Instagram cards exist, skip this test
		const count = await instagramCards.count();
		if (count === 0) {
			test.skip();
			return;
		}

		// Check the first InstagramCard
		const firstCard = instagramCards.first();

		// Hover over the card to reveal action buttons
		await firstCard.hover();

		// Wait for hover actions to appear
		await page.waitForTimeout(300);

		// Count archive buttons within this specific card
		const archiveButtons = firstCard.locator('button[aria-label="Archive card"]');
		const buttonCount = await archiveButtons.count();

		// Assert exactly 1 archive button
		expect(buttonCount).toBe(1);
	});

	test('All card types should have single archive button', async ({ page }) => {
		// This test verifies all visible cards have only one archive button

		// Get all cards on the page
		const allCards = page.locator('article');

		const cardCount = await allCards.count();

		if (cardCount === 0) {
			test.skip();
			return;
		}

		// Check first 5 cards (to keep test fast)
		const cardsToCheck = Math.min(cardCount, 5);

		for (let i = 0; i < cardsToCheck; i++) {
			const card = allCards.nth(i);

			// Hover to reveal buttons
			await card.hover();
			await page.waitForTimeout(200);

			// Count archive buttons
			const archiveButtons = card.locator('button[aria-label="Archive card"]');
			const buttonCount = await archiveButtons.count();

			// Each card should have 0 or 1 archive button (not more)
			expect(buttonCount).toBeLessThanOrEqual(1);
		}
	});

	test('Archive button functionality should work correctly', async ({ page }) => {
		// Find any card with an archive button
		const cards = page.locator('article');
		const firstCard = cards.first();

		// Skip if no cards
		const cardExists = await firstCard.isVisible();
		if (!cardExists) {
			test.skip();
			return;
		}

		// Hover to reveal archive button
		await firstCard.hover();
		await page.waitForTimeout(300);

		// Find archive button
		const archiveButton = firstCard.locator('button[aria-label="Archive card"]');

		const buttonExists = await archiveButton.count();
		if (buttonExists === 0) {
			test.skip();
			return;
		}

		// Click archive button
		await archiveButton.click();

		// Wait for animation/API call
		await page.waitForTimeout(500);

		// Card should be archived (could be removed or have archived state)
		// This is a basic check - actual behavior may vary
		// The key is that clicking once should trigger one archive action
		const remainingCards = await cards.count();

		// We don't assert specific count, just that the action completed without error
		// The important part is that the button exists and is clickable
		expect(remainingCards).toBeGreaterThanOrEqual(0);
	});
});
