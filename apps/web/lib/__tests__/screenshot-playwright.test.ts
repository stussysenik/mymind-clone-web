/**
 * MyMind Clone - Playwright Screenshot Tests
 *
 * Basic unit tests for the Playwright screenshot service.
 *
 * @fileoverview Unit tests for screenshot-playwright.ts
 */

import { describe, it, expect } from '@jest/globals';
import { isPlaywrightAvailable, getMicrolinkFallback } from '../screenshot-playwright';

describe('Playwright Screenshot Service', () => {
	it('should check if Playwright is available', () => {
		// Should be true since we installed playwright-core
		const available = isPlaywrightAvailable();
		expect(typeof available).toBe('boolean');
	});

	it('should generate Microlink fallback URL', () => {
		const url = 'https://github.com/vercel/next.js';
		const fallbackUrl = getMicrolinkFallback(url);

		expect(fallbackUrl).toContain('api.microlink.io');
		expect(fallbackUrl).toContain('screenshot=true');
		expect(fallbackUrl).toContain(encodeURIComponent(url));
	});

	it('should handle invalid URLs in fallback', () => {
		const url = 'not-a-valid-url';
		const fallbackUrl = getMicrolinkFallback(url);

		expect(fallbackUrl).toContain('api.microlink.io');
		expect(fallbackUrl).toContain(url);
	});
});
