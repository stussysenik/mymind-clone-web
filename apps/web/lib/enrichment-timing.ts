/**
 * MyMind Clone - Enrichment Timing Utilities
 *
 * Provides estimated processing times for AI enrichment based on platform,
 * content type, and historical data. Used for real-time ETA display.
 *
 * @fileoverview Enrichment ETA calculation
 */

// =============================================================================
// TYPES
// =============================================================================

export interface EnrichmentTiming {
	/** Timestamp when enrichment started */
	startedAt: number;
	/** Platform being processed */
	platform: string;
	/** Estimated total time in ms */
	estimatedTotalMs: number;
	/** Time spent on scraping (if applicable) */
	scrapeMs?: number;
	/** Time spent on AI classification */
	classifyMs?: number;
	/** Time spent on image analysis */
	imageAnalysisMs?: number;
	/** Total time taken (filled on completion) */
	totalMs?: number;
}

export interface EnrichmentStage {
	name: string;
	label: string;
	icon: string;
	estimatedPercent: number; // What % of total time this stage typically takes
}

// =============================================================================
// STAGE DEFINITIONS
// =============================================================================

/**
 * Enrichment processing stages with visual feedback
 */
export const ENRICHMENT_STAGES: EnrichmentStage[] = [
	{
		name: 'fetching',
		label: 'Fetching content...',
		icon: '🔍',
		estimatedPercent: 15,
	},
	{
		name: 'analyzing',
		label: 'Analyzing with AI...',
		icon: '🧠',
		estimatedPercent: 50,
	},
	{
		name: 'extracting',
		label: 'Extracting insights...',
		icon: '✨',
		estimatedPercent: 25,
	},
	{
		name: 'finalizing',
		label: 'Finalizing...',
		icon: '📝',
		estimatedPercent: 10,
	},
];

// =============================================================================
// PLATFORM TIMING ESTIMATES
// =============================================================================

/**
 * Base estimated times (in ms) per platform.
 * These are based on typical processing times:
 * - oEmbed/API sources are faster
 * - Playwright scraping is slower
 * - AI analysis adds consistent overhead
 */
const PLATFORM_BASE_TIMES: Record<string, number> = {
	// Fast platforms (API-based, minimal scraping)
	youtube: 6000,      // oEmbed + AI
	twitter: 5000,      // Syndication API
	reddit: 6000,       // JSON API

	// Medium platforms (JSON-LD extraction)
	imdb: 7000,         // JSON-LD parsing
	letterboxd: 7000,   // JSON-LD parsing
	goodreads: 8000,    // HTML parsing
	amazon: 8000,       // JSON-LD parsing
	storygraph: 8000,   // HTML parsing
	wikipedia: 6000,    // REST API

	// Slow platforms (complex scraping)
	instagram: 15000,   // Playwright required
	tiktok: 12000,      // Complex auth

	// Generic fallback
	generic: 10000,
};

/**
 * Additional time per 1000 characters of content
 */
const TIME_PER_1000_CHARS = 500; // 0.5s per 1000 chars

/**
 * Additional time if image analysis is needed
 */
const IMAGE_ANALYSIS_TIME = 3000;

// =============================================================================
// ETA CALCULATION
// =============================================================================

/**
 * Estimates enrichment time based on platform and content characteristics.
 */
export function estimateEnrichmentTime(
	platform: string,
	contentLength: number = 0,
	hasImage: boolean = false,
	imageCount: number = 1
): number {
	// Base time for platform
	const baseTime = PLATFORM_BASE_TIMES[platform.toLowerCase()] || PLATFORM_BASE_TIMES.generic;

	// Content length factor (longer content = more processing)
	const contentFactor = Math.floor(contentLength / 1000) * TIME_PER_1000_CHARS;

	// Image analysis factor
	const imageFactor = hasImage ? IMAGE_ANALYSIS_TIME * Math.min(imageCount, 3) : 0;

	// Total estimated time
	return baseTime + contentFactor + imageFactor;
}

/**
 * Gets the current stage and progress based on elapsed time.
 */
export function getEnrichmentProgress(
	elapsedMs: number,
	estimatedTotalMs: number
): {
	stage: EnrichmentStage;
	stageIndex: number;
	overallProgress: number;
	stageProgress: number;
	remainingMs: number;
} {
	const overallProgress = Math.min(elapsedMs / estimatedTotalMs, 0.95); // Cap at 95% until complete

	let accumulatedPercent = 0;
	let stageIndex = 0;
	let stageProgress = 0;

	for (let i = 0; i < ENRICHMENT_STAGES.length; i++) {
		const stage = ENRICHMENT_STAGES[i];
		const stageEnd = accumulatedPercent + stage.estimatedPercent / 100;

		if (overallProgress <= stageEnd) {
			stageIndex = i;
			const stageStart = accumulatedPercent;
			const stageRange = stage.estimatedPercent / 100;
			stageProgress = (overallProgress - stageStart) / stageRange;
			break;
		}

		accumulatedPercent = stageEnd;
		stageIndex = i;
	}

	// Handle edge case where we're past all stages
	if (stageIndex >= ENRICHMENT_STAGES.length) {
		stageIndex = ENRICHMENT_STAGES.length - 1;
	}

	const remainingMs = Math.max(0, estimatedTotalMs - elapsedMs);

	return {
		stage: ENRICHMENT_STAGES[stageIndex],
		stageIndex,
		overallProgress,
		stageProgress: Math.min(stageProgress, 1),
		remainingMs,
	};
}

/**
 * Formats remaining time for display.
 */
export function formatRemainingTime(ms: number): string {
	if (ms < 1000) return 'Almost done...';
	if (ms < 5000) return 'A few seconds...';

	const seconds = Math.ceil(ms / 1000);
	if (seconds < 60) return `~${seconds}s remaining`;

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (remainingSeconds === 0) return `~${minutes}m remaining`;
	return `~${minutes}m ${remainingSeconds}s remaining`;
}

/**
 * Creates initial timing object when enrichment starts.
 */
export function createEnrichmentTiming(
	platform: string,
	contentLength: number = 0,
	hasImage: boolean = false,
	imageCount: number = 1
): EnrichmentTiming {
	return {
		startedAt: Date.now(),
		platform,
		estimatedTotalMs: estimateEnrichmentTime(platform, contentLength, hasImage, imageCount),
	};
}

/**
 * Updates timing with actual measurements.
 */
export function updateEnrichmentTiming(
	timing: EnrichmentTiming,
	updates: Partial<Pick<EnrichmentTiming, 'scrapeMs' | 'classifyMs' | 'imageAnalysisMs' | 'totalMs'>>
): EnrichmentTiming {
	return {
		...timing,
		...updates,
	};
}
