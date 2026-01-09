/**
 * MyMind Clone - AI Utilities
 * 
 * Uses GLM-4.7 for content classification and GLM-4.6V for vision.
 * Falls back to rule-based classification if API is unavailable.
 * 
 * @fileoverview AI utilities using Zhipu GLM Coding API
 */

import type { CardType, ClassificationResult, ImageAnalysisResult } from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_API_BASE = process.env.ZHIPU_API_BASE || 'https://api.z.ai/api/coding/paas/v4';

// Models
const TEXT_MODEL = 'glm-4.7';
const VISION_MODEL = 'glm-4.6v';

/**
 * Check if AI features are available.
 */
export function isAIConfigured(): boolean {
        return !!ZHIPU_API_KEY;
}

// =============================================================================
// GLM API CLIENT
// =============================================================================

interface GLMMessage {
        role: 'system' | 'user' | 'assistant';
        content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface GLMResponse {
        choices: Array<{
                message: {
                        content: string;
                        tool_calls?: Array<{
                                function: {
                                        name: string;
                                        arguments: string;
                                };
                        }>;
                };
        }>;
}

/**
 * Call the GLM API.
 */
async function callGLM(
        model: string,
        messages: GLMMessage[],
        tools?: Array<{
                type: 'function';
                function: {
                        name: string;
                        description: string;
                        parameters: Record<string, unknown>;
                };
        }>
): Promise<GLMResponse> {
        const endpoint = `${ZHIPU_API_BASE}/chat/completions`;

        const body: Record<string, unknown> = {
                model,
                messages,
                max_tokens: 500,
        };

        if (tools) {
                body.tools = tools;
                body.tool_choice = { type: 'function', function: { name: tools[0].function.name } };
        }

        const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
                },
                body: JSON.stringify(body),
        });

        if (!response.ok) {
                const error = await response.text();
                throw new Error(`GLM API error: ${response.status} - ${error}`);
        }

        return response.json();
}

// =============================================================================
// CONTENT CLASSIFICATION
// =============================================================================

/**
 * Tool definition for content classification.
 */
const CLASSIFICATION_TOOL = {
        type: 'function' as const,
        function: {
                name: 'classify_content',
                description: 'Classify web content into a category with tags and summary',
                parameters: {
                        type: 'object',
                        properties: {
                                type: {
                                        type: 'string',
                                        enum: ['article', 'image', 'note', 'product', 'book'],
                                        description: 'The primary content type',
                                },
                                title: {
                                        type: 'string',
                                        description: 'A concise, descriptive title (max 60 chars)',
                                },
                                tags: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        maxItems: 5,
                                        description: 'Relevant tags for categorization (lowercase, hyphenated)',
                                },
                                summary: {
                                        type: 'string',
                                        description: 'Brief summary of the content (max 100 words)',
                                },
                        },
                        required: ['type', 'title', 'tags', 'summary'],
                },
        },
};

/**
 * Normalize type to allowed database values.
 * Maps any type to: article, image, note, product, or book
 */
function normalizeType(type: string): 'article' | 'image' | 'note' | 'product' | 'book' {
        const normalized = type?.toLowerCase() ?? 'article';

        // Map common types to our allowed values
        const typeMap: Record<string, 'article' | 'image' | 'note' | 'product' | 'book'> = {
                article: 'article',
                blog: 'article',
                post: 'article',
                website: 'article',
                link: 'article',
                page: 'article',
                documentation: 'article',
                tutorial: 'article',
                image: 'image',
                photo: 'image',
                picture: 'image',
                screenshot: 'image',
                note: 'note',
                text: 'note',
                memo: 'note',
                thought: 'note',
                product: 'product',
                item: 'product',
                tool: 'product',
                software: 'product',
                app: 'product',
                book: 'book',
                ebook: 'book',
                pdf: 'book',
                document: 'book',
        };

        return typeMap[normalized] ?? 'article';
}

/**
 * Classifies content using GLM-4.7.
 * Falls back to rule-based classification if API is unavailable.
 */
export async function classifyContent(
        url: string | null,
        content: string | null,
        imageUrl?: string | null
): Promise<ClassificationResult> {
        // Fallback to rule-based classification if GLM is not configured
        if (!ZHIPU_API_KEY) {
                return classifyContentFallback(url, content, imageUrl);
        }

        try {
                const prompt = buildClassificationPrompt(url, content, imageUrl);

                const response = await callGLM(
                        TEXT_MODEL,
                        [
                                {
                                        role: 'system',
                                        content: 'You are a content classifier for a personal knowledge manager. Analyze the provided content and classify it accurately. Always use the classify_content function.',
                                },
                                {
                                        role: 'user',
                                        content: prompt,
                                },
                        ],
                        [CLASSIFICATION_TOOL]
                );

                // Extract function call result
                const toolCall = response.choices[0]?.message?.tool_calls?.[0];
                if (toolCall?.function?.arguments) {
                        const result = JSON.parse(toolCall.function.arguments) as ClassificationResult;
                        // Normalize type to allowed values
                        result.type = normalizeType(result.type);
                        return result;
                }

                // Try parsing from content if no tool call
                const content_text = response.choices[0]?.message?.content;
                if (content_text) {
                        try {
                                const parsed = JSON.parse(content_text);
                                if (parsed.type && parsed.title) {
                                        return parsed as ClassificationResult;
                                }
                        } catch {
                                // Not JSON, use fallback
                        }
                }

                throw new Error('No valid classification in response');
        } catch (error) {
                console.error('[AI] Classification error, using fallback:', error);
                return classifyContentFallback(url, content, imageUrl);
        }
}

