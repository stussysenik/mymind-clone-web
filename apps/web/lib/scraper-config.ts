/**
 * Scraper configuration and constants
 */

export const STEALTH_ARGS = [
	'--disable-blink-features=AutomationControlled',
	'--no-sandbox',
	'--disable-setuid-sandbox',
	'--disable-dev-shm-usage',
	'--disable-accelerated-2d-canvas',
	'--no-first-run',
	'--no-zygote',
	'--disable-gpu',
];

export const DEFAULT_VIEWPORT = {
	width: 1920,
	height: 1080,
	deviceScaleFactor: 1,
};

export const USER_AGENTS = {
	chrome:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	googlebot:
		'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

export const DEFAULT_HEADERS = {
	'User-Agent': USER_AGENTS.chrome,
	'Accept-Language': 'en-US,en;q=0.9',
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
};

interface ScraperConfig {
	maxCarouselSize: number;
	navigationTimeout: number;
	captureWindowMs: number;
}

const DEFAULT_CONFIG: ScraperConfig = {
	maxCarouselSize: 10,
	navigationTimeout: 15000,
	captureWindowMs: 3000,
};

export function getScraperConfig(): ScraperConfig {
	return DEFAULT_CONFIG;
}

export function debugLog(tag: string, ...args: unknown[]): void {
	if (process.env.DEBUG_SCRAPER) {
		console.log(`[${tag}]`, ...args);
	} else {
		console.log(`[${tag}]`, ...args);
	}
}
