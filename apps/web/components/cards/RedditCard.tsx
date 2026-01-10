/**
 * MyMind Clone - Reddit Card Component
 * 
 * Renders Reddit posts with subreddit and upvote styling.
 * 
 * @fileoverview Reddit card with orange accent
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowBigUp, MessageSquare } from 'lucide-react';
import type { Card } from '@/lib/types';

// =============================================================================
// TYPES
// =============================================================================

interface RedditCardProps {
        card: Card;
        onDelete?: () => void;
        onRestore?: () => void;
        onClick?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Reddit style card for posts.
 */
export function RedditCard({ card, onDelete, onRestore, onClick }: RedditCardProps) {
        const [imageError, setImageError] = useState(false);
        const [isHovered, setIsHovered] = useState(false);
        const subreddit = card.metadata.subreddit || extractSubreddit(card.url);
        const author = card.metadata.author || 'u/redditor';
        const upvotes = card.metadata.upvotes;
        const comments = card.metadata.comments;

        return (
                <article
                        className={`relative overflow-hidden rounded-lg bg-white card-shadow border-l-[3px] border-[#FF4500] ${onClick ? 'cursor-pointer' : ''}`}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                >
                        {/* Header */}
                        <div className="flex items-center gap-2 p-3 pb-2">
                                {/* Reddit Logo */}
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF4500]">
                                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                                        </svg>
                                </div>

                                {/* Subreddit & Author */}
                                <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-[#FF4500]">
                                                {subreddit}
                                        </span>
                                        <span className="text-xs text-[var(--foreground-muted)]">
                                                Posted by {author}
                                        </span>
                                </div>
                        </div>

                        {/* Title */}
                        <div className="px-3 pb-2">
                                <h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-3 leading-snug">
                                        {card.title}
                                </h3>
                        </div>

                        {/* Image if exists */}
                        {card.imageUrl && !imageError && (
                                <div className="relative aspect-video w-full overflow-hidden border-t border-b border-[var(--border)]">
                                        <Image
                                                src={card.imageUrl}
                                                alt={card.title || 'Reddit post'}
                                                fill
                                                sizes="(max-width: 640px) 100vw, 400px"
                                                className="object-cover"
                                                loading="lazy"
                                                onError={() => setImageError(true)}
                                        />
                                </div>
                        )}

                        {/* Content Preview */}
                        {card.content && !card.imageUrl && (
                                <div className="px-3 pb-2">
                                        <p className="text-xs text-[var(--foreground-muted)] line-clamp-3">
                                                {card.content}
                                        </p>
                                </div>
                        )}

                        {/* Footer with Stats */}
                        <div className="flex items-center gap-4 px-3 py-2 border-t border-[var(--border)]">
                                {/* Upvotes */}
                                <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                                        <ArrowBigUp className="h-4 w-4 text-[#FF4500]" />
                                        <span>{upvotes || '•'}</span>
                                </div>

                                {/* Comments */}
                                <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>{comments || '•'} comments</span>
                                </div>
                        </div>
                </article>
        );
}

/**
 * Extracts subreddit from Reddit URL.
 */
function extractSubreddit(url: string | null): string {
        if (!url) return 'r/reddit';
        const match = url.match(/reddit\.com\/r\/([^\/]+)/);
        return match ? `r/${match[1]}` : 'r/reddit';
}

export default RedditCard;
