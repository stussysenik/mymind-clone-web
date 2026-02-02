/**
 * Instagram Carousel Scraper with Network Interception
 *
 * Strategy: Intercept CDN image requests in a controlled time window,
 * detect carousel size from DOM, and only capture that many images.
 *
 * OPTIMIZED for speed:
 * - Returns first image immediately
 * - Uses timing-based filtering (carousel images load first)
 * - Detects carousel size from dot indicators
 */

import type { Page, Browser, Response } from 'playwright';

// =============================================================================
// TYPES
// =============================================================================

export interface InstagramScraperResult {
	images: string[];
	caption: string;
	author: string;
	slideCount: number;
}

export interface InstagramQuickResult {
	firstImage: string | null;
	caption: string;
	author: string;
	isCarousel: boolean;
	expectedSlideCount: number;
}

interface ImageCandidate {
	url: string;
	timestamp: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const STEALTH_ARGS = [
	'--disable-blink-features=AutomationControlled',
	'--no-sandbox',
	'--disable-setuid-sandbox',
	'--disable-dev-shm-usage',
	'--disable-accelerated-2d-canvas',
	'--no-first-run',
	'--no-zygote',
	'--disable-gpu',
];

const VIEWPORT = {
	width: 1920,
	height: 1080,
	deviceScaleFactor: 1,
};

const USER_AGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const HEADERS = {
	'User-Agent': USER_AGENT,
	'Accept-Language': 'en-US,en;q=0.9',
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
};

// Time window for capturing carousel images (ms)
// Carousel images load in first 2-3 seconds, suggested posts load later
const CAPTURE_WINDOW_MS = 3000;

// Maximum images to capture (safety limit)
const MAX_CAROUSEL_SIZE = 10;

// =============================================================================
// IMAGE QUALITY FILTERING
// =============================================================================

/**
 * Determines if a URL is a high-resolution POST image (not thumbnail/profile)
 */
function isCarouselImage(url: string): boolean {
	// MUST be a post image (t51.2885-15 is the correct CDN marker for post images)
	if (!url.includes('t51.2885-15')) {
		return false;
	}

	// EXCLUDE patterns (low-quality thumbnails and profile pics)
	const excludePatterns = [
		't51.2885-19', // Profile pictures
		'150x150',
		'_s.jpg',
		'_t.jpg',
		'/s150x150/',
		'/s320x320/',
		'/c0.',
		'/e15/',
		// Note: _e35_ is used in high-res images, don't exclude it
		'profile_pic',
	];

	for (const pattern of excludePatterns) {
		if (url.includes(pattern)) {
			return false;
		}
	}

	// Must be an image file
	const urlLower = url.toLowerCase();
	if (!urlLower.includes('.jpg') && !urlLower.includes('.jpeg') && !urlLower.includes('.webp')) {
		return false;
	}

	return true;
}

/**
 * Extracts a unique signature from an image URL for deduplication
 */
function getImageSignature(url: string): string {
	try {
		const parsed = new URL(url);
		// Extract the unique media ID from the path
		// Instagram URLs have format: /v/t51.2885-15/{mediaId}_{suffix}/...
		const pathParts = parsed.pathname.split('/');
		// Find the segment that contains the media ID (usually has underscores)
		const mediaSegment = pathParts.find(p => p.includes('_') && p.length > 20);
		if (mediaSegment) {
			// Extract just the base ID (before resolution suffixes)
			return mediaSegment.split('_')[0];
		}
		return parsed.pathname;
	} catch {
		return url;
	}
}

/**
 * Deduplicates images by signature, preserving order
 */
function deduplicateImages(images: ImageCandidate[]): string[] {
	const seen = new Set<string>();
	const unique: string[] = [];

	// Sort by timestamp to preserve load order
	const sorted = [...images].sort((a, b) => a.timestamp - b.timestamp);

	for (const img of sorted) {
		const sig = getImageSignature(img.url);
		if (!seen.has(sig)) {
			seen.add(sig);
			unique.push(img.url);
		}
	}

	return unique;
}

// =============================================================================
// BROWSER HELPERS
// =============================================================================

/**
 * Detects carousel size by counting dot indicators
 */
async function detectCarouselSize(page: Page): Promise<number> {
	try {
		// Method 1: Count carousel indicator dots
		// Instagram uses a list of dots to indicate carousel position
		const dotCount = await page.locator('article div[role="tablist"] > div').count();
		if (dotCount > 1) {
			console.log(`[InstagramScraper] Detected ${dotCount} carousel dots`);
			return Math.min(dotCount, MAX_CAROUSEL_SIZE);
		}

		// Method 2: Check for carousel navigation buttons
		const hasNextButton = await page.locator('button[aria-label="Next"]').count() > 0;
		if (hasNextButton) {
			console.log('[InstagramScraper] Carousel detected (has Next button), estimating size');
			return MAX_CAROUSEL_SIZE; // We'll use network capture to determine actual count
		}

		// Method 3: Count images in the carousel list
		const listImages = await page.locator('article ul > li img').count();
		if (listImages > 1) {
			console.log(`[InstagramScraper] Found ${listImages} images in carousel list`);
			return Math.min(listImages, MAX_CAROUSEL_SIZE);
		}

		// Single image post
		return 1;
	} catch (error) {
		console.warn('[InstagramScraper] Error detecting carousel size:', error);
		return 1;
	}
}

/**
 * Dismisses Instagram login popup if present
 */
async function dismissLoginPopup(page: Page): Promise<void> {
	const dismissSelectors = [
		'button:has-text("Not now")',
		'button:has-text("Not Now")',
		'[aria-label="Close"]',
	];

	for (const selector of dismissSelectors) {
		try {
			const btn = page.locator(selector).first();
			if (await btn.isVisible({ timeout: 1000 })) {
				await btn.click();
				await page.waitForTimeout(200);
				break;
			}
		} catch {
			// Continue
		}
	}
}

/**
 * Extracts caption and author from page content
 */
async function extractMetadata(page: Page): Promise<{ caption: string; author: string }> {
	let caption = '';
	let author = '';

	try {
		// Get author from og:title
		const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
		if (ogTitle) {
			const authorMatch = ogTitle.match(/^([^:]+)\s+on\s+Instagram/i);
			if (authorMatch) {
				author = authorMatch[1].trim();
			}
		}

		// Get caption from og:description
		const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content');
		if (ogDesc) {
			// Clean up: remove "X likes, Y comments" prefix
			const captionMatch = ogDesc.match(/(?:\d+[KM]?\s*(?:likes?|comments?)[,\s-]*)*(.+)/i);
			caption = captionMatch ? captionMatch[1].trim() : ogDesc;
		}
	} catch (e) {
		console.warn('[InstagramScraper] Error extracting metadata:', e);
	}

	return { caption, author };
}

// =============================================================================
// MAIN SCRAPER FUNCTIONS
// =============================================================================

/**
 * Fast extraction - gets first image and metadata quickly
 * Used for immediate response
 */
export async function scrapeInstagramQuick(shortcode: string): Promise<InstagramQuickResult | null> {
	const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

	let playwright: typeof import('playwright');
	let chromium: typeof import('@sparticuz/chromium') | null = null;

	if (isServerless) {
		chromium = await import('@sparticuz/chromium');
		playwright = await import('playwright-core') as unknown as typeof import('playwright');
	} else {
		playwright = await import('playwright');
	}

	const launchOptions: Parameters<typeof playwright.chromium.launch>[0] = {
		headless: true,
		args: isServerless && chromium ? [...chromium.default.args, ...STEALTH_ARGS] : STEALTH_ARGS,
	};

	if (isServerless && chromium) {
		launchOptions.executablePath = await chromium.default.executablePath();
	}

	const browser: Browser = await playwright.chromium.launch(launchOptions);
	let firstImage: string | null = null;

	try {
		const context = await browser.newContext({
			viewport: VIEWPORT,
			userAgent: USER_AGENT,
			extraHTTPHeaders: HEADERS,
			javaScriptEnabled: true,
		});

		const page = await context.newPage();

		// Capture first high-res image
		const imagePromise = new Promise<string | null>((resolve) => {
			const timeout = setTimeout(() => resolve(null), 5000);

			page.on('response', (response: Response) => {
				const url = response.url();
				if (isCarouselImage(url) && !firstImage) {
					firstImage = url;
					clearTimeout(timeout);
					resolve(url);
				}
			});
		});

		// Navigate
		const postUrl = `https://www.instagram.com/p/${shortcode}/`;
		await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

		// Wait for first image
		await imagePromise;

		// Quick metadata
		const metadata = await extractMetadata(page);

		// Detect carousel
		const expectedSlideCount = await detectCarouselSize(page);
		const isCarousel = expectedSlideCount > 1;

		await context.close();
		await browser.close();

		console.log(`[InstagramScraper] Quick: first image captured, isCarousel=${isCarousel}, expected=${expectedSlideCount}`);

		return {
			firstImage,
			caption: metadata.caption,
			author: metadata.author,
			isCarousel,
			expectedSlideCount,
		};
	} catch (error) {
		await browser.close();
		console.error('[InstagramScraper] Quick extraction error:', error);
		return null;
	}
}

/**
 * Navigates through carousel slides to trigger lazy loading of all images
 * Returns the number of slides navigated
 */
async function navigateCarousel(page: Page, expectedSize: number): Promise<number> {
	let navigatedCount = 0;
	const maxAttempts = Math.min(expectedSize, MAX_CAROUSEL_SIZE);

	console.log(`[InstagramScraper] Navigating carousel, expecting ${expectedSize} slides`);

	for (let i = 0; i < maxAttempts - 1; i++) {
		try {
			// Look for Next button
			const nextButton = page.locator('button[aria-label="Next"]');
			const isVisible = await nextButton.isVisible({ timeout: 1000 }).catch(() => false);

			if (!isVisible) {
				console.log(`[InstagramScraper] No more Next button after ${navigatedCount} navigations`);
				break;
			}

			// Click next
			await nextButton.click();
			navigatedCount++;

			// Wait for new image to load
			await page.waitForTimeout(400);

			console.log(`[InstagramScraper] Clicked Next (${navigatedCount}/${maxAttempts - 1})`);
		} catch (e) {
			console.log(`[InstagramScraper] Navigation stopped: ${e}`);
			break;
		}
	}

	return navigatedCount + 1; // Include first slide
}

/**
 * Full carousel extraction with navigation-based loading
 * Clicks through carousel slides to trigger lazy loading of all images
 */
export async function scrapeInstagramCarousel(shortcode: string): Promise<InstagramScraperResult> {
	const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

	let playwright: typeof import('playwright');
	let chromium: typeof import('@sparticuz/chromium') | null = null;

	if (isServerless) {
		chromium = await import('@sparticuz/chromium');
		playwright = await import('playwright-core') as unknown as typeof import('playwright');
	} else {
		playwright = await import('playwright');
	}

	const launchOptions: Parameters<typeof playwright.chromium.launch>[0] = {
		headless: true,
		args: isServerless && chromium ? [...chromium.default.args, ...STEALTH_ARGS] : STEALTH_ARGS,
	};

	if (isServerless && chromium) {
		launchOptions.executablePath = await chromium.default.executablePath();
	}

	console.log('[InstagramScraper] Starting carousel extraction');
	const browser: Browser = await playwright.chromium.launch(launchOptions);

	const capturedImages: ImageCandidate[] = [];
	let imageCounter = 0;

	try {
		const context = await browser.newContext({
			viewport: VIEWPORT,
			userAgent: USER_AGENT,
			extraHTTPHeaders: HEADERS,
			javaScriptEnabled: true,
		});

		const page = await context.newPage();

		// Network interception - capture all carousel images as they load
		page.on('response', (response: Response) => {
			const url = response.url();

			// Only capture carousel images (post images, not profile pics/thumbnails)
			if (!isCarouselImage(url)) return;

			// Check content type
			const contentType = response.headers()['content-type'] || '';
			if (!contentType.includes('image/')) return;

			// Capture this image
			capturedImages.push({
				url,
				timestamp: imageCounter++,
			});

			console.log(`[InstagramScraper] Captured image #${imageCounter}: ${url.slice(0, 60)}...`);
		});

		// Navigate to post
		const postUrl = `https://www.instagram.com/p/${shortcode}/`;
		console.log(`[InstagramScraper] Navigating to ${postUrl}`);

		await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

		// Wait for initial content
		await page.waitForTimeout(1500);

		// Dismiss popup
		await dismissLoginPopup(page);

		// Detect expected carousel size
		const expectedSize = await detectCarouselSize(page);
		console.log(`[InstagramScraper] Expected carousel size: ${expectedSize}`);

		// CRITICAL: Navigate through carousel to trigger lazy loading of ALL images
		if (expectedSize > 1) {
			const actualSlides = await navigateCarousel(page, expectedSize);
			console.log(`[InstagramScraper] Navigated ${actualSlides} slides`);
		}

		// Wait for final images to load
		await page.waitForTimeout(800);

		// Extract metadata
		const metadata = await extractMetadata(page);

		await context.close();
		await browser.close();

		// Deduplicate
		const uniqueImages = deduplicateImages(capturedImages);

		// Use all unique images (up to MAX_CAROUSEL_SIZE)
		const finalImages = uniqueImages.slice(0, MAX_CAROUSEL_SIZE);

		console.log(`[InstagramScraper] Captured ${capturedImages.length} -> ${uniqueImages.length} unique -> ${finalImages.length} final`);

		return {
			images: finalImages,
			caption: metadata.caption,
			author: metadata.author,
			slideCount: finalImages.length,
		};
	} catch (error) {
		await browser.close();
		console.error('[InstagramScraper] Carousel extraction error:', error);
		throw error;
	}
}

// =============================================================================
// FALLBACK STRATEGIES
// =============================================================================

/**
 * Fetches images via Instagram's embed endpoint (lower quality fallback)
 */
export async function scrapeInstagramEmbed(shortcode: string): Promise<string[]> {
	try {
		const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
		const res = await fetch(embedUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		});

		if (!res.ok) return [];

		const html = await res.text();
		const images: string[] = [];

		// Look for display_url in embedded JSON
		const displayUrlRegex = /"display_url"\s*:\s*"([^"]+)"/g;
		let match;
		while ((match = displayUrlRegex.exec(html)) !== null) {
			if (match[1]) {
				const cleanUrl = match[1]
					.replace(/\\u0026/g, '&')
					.replace(/\\\//g, '/')
					.replace(/\\"/g, '"');

				// Only include high-res images
				if (cleanUrl.includes('t51.2885-15') && !images.includes(cleanUrl)) {
					images.push(cleanUrl);
				}
			}
		}

		return images;
	} catch (e) {
		console.warn('[InstagramScraper] Embed fallback failed:', e);
		return [];
	}
}

