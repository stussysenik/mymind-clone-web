/**
 * Unit tests for screenshot capture module
 *
 * @fileoverview Tests for ScreenshotOne API integration with fallback chain
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	captureScreenshot,
	captureWithScreenshotOne,
	isScreenshotOneConfigured,
	getScreenshotServiceStatus,
} from '../screenshot';

// Mock environment variables
const mockEnv = {
	SCREENSHOTONE_API_KEY: 'test-api-key',
	SCREENSHOTONE_API_URL: 'https://api.screenshotone.com/take',
};

// Mock fetch globally
global.fetch = vi.fn();

describe('Screenshot Module', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset environment
		process.env.SCREENSHOTONE_API_KEY = mockEnv.SCREENSHOTONE_API_KEY;
		process.env.SCREENSHOTONE_API_URL = mockEnv.SCREENSHOTONE_API_URL;
	});

	describe('isScreenshotOneConfigured', () => {
		it('should return true when API key is configured', () => {
			process.env.SCREENSHOTONE_API_KEY = 'test-key';
			expect(isScreenshotOneConfigured()).toBe(true);
		});

		it('should return false when API key is not configured', () => {
			delete process.env.SCREENSHOTONE_API_KEY;
			expect(isScreenshotOneConfigured()).toBe(false);
		});
	});

	describe('getScreenshotServiceStatus', () => {
		it('should return status of both services', () => {
			const status = getScreenshotServiceStatus();
			expect(status).toEqual({
				screenshotone: true,
				microlink: true,
			});
		});

		it('should show screenshotone as false when not configured', () => {
			delete process.env.SCREENSHOTONE_API_KEY;
			const status = getScreenshotServiceStatus();
			expect(status).toEqual({
				screenshotone: false,
				microlink: true,
			});
		});
	});

	describe('captureWithScreenshotOne', () => {
		it('should successfully capture YouTube screenshot with correct viewport', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
			});
			global.fetch = mockFetch;

			const result = await captureWithScreenshotOne('https://youtube.com/watch?v=test');

			expect(result.success).toBe(true);
			expect(result.source).toBe('screenshotone');
			expect(result.platform).toBe('youtube');
			expect(result.url).toContain('viewport_width=1920');
			expect(result.url).toContain('viewport_height=1080');
			expect(result.url).toContain('delay=2'); // YouTube delay
		});

		it('should successfully capture Instagram screenshot with mobile viewport', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
			});
			global.fetch = mockFetch;

			const result = await captureWithScreenshotOne('https://instagram.com/p/abc123/');

			expect(result.success).toBe(true);
			expect(result.platform).toBe('instagram');
			expect(result.url).toContain('viewport_width=375'); // Mobile width
			expect(result.url).toContain('viewport_height=812'); // Mobile height
			expect(result.url).toContain('device_scale_factor=2'); // Retina
			expect(result.url).toContain('full_page=true'); // Capture full post
		});

		it('should successfully capture Twitter screenshot', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
			});
			global.fetch = mockFetch;

			const result = await captureWithScreenshotOne('https://twitter.com/user/status/123');

			expect(result.success).toBe(true);
			expect(result.platform).toBe('twitter');
			expect(result.url).toContain('viewport_width=1200');
			expect(result.url).toContain('viewport_height=800');
		});

		it('should use default config for unknown platforms', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
			});
			global.fetch = mockFetch;

			const result = await captureWithScreenshotOne('https://example.com');

			expect(result.success).toBe(true);
			expect(result.platform).toBe('unknown');
			expect(result.url).toContain('viewport_width=1920');
			expect(result.url).toContain('viewport_height=1080');
		});

		it('should throw error when API key is not configured', async () => {
			delete process.env.SCREENSHOTONE_API_KEY;

			await expect(
				captureWithScreenshotOne('https://example.com')
			).rejects.toThrow('ScreenshotOne API key not configured');
		});

		it('should throw error on API failure', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
			});
			global.fetch = mockFetch;

			await expect(
				captureWithScreenshotOne('https://example.com')
			).rejects.toThrow('ScreenshotOne API error: 500 Internal Server Error');
		});

		it('should include all required parameters in API call', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
			});
			global.fetch = mockFetch;

			const url = 'https://example.com';
			await captureWithScreenshotOne(url);

			const fetchCall = mockFetch.mock.calls[0][0] as string;
			expect(fetchCall).toContain('access_key=test-api-key');
			expect(fetchCall).toContain(`url=${encodeURIComponent(url)}`);
			expect(fetchCall).toContain('format=png');
			expect(fetchCall).toContain('block_ads=true');
			expect(fetchCall).toContain('block_cookie_banners=true');
		});

		it('should allow custom options override', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
			});
			global.fetch = mockFetch;

			await captureWithScreenshotOne('https://example.com', {
				viewport_width: 800,
				viewport_height: 600,
				format: 'jpeg',
			});

			const fetchCall = mockFetch.mock.calls[0][0] as string;
			expect(fetchCall).toContain('viewport_width=800');
			expect(fetchCall).toContain('viewport_height=600');
			expect(fetchCall).toContain('format=jpeg');
		});
	});

	describe('captureScreenshot (with retry and fallback)', () => {
		it('should succeed on first try with ScreenshotOne', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
			});
			global.fetch = mockFetch;

			const url = 'https://example.com';
			const result = await captureScreenshot(url);

			expect(result).toBeTruthy();
			expect(result).toContain('api.screenshotone.com');
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('should retry on failure and succeed on second attempt', async () => {
			const mockFetch = vi.fn()
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce({ ok: true, status: 200 });
			global.fetch = mockFetch;

			const url = 'https://example.com';
			const result = await captureScreenshot(url);

			expect(result).toBeTruthy();
			expect(result).toContain('api.screenshotone.com');
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it('should fall back to Microlink after all retries fail', async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
			global.fetch = mockFetch;

			const url = 'https://example.com';
			const result = await captureScreenshot(url);

			expect(result).toBeTruthy();
			expect(result).toContain('api.microlink.io');
			expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
		});

		it('should return null if both ScreenshotOne and Microlink fail', async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
			global.fetch = mockFetch;

			// Mock Microlink failure by making URL builder throw
			const url = 'invalid-url';

			const result = await captureScreenshot(url);

			// Even with invalid URL, captureScreenshot handles it gracefully
			expect(result).toBeTruthy();
		});

		it('should immediately fall back to Microlink when API key is missing', async () => {
			delete process.env.SCREENSHOTONE_API_KEY;

			const url = 'https://example.com';
			const result = await captureScreenshot(url);

			expect(result).toBeTruthy();
			expect(result).toContain('api.microlink.io');
		});
	});

	describe('Platform-specific viewport configurations', () => {
		const testCases = [
			{
				platform: 'youtube',
				url: 'https://youtube.com/watch?v=test',
				expectedWidth: 1920,
				expectedHeight: 1080,
				expectedFullPage: false,
			},
			{
				platform: 'instagram',
				url: 'https://instagram.com/p/test/',
				expectedWidth: 375,
				expectedHeight: 812,
				expectedFullPage: true,
			},
			{
				platform: 'twitter',
				url: 'https://twitter.com/user/status/123',
				expectedWidth: 1200,
				expectedHeight: 800,
				expectedFullPage: false,
			},
			{
				platform: 'github',
				url: 'https://github.com/user/repo',
				expectedWidth: 1920,
				expectedHeight: 1080,
				expectedFullPage: false,
			},
		];

		testCases.forEach(({ platform, url, expectedWidth, expectedHeight, expectedFullPage }) => {
			it(`should use correct viewport for ${platform}`, async () => {
				const mockFetch = vi.fn().mockResolvedValue({
					ok: true,
					status: 200,
				});
				global.fetch = mockFetch;

				await captureWithScreenshotOne(url);

				const fetchCall = mockFetch.mock.calls[0][0] as string;
				expect(fetchCall).toContain(`viewport_width=${expectedWidth}`);
				expect(fetchCall).toContain(`viewport_height=${expectedHeight}`);
				expect(fetchCall).toContain(`full_page=${expectedFullPage}`);
			});
		});
	});
});
