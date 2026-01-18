/**
 * MyMind Clone - Prompt Templates Index
 *
 * Central exports for all platform-specific prompts.
 * Enables modular, maintainable prompt management.
 */

export {
	CLASSIFICATION_TOOL,
	GENERIC_CLASSIFICATION_PROMPT,
} from './classification';

export {
	getInstagramPrompt,
	INSTAGRAM_CAROUSEL_INSTRUCTIONS,
	extractInstagramHashtags,
} from './instagram';

export {
	getTwitterPrompt,
	THREAD_INDICATORS,
	detectThreadIntent,
	extractTwitterHashtags,
	extractTwitterMentions,
} from './twitter';

export {
	getWebsitePrompt,
	PAGE_TYPE_PATTERNS,
	detectPageType,
	extractDomain,
} from './website';
