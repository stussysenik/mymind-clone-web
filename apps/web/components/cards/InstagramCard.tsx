/**
 * MyMind Clone - Instagram Card Component
 * 
 * Renders Instagram posts and reels with distinctive styling.
 * 
 * @fileoverview Instagram card with gradient and play button
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, Instagram } from 'lucide-react';
import type { Card } from '@/lib/types';

// =============================================================================
// TYPES
// =============================================================================

interface InstagramCardProps {
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
 * Instagram style card for posts and reels.
 */
export function InstagramCard({ card, onDelete, onArchive, onRestore, onClick }: InstagramCardProps) {
        const [imageError, setImageError] = useState(false);
        const [isHovered, setIsHovered] = useState(false);
        const isReel = card.url?.includes('/reel/') || card.url?.includes('/reels/');
        const author = card.metadata.author || 'instagram';

        return (
                <article
                        className={`relative overflow-hidden rounded-lg bg-white card-shadow border-l-[3px] border-[#E4405F] ${onClick ? 'cursor-pointer' : ''}`}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                >
                        {/* Image Container - Square aspect ratio for Instagram */}
                        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                                {card.imageUrl && !imageError ? (
                                        <Image
                                                src={card.imageUrl}
                                                alt={card.title || 'Instagram post'}
                                                fill
                                                sizes="(max-width: 640px) 100vw, 400px"
                                                className="object-cover"
                                                loading="lazy"
                                                onError={() => setImageError(true)}
                                        />
                                ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                                <Instagram className="h-16 w-16 text-white/80" />
                                        </div>
                                )}

                                {/* Instagram Badge */}
                                <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
                                        <Instagram className="h-3.5 w-3.5 text-white" />
                                        <span className="text-xs font-medium text-white">Instagram</span>
                                </div>

                                {/* Play Button for Reels */}
                                {isReel && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                                                        <Play className="h-6 w-6 text-gray-800 ml-0.5" fill="currentColor" />
                                                </div>
                                        </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                                {/* Hover Actions */}
                                {isHovered && (
                                        <div className="absolute right-2 top-2 flex gap-1 z-20">
                                                {onArchive && (
                                                        <button
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onArchive();
                                                                }}
                                                                className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 hover:text-amber-400 transition-colors"
                                                                aria-label="Archive card"
                                                        >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <rect width="20" height="5" x="2" y="3" rx="1" />
                                                                        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                                                                        <path d="M10 12h4" />
                                                                </svg>
                                                        </button>
                                                )}
                                                {onDelete && (
                                                        <button
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDelete();
                                                                }}
                                                                className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 hover:text-red-400 transition-colors"
                                                                aria-label="Delete card"
                                                        >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M3 6h18" />
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                        <path d="M8 6V4c0-1 1-1 1-1h6c1 0 1 1 1 1v2" />
                                                                </svg>
                                                        </button>
                                                )}
                                                {onRestore && (
                                                        <button
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onRestore();
                                                                }}
                                                                className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 hover:text-green-400 transition-colors"
                                                                aria-label="Restore card"
                                                        >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                                        <path d="M3 3v5h5" />
                                                                </svg>
                                                        </button>
                                                )}
                                        </div>
                                )}

                                {/* Hover Actions */}
                                {isHovered && (
                                        <div className="absolute right-2 top-2 flex gap-1 z-20">
                                                {onArchive && (
                                                        <button
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onArchive();
                                                                }}
                                                                className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 hover:text-amber-400 transition-colors"
                                                                aria-label="Archive card"
                                                        >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <rect width="20" height="5" x="2" y="3" rx="1" />
                                                                        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                                                                        <path d="M10 12h4" />
                                                                </svg>
                                                        </button>
                                                )}
                                                {onDelete && (
                                                        <button
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDelete();
                                                                }}
                                                                className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 hover:text-red-400 transition-colors"
                                                                aria-label="Delete card"
                                                        >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M3 6h18" />
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                        <path d="M8 6V4c0-1 1-1 1-1h6c1 0 1 1 1 1v2" />
                                                                </svg>
                                                        </button>
                                                )}
                                                {onRestore && (
                                                        <button
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onRestore();
                                                                }}
                                                                className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 hover:text-green-400 transition-colors"
                                                                aria-label="Restore card"
                                                        >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                {/* Author */}
                                <div className="mb-2 flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
                                                <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                                                        <span className="text-[8px] font-semibold text-pink-500">IG</span>
                                                </div>
                                        </div>
                                        <span className="text-sm font-medium text-[var(--foreground)]">
                                                {author}
                                        </span>
                                </div>

                                {/* Caption */}
                                {card.content && (
                                        <p className="text-sm text-[var(--foreground-muted)] line-clamp-3">
                                                {card.content}
                                        </p>
                                )}

                                {/* Source URL */}
                                <div className="mt-2 text-xs text-[var(--accent-primary)]">
                                        instagram.com
                                </div>
                        </div>
                </article>
        );
}

export default InstagramCard;
