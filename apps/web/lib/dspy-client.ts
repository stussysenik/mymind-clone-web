/**
 * DSPy Service Client
 *
 * TypeScript client for communicating with the DSPy content quality service.
 * Handles title extraction, summary generation, and asset extraction
 * for Instagram, Twitter, and Reddit.
 *
 * @fileoverview DSPy microservice client
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const DSPY_SERVICE_URL = process.env.DSPY_SERVICE_URL || 'http://localhost:8000';
const DSPY_TIMEOUT = parseInt(process.env.DSPY_TIMEOUT || '10000', 10);
const DSPY_ENABLED = process.env.DSPY_ENABLED !== 'false';

// Circuit breaker configuration
const CIRCUIT_FAILURE_THRESHOLD = 3;    // Open circuit after 3 consecutive failures
const CIRCUIT_RESET_MS = 60000;          // Reset circuit after 60s cooldown

// =============================================================================
// TYPES
// =============================================================================

export type DSPyPlatform =
  | 'instagram'
  | 'twitter'
  | 'reddit'
  | 'imdb'
  | 'letterboxd'
  | 'youtube'
  | 'amazon'
  | 'goodreads'
  | 'storygraph'
  | 'wikipedia';

export interface TitleRequest {
  raw_content: string;
  author: string;
  platform: DSPyPlatform;
}

export interface TitleResponse {
  title: string;
  is_valid: boolean;
  issues: string[];
  confidence: number;
}

export interface SummaryRequest {
  content: string;
  platform: DSPyPlatform;
  author?: string;
  title?: string;
  image_count?: number;
}

export interface SummaryResponse {
  summary: string;
  key_topics: string[];
  content_type: string;
  quality_score: number;
  is_analytical: boolean;
}

export interface AssetRequest {
  html_content: string;
  platform: DSPyPlatform;
  expected_count?: number;
}

export interface AssetResponse {
  images: Array<{
    url: string;
    source: string;
    quality: string;
  }>;
  primary_image: string | null;
  is_carousel: boolean;
  total_images: number;
  extraction_confidence: number;
}

export interface UnifiedRequest {
  url: string;
  platform: DSPyPlatform;
  raw_html?: string;
  raw_caption?: string;
  detected_author?: string;
  json_data?: string;
}

export interface UnifiedResponse {
  title: string;
  author: string;
  summary: string;
  images: string[];
  video_url?: string;
  thumbnail_url?: string;
  content_type: string;
  hashtags: string[];
  mentions: string[];
  confidence: number;
  platform_data: {
    title_issues?: string[];
    key_topics?: string[];
    is_carousel?: boolean;
    total_images?: number;
  };
}

/**
 * Request for hierarchical tag generation via DSPy.
 * Uses 3-layer tag hierarchy: primary (essence), contextual (subject), vibe (mood)
 */
export interface TagsRequest {
  content: string;
  platform: DSPyPlatform;
  image_url?: string;
  title?: string;
  image_count?: number;
}

/**
 * Response from DSPy tag generation.
 * Structured hierarchical tags for cross-disciplinary discovery.
 */
export interface TagsResponse {
  tags: {
    primary: string[];     // 1-2 essence tags: "bmw", "terence-tao", "breakdance"
    contextual: string[];  // 1-2 subject tags: "automotive", "mathematics", "dance"
    vibe: string;          // 1 abstract mood: "kinetic", "minimalist", "contemplative"
  };
  confidence: number;
  reasoning?: string;
}

// =============================================================================
// CLIENT CLASS
// =============================================================================

class DSPyClient {
  private baseUrl: string;
  private timeout: number;
  private enabled: boolean;

  // Circuit breaker state
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private circuitOpen: boolean = false;

  constructor() {
    this.baseUrl = DSPY_SERVICE_URL;
    this.timeout = DSPY_TIMEOUT;
    this.enabled = DSPY_ENABLED;
  }

  /**
   * Check if circuit breaker is open (service is down)
   */
  private isCircuitOpen(): boolean {
    if (!this.circuitOpen) return false;

    // Check if cooldown has passed
    const now = Date.now();
    if (now - this.lastFailureTime > CIRCUIT_RESET_MS) {
      console.log('[DSPy] Circuit breaker reset - attempting half-open');
      this.circuitOpen = false;
      this.failureCount = 0;
      return false;
    }

    return true;
  }

