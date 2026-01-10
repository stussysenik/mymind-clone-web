/**
 * MyMind Clone - Goodreads Card Component
 * 
 * Renders books from Goodreads with rating and author.
 * Brown/cream accent matching Goodreads brand.
 * 
 * @fileoverview Goodreads book card
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, ExternalLink, Trash2, BookOpen } from 'lucide-react';
import type { Card } from '@/lib/types';

interface GoodreadsCardProps {
        card: Card;
        onDelete?: () => void;
        onRestore?: () => void;
        onClick?: () => void;
}

export function GoodreadsCard({ card, onDelete, onClick }: GoodreadsCardProps) {
        const [imageError, setImageError] = useState(false);
        const [isHovered, setIsHovered] = useState(false);

        const rating = card.metadata.rating;
        const author = card.metadata.author;

        return (
                <article
                        className={`relative overflow-hidden rounded-lg bg-[#F4F1EA] card-shadow border-l-[3px] border-[#553B08] ${onClick ? 'cursor-pointer' : ''}`}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                >
                        {/* Book Cover */}
                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#E8E3D9]">
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
                                        <div className="flex h-full w-full items-center justify-center bg-[#E8E3D9]">
                                                <BookOpen className="h-12 w-12 text-[#553B08]/40" />
                                        </div>
                                )}

                                {/* Goodreads Badge */}
                                <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-[#553B08]/90 px-2 py-1 backdrop-blur-sm">
                                        <BookOpen className="h-3.5 w-3.5 text-white" />
                                        <span className="text-xs font-medium text-white">Goodreads</span>
                                </div>

                                {/* Rating Badge */}
                                {rating && (
                                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-[#553B08]/90 px-2 py-1">
                                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
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
                                                                aria-label="Open on Goodreads"
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
                        <div className="p-3 bg-[#F4F1EA]">
                                <h3 className="text-sm font-medium text-[#382110] line-clamp-2 leading-snug">
                                        {card.title}
                                </h3>
                                {author && (
                                        <p className="mt-1 text-xs text-[#553B08]">by {author}</p>
                                )}
                        </div>
                </article>
        );
}

export default GoodreadsCard;
