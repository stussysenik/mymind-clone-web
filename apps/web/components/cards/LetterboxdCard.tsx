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
import { Star, Film, Globe } from 'lucide-react';
import type { Card } from '@/lib/types';
import { TagDisplay } from '../TagDisplay';
import { AnalyzingIndicator } from '../AnalyzingIndicator';
import { CardActions, ExternalLinkButton } from './CardActions';

interface LetterboxdCardProps {
	card: Card;
	onDelete?: () => void;
	onArchive?: () => void;
	onRestore?: () => void;
	onClick?: () => void;
}

export function LetterboxdCard({ card, onDelete, onArchive, onRestore, onClick }: LetterboxdCardProps) {
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
			{/* Processing Indicator */}
			{card.metadata?.processing && (
				<div className="absolute left-2 top-2 z-30">
					<AnalyzingIndicator variant="dark" accentColor="#00E054" size="sm" />
				</div>
			)}

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

				{/* Domain Badge */}
				{card.url && (
					<div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
						<Globe className="w-3 h-3 text-white/80" />
						<span className="text-xs font-medium text-white truncate max-w-[120px]">
							{new URL(card.url).hostname.replace('www.', '')}
						</span>
					</div>
				)}

				{/* Rating Badge */}
				{rating && (
					<div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1">
						<Star className="h-3 w-3 text-[#00E054] fill-[#00E054]" />
						<span className="text-xs font-bold text-white">{rating}</span>
					</div>
				)}

				{/* Always-visible External Link - bottom right for consistency */}
				{card.url && (
					<ExternalLinkButton url={card.url} variant="dark" position="bottom-right" />
				)}

				{/* Hover Actions */}
				<CardActions
					isHovered={isHovered}
					onArchive={onArchive}
					onDelete={onDelete}
					onRestore={onRestore}
					variant="dark"
				/>
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
				{/* Domain Link */}
				<div className="flex items-center gap-1.5 mt-1">
					<Globe className="w-3 h-3 text-[#9AB]/70" />
					<span className="text-xs text-[#00E054] truncate">letterboxd.com</span>
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
