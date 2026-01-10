import { APIRequestContext, expect } from '@playwright/test';

/**
 * Creates a test card using the API to ensure tests have data to work with.
 * This prevents tests from failing when the database is empty.
 */
export async function seedTestCard(request: APIRequestContext) {
        const response = await request.post('/api/save', {
                data: {
                        content: 'Test Card for Playwright E2E',
                        type: 'note',
                        url: 'https://example.com/test-card'
                }
        });

        expect(response.ok()).toBeTruthy();
        const json = await response.json();
        return json.card;
}

/**
 * Ensures at least one card exists, creating it if necessary.
 */
export async function ensureTestContent(request: APIRequestContext) {
        const search = await request.get('/api/search');
        const json = await search.json();

        if (!json.cards || json.cards.length === 0) {
                console.log('Seeding test data: Creating default test card');
                return await seedTestCard(request);
        }
        return json.cards[0];
}
