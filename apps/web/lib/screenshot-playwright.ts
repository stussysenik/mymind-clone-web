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
// POPUP DISMISSAL CONFIGURATION
// =============================================================================

/**
 * Platform-specific popup/modal selectors to dismiss before screenshot
 * These handle login walls, cookie banners, and other obstructive overlays
 */
interface PopupDismissalConfig {
	/** CSS selectors for close buttons or dismiss elements */
	selectors: string[];
	/** Selector to scroll into view after dismissal */
	scrollToContent?: string;
	/** Additional wait time after dismissal (ms) */
	waitAfter?: number;
	/** CSS to inject to forcibly hide persistent elements */
	hideCSS?: string;
}

const POPUP_CONFIGS: Partial<Record<Platform, PopupDismissalConfig>> = {
	twitter: {
		selectors: [
			// "Don't miss what's happening" login modal - multiple variations
			'[data-testid="sheetDialog"] [aria-label="Close"]',
			'[role="dialog"] [data-testid="app-bar-close"]',
			'[data-testid="app-bar-close"]',
			// Bottom signup/login banner - various close buttons
			'[data-testid="BottomBar"] button[aria-label="Close"]',
			'[data-testid="BottomBar"] [role="button"]',
			'div[data-testid="BottomBar"]', // Will be hidden via CSS below
			// "Sign up" bottom bar close
			'[data-testid="signup-bar-close-button"]',
			// Cookie consent
			'[data-testid="cookie-policy-banner"] button',
			// Generic close buttons in dialogs
			'[role="dialog"] button[aria-label="Close"]',
			'[role="alertdialog"] button[aria-label="Close"]',
			// Login prompt "Not now" style buttons
			'button[data-testid="confirmationSheetCancel"]',
		],
		scrollToContent: 'article[data-testid="tweet"]',
		waitAfter: 500,
		// CSS to inject to hide persistent bottom bars
		hideCSS: `
			[data-testid="BottomBar"],
			[data-testid="sheetDialog"],
			[role="dialog"][aria-modal="true"],
			div[class*="BottomBar"],
			div[class*="SignupBanner"] {
				display: none !important;
				visibility: hidden !important;
			}
		`,
	},
	instagram: {
		selectors: [
			// "Sign up to see photos" modal close
			'button[aria-label="Close"]',
			'svg[aria-label="Close"]',
			// "Not now" button on login prompts
			'button:has-text("Not now")',
			'button:has-text("Not Now")',
			// Cookie consent
			'button:has-text("Accept")',
			'button:has-text("Accept All")',
			// App download banner
			'[role="dialog"] button[aria-label="Close"]',
		],
		scrollToContent: 'article[role="presentation"]',
		waitAfter: 500,
	},
	reddit: {
		selectors: [
			// "Use the app" modal
			'button[aria-label="Close"]',
			// Cookie banner
			'button:has-text("Accept all")',
			// Login prompt
			'button:has-text("Continue")',
		],
		scrollToContent: 'shreddit-post, .Post',
		waitAfter: 300,
	},
	linkedin: {
		selectors: [
			// Login wall
			'button[aria-label="Dismiss"]',
			'button:has-text("Sign in")',
			// Cookie banner
			'button:has-text("Accept")',
		],
		scrollToContent: '.feed-shared-update-v2',
		waitAfter: 500,
	},
	tiktok: {
		selectors: [
			// Cookie consent
			'button:has-text("Accept all")',
			// Login popup
			'[data-e2e="modal-close-inner-button"]',
		],
		scrollToContent: 'div[data-e2e="browse-video"]',
		waitAfter: 1000,
	},
	perplexity: {
		selectors: [
			// Login/signup modal close buttons
			'button[aria-label="Close"]',
			'button[aria-label="close"]',
			'[role="dialog"] button:has(svg)',
			// "Continue without signing in" or "Maybe later"
			'button:has-text("Maybe later")',
			'button:has-text("Continue")',
			'button:has-text("Skip")',
			// Cookie consent
			'button:has-text("Accept")',
			// Any X close button in modal
			'[class*="modal"] button:first-child',
			'[class*="Modal"] button:first-child',
		],
		scrollToContent: '[class*="answer"], [class*="response"], main',
		waitAfter: 500,
		hideCSS: `
			[role="dialog"],
			[class*="modal"],
			[class*="Modal"],
			[class*="overlay"],
			[class*="Overlay"] {
				display: none !important;
				visibility: hidden !important;
			}
		`,
	},
};

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
		viewport_width: 550, // Narrower viewport for card-friendly aspect ratio
		viewport_height: 800,
		device_scale_factor: 2,
		full_page: false,
		delay: 2000, // Extra wait for content to load
		selector: 'article[data-testid="tweet"]', // Single tweet
		fallback_full_viewport: true, // If tweet selector fails, capture viewport
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

	// AI/Research platforms
	perplexity: {
		viewport_width: 430, // Mobile viewport for cleaner preview
		viewport_height: 932, // iPhone 14 Pro Max dimensions
		device_scale_factor: 2,
		full_page: false,
		delay: 3000, // Extra delay for content to load and modals to appear
		selector: '[class*="answer"], [class*="response"], [class*="Answer"], main', // AI answer content
		fallback_full_viewport: true,
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
// POPUP DISMISSAL
// =============================================================================

/**
 * Dismiss popups, modals, and overlays before taking screenshot
 * Returns true if any popups were dismissed
 */
async function dismissPopups(
	page: any,
	platform: Platform
): Promise<boolean> {
	const config = POPUP_CONFIGS[platform];
	if (!config) return false;

	let dismissed = false;

	for (const selector of config.selectors) {
		try {
			// Try to find and click the element
			const element = page.locator(selector).first();

			// Check if visible with short timeout
			const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);

			if (isVisible) {
				console.log(`[Screenshot] Dismissing popup: ${selector}`);
				await element.click({ timeout: 2000 }).catch(() => {
					// Click might fail if element disappears, that's okay
				});
				dismissed = true;

				// Brief wait for animation
				await page.waitForTimeout(300);
			}
		} catch {
			// Selector not found or not visible, continue to next
		}
	}

	// Inject CSS to forcibly hide persistent elements (like Twitter bottom bar)
	if (config.hideCSS) {
		try {
			await page.addStyleTag({ content: config.hideCSS });
			console.log(`[Screenshot] Injected hide CSS for ${platform}`);
			dismissed = true; // Consider this a "dismissal" for wait purposes
		} catch {
			// CSS injection failed, continue anyway
		}
	}

	// Scroll to content if specified and popups were dismissed
	if (dismissed && config.scrollToContent) {
		try {
			const contentElement = page.locator(config.scrollToContent).first();
			await contentElement.scrollIntoViewIfNeeded({ timeout: 2000 });
		} catch {
			// Content element not found, continue anyway
		}
	}

	// Additional wait after dismissal
	if (dismissed && config.waitAfter) {
		await page.waitForTimeout(config.waitAfter);
	}

	return dismissed;
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

		// PHASE 4 FIX: Dismiss popups before screenshot
		const popupsDismissed = await dismissPopups(page, platform);
		if (popupsDismissed) {
			console.log(`[Screenshot] Dismissed popups for ${platform}, waiting for content to stabilize`);
			// Extra wait after popup dismissal for content to render
			await page.waitForTimeout(500);
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
