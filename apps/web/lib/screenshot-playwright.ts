/**
 * MyMind Clone - Playwright Screenshot Capture Module
 *
 * Self-hosted screenshot capture using Playwright with content-focused selectors.
 *
 * Features:
 * - Zero API costs (Playwright-based, runs on Vercel serverless)
 * - Platform-specific viewport optimization (YouTube, Instagram, Twitter, etc.)
 * - Content-focused capture (selectors for main content, not thumbnails/ads)
 * - Retina/HiDPI support (2x pixel density)
 * - Serverless-optimized (uses @sparticuz/chromium on Vercel)
 * - Graceful fallback to Microlink on failure
 *
 * @fileoverview Self-hosted screenshot capture with Playwright
 */

import { detectPlatform, type Platform } from './platforms';

// Dynamic imports for Playwright (loaded only when needed)
let chromium: any = null;
let playwright: any = null;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Screenshot capture result
 */
export interface PlaywrightScreenshotResult {
	buffer: Buffer;
	platform: Platform;
	success: boolean;
	error?: string;
}

/**
 * Platform-specific configuration with content selectors
 */
interface PlatformConfig {
	viewport_width: number;
	viewport_height: number;
	device_scale_factor?: number;
	full_page?: boolean;
	delay?: number; // Delay in milliseconds before screenshot
	selector?: string; // CSS selector for content-focused capture
	fallback_full_viewport?: boolean; // If selector fails, fallback to full viewport
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Platform-specific viewport configurations with content-focused selectors
 */
const PLATFORM_CONFIGS: Record<Platform, PlatformConfig | null> = {
	// Video platforms - desktop 1080p
	youtube: {
		viewport_width: 1920,
		viewport_height: 1080,
		device_scale_factor: 2,
		full_page: false,
		delay: 2000,
		selector: '#movie_player, #player', // Video player area
	},

	// Social media - mobile viewports with content selectors
	instagram: {
		viewport_width: 375, // iPhone X width
		viewport_height: 812, // iPhone X height
		device_scale_factor: 2, // Retina display
		full_page: false,
		delay: 2000,
		selector: 'article[role="presentation"], article', // Post + caption only
	},
	twitter: {
		viewport_width: 1200,
		viewport_height: 800,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: 'article[data-testid="tweet"]', // Single tweet
	},
	tiktok: {
		viewport_width: 375,
		viewport_height: 812,
		device_scale_factor: 2,
		full_page: false,
		delay: 2000,
		selector: 'div[data-e2e="browse-video"]', // Video content
	},
	linkedin: {
		viewport_width: 1200,
		viewport_height: 800,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: '.feed-shared-update-v2, article', // Post content
	},
	reddit: {
		viewport_width: 1920,
		viewport_height: 1080,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: 'shreddit-post, .Post', // Post + comments
	},
	pinterest: {
		viewport_width: 1200,
		viewport_height: 1600,
		device_scale_factor: 2,
		full_page: true,
		delay: 1000,
		selector: '[data-test-id="pin"], [data-test-id="pinrep-image"]', // Pin content
	},

	// Content platforms
	medium: {
		viewport_width: 1200,
		viewport_height: 1600,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: 'article', // Article content
	},
	substack: {
		viewport_width: 1200,
		viewport_height: 1600,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: '.post-content, article', // Post content
	},
	github: {
		viewport_width: 1920,
		viewport_height: 1080,
		device_scale_factor: 2,
		full_page: false,
		delay: 500,
		selector: '.repository-content, #repo-content-pjax-container', // Repo main content
	},

	// Entertainment
	mastodon: {
		viewport_width: 1200,
		viewport_height: 800,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: '.status, article', // Toot/post content
	},
	letterboxd: {
		viewport_width: 1200,
		viewport_height: 1600,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: '.film-detail, .poster', // Film details
	},
	imdb: {
		viewport_width: 1920,
		viewport_height: 1080,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: '[data-testid="hero-media"], .ipc-page-content-container', // Movie/show content
	},
	goodreads: {
		viewport_width: 1200,
		viewport_height: 1600,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: '.BookPage, #topcol', // Book details
	},
	amazon: {
		viewport_width: 1920,
		viewport_height: 1080,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: '#dp-container, #ppd', // Product details
	},
	storygraph: {
		viewport_width: 1200,
		viewport_height: 1600,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: '.book-page-book-pane, .main-content', // Book content
	},
	spotify: {
		viewport_width: 1920,
		viewport_height: 1080,
		device_scale_factor: 2,
		full_page: false,
		delay: 1000,
		selector: '[data-testid="entity-page"], main', // Album/playlist/artist page
	},

	// Generic websites
	unknown: {
		viewport_width: 1920,
		viewport_height: 1080,
		device_scale_factor: 2,
		full_page: false,
		delay: 500,
		selector: 'main, article, [role="main"]', // Try semantic HTML selectors
		fallback_full_viewport: true, // Fallback to viewport if no semantic HTML
	},
};

/**
 * Default configuration for unknown platforms
 */
const DEFAULT_CONFIG: PlatformConfig = {
	viewport_width: 1920,
	viewport_height: 1080,
	device_scale_factor: 2,
	full_page: false,
	delay: 500,
	fallback_full_viewport: true,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get platform-specific configuration
 */
function getPlatformConfig(url: string): PlatformConfig {
	const platform = detectPlatform(url);
	return PLATFORM_CONFIGS[platform] ?? DEFAULT_CONFIG;
}

/**
 * Build Microlink fallback URL
 */
function buildMicrolinkUrl(url: string): string {
	return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}

/**
 * Detect if running in serverless environment
 */
function isServerless(): boolean {
	return !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

/**
 * Lazy-load Playwright dependencies
 */
async function loadPlaywrightDependencies() {
	if (!playwright || !chromium) {
		if (isServerless()) {
			// Use @sparticuz/chromium for serverless
			chromium = await import('@sparticuz/chromium');
			playwright = await import('playwright-core');
		} else {
			// Use local Playwright for development
			playwright = await import('playwright');
		}
	}
	return { playwright, chromium };
}

// =============================================================================
// CORE SCREENSHOT FUNCTIONS
// =============================================================================

/**
 * Capture screenshot using Playwright
 *
 * @param url - URL to capture
 * @returns Screenshot buffer
 */
export async function captureWithPlaywright(
	url: string
): Promise<PlaywrightScreenshotResult> {
	const platform = detectPlatform(url);
	const config = getPlatformConfig(url);

	try {
		// Load Playwright dependencies
		const { playwright: pw, chromium: ch } = await loadPlaywrightDependencies();

		// Launch browser with appropriate settings
		const launchOptions: any = {
			headless: true,
			args: isServerless() && ch ? ch.default.args : [],
		};

		if (isServerless() && ch) {
			launchOptions.executablePath = await ch.default.executablePath();
		}

		console.log(`[Screenshot] Launching Playwright for ${platform} (serverless: ${isServerless()})`);

		const browser = await pw.chromium.launch(launchOptions);

		// Create page with viewport settings
		const page = await browser.newPage({
			viewport: {
				width: config.viewport_width,
				height: config.viewport_height,
			},
			deviceScaleFactor: config.device_scale_factor ?? 2,
		});

		// Set user agent to avoid bot detection
		await page.setExtraHTTPHeaders({
			'User-Agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		});

		// Navigate to URL
		console.log(`[Screenshot] Navigating to ${url}`);
		await page.goto(url, {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		// Wait for specified delay
		if (config.delay) {
			await page.waitForTimeout(config.delay);
		}

		let screenshot: Buffer;

		// Try content-focused screenshot with selector
		if (config.selector) {
			try {
				console.log(`[Screenshot] Trying selector: ${config.selector}`);
				const element = page.locator(config.selector).first();
				await element.waitFor({ state: 'visible', timeout: 5000 });
				screenshot = await element.screenshot({ type: 'png' });
				console.log(`[Screenshot] Captured element screenshot for ${platform}`);
			} catch (selectorError) {
				console.warn(`[Screenshot] Selector failed for ${platform}:`, selectorError);

				// Fallback to full viewport or full page
				if (config.fallback_full_viewport) {
					console.log(`[Screenshot] Falling back to full viewport for ${platform}`);
					screenshot = await page.screenshot({
						type: 'png',
						fullPage: false,
					});
				} else {
					console.log(`[Screenshot] Falling back to full page for ${platform}`);
					screenshot = await page.screenshot({
						type: 'png',
						fullPage: config.full_page ?? false,
					});
				}
			}
		} else {
			// No selector, use full viewport or full page
			screenshot = await page.screenshot({
				type: 'png',
				fullPage: config.full_page ?? false,
			});
			console.log(
				`[Screenshot] Captured ${config.full_page ? 'full page' : 'viewport'} screenshot for ${platform}`
			);
		}

		await browser.close();

		return {
			buffer: screenshot,
			platform,
			success: true,
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(`[Screenshot] Playwright failed for ${platform}:`, errorMsg);

		return {
			buffer: Buffer.from(''),
			platform,
			success: false,
			error: errorMsg,
		};
	}
}

/**
 * Get Microlink fallback URL
 *
 * @param url - URL to capture
 * @returns Microlink screenshot URL
 */
export function getMicrolinkFallback(url: string): string {
	return buildMicrolinkUrl(url);
}

/**
 * Check if Playwright is available
 */
export function isPlaywrightAvailable(): boolean {
	try {
		// Check if playwright-core is installed
		require.resolve('playwright-core');
		return true;
	} catch {
		return false;
	}
}
