/**
 * MyMind Clone - YouTube Card Component
 * 
 * Renders YouTube videos with thumbnail and play button.
 * 
 * @fileoverview YouTube card with red accent
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, ExternalLink, Trash2, Archive } from 'lucide-react';
import type { Card } from '@/lib/types';

// =============================================================================
// TYPES
// =============================================================================

interface YouTubeCardProps {
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
 * YouTube style card for videos.
 */
export function YouTubeCard({ card, onDelete, onArchive, onRestore, onClick }: YouTubeCardProps) {
        const [imageError, setImageError] = useState(false);
        const [isHovered, setIsHovered] = useState(false);
        const channelName = card.metadata.author || 'YouTube';
        const viewCount = card.metadata.viewCount;

        return (
                <article
                        className={`relative overflow-hidden rounded-lg bg-white card-shadow border-l-[3px] border-red-600 ${onClick ? 'cursor-pointer' : ''}`}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                >
                        {/* Thumbnail */}
                        <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                                {card.imageUrl && !imageError ? (
                                        <Image
                                                src={card.imageUrl}
                                                alt={card.title || 'YouTube video'}
                                                fill
                                                sizes="(max-width: 640px) 100vw, 400px"
                                                className="object-cover"
                                                loading="lazy"
                                                onError={() => setImageError(true)}
                                        />
                                ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-900">
                                                <svg className="h-12 w-12 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                                </svg>
                                        </div>
                                )}

                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/90 shadow-lg transition-transform hover:scale-110">
                                                <Play className="h-6 w-6 text-white ml-0.5" fill="currentColor" />
                                        </div>
                                </div>

                                {/* Duration Badge (if available) */}
                                {card.metadata.duration && (
                                        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                                                {card.metadata.duration}
                                        </div>
                                )}

                                {/* YouTube Badge */}
                                <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
                                        <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                        <span className="text-xs font-medium text-white">YouTube</span>
                                </div>

                                {/* Hover Actions */}
                                {isHovered && (
                                        <div className="absolute right-2 top-2 flex gap-1 z-20">
                                                {card.url && (
                                                        <a
                                                                href={card.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                                                                aria-label="Open in YouTube"
                                                        >
                                                                <ExternalLink className="h-4 w-4 text-gray-600" />
                                                        </a>
                                                )}
                                                {onArchive && (
                                                        <button
                                                                onClick={(e) => { e.stopPropagation(); onArchive(); }}
                                                                className="p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                                                                aria-label="Archive card"
                                                        >
                                                                <Archive className="h-4 w-4 text-gray-600 hover:text-amber-500" />
                                                        </button>
                                                )}
                                                {onDelete && (
                                                        <button
                                                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                                                className="p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                                                                aria-label="Delete card"
                                                        >
                                                                <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-500" />
                                                        </button>
                                                )}
                                                {onRestore && (
                                                        <button
                                                                onClick={(e) => { e.stopPropagation(); onRestore(); }}
                                                                className="p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                                                                aria-label="Restore card"
                                                        >
                                                                <svg className="h-4 w-4 text-gray-600 hover:text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                                        <path d="M3 3v5h5" />
                                                                </svg>
                                                        </button>
                                                )}
                                        </div>
                                )}
                        </div>

                        {/* Content */}
                        <div className="p-3">
                                {/* Title */}
                                <h3 className="mb-1 text-sm font-medium text-[var(--foreground)] line-clamp-2 leading-snug">
                                        {card.title}
                                </h3>

                                {/* Channel & Views */}
                                <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                                        <span className="font-medium">{channelName}</span>
                                        {viewCount && (
                                                <>
                                                        <span>•</span>
                                                        <span>{viewCount} views</span>
                                                </>
                                        )}
                                </div>

                                {/* Tags */}
                                {card.tags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                                {card.tags.slice(0, 3).map((tag) => (
                                                        <span
                                                                key={tag}
                                                                className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]"
                                                        >
                                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                                {tag}
                                                        </span>
                                                ))}
                                        </div>
                                )}
                        </div>
                </article>
        );
}

export default YouTubeCard;