/**
 * Scrapes Instagram carousel via embed page with browser navigation
 * This approach works without login by using the public embed endpoint
 * and clicking through the carousel to trigger network requests for all images
 */
export async function scrapeInstagramViaEmbed(shortcode: string): Promise<InstagramScraperResult> {
	const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

	let playwright: typeof import('playwright');
	let chromium: typeof import('@sparticuz/chromium') | null = null;

	if (isServerless) {
		chromium = await import('@sparticuz/chromium');
		playwright = await import('playwright-core') as unknown as typeof import('playwright');
	} else {
		playwright = await import('playwright');
	}

	const launchOptions: Parameters<typeof playwright.chromium.launch>[0] = {
		headless: true,
		args: isServerless && chromium ? [...chromium.default.args, ...STEALTH_ARGS] : STEALTH_ARGS,
	};

	if (isServerless && chromium) {
		launchOptions.executablePath = await chromium.default.executablePath();
	}

	console.log('[InstagramScraper] Starting embed page carousel extraction');
	const browser: Browser = await playwright.chromium.launch(launchOptions);

	const capturedImages: ImageCandidate[] = [];
	let imageCounter = 0;

	try {
		const context = await browser.newContext({
			viewport: VIEWPORT,
			userAgent: USER_AGENT,
			extraHTTPHeaders: HEADERS,
			javaScriptEnabled: true,
		});

		const page = await context.newPage();

		// Network interception - capture all high-res images as they load
		page.on('response', (response: Response) => {
			const url = response.url();

			// Only capture high-res carousel images (t51.2885-15 is the CDN marker)
			if (!url.includes('t51.2885-15')) return;

			// Exclude thumbnails and profile pics
			const excludePatterns = ['150x150', '_s.jpg', '_t.jpg', '/s150x150/', '/s320x320/', 'profile_pic'];
			for (const pattern of excludePatterns) {
				if (url.includes(pattern)) return;
			}

			// Must be an image file
			if (!url.includes('.jpg') && !url.includes('.jpeg') && !url.includes('.webp')) return;

			// Check content type
			const contentType = response.headers()['content-type'] || '';
			if (!contentType.includes('image/')) return;

			// Capture this image
			capturedImages.push({
				url,
				timestamp: imageCounter++,
			});

			console.log(`[InstagramScraper] Embed captured image #${imageCounter}: ${url.slice(0, 80)}...`);
		});

		// Navigate to embed page (works without login)
		const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
		console.log(`[InstagramScraper] Navigating to embed: ${embedUrl}`);

		await page.goto(embedUrl, { waitUntil: 'networkidle', timeout: 20000 });

		// Wait for initial content to load
		await page.waitForTimeout(1000);

		// Extract metadata from embed page
		let caption = '';
		let author = '';

		try {
			// Try to get caption from embed
			const captionEl = await page.locator('.Caption').first();
			if (await captionEl.isVisible({ timeout: 1000 }).catch(() => false)) {
				caption = await captionEl.innerText().catch(() => '');
			}

			// Try to get author from embed
			const authorEl = await page.locator('.UsernameText').first();
			if (await authorEl.isVisible({ timeout: 1000 }).catch(() => false)) {
				author = await authorEl.innerText().catch(() => '');
			}
		} catch {
			// Metadata extraction is optional
		}

		// Navigate through carousel by clicking Next button repeatedly
		let clickCount = 0;
		const maxClicks = MAX_CAROUSEL_SIZE - 1; // -1 because first image already loaded

		console.log('[InstagramScraper] Starting carousel navigation...');

		while (clickCount < maxClicks) {
			try {
				// Look for Next button in embed (different selector than main page)
				const nextButton = page.locator('button.coreSpriteRightChevron, button[aria-label="Next"], .LeftChevron + .RightChevron, button:has(svg[aria-label="Next"])');
				const isVisible = await nextButton.first().isVisible({ timeout: 1500 }).catch(() => false);

				if (!isVisible) {
					console.log(`[InstagramScraper] No more Next button after ${clickCount} clicks`);
					break;
				}

				// Click next
				await nextButton.first().click();
				clickCount++;

				// Wait for new image to load via network
				await page.waitForTimeout(400);

				console.log(`[InstagramScraper] Embed clicked Next (${clickCount}/${maxClicks})`);
			} catch (e) {
				console.log(`[InstagramScraper] Embed navigation stopped: ${e}`);
				break;
			}
		}

		// Wait for final images to load
		await page.waitForTimeout(500);

		await context.close();
		await browser.close();

		// Deduplicate images
		const uniqueImages = deduplicateImages(capturedImages);
		const finalImages = uniqueImages.slice(0, MAX_CAROUSEL_SIZE);

		console.log(`[InstagramScraper] Embed captured ${capturedImages.length} -> ${uniqueImages.length} unique -> ${finalImages.length} final`);

		return {
			images: finalImages,
			caption,
			author,
			slideCount: finalImages.length,
		};
	} catch (error) {
		await browser.close();
		console.error('[InstagramScraper] Embed carousel extraction error:', error);
		throw error;
	}
}

