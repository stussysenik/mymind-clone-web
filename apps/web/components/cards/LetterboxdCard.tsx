/**
 * MyMind Clone - Letterboxd Card Component
 *
 * Renders films from Letterboxd with rating, year, and director.
 * Green accent matching Letterboxd brand.
 *
 * @fileoverview Letterboxd film card
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, ExternalLink, Trash2, Film } from 'lucide-react';
import type { Card } from '@/lib/types';
import { TagDisplay } from '../TagDisplay';

interface LetterboxdCardProps {
	card: Card;
	onDelete?: () => void;
	onArchive?: () => void;
	onRestore?: () => void;
	onClick?: () => void;
}

export function LetterboxdCard({ card, onDelete, onClick }: LetterboxdCardProps) {
	const [imageError, setImageError] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const rating = card.metadata.rating;
	const year = card.metadata.year;
	const director = card.metadata.director;

	return (
		<article
			className={`relative overflow-hidden rounded-lg bg-[#14181C] card-shadow border-l-[3px] border-[#00E054] ${onClick ? 'cursor-pointer' : ''}`}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Poster Image */}
			<div className="relative aspect-[2/3] w-full overflow-hidden bg-[#2C3440]">
				{card.imageUrl && !imageError ? (
					<Image
						src={card.imageUrl}
						alt={card.title || 'Film poster'}
						fill
						sizes="(max-width: 640px) 100vw, 300px"
						className="object-cover"
						loading="lazy"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-[#2C3440]">
						<Film className="h-12 w-12 text-[#00E054]/40" />
					</div>
				)}

				{/* Letterboxd Badge */}
				<div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
					<div className="flex gap-0.5">
						<div className="w-2 h-2 rounded-full bg-[#FF8000]" />
						<div className="w-2 h-2 rounded-full bg-[#00E054]" />
						<div className="w-2 h-2 rounded-full bg-[#40BCF4]" />
					</div>
					<span className="text-xs font-medium text-white">Letterboxd</span>
				</div>

				{/* Rating Badge */}
				{rating && (
					<div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1">
						<Star className="h-3 w-3 text-[#00E054] fill-[#00E054]" />
						<span className="text-xs font-bold text-white">{rating}</span>
					</div>
				)}

				{/* Always-visible External Link */}
				{card.url && (
					<a
						href={card.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						className="absolute bottom-10 right-2 p-1.5 rounded-full bg-white/90 shadow-sm text-gray-400 hover:text-gray-600 transition-colors z-10"
						aria-label="Open original"
					>
						<ExternalLink className="h-3.5 w-3.5" />
					</a>
				)}

				{/* Hover Actions */}
				{isHovered && (
					<div className="absolute right-2 top-2 flex gap-1 z-20">
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
			<div className="p-3 bg-[#14181C]">
				<h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
					{card.title}
				</h3>
				<div className="flex items-center gap-2 mt-1 text-xs text-[#9AB]">
					{year && <span>{year}</span>}
					{director && (
						<>
							<span>•</span>
							<span>{director}</span>
						</>
					)}
				</div>
				{/* Added Date */}
				<div className="mt-1 text-xs text-[#9AB]/70">
					Added {new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</div>
				{/* Tags */}
				{card.tags && card.tags.length > 0 && (
					<TagDisplay tags={card.tags} className="mt-2 pt-2 border-t border-[#2C3440]" />
				)}
			</div>
		</article>
	);
}

export default LetterboxdCard;
