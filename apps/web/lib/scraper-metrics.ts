/**
 * Scraper metrics recording
 */

export function recordScraperEvent(
	platform: string,
	strategy: string,
	success: boolean,
	durationMs: number,
	errorCategory?: string
): void {
	const status = success ? 'SUCCESS' : 'FAILED';
	const suffix = errorCategory ? ` [${errorCategory}]` : '';
	console.log(
		`[ScraperMetrics] ${platform}/${strategy}: ${status} in ${durationMs}ms${suffix}`
	);
}