/**
 * Builds the prompt for content classification.
 */
function buildClassificationPrompt(
        url: string | null,
        content: string | null,
        imageUrl?: string | null
): string {
        const parts: string[] = [];

        if (url) {
                parts.push(`URL: ${url}`);
        }

        if (content) {
                // Truncate content to avoid token limits
                const truncated = content.slice(0, 1000);
                parts.push(`Content: ${truncated}`);
        }

        if (imageUrl) {
                parts.push(`Image URL: ${imageUrl}`);
        }

        return parts.join('\n\n');
}

/**
 * Rule-based content classification fallback.
 */
function classifyContentFallback(
        url: string | null,
        content: string | null,
        imageUrl?: string | null
): ClassificationResult {
        const urlLower = url?.toLowerCase() ?? '';
        const contentLower = content?.toLowerCase() ?? '';

        // Detect type based on URL patterns and content
        let type: CardType = 'note';
        const tags: string[] = [];

        // Product detection
        if (
                urlLower.includes('amazon.') ||
                urlLower.includes('shop') ||
                urlLower.includes('product') ||
                urlLower.includes('ebay.') ||
                contentLower.includes('add to cart') ||
                contentLower.includes('buy now')
        ) {
                type = 'product';
                tags.push('shopping');
        }
        // Book detection
        else if (
                urlLower.includes('goodreads.') ||
                urlLower.includes('/book') ||
                contentLower.includes('isbn') ||
                contentLower.includes('author:')
        ) {
                type = 'book';
                tags.push('reading');
        }
        // Article detection
        else if (
                urlLower.includes('blog') ||
                urlLower.includes('article') ||
                urlLower.includes('medium.com') ||
                urlLower.includes('substack') ||
                urlLower.includes('github.com') ||
                urlLower.includes('news') ||
                (content && content.length > 500)
        ) {
                type = 'article';
                tags.push('reading');
        }
        // Image detection
        else if (
                imageUrl &&
                !content &&
                (urlLower.includes('unsplash') ||
                        urlLower.includes('pinterest') ||
                        urlLower.includes('imgur') ||
                        urlLower.endsWith('.jpg') ||
                        urlLower.endsWith('.png'))
        ) {
                type = 'image';
                tags.push('visual');
        }

        // Extract title from content or URL
        let title = 'Untitled';
        if (content) {
                const firstLine = content.split('\n')[0];
                title = firstLine.slice(0, 60).trim() || 'Untitled';
        } else if (url) {
                try {
                        const urlPath = new URL(url).pathname;
                        title = urlPath.split('/').pop()?.replace(/[-_]/g, ' ') || new URL(url).hostname;
                } catch {
                        title = url.slice(0, 60);
                }
        }

        // Generate simple summary
        const summary = content
                ? content.slice(0, 150).trim() + (content.length > 150 ? '...' : '')
                : 'No summary available.';

        return {
                type,
                title,
                tags,
                summary,
        };
}

// =============================================================================
// IMAGE ANALYSIS (GLM-4.6V)
// =============================================================================

/**
 * Analyzes an image using GLM-4.6V for colors, objects, and text.
 */
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
        if (!ZHIPU_API_KEY) {
                // Return mock data if API not configured
                return {
                        colors: ['#3498DB', '#2ECC71', '#9B59B6'],
                        objects: ['image', 'content'],
                        ocrText: null,
                };
        }

        try {
                const response = await callGLM(VISION_MODEL, [
                        {
                                role: 'user',
                                content: [
                                        {
                                                type: 'text',
                                                text: 'Analyze this image and respond with JSON containing: { "colors": ["#hex1", "#hex2", "#hex3"] (3 dominant colors as hex), "objects": ["object1", "object2"] (detected objects/labels), "ocrText": "any text visible in image or null" }',
                                        },
                                        {
                                                type: 'image_url',
                                                image_url: { url: imageUrl },
                                        },
                                ],
                        },
                ]);

                const content = response.choices[0]?.message?.content;
                if (content) {
                        // Try to parse JSON from response
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[0]);
                                return {
                                        colors: parsed.colors || ['#3498DB', '#2ECC71', '#9B59B6'],
                                        objects: parsed.objects || [],
                                        ocrText: parsed.ocrText || null,
                                };
                        }
                }

                throw new Error('Could not parse vision response');
        } catch (error) {
                console.error('[AI] Image analysis error:', error);
                return {
                        colors: ['#3498DB', '#2ECC71', '#9B59B6'],
                        objects: ['image'],
                        ocrText: null,
                };
        }
}

// =============================================================================
// SUMMARY GENERATION
// =============================================================================

/**
 * Generates a summary for content using GLM-4.7.
 */
export async function generateSummary(
        content: string,
        maxTokens: number = 50
): Promise<string | null> {
        if (!ZHIPU_API_KEY) {
                return content.slice(0, 150).trim() + '...';
        }

        try {
                const response = await callGLM(TEXT_MODEL, [
                        {
                                role: 'system',
                                content: 'Summarize the following content in 1-2 sentences. Be concise and informative.',
                        },
                        {
                                role: 'user',
                                content: content.slice(0, 2000),
                        },
                ]);

                return response.choices[0]?.message?.content ?? null;
        } catch (error) {
                console.error('[AI] Summary generation error:', error);
                return content.slice(0, 150).trim() + '...';
        }
}