/**
 * Main extraction function with fallback chain
 */
export async function extractInstagramImages(url: string): Promise<InstagramScraperResult | null> {
	// Extract shortcode
	const shortcodeMatch = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
	const shortcode = shortcodeMatch?.[2];

	if (!shortcode) {
		console.error('[InstagramScraper] Could not extract shortcode from URL:', url);
		return null;
	}

	// Strategy 1: Embed page with browser carousel navigation (BEST - works without login)
	try {
		console.log('[InstagramScraper] Strategy 1: Embed page with carousel navigation');
		const result = await scrapeInstagramViaEmbed(shortcode);
		if (result.images.length > 0) {
			console.log(`[InstagramScraper] Embed navigation succeeded: ${result.images.length} images`);
			return result;
		}
	} catch (e) {
		console.warn('[InstagramScraper] Strategy 1 (embed navigation) failed:', e);
	}

	// Strategy 2: Direct post page with Playwright (may require login for some posts)
	try {
		console.log('[InstagramScraper] Strategy 2: Direct post page with Playwright');
		const result = await scrapeInstagramCarousel(shortcode);
		if (result.images.length > 0) {
			console.log(`[InstagramScraper] Direct page succeeded: ${result.images.length} images`);
			return result;
		}
	} catch (e) {
		console.warn('[InstagramScraper] Strategy 2 (direct page) failed:', e);
	}

	// Strategy 3: Static embed HTML parsing (fastest but may miss carousel images)
	try {
		console.log('[InstagramScraper] Strategy 3: Static embed HTML parsing');
		const images = await scrapeInstagramEmbed(shortcode);
		if (images.length > 0) {
			console.log(`[InstagramScraper] Static embed succeeded: ${images.length} images`);
			return {
				images,
				caption: '',
				author: '',
				slideCount: images.length,
			};
		}
	} catch (e) {
		console.warn('[InstagramScraper] Strategy 3 (static embed) failed:', e);
	}

	console.error('[InstagramScraper] All strategies failed');
	return null;
}
