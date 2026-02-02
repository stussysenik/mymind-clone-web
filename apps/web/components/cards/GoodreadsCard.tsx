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
import { Star, BookOpen, Globe } from 'lucide-react';
import type { Card } from '@/lib/types';
import { TagDisplay } from '../TagDisplay';
import { AnalyzingIndicator } from '../AnalyzingIndicator';
import { CardActions, ExternalLinkButton } from './CardActions';

interface GoodreadsCardProps {
	card: Card;
	onDelete?: () => void;
	onArchive?: () => void;
	onRestore?: () => void;
	onClick?: () => void;
}

export function GoodreadsCard({ card, onDelete, onArchive, onRestore, onClick }: GoodreadsCardProps) {
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
			{/* Processing Indicator */}
			{card.metadata?.processing && (
				<div className="absolute left-2 top-2 z-30">
					<AnalyzingIndicator variant="dark" accentColor="#553B08" size="sm" />
				</div>
			)}

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
					<div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-[#553B08]/90 px-2 py-1">
						<Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
						<span className="text-xs font-bold text-white">{rating}</span>
					</div>
				)}

				{/* Always-visible External Link */}
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
			<div className="p-3 bg-[#F4F1EA]">
				<h3 className="text-sm font-medium text-[#382110] line-clamp-2 leading-snug">
					{card.title}
				</h3>
				{author && (
					<p className="mt-1 text-xs text-[#553B08]">by {author}</p>
				)}
				{/* Added Date */}
				<div className="mt-1 text-xs text-[#553B08]/60">
					Added {new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</div>
				{/* Domain Link */}
				<div className="flex items-center gap-1.5 mt-1">
					<Globe className="w-3 h-3 text-[#553B08]/60" />
					<span className="text-xs text-[#553B08] truncate">goodreads.com</span>
				</div>
				{/* Tags */}
				{card.tags && card.tags.length > 0 && (
					<TagDisplay tags={card.tags} className="mt-2 pt-2 border-t border-[#E0D9CC]" />
				)}
			</div>
		</article>
	);
}

export default GoodreadsCard;
