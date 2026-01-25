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

// =============================================================================
// TYPES
// =============================================================================

export interface TitleRequest {
  raw_content: string;
  author: string;
  platform: 'instagram' | 'twitter' | 'reddit';
}

export interface TitleResponse {
  title: string;
  is_valid: boolean;
  issues: string[];
  confidence: number;
}

export interface SummaryRequest {
  content: string;
  platform: 'instagram' | 'twitter' | 'reddit';
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
  platform: 'instagram' | 'twitter' | 'reddit';
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
  platform: 'instagram' | 'twitter' | 'reddit';
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

// =============================================================================
// CLIENT CLASS
// =============================================================================

class DSPyClient {
  private baseUrl: string;
  private timeout: number;
  private enabled: boolean;

  constructor() {
    this.baseUrl = DSPY_SERVICE_URL;
    this.timeout = DSPY_TIMEOUT;
    this.enabled = DSPY_ENABLED;
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
   * Internal POST request helper
   */
  private async post<T>(endpoint: string, body: unknown): Promise<T> {
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
        throw new Error(`DSPy API error: ${response.status} - ${error}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
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
  platform: 'instagram' | 'twitter' | 'reddit'
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
  platform: 'instagram' | 'twitter' | 'reddit',
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
  platform: 'instagram' | 'twitter' | 'reddit',
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
  platform: 'instagram' | 'twitter' | 'reddit',
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
