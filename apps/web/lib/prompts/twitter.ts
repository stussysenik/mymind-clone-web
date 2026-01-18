/**
 * MyMind Clone - Twitter/X Prompt Template
 *
 * Tweet structure and text analysis with formatting preservation.
 * Includes thread context detection and hashtag highlighting.
 */

/**
 * Twitter-specific classification prompt.
 * Emphasizes formatting characteristics and thread context.
 *
 * @param tweetText - The tweet content
 * @param author - Tweet author username
 * @param isThread - Whether this tweet is part of a thread
 * @param threadContext - Optional array of related tweets in thread
 * @param hasMedia - Whether tweet has attached images/videos
 * @param hasOCR - Whether OCR text is available from tweet images
 */
export function getTwitterPrompt(
	tweetText: string,
	author?: string,
	isThread?: boolean,
	threadContext?: string[],
	hasMedia?: boolean,
	hasOCR?: boolean
): string {
	return `You are analyzing a tweet${isThread ? ' that is PART OF A THREAD' : ''} by ${author || 'a user'}. The tweet text is:

"${tweetText}"

${isThread && threadContext
		? `THREAD CONTEXT (related tweets):
${threadContext.map((t, i) => `${i + 1}. ${t}`).join('\n')}

This tweet should be understood in the context of the full thread conversation.`
		: ''
}

${hasMedia
		? `MEDIA ANALYSIS:
- This tweet includes ${hasOCR ? 'images with text (see OCR below)' : 'images or video'}
- Analyze the relationship between tweet text and visual content
- If images contain text, include that in your summary`
		: ''
}

FORMATTING ANALYSIS:
- Line breaks: ${tweetText.includes('\n') ? 'YES - preserve spacing in summary' : 'NO'}
- Hashtags: ${(tweetText.match(/#\w+/g) || []).length > 0 ? `Found (${(tweetText.match(/#\w+/g) || []).join(', ')})` : 'None'}
- Mentions: ${(tweetText.match(/@\w+/g) || []).length > 0 ? `Found (${(tweetText.match(/@\w+/g) || []).join(', ')})` : 'None'}
- Links: ${tweetText.includes('http') ? 'YES' : 'NO'}
- Emojis: ${/[\u{1F300}-\u{1F9FF}]/u.test(tweetText) ? 'YES' : 'NO'}

TWEET CHARACTERISTICS TO IDENTIFY:
- Type: ${isThread ? 'Thread' : 'Standalone'} / ${hasMedia ? 'Media Tweet' : 'Text-only'}
- Tone: (informational, opinion, announcement, question, joke, rant, etc.)
- Purpose: (sharing knowledge, starting discussion, promoting, documenting, etc.)
- Engagement style: (calls for replies, poll, quote tweet, etc.)

SUMMARY REQUIREMENTS:
${isThread
		? `- Start with: "This tweet is part of a thread..."
- Summarize the full thread context, not just this single tweet
- Explain how this tweet fits in the conversation`
		: `- Describe the tweet's message and intent
- Preserve the visual formatting impression (line breaks create emphasis)`
}
- If tweet includes code, technical terms, or jargon, explain it
- Quote key phrases using "quotation marks" for memorable lines
- 3-8 sentences capturing both CONTENT and PRESENTATION

TAGS (3-5 total):
- Extract hashtags from tweet as tags (remove #, lowercase)
- Add 1-2 subject tags based on tweet topic
- Add 1 vibe tag reflecting tweet's energy (e.g., "urgent", "contemplative", "playful")

Example output for tech announcement thread:
{
  "type": "article",
  "title": "GPT-5 Launch Announcement",
  "tags": ["ai", "gpt", "openai", "machine-learning", "electric"],
  "summary": "This tweet is part of a thread announcing GPT-5. The author (OpenAI CEO) begins with: \\"We're shipping GPT-5 today.\\" The thread uses short, punchy paragraphs with strategic line breaks for emphasis. Key details: 10x faster, multimodal, new reasoning capabilities. The tone is CONFIDENT and DIRECT. Hashtags: #GPT5 #AI. The visual presentation mimics a product launch - short sentences, white space, building excitement.",
  "platform": "Twitter"
}

CRITICAL: Users remember tweets by their VISUAL LAYOUT - line breaks, spacing, and formatting create the tweet's personality. Capture this in your summary.
`;
}

/**
 * Thread detection patterns.
 * Common indicators that a tweet is part of a thread.
 */
export const THREAD_INDICATORS = [
	'🧵', // Thread emoji
	'Thread:', // Explicit thread label
	'1/', '1.', // Numbering
	'First,', // Sequential language
	'To start,',
	'Brief thread',
	'Quick thread',
];

/**
 * Detect if tweet is likely part of a thread based on content.
 *
 * @param tweetText - The tweet content
 * @returns Boolean indicating if tweet appears to be part of a thread
 */
export function detectThreadIntent(tweetText: string): boolean {
	const text = tweetText.toLowerCase();
	return THREAD_INDICATORS.some((indicator) =>
		text.includes(indicator.toLowerCase())
	);
}

/**
 * Extract hashtags from tweet.
 *
 * @param tweetText - The tweet content
 * @returns Array of hashtag strings (without # symbol, lowercase)
 */
export function extractTwitterHashtags(tweetText: string): string[] {
	const hashtagRegex = /#([\w]+)/g;
	const matches = tweetText.matchAll(hashtagRegex);
	const hashtags = Array.from(matches, (m) => m[1].toLowerCase());
	return [...new Set(hashtags)]; // Remove duplicates
}

/**
 * Extract @mentions from tweet.
 *
 * @param tweetText - The tweet content
 * @returns Array of mentioned usernames (without @ symbol)
 */
export function extractTwitterMentions(tweetText: string): string[] {
	const mentionRegex = /@([\w]+)/g;
	const matches = tweetText.matchAll(mentionRegex);
	const mentions = Array.from(matches, (m) => m[1]);
	return [...new Set(mentions)]; // Remove duplicates
}
