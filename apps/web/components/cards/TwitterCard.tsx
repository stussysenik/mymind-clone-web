/**
 * MyMind Clone - Twitter/X Card Component
 * 
 * Renders tweets in a distinctive Twitter/X style.
 * 
 * @fileoverview Twitter card with X branding
 */

'use client';

import Image from 'next/image';
import { ExternalLink, Trash2, RotateCcw, Loader2, Archive } from 'lucide-react';
import { useState } from 'react';
import type { Card } from '@/lib/types';

// =============================================================================
// TYPES
// =============================================================================

interface TwitterCardProps {
        card: Card;
        onDelete?: () => void;
        onArchive?: () => void;
        onRestore?: () => void;
        onClick?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Twitter/X style card for tweets.
 */
export function TwitterCard({ card, onDelete, onArchive, onRestore, onClick }: TwitterCardProps) {
        const [isHovered, setIsHovered] = useState(false);
        const author = card.metadata.author || '@user';
        const tweetText = card.content || card.title || '';

        return (
                <article
                        className={`relative flex flex-col overflow-hidden rounded-lg bg-white card-shadow border-l-[3px] border-black ${onClick ? 'cursor-pointer' : ''}`}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                >
                        {/* Header */}
                        <div className="flex items-center gap-3 p-3 pb-2">
                                {/* X Logo */}
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
                                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                </div>

                                {/* Author */}
                                <div className="flex flex-col">
                                        <span className="text-sm font-medium text-[var(--foreground)]">
                                                {author.startsWith('@') ? author.slice(1) : author}
                                        </span>
                                        <span className="text-xs text-[var(--foreground-muted)]">
                                                {author.startsWith('@') ? author : `@${author}`}
                                        </span>
                                </div>
                        </div>

                        {/* Tweet Content */}
                        <div className="px-3 pb-2">
                                <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                                        {tweetText}
                                </p>
                        </div>

                        {/* Image if exists */}
                        {card.imageUrl && (
                                <div className="relative aspect-video w-full overflow-hidden border-t border-[var(--border)]">
                                        <Image
                                                src={card.imageUrl}
                                                alt="Tweet media"
                                                fill
                                                sizes="(max-width: 640px) 100vw, 400px"
                                                className="object-cover"
                                                loading="lazy"
                                        />
                                </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-4 px-3 py-2 border-t border-[var(--border)]">
                                <span className="text-xs text-[var(--foreground-muted)]">
                                        {card.url && new URL(card.url).hostname.replace('www.', '')}
                                </span>
                        </div>

                        {/* Tags */}
                        {card.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 px-3 pb-3">
                                        {card.tags.map((tag) => (
                                                <span
                                                        key={tag}
                                                        className="text-xs text-blue-500"
                                                >
                                                        #{tag}
                                                </span>
                                        ))}
                                </div>
                        )}

                        {/* Processing Indicator */}
                        {card.metadata?.processing && (
                                <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium animate-pulse">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Analyzing...
                                </div>
                        )}

                        {/* Hover Actions */}
                        {isHovered && (
                                <div className="absolute right-2 top-2 flex gap-1">
                                        {card.url && (
                                                <a
                                                        href={card.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1.5 rounded-md bg-white/90 shadow-sm text-gray-600 hover:text-gray-900 transition-colors"
                                                        aria-label="Open original link"
                                                >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                        )}
                                        {onArchive && (
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onArchive();
                                                        }}
                                                        className="p-1.5 rounded-md bg-white/90 shadow-sm text-gray-600 hover:text-amber-600 transition-colors"
                                                        aria-label="Archive card"
                                                >
                                                        <div className="flex items-center justify-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <rect width="20" height="5" x="2" y="3" rx="1" />
                                                                        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                                                                        <path d="M10 12h4" />
                                                                </svg>
                                                        </div>
                                                </button>
                                        )}
                                        {onArchive && (
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onArchive();
                                                        }}
                                                        className="p-1.5 rounded-md bg-white/90 shadow-sm text-gray-600 hover:text-amber-600 transition-colors"
                                                        aria-label="Archive card"
                                                >
                                                        <Archive className="h-3.5 w-3.5" />
                                                </button>
                                        )}
                                        {onDelete && (
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete();
                                                        }}
                                                        className="p-1.5 rounded-md bg-white/90 shadow-sm text-gray-600 hover:text-red-600 transition-colors"
                                                        aria-label="Delete card"
                                                >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                        )}
                                        {onRestore && (
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRestore();
                                                        }}
                                                        className="p-1.5 rounded-md bg-white/90 shadow-sm text-gray-600 hover:text-green-600 transition-colors"
                                                        aria-label="Restore card"
                                                >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                </button>
                                        )}
                                </div>
                        )}
                </article>
        );
}

export default TwitterCard;
