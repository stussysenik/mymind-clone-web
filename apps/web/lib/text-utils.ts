/**
 * MyMind Clone - Text Utilities
 *
 * Utility functions for text processing and normalization.
 *
 * @fileoverview Text processing utilities
 */

/**
 * Decodes common HTML entities to their character equivalents.
 *
 * Handles entities commonly returned by APIs like Twitter Syndication
 * that return HTML-encoded text.
 *
 * @param text - Text containing HTML entities
 * @returns Text with entities decoded
 *
 * @example
 * decodeHtmlEntities('Design &amp; Development') // 'Design & Development'
 * decodeHtmlEntities('&lt;script&gt;') // '<script>'
 */
export function decodeHtmlEntities(text: string): string {
	if (!text) return '';

	const entities: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&apos;': "'",
		'&nbsp;': ' ',
		'&#x27;': "'",
		'&#x2F;': '/',
		'&#60;': '<',
		'&#62;': '>',
	};

	return text.replace(
		/&(?:amp|lt|gt|quot|apos|nbsp|#39|#x27|#x2F|#60|#62);/gi,
		(match) => entities[match.toLowerCase()] || match
	);
}
