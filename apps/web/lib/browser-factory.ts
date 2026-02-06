/**
 * Browser factory for stealth Playwright sessions
 */

import type { Page, Browser } from 'playwright';
import {
	STEALTH_ARGS,
	DEFAULT_VIEWPORT,
	USER_AGENTS,
	DEFAULT_HEADERS,
} from './scraper-config';

interface StealthPageResult {
	page: Page;
	cleanup: () => Promise<void>;
}

/**
 * Creates a stealth browser page with bot evasion settings.
 * Returns the page and a cleanup function that closes browser + context.
 */
export async function createStealthPage(): Promise<StealthPageResult> {
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

	const context = await browser.newContext({
		viewport: DEFAULT_VIEWPORT,
		userAgent: USER_AGENTS.chrome,
		extraHTTPHeaders: DEFAULT_HEADERS,
		javaScriptEnabled: true,
	});

	const page = await context.newPage();

	const cleanup = async () => {
		await context.close();
		await browser.close();
	};

	return { page, cleanup };
}

/**
 * Waits for a random delay between min and max milliseconds
 */
export async function humanDelay(minMs: number, maxMs: number): Promise<void> {
	const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
	await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Clicks an element with human-like behavior
 */
export async function humanClick(page: Page, selector: string): Promise<void> {
	const element = page.locator(selector).first();
	await element.click();
}

/**
 * Wraps a scraper function with timing metrics
 */
export async function withScraperMetrics<T>(
	platform: string,
	strategy: string,
	fn: () => Promise<T>
): Promise<T> {
	const startTime = Date.now();
	try {
		const result = await fn();
		const duration = Date.now() - startTime;
		console.log(`[ScraperMetrics] ${platform}/${strategy}: SUCCESS in ${duration}ms`);
		return result;
	} catch (error) {
		const duration = Date.now() - startTime;
		console.log(`[ScraperMetrics] ${platform}/${strategy}: FAILED in ${duration}ms`);
		throw error;
	}
}

/**
 * Categorizes an error into a short string for metrics
 */
export function categorizeError(error: unknown): string {
	if (error instanceof Error) {
		if (error.message.includes('timeout') || error.message.includes('Timeout')) {
			return 'TIMEOUT';
		}
		if (error.message.includes('net::') || error.message.includes('Navigation')) {
			return 'NETWORK';
		}
		if (error.message.includes('Target closed') || error.message.includes('browser')) {
			return 'BROWSER_CRASH';
		}
		return 'UNKNOWN';
	}
	return 'UNKNOWN';
}
