/**
 * MyMind Clone - StoryGraph Card Component
 * 
 * Renders books from The StoryGraph with rating and moods.
 * Purple accent matching StoryGraph brand.
 * 
 * @fileoverview StoryGraph book card
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, ExternalLink, Trash2, BookMarked, Sparkles } from 'lucide-react';
import type { Card } from '@/lib/types';

interface StoryGraphCardProps {
        card: Card;
        onDelete?: () => void;
	onArchive?: () => void;
        onRestore?: () => void;
        onClick?: () => void;
}

export function StoryGraphCard({ card, onDelete, onClick }: StoryGraphCardProps) {
        const [imageError, setImageError] = useState(false);
        const [isHovered, setIsHovered] = useState(false);

        const rating = card.metadata.rating;
        const author = card.metadata.author;

        return (
                <article
                        className={`relative overflow-hidden rounded-lg bg-[#1A1625] card-shadow border-l-[3px] border-[#9B7EBD] ${onClick ? 'cursor-pointer' : ''}`}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                >
                        {/* Book Cover */}
                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#2D2640]">
                                {card.imageUrl && !imageError ? (
                                        <Image
                                                src={card.imageUrl}
                                                alt={card.title || 'Book cover'}
                                                fill
                                                sizes="(max-width: 640px) 100vw, 300px"
                                                className="object-cover"
                                                loading="lazy"
                                                onError={() => setImageError(true)}
                                        />
                                ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-[#2D2640]">
                                                <BookMarked className="h-12 w-12 text-[#9B7EBD]/40" />
                                        </div>
                                )}

                                {/* StoryGraph Badge */}
                                <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-[#9B7EBD]/90 px-2 py-1 backdrop-blur-sm">
                                        <Sparkles className="h-3.5 w-3.5 text-white" />
                                        <span className="text-xs font-medium text-white">StoryGraph</span>
                                </div>

                                {/* Rating Badge */}
                                {rating && (
                                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-[#9B7EBD]/90 px-2 py-1">
                                                <Star className="h-3 w-3 text-white fill-white" />
                                                <span className="text-xs font-bold text-white">{rating}</span>
                                        </div>
                                )}

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
                                                                aria-label="Open on StoryGraph"
                                                        >
                                                                <ExternalLink className="h-4 w-4 text-gray-600" />
                                                        </a>
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
                                        </div>
                                )}
                        </div>

                        {/* Content */}
                        <div className="p-3 bg-[#1A1625]">
                                <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
                                        {card.title}
                                </h3>
                                {author && (
                                        <p className="mt-1 text-xs text-[#9B7EBD]">by {author}</p>
                                )}

                                {/* Tags as mood indicators */}
                                {card.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                                {card.tags.slice(0, 3).map((tag) => (
                                                        <span
                                                                key={tag}
                                                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#9B7EBD]/20 text-[#9B7EBD]"
                                                        >
                                                                {tag}
                                                        </span>
                                                ))}
                                        </div>
                                )}
                        </div>
                </article>
        );
}

export default StoryGraphCard;
