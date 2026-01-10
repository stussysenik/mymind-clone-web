/**
 * MyMind Clone - Demo Data
 * 
 * Sample cards for demo mode including platform-specific examples.
 * Shows Twitter, Instagram, YouTube, Reddit, IMDB, Letterboxd, and more.
 * 
 * @fileoverview Mock data with diverse platform examples
 */

import type { Card } from './types';

/**
 * Default user ID for demo mode.
 */
export const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000';

/**
 * Comprehensive demo cards with platform-specific examples.
 */
export const DEMO_CARDS: Card[] = [
        // =========================================================================
        // TWITTER/X POSTS
        // =========================================================================
        {
                id: 'twitter-001',
                userId: DEMO_USER_ID,
                type: 'article',
                title: 'Thread on design systems',
                content: 'The best thing said by a designer, "study the world."\n\nIf you want to be a better designer, don\'t study design books. Study sculpture. Study paintings. Study cars, watches, philosophers, movies, fiction, music, people.\n\nStudy the world.',
                url: 'https://twitter.com/designsystems/status/123456789',
                imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
                metadata: {
                        author: '@tobiasvs',
                        platform: 'twitter',
                },
                tags: ['design', 'inspiration', 'wisdom'],
                createdAt: '2024-01-09T14:30:00Z',
                updatedAt: '2024-01-09T14:30:00Z',
                deletedAt: null,
                archivedAt: null,
        },
        {
                id: 'twitter-002',
                userId: DEMO_USER_ID,
                type: 'article',
                title: 'Physics in games',
                content: 'How we think about #physics in games has changed enormously over the years. #Havok Talk\n\nFrom simple approximations to complex, fully dynamic geometry, physics simulation has become a core pillar of interactivity.',
                url: 'https://x.com/gamedev/status/987654321',
                imageUrl: null,
                metadata: {
                        author: '@FelixLee',
                },
                tags: ['gamedev', 'physics', 'havok'],
                createdAt: '2024-01-08T11:20:00Z',
                updatedAt: '2024-01-08T11:20:00Z',
                deletedAt: null,
                archivedAt: null,
        },

        // =========================================================================
        // INSTAGRAM POSTS
        // =========================================================================
        {
                id: 'instagram-001',
                userId: DEMO_USER_ID,
                type: 'image',
                title: 'Sanrio founder explains Hello Kitty',
                content: 'The meaning behind the iconic character revealed...',
                url: 'https://www.instagram.com/p/ABC123/',
                imageUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&q=80',
                metadata: {
                        author: 'design.weekly',
                },
                tags: ['design', 'branding', 'japan'],
                createdAt: '2024-01-07T16:45:00Z',
                updatedAt: '2024-01-07T16:45:00Z',
                deletedAt: null,
                archivedAt: null,
        },
        {
                id: 'instagram-002',
                userId: DEMO_USER_ID,
                type: 'image',
                title: 'Coffee art morning ritual',
                content: null,
                url: 'https://www.instagram.com/reel/XYZ789/',
                imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
                metadata: {
                        author: 'coffeelovers',
                },
                tags: ['coffee', 'morning', 'ritual'],
                createdAt: '2024-01-06T08:15:00Z',
                updatedAt: '2024-01-06T08:15:00Z',
                deletedAt: null,
                archivedAt: null,
        },

        // =========================================================================
        // YOUTUBE VIDEOS
        // =========================================================================
        {
                id: 'youtube-001',
                userId: DEMO_USER_ID,
                type: 'article',
                title: 'New Year\'s Eve at Stereo Montreal',
                content: 'An immersive night of electronic music at one of the world\'s best clubs',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                imageUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80',
                metadata: {
                        author: 'Stereo Montreal',
                        duration: '1:24:30',
                        viewCount: '245K',
                },
                tags: ['music', 'electronic', 'montreal'],
                createdAt: '2024-01-05T22:00:00Z',
                updatedAt: '2024-01-05T22:00:00Z',
                deletedAt: null,
                archivedAt: null,
        },
        {
                id: 'youtube-002',
                userId: DEMO_USER_ID,
                type: 'article',
                title: 'Building a Second Brain - Full Course',
                content: 'The complete guide to personal knowledge management with Tiago Forte',
                url: 'https://youtu.be/ABCD1234',
                imageUrl: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=600&q=80',
                metadata: {
                        author: 'Tiago Forte',
                        duration: '2:15:00',
                        viewCount: '1.2M',
                },
                tags: ['productivity', 'PKM', 'notes'],
                createdAt: '2024-01-04T14:30:00Z',
                updatedAt: '2024-01-04T14:30:00Z',
                deletedAt: null,
                archivedAt: null,
        },

        // =========================================================================
        // REDDIT POSTS
        // =========================================================================
        {
                id: 'reddit-001',
                userId: DEMO_USER_ID,
                type: 'article',
                title: 'I built a visual bookmark manager that uses AI to auto-tag everything',
                content: 'After years of struggling with messy bookmarks, I finally built something that works for me. It uses GPT-4 to classify and Google Vision for OCR...',
                url: 'https://www.reddit.com/r/SideProject/comments/abc123/',
                imageUrl: null,
                metadata: {
                        subreddit: 'r/SideProject',
                        author: 'u/devbuilder',
                        upvotes: '2.4k',
                        comments: '187',
                },
                tags: ['sideproject', 'ai', 'bookmarks'],
                createdAt: '2024-01-03T10:00:00Z',
                updatedAt: '2024-01-03T10:00:00Z',
                deletedAt: null,
                archivedAt: null,
        },
        {
                id: 'reddit-002',
                userId: DEMO_USER_ID,
                type: 'image',
                title: 'My minimal desk setup after 5 years of iteration',
                content: null,
                url: 'https://www.reddit.com/r/battlestations/comments/xyz789/',
                imageUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&q=80',
                metadata: {
                        subreddit: 'r/battlestations',
                        author: 'u/cleandesk',
                        upvotes: '5.8k',
                        comments: '342',
                },
                tags: ['desk', 'setup', 'minimal'],
                createdAt: '2024-01-02T15:45:00Z',
                updatedAt: '2024-01-02T15:45:00Z',
                deletedAt: null,
                archivedAt: null,
        },

        // =========================================================================
        // LETTERBOXD FILMS
        // =========================================================================
        {
                id: 'letterboxd-001',
                userId: DEMO_USER_ID,
                type: 'book',
                title: 'Past Lives',
                content: 'Nora and Hae Sung, two deeply connected childhood friends, are wrest apart after Nora\'s family emigrates from South Korea.',
                url: 'https://letterboxd.com/film/past-lives/',
                imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80',
                metadata: {
                        rating: '4.5',
                        year: '2023',
                        director: 'Celine Song',
                        summary: 'A profound meditation on fate, love, and the paths not taken.',
                },
                tags: ['film', 'drama', 'romance', 'korean'],
                createdAt: '2024-01-01T20:00:00Z',
                updatedAt: '2024-01-01T20:00:00Z',
                deletedAt: null,
                archivedAt: null,
        },
        {
                id: 'letterboxd-002',
                userId: DEMO_USER_ID,
                type: 'book',
                title: 'Oppenheimer',
                content: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
                url: 'https://letterboxd.com/film/oppenheimer-2023/',
                imageUrl: 'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=600&q=80',
                metadata: {
                        rating: '4.3',
                        year: '2023',
                        director: 'Christopher Nolan',
                },
                tags: ['film', 'biography', 'history'],
                createdAt: '2023-12-28T19:30:00Z',
                updatedAt: '2023-12-28T19:30:00Z',
                deletedAt: null,
                archivedAt: null,
        },

        // =========================================================================
        // IMDB
        // =========================================================================
        {
                id: 'imdb-001',
                userId: DEMO_USER_ID,
                type: 'book',
                title: 'Dune: Part Two',
                content: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
                url: 'https://www.imdb.com/title/tt15239678/',
                imageUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600&q=80',
                metadata: {
                        rating: '8.8',
                        year: '2024',
                        director: 'Denis Villeneuve',
                },
                tags: ['film', 'scifi', 'epic'],
                createdAt: '2023-12-25T21:00:00Z',
                updatedAt: '2023-12-25T21:00:00Z',
                deletedAt: null,
                archivedAt: null,
        },

        // =========================================================================
        // ARTICLES
        // =========================================================================
        {
                id: 'article-001',
                userId: DEMO_USER_ID,
                type: 'article',
                title: 'The Future of AI in Creative Work',
                content: 'Artificial intelligence is transforming how we approach creative work.',
                url: 'https://example.com/ai-creative-work',
                imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80',
                metadata: {
                        summary: 'AI is revolutionizing creative industries by augmenting human capabilities rather than replacing them.',
                        author: 'Sarah Chen',
                        readingTime: 8,
                },
                tags: ['ai', 'creativity', 'technology'],
                createdAt: '2024-01-09T10:30:00Z',
                updatedAt: '2024-01-09T10:30:00Z',
                deletedAt: null,
                archivedAt: null,
        },

        // =========================================================================
        // IMAGES
        // =========================================================================
        {
                id: 'image-001',
                userId: DEMO_USER_ID,
                type: 'image',
                title: 'Mountain Sunrise',
                content: null,
                url: null,
                imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
                metadata: {
                        colors: ['#FF7B54', '#1B1464', '#4B3869'],
                },
                tags: ['nature', 'photography', 'inspiration'],
                createdAt: '2024-01-06T08:00:00Z',
                updatedAt: '2024-01-06T08:00:00Z',
                deletedAt: null,
                archivedAt: null,
        },
        {
                id: 'image-002',
                userId: DEMO_USER_ID,
                type: 'image',
                title: 'Abstract Fluid Art',
                content: null,
                url: null,
                imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
                metadata: {
                        colors: ['#9B59B6', '#3498DB', '#E74C3C'],
                },
                tags: ['art', 'abstract', 'colorful'],
                createdAt: '2024-01-04T11:45:00Z',
                updatedAt: '2024-01-04T11:45:00Z',
                deletedAt: null,
                archivedAt: null,
        },

        // =========================================================================
        // PRODUCTS
        // =========================================================================
        {
                id: 'product-001',
                userId: DEMO_USER_ID,
                type: 'product',
                title: 'Sony WH-1000XM5 Headphones',
                content: 'Industry-leading noise cancellation with exceptional sound quality.',
                url: 'https://amazon.com/sony-headphones',
                imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80',
                metadata: {
                        price: '$349.99',
                        summary: 'Premium wireless headphones with 30-hour battery life.',
                },
                tags: ['audio', 'headphones', 'wishlist'],
                createdAt: '2024-01-02T12:00:00Z',
                updatedAt: '2024-01-02T12:00:00Z',
                deletedAt: null,
                archivedAt: null,
        },
        {
                id: 'product-002',
                userId: DEMO_USER_ID,
                type: 'product',
                title: 'Keychron Q1 Pro Keyboard',
                content: 'Wireless mechanical keyboard with hot-swappable switches.',
                url: 'https://keychron.com/q1-pro',
                imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
                metadata: {
                        price: '$199.00',
                        summary: 'Premium mechanical keyboard with aluminum case.',
                },
                tags: ['keyboard', 'mechanical', 'desk-setup'],
                createdAt: '2024-01-01T09:30:00Z',
                updatedAt: '2024-01-01T09:30:00Z',
                deletedAt: null,
                archivedAt: null,
        },

        // =========================================================================
        // NOTES
        // =========================================================================
        {
                id: 'note-001',
                userId: DEMO_USER_ID,
                type: 'note',
                title: 'Project Ideas for 2024',
                content: `## Ideas to explore this year

1. **AI-powered bookmark manager** - Use embeddings to find related content
2. **Personal dashboard** - Aggregate data from various sources
3. **Writing assistant** - Help with technical documentation

### Priority
Start with the bookmark manager - most immediate need.`,
                url: null,
                imageUrl: null,
                metadata: {},
                tags: ['ideas', 'projects', 'planning'],
                createdAt: '2024-01-09T08:00:00Z',
                updatedAt: '2024-01-09T08:00:00Z',
                deletedAt: null,
                archivedAt: null,
        },
        {
                id: 'note-002',
                userId: DEMO_USER_ID,
                type: 'note',
                title: 'Quick Recipe: Pasta Aglio e Olio',
                content: `## Ingredients
- 400g spaghetti
- 6 cloves garlic, thinly sliced
- 1/2 cup olive oil
- 1 tsp red pepper flakes
- Parsley, chopped

## Instructions
1. Cook pasta in salted water
2. Sauté garlic in olive oil until golden
3. Add pepper flakes
4. Toss with pasta`,
                url: null,
                imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
                metadata: {},
                tags: ['recipe', 'cooking', 'italian'],
                createdAt: '2024-01-05T19:30:00Z',
                updatedAt: '2024-01-05T19:30:00Z',
                deletedAt: null,
                archivedAt: null,
        },
];

/**
 * Get all demo cards.
 */
export function getDemoCards(): Card[] {
        return DEMO_CARDS;
}

/**
 * Search demo cards by query string.
 */
export function searchDemoCards(query: string): Card[] {
        const lowerQuery = query.toLowerCase();

        return DEMO_CARDS.filter((card) => {
                const titleMatch = card.title?.toLowerCase().includes(lowerQuery);
                const contentMatch = card.content?.toLowerCase().includes(lowerQuery);
                const tagMatch = card.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));

                return titleMatch || contentMatch || tagMatch;
        });
}

/**
 * Filter demo cards by type.
 */
export function filterDemoCardsByType(type: string): Card[] {
        return DEMO_CARDS.filter((card) => card.type === type);
}

/**
 * Get unique tags from all demo cards.
 */
export function getDemoTags(): string[] {
        const tagSet = new Set<string>();
        DEMO_CARDS.forEach((card) => {
                card.tags.forEach((tag) => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
}
