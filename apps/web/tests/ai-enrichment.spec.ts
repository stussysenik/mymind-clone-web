import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - AI Enrichment Tests
 * 
 * Verifies the AI processing pipeline:
 * 1. Save a card (Optimistic save)
 * 2. Trigger Enrichment (AI Analysis)
 * 3. Verify Summary and Tags generation
 * 
 * Note: This test requires a working Supabase backend and Service Key.
 * It will SKIP if the backend is running in Mock/Demo mode.
 */

test.describe('AI Analysis Pipeline', () => {

        test('full save and enrich flow', async ({ request }) => {
                test.setTimeout(60000); // Allow 60s for full integration flow
                // 1. Create a card via API
                const saveResponse = await request.post('/api/save', {
                        data: {
                                url: 'https://medium.com/ai-test',
                                content: 'This is a test article about Artificial Intelligence and Neural Networks. It discusses how transformers work.',
                                type: 'article'
                        }
                });

                expect(saveResponse.ok()).toBeTruthy();
                const saveData = await saveResponse.json();

                // Check availability
                if (saveData.source === 'mock') {
                        console.log('Skipping AI test: Backend is in Mock Mode');
                        test.skip();
                        return;
                }

                const cardId = saveData.card.id;
                console.log(`Created card ${cardId} in DB. Triggering enrichment...`);

                // 2. Call Enrich API
                const enrichResponse = await request.post('/api/enrich', {
                        data: { cardId }
                });

                // If enrichment fails (e.g. 500 or 401), fail the test (unless we want to be lenient)
                // But for "Production" testing, it SHOULD work if DB worked.
                expect(enrichResponse.ok()).toBeTruthy();

                const enrichData = await enrichResponse.json();
                console.log('Enrich Response:', JSON.stringify(enrichData, null, 2));
                const classification = enrichData.classification;

                // 3. Verify AI Output (or Fallback Output)
                // Even fallback generates tags and summary
                expect(classification).toBeDefined();
                expect(classification.summary).toBeTruthy();
                expect(classification.tags.length).toBeGreaterThan(0);

                console.log('AI Analysis Result:', classification);

                // check specific tag if rule-based fallback worked
                // Content mentions "Artificial Intelligence", expecting "article" type
                expect(classification.type).toBe('article');
        });

        test('enrichment handles invalid card id', async ({ request }) => {
                const response = await request.post('/api/enrich', {
                        data: { cardId: 'invalid-uuid-123' }
                });

                // Should return 404 or 500 (depending on DB error handling)
                // API returns 404 if not found
                expect(response.status()).toBe(404);
        });
});
