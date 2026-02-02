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

// =============================================================================
// STUCK DETECTION
// =============================================================================

/**
 * Maximum time (ms) before considering enrichment "stuck".
 * After this time, we assume something went wrong and stop showing the loading indicator.
 * 5 minutes = 300,000 ms
 */
export const STUCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Checks if a card's enrichment is stuck (processing for too long).
 *
 * A card is considered stuck if:
 * - metadata.processing === true AND
 * - enrichmentTiming.startedAt is older than STUCK_TIMEOUT_MS (5 minutes)
 *
 * If stuck, the card should be treated as "done" (with or without AI data).
 */
export function isEnrichmentStuck(metadata: {
	processing?: boolean;
	enrichmentTiming?: { startedAt?: number };
	enrichmentError?: string;
	enrichmentFailedAt?: string;
} | null | undefined): { stuck: boolean; failed: boolean; elapsedMs: number } {
	if (!metadata?.processing) {
		return { stuck: false, failed: false, elapsedMs: 0 };
	}

	const startedAt = metadata.enrichmentTiming?.startedAt;
	const elapsedMs = startedAt ? Date.now() - startedAt : 0;

	// Check if there's an explicit error
	if (metadata.enrichmentError || metadata.enrichmentFailedAt) {
		return { stuck: true, failed: true, elapsedMs };
	}

	if (!startedAt) {
		// No timestamp - can't determine, assume not stuck yet
		// But if processing without a timestamp, that's suspicious after a while
		return { stuck: false, failed: false, elapsedMs: 0 };
	}

	const stuck = elapsedMs > STUCK_TIMEOUT_MS;

	// stuck but not failed - just taking too long (no explicit error)
	return { stuck, failed: false, elapsedMs };
}

/**
 * Gets the processing state of a card for UI display.
 *
 * Returns:
 * - 'idle': Not processing, no errors
 * - 'processing': Currently processing (within timeout)
 * - 'slow': Processing but taking longer than expected (but not yet stuck)
 * - 'stuck': Processing but timed out (>5 min) - show options to user
 * - 'failed': Explicit error recorded
 */
export type ProcessingState = 'idle' | 'processing' | 'slow' | 'stuck' | 'failed';

/** Time (ms) after which processing is considered "slow" but not failed (2 minutes) */
export const SLOW_TIMEOUT_MS = 2 * 60 * 1000;

export function getProcessingState(metadata: {
	processing?: boolean;
	enrichmentTiming?: { startedAt?: number; estimatedTotalMs?: number };
	enrichmentError?: string;
	enrichmentFailedAt?: string;
} | null | undefined): ProcessingState {
	if (!metadata?.processing) {
		return 'idle';
	}

	// Check for explicit failure
	if (metadata.enrichmentError || metadata.enrichmentFailedAt) {
		return 'failed';
	}

	// Check for timeout (stuck = 5 min)
	const { stuck, elapsedMs } = isEnrichmentStuck(metadata);
	if (stuck) {
		return 'stuck';
	}

	// Check if slow (> 2 min or > 2x estimated time)
	const estimatedMs = metadata.enrichmentTiming?.estimatedTotalMs || 15000;
	const slowThreshold = Math.max(SLOW_TIMEOUT_MS, estimatedMs * 2);
	if (elapsedMs > slowThreshold) {
		return 'slow';
	}

	return 'processing';
}
