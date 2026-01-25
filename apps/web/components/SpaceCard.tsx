/**
 * MyMind Clone - Space Card Component
 *
 * Displays a single space card with hover hide/delete functionality.
 * Hide = non-destructive (cards keep their tags)
 * Delete = destructive (deletes all cards in space)
 *
 * Compact horizontal layout for bento-grid style.
 *
 * @fileoverview Client component for space cards with hide/delete
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Hash, Trash2, EyeOff } from 'lucide-react';

interface SpaceCardProps {
	tag: string;
	count: number;
	onHide?: (tag: string) => void;
	onDelete?: () => void;
}

export function SpaceCard({ tag, count, onHide, onDelete }: SpaceCardProps) {
	const [showConfirm, setShowConfirm] = useState(false);

	const handleHide = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (showConfirm) {
			onHide?.(tag);
			setShowConfirm(false);
		} else {
			setShowConfirm(true);
		}
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onDelete?.();
	};

	const handleCancelConfirm = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setShowConfirm(false);
	};

	return (
		<Link
			href={`/?q=%23${encodeURIComponent(tag)}`}
			className="group relative bg-white rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md transition-all p-3 flex items-center gap-3"
		>
			{/* Action Buttons (appear on hover) - top right corner */}
			<div className="absolute top-2 right-2 flex gap-1 z-10">
				{/* Hide Button */}
				{onHide && (
					<button
						onClick={handleHide}
						className={`p-1 rounded-full transition-all ${showConfirm
							? 'bg-amber-500 text-white opacity-100'
							: 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-amber-100 hover:text-amber-500'
							}`}
						title={showConfirm ? 'Click again to confirm' : 'Hide this space'}
					>
						<EyeOff className="w-3.5 h-3.5" />
					</button>
				)}

				{/* Delete Button */}
				{onDelete && (
					<button
						onClick={handleDelete}
						className="p-1 rounded-full bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 transition-all"
						title="Delete space and all its posts"
					>
						<Trash2 className="w-3.5 h-3.5" />
					</button>
				)}
			</div>

			{/* Hide Confirmation overlay */}
			{showConfirm && (
				<div
					className="absolute inset-0 bg-amber-50/95 rounded-xl flex items-center justify-center gap-2 z-5 backdrop-blur-sm px-2"
					onClick={handleCancelConfirm}
				>
					<p className="text-xs font-medium text-amber-700 truncate">
						Hide?
					</p>
					<button
						onClick={handleHide}
						className="px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded-md hover:bg-amber-600 shrink-0"
					>
						Yes
					</button>
					<button
						onClick={handleCancelConfirm}
						className="px-2 py-1 text-xs font-medium bg-white text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 shrink-0"
					>
						No
					</button>
				</div>
			)}

			{/* Icon - smaller for compact layout */}
			<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
				<Hash className="w-5 h-5 text-[var(--accent-primary)]" />
			</div>

			{/* Text - inline with ellipsis */}
			<div className="flex-1 min-w-0 pr-8">
				<h3 className="text-sm font-medium text-[var(--foreground)] capitalize truncate group-hover:text-[var(--accent-primary)] transition-colors">
					{tag}
				</h3>
				<p className="text-xs text-[var(--foreground-muted)]">
					{count} {count === 1 ? 'item' : 'items'}
				</p>
			</div>
		</Link>
	);
}

export default SpaceCard;