  /**
   * Record a failure and potentially open the circuit
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= CIRCUIT_FAILURE_THRESHOLD) {
      this.circuitOpen = true;
      console.warn(`[DSPy] Circuit breaker OPEN after ${this.failureCount} failures. Will retry in ${CIRCUIT_RESET_MS / 1000}s`);
    }
  }

  /**
   * Record a success and reset failure count
   */
  private recordSuccess(): void {
    if (this.circuitOpen) {
      console.log('[DSPy] Circuit breaker CLOSED - service recovered');
    }
    this.failureCount = 0;
    this.circuitOpen = false;
  }

  /**
   * Check if DSPy service is available
   */
  async isHealthy(): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Extract and validate title
   */
  async extractTitle(req: TitleRequest): Promise<TitleResponse | null> {
    if (!this.enabled) return null;

    try {
      const response = await this.post<TitleResponse>('/extract/title', req);
      console.log(`[DSPy] Title extracted: "${response.title.slice(0, 40)}..." (confidence: ${response.confidence})`);
      return response;
    } catch (error) {
      console.warn('[DSPy] Title extraction failed:', error);
      return null;
    }
  }

  /**
   * Generate analytical summary
   */
  async generateSummary(req: SummaryRequest): Promise<SummaryResponse | null> {
    if (!this.enabled) return null;

    try {
      const response = await this.post<SummaryResponse>('/generate/summary', req);
      console.log(`[DSPy] Summary generated (quality: ${response.quality_score}, analytical: ${response.is_analytical})`);
      return response;
    } catch (error) {
      console.warn('[DSPy] Summary generation failed:', error);
      return null;
    }
  }

  /**
   * Generate hierarchical tags using DSPy signatures.
   * Uses 3-layer structure: primary (essence), contextual (subject), vibe (mood)
   * Enables cross-disciplinary discovery through abstract "vibe" tags.
   */
  async generateTags(req: TagsRequest): Promise<TagsResponse | null> {
    if (!this.enabled) return null;

    try {
      const response = await this.post<TagsResponse>('/generate/tags', req);
      const tagCount = response.tags.primary.length + response.tags.contextual.length + (response.tags.vibe ? 1 : 0);
      console.log(`[DSPy] Tags generated (${tagCount} tags, confidence: ${response.confidence})`);
      return response;
    } catch (error) {
      console.warn('[DSPy] Tag generation failed:', error);
      return null;
    }
  }

  /**
   * Extract assets (images, videos)
   */
  async extractAssets(req: AssetRequest): Promise<AssetResponse | null> {
    if (!this.enabled) return null;

    try {
      const response = await this.post<AssetResponse>('/extract/assets', req);
      console.log(`[DSPy] Assets extracted: ${response.total_images} images (carousel: ${response.is_carousel})`);
      return response;
    } catch (error) {
      console.warn('[DSPy] Asset extraction failed:', error);
      return null;
    }
  }

  /**
   * Unified extraction (title + summary + assets in one call)
   * This is the recommended endpoint for full content processing.
   */
  async extractUnified(req: UnifiedRequest): Promise<UnifiedResponse | null> {
    if (!this.enabled) return null;

    try {
      const response = await this.post<UnifiedResponse>('/extract/unified', req);
      console.log(`[DSPy] Unified extraction complete (confidence: ${response.confidence})`);
      return response;
    } catch (error) {
      console.warn('[DSPy] Unified extraction failed:', error);
      return null;
    }
  }

