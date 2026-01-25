/**
 * Platform-Specific Summary Prompts
 *
 * Generates analytical summaries instead of simple truncation.
 * Each prompt is optimized for the type of content from that platform.
 *
 * @fileoverview AI summary prompt templates
 */

import type { Platform } from '../platforms';

// =============================================================================
// TYPES
// =============================================================================

export interface SummaryContext {
  content: string;
  author?: string;
  platform: Platform;
  imageCount?: number;
  url?: string;
  title?: string;
}

// =============================================================================
// INSTAGRAM PROMPTS
// =============================================================================

/**
 * Generate summary prompt for Instagram content
 */
export function getInstagramSummaryPrompt(context: SummaryContext): string {
  const { content, author, imageCount = 1 } = context;
  const postType = imageCount > 1 ? 'carousel' : 'post';

  return `Analyze this Instagram ${postType}${author ? ` by @${author}` : ''}.

CAPTION: "${content.slice(0, 500)}"
${imageCount > 1 ? `IMAGES: ${imageCount} photos in carousel` : ''}

Generate a 2-4 sentence ANALYTICAL summary that captures:
1. What is this post ABOUT? (topic, theme, subject matter)
2. What makes it MEMORABLE or worth saving? (insight, emotion, aesthetic)
3. Who would find this interesting or useful?

RULES:
- Do NOT repeat or paraphrase the caption verbatim
- Provide INSIGHT, not description
- Focus on WHY this content matters
- 50-200 characters ideal length

EXAMPLE of BAD summary: "The user posted about their trip"
EXAMPLE of GOOD summary: "Travel photography from Morocco's medinas - captures the sensory overload of spice markets and winding alleys that define Marrakech's old city."`;
}

// =============================================================================
// TWITTER PROMPTS
// =============================================================================

/**
 * Generate summary prompt for Twitter/X content
 */
export function getTwitterSummaryPrompt(context: SummaryContext): string {
  const { content, author } = context;

  return `Analyze this tweet${author ? ` from @${author}` : ''}.

TWEET: "${content.slice(0, 500)}"

Generate a 1-3 sentence ANALYTICAL summary that captures:
1. What INSIGHT or perspective does this tweet offer?
2. What larger conversation or trend does it relate to?
3. Why would someone save this for later reference?

RULES:
- Do NOT just rephrase the tweet
- Provide CONTEXT about why this matters
- If it's a hot take or opinion, note the perspective
- If it contains information, highlight what's useful
- 50-150 characters ideal length

EXAMPLE of BAD summary: "A tweet about programming"
EXAMPLE of GOOD summary: "Contrarian take on microservices - argues monoliths are underrated for teams under 50 engineers, with specific scaling thresholds."`;
}

// =============================================================================
// YOUTUBE PROMPTS
// =============================================================================

/**
 * Generate summary prompt for YouTube content
 */
export function getYouTubeSummaryPrompt(context: SummaryContext): string {
  const { title, author } = context;

  return `Analyze this YouTube video.

TITLE: "${title}"
${author ? `CHANNEL: ${author}` : ''}

Generate a 2-3 sentence ANALYTICAL summary that captures:
1. What will the viewer LEARN or experience?
2. What makes this video worth watching later?
3. What category/genre does this belong to?

RULES:
- Do NOT just repeat the video title
- Describe the VALUE proposition
- Mention if it's tutorial, entertainment, documentary, etc.
- 50-150 characters ideal length

EXAMPLE of BAD summary: "A video about cooking"
EXAMPLE of GOOD summary: "Deep-dive into Japanese knife sharpening techniques - covers whetstone selection, angle geometry, and maintenance routines for home cooks."`;
}

// =============================================================================
// ARTICLE PROMPTS
// =============================================================================

/**
 * Generate summary prompt for articles/blog posts
 */
export function getArticleSummaryPrompt(context: SummaryContext): string {
  const { content, title, author } = context;

  return `Analyze this article.

TITLE: "${title}"
${author ? `AUTHOR: ${author}` : ''}
EXCERPT: "${content.slice(0, 800)}"

Generate a 2-4 sentence ANALYTICAL summary that captures:
1. What is the MAIN ARGUMENT or thesis?
2. What EVIDENCE or insights support it?
3. What ACTION or takeaway should the reader remember?

RULES:
- Do NOT just describe what the article is about
- Extract the KEY INSIGHT
- Note if it's opinion, research, tutorial, or news
- 100-250 characters ideal length

EXAMPLE of BAD summary: "An article discussing technology trends"
EXAMPLE of GOOD summary: "Research-backed analysis of AI adoption in healthcare - finds diagnostic accuracy improves 12% with human-AI collaboration vs AI alone, with specific workflow recommendations."`;
}

// =============================================================================
// GENERIC PROMPTS
// =============================================================================

/**
 * Generate summary prompt for generic content
 */
export function getGenericSummaryPrompt(context: SummaryContext): string {
  const { content, title, url } = context;

  return `Analyze this saved content.

${title ? `TITLE: "${title}"` : ''}
${url ? `SOURCE: ${new URL(url).hostname}` : ''}
CONTENT: "${content.slice(0, 800)}"

Generate a 2-3 sentence ANALYTICAL summary that captures:
1. What is this content ABOUT?
2. Why would someone want to revisit this later?
3. What category does it belong to?

RULES:
- Be specific, not generic
- Focus on VALUE and memorability
- 50-200 characters ideal length`;
}

// =============================================================================
// PROMPT ROUTER
// =============================================================================

/**
 * Get the appropriate summary prompt based on platform
 */
export function getSummaryPrompt(context: SummaryContext): string {
  switch (context.platform) {
    case 'instagram':
      return getInstagramSummaryPrompt(context);
    case 'twitter':
      return getTwitterSummaryPrompt(context);
    case 'youtube':
      return getYouTubeSummaryPrompt(context);
    case 'medium':
    case 'substack':
      return getArticleSummaryPrompt(context);
    default:
      return getGenericSummaryPrompt(context);
  }
}

/**
 * Detect platform from URL
 */
export function detectPlatformFromUrl(url: string): Platform {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('medium.com')) return 'medium';
    if (hostname.includes('substack.com')) return 'substack';
    if (hostname.includes('reddit.com')) return 'reddit';
    if (hostname.includes('github.com')) return 'github';
    if (hostname.includes('letterboxd.com')) return 'letterboxd';

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate that a summary is analytical, not just truncation
 */
export function validateSummaryQuality(summary: string, originalContent: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check length
  if (summary.length < 50) {
    issues.push('Summary too short (< 50 chars)');
  }
  if (summary.length > 500) {
    issues.push('Summary too long (> 500 chars)');
  }

  // Check if it's just truncation of original
  const originalStart = originalContent.slice(0, 100).toLowerCase();
  const summaryLower = summary.toLowerCase();
  if (summaryLower.startsWith(originalStart.slice(0, 50))) {
    issues.push('Summary appears to be truncation of original content');
  }

  // Check for generic phrases that indicate low quality
  const genericPhrases = [
    'this is a post about',
    'the user posted',
    'content saved from',
    'a video about',
    'an article about',
    'this tweet is about',
  ];
  for (const phrase of genericPhrases) {
    if (summaryLower.includes(phrase)) {
      issues.push(`Contains generic phrase: "${phrase}"`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
