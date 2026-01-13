import { test, expect } from '@playwright/test';

/**
 * MyMind Clone - iOS Share Extension API Tests
 *
 * Tests for the /api/save endpoint with iOS Share Extension support.
 * Verifies source tracking and auth_token authentication flow.
 */

test.describe('iOS Share Extension API', () => {
        const API_URL = '/api/save';

        test.describe('Request Source Tracking', () => {
                test('accepts request without source (defaults to manual)', async ({ request }) => {
                        const response = await request.post(API_URL, {
                                data: {
                                        url: 'https://example.com/test-article',
                                },
                        });

                        expect(response.ok()).toBeTruthy();
                        const json = await response.json();
                        expect(json.success).toBe(true);
                });

                test('accepts request with chrome-extension source', async ({ request }) => {
                        const response = await request.post(API_URL, {
                                data: {
                                        url: 'https://example.com/chrome-test',
                                        source: 'chrome-extension',
                                },
                        });

                        expect(response.ok()).toBeTruthy();
                        const json = await response.json();
                        expect(json.success).toBe(true);
                });

                test('accepts request with web-share-api source', async ({ request }) => {
                        const response = await request.post(API_URL, {
                                data: {
                                        url: 'https://example.com/web-share-test',
                                        source: 'web-share-api',
                                },
                        });

                        expect(response.ok()).toBeTruthy();
                        const json = await response.json();
                        expect(json.success).toBe(true);
                });
        });

        test.describe('iOS Share Extension Authentication', () => {
                // Use fresh context without cookies for iOS tests
                test.use({ storageState: { cookies: [], origins: [] } });

                test('rejects ios-share-extension request without auth_token', async ({ request }) => {
                        const response = await request.post(API_URL, {
                                data: {
                                        url: 'https://example.com/ios-test',
                                        source: 'ios-share-extension',
                                },
                        });

                        expect(response.status()).toBe(401);
                        const json = await response.json();
                        expect(json.success).toBe(false);
                        expect(json.error).toContain('Authentication token required');
                });

                test('rejects ios-share-extension request with invalid auth_token', async ({ request }) => {
                        const response = await request.post(API_URL, {
                                data: {
                                        url: 'https://example.com/ios-test',
                                        source: 'ios-share-extension',
                                        auth_token: 'invalid-token-12345',
                                },
                        });

                        expect(response.status()).toBe(401);
                        const json = await response.json();
                        expect(json.success).toBe(false);
                        expect(json.error).toContain('Invalid or expired');
                });

                test('rejects ios-share-extension request with empty auth_token', async ({ request }) => {
                        const response = await request.post(API_URL, {
                                data: {
                                        url: 'https://example.com/ios-test',
                                        source: 'ios-share-extension',
                                        auth_token: '',
                                },
                        });

                        expect(response.status()).toBe(401);
                        const json = await response.json();
                        expect(json.success).toBe(false);
                });
        });

        test.describe('Response Time Performance', () => {
                test('responds within reasonable time', async ({ request }) => {
                        const start = Date.now();
                        const response = await request.post(API_URL, {
                                data: {
                                        content: 'Test note content',
                                        source: 'manual',
                                },
                        });
                        const elapsed = Date.now() - start;

                        expect(response.ok()).toBeTruthy();
                        // Allow network overhead in test environment
                        // The 200ms budget is for production server-side processing
                        // Network latency in test environment can vary significantly
                        expect(elapsed).toBeLessThan(2000); // Generous for CI/test env
                        console.log(`[Performance] API response time: ${elapsed}ms`);
                });
        });

        test.describe('Backward Compatibility', () => {
                test('maintains existing request format support', async ({ request }) => {
                        // Legacy format without source or auth_token
                        const response = await request.post(API_URL, {
                                data: {
                                        url: 'https://example.com/legacy',
                                        title: 'Legacy Title',
                                        tags: ['legacy', 'test'],
                                },
                        });

                        expect(response.ok()).toBeTruthy();
                        const json = await response.json();
                        expect(json.success).toBe(true);
                        expect(json.card).toBeDefined();
                        expect(json.card.title).toBe('Legacy Title');
                        expect(json.card.tags).toContain('legacy');
                });

                test('maintains note saving format', async ({ request }) => {
                        const response = await request.post(API_URL, {
                                data: {
                                        content: 'This is a test note without URL',
                                },
                        });

                        expect(response.ok()).toBeTruthy();
                        const json = await response.json();
                        expect(json.success).toBe(true);
                        expect(json.card.type).toBe('note');
                });
        });

        test.describe('Input Validation', () => {
                test('rejects request with no content', async ({ request }) => {
                        const response = await request.post(API_URL, {
                                data: {},
                        });

                        expect(response.status()).toBe(400);
                        const json = await response.json();
                        expect(json.success).toBe(false);
                        expect(json.error).toContain('At least one of');
                });
        });
});