  /**
   * Internal POST request helper with circuit breaker
   */
  private async post<T>(endpoint: string, body: unknown): Promise<T> {
    // Check circuit breaker first
    if (this.isCircuitOpen()) {
      throw new Error('DSPy circuit breaker is open');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        this.recordFailure();
        throw new Error(`DSPy API error: ${response.status} - ${error}`);
      }

      // Success - reset failure count
      this.recordSuccess();
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      this.recordFailure();
      throw error;
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const dspyClient = new DSPyClient();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Extract clean title using DSPy, with fallback to simple extraction.
 */
export async function extractTitleWithDSPy(
  rawContent: string,
  author: string,
  platform: DSPyPlatform
): Promise<{ title: string; confidence: number }> {
  // Try DSPy first
  const dspyResult = await dspyClient.extractTitle({
    raw_content: rawContent,
    author,
    platform,
  });

  if (dspyResult && dspyResult.is_valid) {
    return {
      title: dspyResult.title,
      confidence: dspyResult.confidence,
    };
  }

  // Fallback to simple extraction
  let cleanContent = rawContent;

  // Remove author prefix
  const authorVariants = [
    author,
    author.toLowerCase(),
    author.replace('@', ''),
    `@${author.replace('@', '')}`,
  ].filter(Boolean);

  for (const variant of authorVariants) {
    if (cleanContent.toLowerCase().startsWith(variant.toLowerCase())) {
      cleanContent = cleanContent.slice(variant.length).trim();
      break;
    }
  }

  // Remove leading separators
  cleanContent = cleanContent.replace(/^[\s\-:·]+/, '');

  const title = cleanContent.slice(0, 80).trim() || 'Untitled';

  return {
    title,
    confidence: dspyResult ? 0.5 : 0.3, // Lower confidence for fallback
  };
}

/**
 * Generate summary using DSPy, with fallback to simple generation.
 */
export async function generateSummaryWithDSPy(
  content: string,
  platform: DSPyPlatform,
  options: { author?: string; title?: string; imageCount?: number } = {}
): Promise<{ summary: string; qualityScore: number; isAnalytical: boolean }> {
  // Try DSPy first
  const dspyResult = await dspyClient.generateSummary({
    content,
    platform,
    author: options.author,
    title: options.title,
    image_count: options.imageCount,
  });

  if (dspyResult && dspyResult.is_analytical) {
    return {
      summary: dspyResult.summary,
      qualityScore: dspyResult.quality_score,
      isAnalytical: true,
    };
  }

  // Fallback to truncation (not ideal, but better than nothing)
  const summary = content.slice(0, 150).trim() + (content.length > 150 ? '...' : '');

  return {
    summary,
    qualityScore: 0.3,
    isAnalytical: false,
  };
}

/**
 * Extract assets using DSPy, with fallback to regex extraction.
 */
export async function extractAssetsWithDSPy(
  htmlContent: string,
  platform: DSPyPlatform,
  expectedCount: number = 1
): Promise<{ images: string[]; isCarousel: boolean; confidence: number }> {
  // Try DSPy first
  const dspyResult = await dspyClient.extractAssets({
    html_content: htmlContent,
    platform,
    expected_count: expectedCount,
  });

  if (dspyResult && dspyResult.total_images > 0) {
    return {
      images: dspyResult.images.map((img) => img.url),
      isCarousel: dspyResult.is_carousel,
      confidence: dspyResult.extraction_confidence,
    };
  }

  // Fallback to regex
  const images: string[] = [];

  // Extract display_url
  const displayUrlRegex = /"display_url"\s*:\s*"([^"]+)"/g;
  let match;
  while ((match = displayUrlRegex.exec(htmlContent)) !== null) {
    const url = match[1]
      .replace(/\\u0026/g, '&')
      .replace(/\\\//g, '/');
    if (!images.includes(url)) {
      images.push(url);
    }
  }

  return {
    images,
    isCarousel: images.length > 1,
    confidence: images.length > 0 ? 0.5 : 0.1,
  };
}

/**
 * Complete unified extraction with DSPy
 */
export async function extractContentWithDSPy(
  url: string,
  platform: DSPyPlatform,
  rawData: {
    html?: string;
    caption?: string;
    author?: string;
    json?: string;
  }
): Promise<UnifiedResponse | null> {
  return dspyClient.extractUnified({
    url,
    platform,
    raw_html: rawData.html,
    raw_caption: rawData.caption,
    detected_author: rawData.author,
    json_data: rawData.json,
  });
}

/**
 * Generate hierarchical tags using DSPy, with fallback to empty array.
 * Uses 3-layer hierarchy for cross-disciplinary discovery:
 * - PRIMARY (1-2): Essence - "bmw", "terence-tao", "breakdance"
 * - CONTEXTUAL (1-2): Subject - "automotive", "mathematics", "dance"
 * - VIBE (1): Abstract mood - "kinetic", "minimalist", "contemplative"
 *
 * @param content - Text content to analyze (caption, description, etc)
 * @param platform - Source platform for context-aware tagging
 * @param options - Optional image URL and title for multimodal analysis
 * @returns Flattened array of tags with confidence score
 */
export async function generateTagsWithDSPy(
  content: string,
  platform: DSPyPlatform,
  options: { imageUrl?: string; title?: string; imageCount?: number } = {}
): Promise<{ tags: string[]; confidence: number }> {
  // Try DSPy first (O(1) optimized inference)
  const dspyResult = await dspyClient.generateTags({
    content,
    platform,
    image_url: options.imageUrl,
    title: options.title,
    image_count: options.imageCount,
  });

  if (dspyResult && dspyResult.confidence > 0.5) {
    // Flatten hierarchical tags to array
    const flatTags = [
      ...dspyResult.tags.primary,
      ...dspyResult.tags.contextual,
      dspyResult.tags.vibe,
    ].filter(Boolean);

    console.log(`[DSPy] Tags generated: [${flatTags.join(', ')}] (confidence: ${dspyResult.confidence})`);
    return { tags: flatTags, confidence: dspyResult.confidence };
  }

  // Fallback to empty - GLM classification will handle tagging
  console.log('[DSPy] Tag generation skipped or low confidence, falling back to GLM');
  return { tags: [], confidence: 0 };
}

// =============================================================================
// IMDB/MOVIE TITLE CLEANING
// =============================================================================

/**
 * Cleans IMDB and movie titles by removing metadata cruft.
 * Examples:
 * - "Cyberpunk: Edgerunners (TV Series 2022– )" -> "Cyberpunk: Edgerunners"
 * - "The Matrix (1999) ⭐ 8.7" -> "The Matrix"
 * - "Breaking Bad (TV Series 2008–2013)" -> "Breaking Bad"
 */
export function cleanMovieTitle(rawTitle: string): { title: string; year?: string; rating?: string } {
  let title = rawTitle.trim();
  let year: string | undefined;
  let rating: string | undefined;

  // Extract star rating (⭐ 8.3)
  const ratingMatch = title.match(/[⭐★]\s*(\d+\.?\d*)/);
  if (ratingMatch) {
    rating = ratingMatch[1];
    title = title.replace(ratingMatch[0], '').trim();
  }

  // Extract year patterns:
  // "(2022)" - single year
  // "(2022– )" - ongoing series
  // "(2008–2013)" - completed series
  // "(TV Series 2022– )" - with TV Series prefix
  const yearPatterns = [
    /\s*\(TV Series\s+(\d{4})[–-]\s*\d*\s*\)/i,  // (TV Series 2022– )
    /\s*\(TV Mini[- ]Series\s+(\d{4})\)/i,        // (TV Mini-Series 2022)
    /\s*\(Video Game\s+(\d{4})\)/i,               // (Video Game 2022)
    /\s*\(Short\s+(\d{4})\)/i,                    // (Short 2022)
    /\s*\((\d{4})[–-]\d*\s*\)/,                   // (2008–2013) or (2022– )
    /\s*\((\d{4})\)/,                             // (2022)
  ];

  for (const pattern of yearPatterns) {
    const match = title.match(pattern);
    if (match) {
      year = match[1];
      title = title.replace(pattern, '').trim();
      break;
    }
  }

  // Clean up any remaining trailing whitespace or dashes
  title = title.replace(/[\s\-–]+$/, '').trim();

  return { title, year, rating };
}

/**
 * Checks if a platform is a movie/film platform that needs title cleaning
 */
export function isMoviePlatform(platform: string): boolean {
  return ['imdb', 'letterboxd', 'tmdb', 'rottentomatoes', 'metacritic'].includes(platform.toLowerCase());
}
