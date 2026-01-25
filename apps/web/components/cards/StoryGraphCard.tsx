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
import { Star, BookMarked, Sparkles, Globe } from 'lucide-react';
import type { Card } from '@/lib/types';
import { TagDisplay } from '../TagDisplay';
import { AnalyzingIndicator } from '../AnalyzingIndicator';
import { CardActions, ExternalLinkButton } from './CardActions';

interface StoryGraphCardProps {
	card: Card;
	onDelete?: () => void;
	onArchive?: () => void;
	onRestore?: () => void;
	onClick?: () => void;
}

export function StoryGraphCard({ card, onDelete, onArchive, onRestore, onClick }: StoryGraphCardProps) {
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
			{/* Processing Indicator */}
			{card.metadata?.processing && (
				<div className="absolute left-2 top-2 z-30">
					<AnalyzingIndicator variant="dark" accentColor="#9B7EBD" size="sm" />
				</div>
			)}

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
			<div className="p-3 bg-[#1A1625]">
				<h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
					{card.title}
				</h3>
				{author && (
					<p className="mt-1 text-xs text-[#9B7EBD]">by {author}</p>
				)}
				{/* Added Date */}
				<div className="mt-1 text-xs text-[#9B7EBD]/60">
					Added {new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</div>
				{/* Domain Link */}
				<div className="flex items-center gap-1.5 mt-1">
					<Globe className="w-3 h-3 text-[#9B7EBD]/60" />
					<span className="text-xs text-[#9B7EBD] truncate">thestorygraph.com</span>
				</div>

				{/* Tags */}
				{card.tags && card.tags.length > 0 && (
					<TagDisplay tags={card.tags} className="mt-2 pt-2 border-t border-[#2D2640]" />
				)}
			</div>
		</article>
	);
}

export default StoryGraphCard;
