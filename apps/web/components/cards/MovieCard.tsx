/**
 * MyMind Clone - Movie/Film Card Component
 * 
 * Renders IMDB and Letterboxd movie/film entries.
 * 
 * @fileoverview Movie card for IMDB and Letterboxd
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, Film } from 'lucide-react';
import type { Card } from '@/lib/types';
import { detectPlatform } from '@/lib/platforms';

// =============================================================================
// TYPES
// =============================================================================

interface MovieCardProps {
        card: Card;
        onDelete?: () => void;
        onRestore?: () => void;
        onClick?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Movie/Film card for IMDB and Letterboxd.
 */
export function MovieCard({ card, onDelete, onRestore, onClick }: MovieCardProps) {
        const [imageError, setImageError] = useState(false);
        const [isHovered, setIsHovered] = useState(false);
        const platform = detectPlatform(card.url);
        const isLetterboxd = platform === 'letterboxd';
        const isImdb = platform === 'imdb';

        const rating = card.metadata.rating;
        const year = card.metadata.year;
        const director = card.metadata.director;

        // Platform-specific colors
        const borderColor = isLetterboxd ? '#00E054' : '#F5C518';
        const accentColor = isLetterboxd ? '#00E054' : '#F5C518';

        return (
                <article
                        className={`relative overflow-hidden rounded-lg bg-white card-shadow ${onClick ? 'cursor-pointer' : ''}`}
                        style={{ borderLeft: `3px solid ${borderColor}` }}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                >
                        {/* Poster */}
                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-900">
                                {card.imageUrl && !imageError ? (
                                        <Image
                                                src={card.imageUrl}
                                                alt={card.title || 'Movie poster'}
                                                fill
                                                sizes="(max-width: 640px) 100vw, 300px"
                                                className="object-cover"
                                                loading="lazy"
                                                onError={() => setImageError(true)}
                                        />
                                ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
                                                <Film className="h-16 w-16 text-gray-600" />
                                        </div>
                                )}

                                {/* Platform Badge */}
                                <div
                                        className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md px-2 py-1 backdrop-blur-sm"
                                        style={{ backgroundColor: `${accentColor}20` }}
                                >
                                        {isLetterboxd ? (
                                                <>
                                                        <div className="flex gap-0.5">
                                                                <div className="h-2.5 w-2.5 rounded-full bg-[#FF8000]" />
                                                                <div className="h-2.5 w-2.5 rounded-full bg-[#00E054]" />
                                                                <div className="h-2.5 w-2.5 rounded-full bg-[#40BCF4]" />
                                                        </div>
                                                        <span className="text-xs font-medium text-white">Letterboxd</span>
                                                </>
                                        ) : (
                                                <>
                                                        <div className="rounded bg-[#F5C518] px-1 py-0.5 text-[10px] font-bold text-black">
                                                                IMDb
                                                        </div>
                                                </>
                                        )}
                                </div>

                                {/* Rating Badge */}
                                {rating && (
                                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 backdrop-blur-sm">
                                                <Star className="h-3.5 w-3.5" fill={accentColor} stroke={accentColor} />
                                                <span className="text-sm font-bold text-white">{rating}</span>
                                        </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="p-3">
                                {/* Title */}
                                <h3 className="mb-1 text-sm font-semibold text-[var(--foreground)] line-clamp-2">
                                        {card.title}
                                </h3>

                                {/* Year & Director */}
                                <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                                        {year && <span>{year}</span>}
                                        {year && director && <span>•</span>}
                                        {director && <span>Dir. {director}</span>}
                                </div>

                                {/* Summary */}
                                {card.metadata.summary && (
                                        <p className="mt-2 text-xs text-[var(--foreground-muted)] line-clamp-2">
                                                {card.metadata.summary}
                                        </p>
                                )}

                                {/* Tags */}
                                {card.tags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                                {card.tags.slice(0, 3).map((tag) => (
                                                        <span
                                                                key={tag}
                                                                className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]"
                                                        >
                                                                <span
                                                                        className="h-1.5 w-1.5 rounded-full"
                                                                        style={{ backgroundColor: accentColor }}
                                                                />
                                                                {tag}
                                                        </span>
                                                ))}
                                        </div>
                                )}
                        </div>
                </article>
        );
}

export default MovieCard;
