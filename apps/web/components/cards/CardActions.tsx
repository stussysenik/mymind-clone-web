/**
 * MyMind Clone - Card Actions Component
 *
 * Shared component for consistent card action buttons across all platform cards.
 * Provides Archive, Delete, and Restore actions that appear on hover.
 *
 * @fileoverview Shared card actions for platform consistency
 */

'use client';

import { Archive, Trash2, RotateCcw, ExternalLink } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface CardActionsProps {
	/** Whether the card is currently hovered */
	isHovered: boolean;
	/** Archive handler (moves to archive) */
	onArchive?: () => void;
	/** Delete handler (moves to trash) */
	onDelete?: () => void;
	/** Restore handler (from trash or archive) */
	onRestore?: () => void;
	/** Visual variant for different card backgrounds */
	variant?: 'light' | 'dark';
}

interface ExternalLinkButtonProps {
	/** URL to open */
	url: string;
	/** Visual variant for different card backgrounds */
	variant?: 'light' | 'dark';
	/** Position on the card */
	position?: 'bottom-right' | 'bottom-left' | 'top-right';
	/** Custom class name */
	className?: string;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Hover action buttons (Archive, Delete, Restore).
 * Appears in top-right corner on hover.
 */
export function CardActions({
	isHovered,
	onArchive,
	onDelete,
	onRestore,
	variant = 'light',
}: CardActionsProps) {
	if (!isHovered) return null;

	const bgClass = variant === 'dark'
		? 'bg-white/90 hover:bg-white'
		: 'bg-[var(--card-bg)]/90 hover:bg-[var(--card-bg)]';

	const textClass = variant === 'dark'
		? 'text-gray-600'
		: 'text-[var(--foreground-muted)]';

	return (
		<div className="absolute right-2 top-2 flex gap-1.5 z-20 animate-scale-in">
			{onArchive && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onArchive();
					}}
					className={`p-2.5 md:p-2 rounded-lg ${bgClass} shadow-sm ${textClass}
						hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20
						transition-colors physics-press touch-target`}
					aria-label="Archive card"
				>
					<Archive className="h-4 w-4" />
				</button>
			)}
			{onDelete && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className={`p-2.5 md:p-2 rounded-lg ${bgClass} shadow-sm ${textClass}
						hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
						transition-colors physics-press touch-target`}
					aria-label="Delete card"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			)}
			{onRestore && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onRestore();
					}}
					className={`p-2.5 md:p-2 rounded-lg ${bgClass} shadow-sm ${textClass}
						hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20
						transition-colors physics-press touch-target`}
					aria-label="Restore card"
				>
					<RotateCcw className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}

/**
 * External link button for opening original content.
 * Always visible (not just on hover) for better accessibility.
 */
export function ExternalLinkButton({
	url,
	variant = 'light',
	position = 'bottom-right',
	className = '',
}: ExternalLinkButtonProps) {
	const bgClass = variant === 'dark'
		? 'bg-white/90 hover:bg-white'
		: 'bg-[var(--card-bg)]/90';

	const textClass = variant === 'dark'
		? 'text-gray-400 hover:text-gray-600'
		: 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]';

	const positionClass = {
		'bottom-right': 'bottom-2 right-2',
		'bottom-left': 'bottom-2 left-2',
		'top-right': 'top-2 right-2',
	}[position];

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			onClick={(e) => e.stopPropagation()}
			className={`absolute ${positionClass} p-2 md:p-1.5 rounded-full ${bgClass} shadow-sm ${textClass}
				transition-colors z-10 physics-press touch-target ${className}`}
			aria-label="Open original"
		>
			<ExternalLink className="h-4 w-4 md:h-3.5 md:w-3.5" />
		</a>
	);
}

export default CardActions;
