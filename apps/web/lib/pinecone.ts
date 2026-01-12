/**
 * MyMind Clone - Pinecone Vector Database Integration
 * 
 * Uses Pinecone with integrated embeddings (llama-text-embed-v2).
 * Provides semantic similarity search for "See Similar" functionality.
 * 
 * @fileoverview Pinecone vector database utilities using official SDK
 */

import { Pinecone } from '@pinecone-database/pinecone';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_HOST = process.env.PINECONE_HOST;

// Lazy-initialized client
let pineconeClient: Pinecone | null = null;

/**
 * Check if Pinecone is configured.
 */
export function isPineconeConfigured(): boolean {
        return !!(PINECONE_API_KEY && PINECONE_HOST);
}

/**
 * Get or create the Pinecone client.
 */
function getClient(): Pinecone | null {
        if (!isPineconeConfigured()) {
                return null;
        }

        if (!pineconeClient) {
                pineconeClient = new Pinecone({
                        apiKey: PINECONE_API_KEY!,
                });
        }

        return pineconeClient;
}

/**
 * Get the index instance.
 */
function getIndex() {
        const client = getClient();
        if (!client || !PINECONE_HOST) {
                return null;
        }

        return client.index('mymind-knowledge', PINECONE_HOST);
}

// =============================================================================
// PINECONE OPERATIONS
// =============================================================================

interface PineconeRecord {
        id: string;
        text: string;  // For integrated embeddings
        metadata?: Record<string, string | number | boolean | string[]>;
}

interface PineconeMatch {
        id: string;
        score: number;
        metadata?: Record<string, unknown>;
}

/**
 * Upserts a record to Pinecone with integrated embeddings.
 * Pinecone will automatically generate the embedding from the `text` field.
 */
export async function upsertRecord(record: PineconeRecord): Promise<boolean> {
        const index = getIndex();
        if (!index) {
                console.warn('[Pinecone] Not configured, skipping upsert');
                return false;
        }

        try {
                // Use the Records API for integrated embeddings
                await index.upsertRecords([{
                        _id: record.id,
                        text: record.text,
                        ...record.metadata,
                }]);

                console.log(`[Pinecone] Upserted record: ${record.id}`);
                return true;
        } catch (error) {
                console.error('[Pinecone] Upsert error:', error);
                return false;
        }
}

/**
 * Queries Pinecone for similar records.
 * Uses integrated embeddings for the query text.
 * 
 * @param queryText - The text to find similar records for
 * @param topK - Number of results to return (default 5)
 * @param excludeId - Optional record ID to exclude from results
 */
export async function querySimilar(
        queryText: string,
        topK: number = 5,
        excludeId?: string
): Promise<PineconeMatch[]> {
        const index = getIndex();
        if (!index) {
                console.warn('[Pinecone] Not configured, returning empty results');
                return [];
        }

        try {
                // Use the Search API for integrated embeddings
                const response = await index.searchRecords({
                        query: {
                                inputs: { text: queryText },
                                topK: excludeId ? topK + 1 : topK,
                        },
                        fields: ['title', 'type', 'tags', 'image_url'],
                });

                // Map to our format
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let matches: PineconeMatch[] = (response.result?.hits || []).map((hit: any) => ({
                        id: hit._id,
                        score: hit._score,
                        metadata: hit.fields as Record<string, unknown> | undefined,
                }));

                // Filter out the excluded ID (typically the current card)
                if (excludeId) {
                        matches = matches.filter(m => m.id !== excludeId).slice(0, topK);
                }

                console.log(`[Pinecone] Found ${matches.length} similar records`);
                return matches;
        } catch (error) {
                console.error('[Pinecone] Query error:', error);
                return [];
        }
}

/**
 * Deletes a record from Pinecone.
 */
export async function deleteRecord(id: string): Promise<boolean> {
        const index = getIndex();
        if (!index) {
                return false;
        }

        try {
                await index.deleteOne(id);
                console.log(`[Pinecone] Deleted record: ${id}`);
                return true;
        } catch (error) {
                console.error('[Pinecone] Delete error:', error);
                return false;
        }
}

/**
 * Builds the text field for Pinecone from card data.
 * Combines title, summary, and tags for rich semantic representation.
 */
export function buildEmbeddingText(card: {
        title?: string | null;
        content?: string | null;
        tags?: string[] | null;
        metadata?: { summary?: string } | null;
}): string {
        const parts: string[] = [];

        if (card.title) {
                parts.push(card.title);
        }

        // Prefer summary over raw content (more semantic value)
        if (card.metadata?.summary) {
                parts.push(card.metadata.summary);
        } else if (card.content) {
                // Truncate raw content to avoid token limits
                parts.push(card.content.slice(0, 500));
        }

        if (card.tags && card.tags.length > 0) {
                parts.push(`Tags: ${card.tags.join(', ')}`);
        }

        return parts.join('. ');
}
