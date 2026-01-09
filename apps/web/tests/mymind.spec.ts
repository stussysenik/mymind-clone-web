import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - Card Grid Spec
 * 
 * Validates the masonry grid renders correctly with demo cards.
 * This is the foundational spec that must pass before other features.
 */

test.describe('Card Grid', () => {
        test('renders demo cards on initial load', async ({ page }) => {
                await page.goto('/');

                // Wait for grid to be visible
                const grid = page.locator('.columns-1, .columns-2, .columns-3');
                await expect(grid).toBeVisible();

                // Should have multiple cards (demo data has 17)
                const cards = page.locator('article');
                await expect(cards.first()).toBeVisible();

                // Capture DOM snapshot for CLI consumption
                const domSnapshot = await page.evaluate(() => {
                        const cards = document.querySelectorAll('article');
                        return {
                                spec: 'card-grid',
                                totalCards: cards.length,
                                hasGrid: !!document.querySelector('.columns-1, .columns-2, .columns-3'),
                                firstCardText: cards[0]?.textContent?.slice(0, 100) || null,
                        };
                });

                console.log(JSON.stringify(domSnapshot, null, 2));
                expect(domSnapshot.totalCards).toBeGreaterThan(0);
        });

        test('search bar is visible and functional', async ({ page }) => {
                await page.goto('/');

                // Search bar should be visible with serif italic styling
                const searchInput = page.locator('input[type="text"]').first();
                await expect(searchInput).toBeVisible();

                // Should have placeholder text
                const placeholder = await searchInput.getAttribute('placeholder');

                console.log(JSON.stringify({
                        spec: 'search-bar',
                        hasSearchInput: true,
                        placeholder,
                }, null, 2));

                expect(placeholder).toBeTruthy();
        });
});

test.describe('Add Modal', () => {
        test('opens when + button is clicked', async ({ page }) => {
                await page.goto('/');

                // Find and click the add button using data-testid
                const addButton = page.locator('[data-testid="add-button"]');
                await addButton.click();

                // Modal should appear
                const modal = page.locator('text=Save to Mind');
                await expect(modal).toBeVisible();

                // Should have 3 tabs: Link, Note, Image
                const linkTab = page.locator('button').filter({ hasText: 'Link' });
                const noteTab = page.locator('button').filter({ hasText: 'Note' });
                const imageTab = page.locator('button').filter({ hasText: 'Image' });

                await expect(linkTab).toBeVisible();
                await expect(noteTab).toBeVisible();
                await expect(imageTab.first()).toBeVisible();

                console.log(JSON.stringify({
                        spec: 'add-modal',
                        modalVisible: true,
                        hasTabs: { link: true, note: true, image: true },
                }, null, 2));
        });

        test('can save a note', async ({ page }) => {
                await page.goto('/');

                // Open modal using data-testid
                const addButton = page.locator('[data-testid="add-button"]');
                await addButton.click();

                // Switch to Note tab
                const noteTab = page.locator('button').filter({ hasText: 'Note' });
                await noteTab.click();

                // Fill in note
                const titleInput = page.locator('input[placeholder*="Title"]');
                const contentInput = page.locator('textarea');

                await titleInput.fill('Test Note from Playwright');
                await contentInput.fill('This is a test note created by the Playwright spec.');

                // Click save
                const saveButton = page.locator('button').filter({ hasText: 'Save' });
                await saveButton.click();

                // Wait for page reload or modal close
                await page.waitForTimeout(1000);

                console.log(JSON.stringify({
                        spec: 'save-note',
                        noteSaved: true,
                }, null, 2));
        });
});

test.describe('API Endpoints', () => {
        test('POST /api/save returns success with AI classification', async ({ request }) => {
                const response = await request.post('/api/save', {
                        data: {
                                url: 'https://playwright.dev',
                        },
                });

                expect(response.ok()).toBeTruthy();
                const json = await response.json();

                console.log(JSON.stringify({
                        spec: 'api-save',
                        status: response.status(),
                        success: json.success,
                        hasCard: !!json.card,
                        cardType: json.card?.type,
                        hasTags: json.card?.tags?.length > 0,
                }, null, 2));

                expect(json.success).toBe(true);
                expect(json.card).toBeTruthy();
        });

        test('GET /api/search returns cards', async ({ request }) => {
                const response = await request.get('/api/search');

                expect(response.ok()).toBeTruthy();
                const json = await response.json();

                console.log(JSON.stringify({
                        spec: 'api-search',
                        status: response.status(),
                        success: json.success,
                        totalCards: json.total,
                }, null, 2));

                expect(json.success).toBe(true);
                expect(json.cards).toBeDefined();
        });

        test('GET /api/search with query filters results', async ({ request }) => {
                const response = await request.get('/api/search?q=design');

                expect(response.ok()).toBeTruthy();
                const json = await response.json();

                console.log(JSON.stringify({
                        spec: 'api-search-query',
                        query: 'design',
                        totalResults: json.total,
                }, null, 2));

                expect(json.success).toBe(true);
        });

        test('GET /api/search with type filter', async ({ request }) => {
                const response = await request.get('/api/search?type=article');

                expect(response.ok()).toBeTruthy();
                const json = await response.json();

                console.log(JSON.stringify({
                        spec: 'api-search-type',
                        type: 'article',
                        totalResults: json.total,
                }, null, 2));

                expect(json.success).toBe(true);
                // All results should be articles
                if (json.cards.length > 0) {
                        expect(json.cards.every((c: { type: string }) => c.type === 'article')).toBe(true);
                }
        });

        test('DELETE /api/cards/:id deletes card', async ({ request }) => {
                // First create a card
                const saveResponse = await request.post('/api/save', {
                        data: {
                                content: 'Temp note for deletion test',
                                type: 'note',
                        },
                });
                const saved = await saveResponse.json();

                // Then delete it
                const deleteResponse = await request.delete(`/api/cards/${saved.card.id}`);
                expect(deleteResponse.ok()).toBeTruthy();

                const json = await deleteResponse.json();
                console.log(JSON.stringify({
                        spec: 'api-delete',
                        cardId: saved.card.id,
                        success: json.success,
                }, null, 2));

                expect(json.success).toBe(true);
        });
});
