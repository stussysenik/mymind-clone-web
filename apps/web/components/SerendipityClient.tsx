/**
 * MyMind Clone - SerendipityClient Component
 *
 * Interactive focused discovery experience for Serendipity mode.
 * Features single-card focus view with swipe/keyboard navigation.
 *
 * @fileoverview Interactive serendipity exploration client
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Shuffle, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Card } from '@/lib/types';
import { rowToCard, type CardRow } from '@/lib/types';
import { supabaseBrowser } from '@/lib/supabase';
import { FocusCard } from './FocusCard';
import { CardDetailModal } from './CardDetailModal';
import { useSwipe } from '@/hooks/useSwipe';

// =============================================================================
// TYPES
// =============================================================================

interface SerendipityClientProps {
	initialCards: Card[];
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Interactive serendipity client with focus mode carousel.
 */
// Count options for random cards
const COUNT_OPTIONS = [5, 10, 20, 50, 100];

export function SerendipityClient({ initialCards }: SerendipityClientProps) {
	const router = useRouter();
	const [cards, setCards] = useState(initialCards);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isShuffling, setIsShuffling] = useState(false);
	const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');
	const [isAnimating, setIsAnimating] = useState(false);
	const [cardCount, setCardCount] = useState(20); // Default to 20 cards

	const currentCard = cards[currentIndex];

	// Navigation functions
	const nextCard = useCallback(() => {
		if (currentIndex < cards.length - 1) {
			setAnimationDirection('right');
			setIsAnimating(true);
			setCurrentIndex(prev => prev + 1);
			setTimeout(() => setIsAnimating(false), 300);
		}
	}, [currentIndex, cards.length]);

	const prevCard = useCallback(() => {
		if (currentIndex > 0) {
			setAnimationDirection('left');
			setIsAnimating(true);
			setCurrentIndex(prev => prev - 1);
			setTimeout(() => setIsAnimating(false), 300);
		}
	}, [currentIndex]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger if user is typing in an input
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			switch (e.key) {
				case 'ArrowRight':
				case 'j':
					e.preventDefault();
					nextCard();
					break;
				case 'ArrowLeft':
				case 'k':
					e.preventDefault();
					prevCard();
					break;
				case ' ':
				case 'Enter':
					e.preventDefault();
					setIsDetailOpen(true);
					break;
				case 'Escape':
					if (isDetailOpen) {
						setIsDetailOpen(false);
					}
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [nextCard, prevCard, isDetailOpen]);

	// Swipe gestures
	const swipeHandlers = useSwipe(
		() => nextCard(),   // Swipe left -> next card
		() => prevCard()    // Swipe right -> prev card
	);

	// Shuffle with animation (client-side fetch)
	const handleShuffle = async () => {
		setIsShuffling(true);
		try {
			const response = await fetch(`/api/cards/random?limit=${cardCount}`);
			if (response.ok) {
				const newCards = await response.json();
				if (newCards.length > 0) {
					setCards(newCards);
					setCurrentIndex(0);
				}
			}
		} catch (err) {
			console.error('[Serendipity] Shuffle failed:', err);
		} finally {
			setIsShuffling(false);
		}
	};

	// Handle card deletion
	const handleDelete = useCallback((cardId: string) => {
		setCards(prev => prev.filter(c => c.id !== cardId));
		if (currentIndex >= cards.length - 1 && currentIndex > 0) {
			setCurrentIndex(prev => prev - 1);
		}
		setIsDetailOpen(false);
	}, [currentIndex, cards.length]);

	// Handle card archiving
	const handleArchive = useCallback(async (cardId: string) => {
		try {
			await fetch(`/api/cards/${cardId}/archive`, { method: 'POST' });
			// Remove from local cards array (archived cards shouldn't show in serendipity)
			setCards(prev => prev.filter(c => c.id !== cardId));
			// Adjust index if needed
			if (currentIndex >= cards.length - 1 && currentIndex > 0) {
				setCurrentIndex(prev => prev - 1);
			}
			setIsDetailOpen(false);
		} catch (err) {
			console.error('[Serendipity] Archive failed:', err);
		}
	}, [currentIndex, cards.length]);

	// Realtime subscription for data sync (enrichment updates)
	useEffect(() => {
		if (!supabaseBrowser) return;

		const channel = supabaseBrowser
			.channel('serendipity_cards')
			.on('postgres_changes', {
				event: 'UPDATE',
				schema: 'public',
				table: 'cards'
			}, (payload) => {
				// Update specific card in state if it's in our list
				const updatedRow = payload.new as CardRow;
				setCards(prev => prev.map(card =>
					card.id === updatedRow.id
						? rowToCard(updatedRow)
						: card
				));
			})
			.subscribe();

		return () => {
			supabaseBrowser?.removeChannel(channel);
		};
	}, []);

	// Empty state
	if (cards.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="p-4 bg-gray-100 rounded-full mb-4">
					<Sparkles className="w-8 h-8 text-gray-400" />
				</div>
				<h3 className="text-xl font-medium text-gray-900 mb-2">Nothing to discover</h3>
				<p className="text-gray-500 max-w-sm">
					Save some cards to start your serendipity journey.
				</p>
				<Link
					href="/"
					className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Everything
				</Link>
			</div>
		);
	}

	return (
		<div className="min-h-[80vh] flex flex-col" {...swipeHandlers}>
			{/* Header Controls */}
			<div className="flex items-center justify-between mb-8 px-4">
				<Link
					href="/"
					className="inline-flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors rounded-lg hover:bg-gray-100"
				>
					<ArrowLeft className="w-4 h-4" />
					<span className="hidden sm:inline">Back to Everything</span>
				</Link>

				<div className="flex items-center gap-2">
					{/* Count Selector */}
					<select
						value={cardCount}
						onChange={(e) => setCardCount(Number(e.target.value))}
						disabled={isShuffling}
						className="
							px-3 py-2.5
							bg-white border border-gray-200 rounded-full
							text-sm font-medium shadow-sm
							hover:bg-gray-50 hover:border-gray-300
							disabled:opacity-50 disabled:cursor-not-allowed
							transition-all cursor-pointer
							appearance-none
							pr-8
							bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
							bg-[position:right_8px_center]
							bg-no-repeat
						"
						aria-label="Number of cards to show"
					>
						{COUNT_OPTIONS.map((count) => (
							<option key={count} value={count}>
								{count} cards
							</option>
						))}
					</select>

					{/* Shuffle Button */}
					<button
						onClick={handleShuffle}
						disabled={isShuffling}
						className={`
							inline-flex items-center gap-2 px-5 py-2.5
							bg-white border border-gray-200 rounded-full
							text-sm font-medium shadow-sm
							hover:bg-gray-50 hover:border-gray-300
							disabled:opacity-50 disabled:cursor-not-allowed
							transition-all
							${isShuffling ? 'animate-pulse' : ''}
						`}
					>
						<Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
						{isShuffling ? 'Shuffling...' : 'Shuffle'}
					</button>
				</div>
			</div>

			{/* Focus Card Area */}
			<div className="flex-1 flex items-center justify-center px-4 relative">
				{/* Left Navigation Arrow */}
				<button
					onClick={prevCard}
					disabled={currentIndex === 0}
					className={`
						absolute left-4 lg:left-8 z-10
						p-3 rounded-full bg-white/90 shadow-lg backdrop-blur-sm
						text-gray-600 hover:text-gray-900 hover:bg-white
						disabled:opacity-30 disabled:cursor-not-allowed
						transition-all hover:scale-110
						hidden md:flex items-center justify-center
					`}
					aria-label="Previous card"
				>
					<ChevronLeft className="w-6 h-6" />
				</button>

				{/* Current Card */}
				{currentCard && (
					<FocusCard
						card={currentCard}
						onOpenDetail={() => setIsDetailOpen(true)}
						isAnimating={isAnimating}
						direction={animationDirection}
					/>
				)}

				{/* Right Navigation Arrow */}
				<button
					onClick={nextCard}
					disabled={currentIndex >= cards.length - 1}
					className={`
						absolute right-4 lg:right-8 z-10
						p-3 rounded-full bg-white/90 shadow-lg backdrop-blur-sm
						text-gray-600 hover:text-gray-900 hover:bg-white
						disabled:opacity-30 disabled:cursor-not-allowed
						transition-all hover:scale-110
						hidden md:flex items-center justify-center
					`}
					aria-label="Next card"
				>
					<ChevronRight className="w-6 h-6" />
				</button>
			</div>

			{/* Bottom Navigation */}
			<div className="py-8 flex flex-col items-center gap-4">
				{/* Progress Indicator */}
				<div className="flex items-center gap-3">
					<span className="text-sm text-gray-400 font-medium">
						{currentIndex + 1} / {cards.length}
					</span>
				</div>

				{/* Progress Dots (max 20 visible) */}
				<div className="flex items-center gap-1.5 max-w-md overflow-hidden">
					{cards.slice(0, 20).map((_, idx) => (
						<button
							key={idx}
							onClick={() => {
								setAnimationDirection(idx > currentIndex ? 'right' : 'left');
								setIsAnimating(true);
								setCurrentIndex(idx);
								setTimeout(() => setIsAnimating(false), 300);
							}}
							className={`
								transition-all duration-200 rounded-full
								${idx === currentIndex
									? 'w-4 h-2 bg-[var(--accent-primary)]'
									: 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
								}
							`}
							aria-label={`Go to card ${idx + 1}`}
						/>
					))}
					{cards.length > 20 && (
						<span className="text-xs text-gray-400 ml-2">+{cards.length - 20} more</span>
					)}
				</div>

				{/* Mobile Navigation */}
				<div className="flex items-center gap-4 md:hidden">
					<button
						onClick={prevCard}
						disabled={currentIndex === 0}
						className="p-3 rounded-full bg-gray-100 text-gray-600 disabled:opacity-30 min-w-[48px] min-h-[48px] flex items-center justify-center"
						aria-label="Previous"
					>
						<ChevronLeft className="w-5 h-5" />
					</button>
					<button
						onClick={nextCard}
						disabled={currentIndex >= cards.length - 1}
						className="p-3 rounded-full bg-gray-100 text-gray-600 disabled:opacity-30 min-w-[48px] min-h-[48px] flex items-center justify-center"
						aria-label="Next"
					>
						<ChevronRight className="w-5 h-5" />
					</button>
				</div>

				{/* Keyboard Hints (desktop) */}
				<div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
					<span className="flex items-center gap-1">
						<kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">←</kbd>
						<kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">→</kbd>
						Navigate
					</span>
					<span className="flex items-center gap-1">
						<kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Space</kbd>
						View Details
					</span>
				</div>
			</div>

			{/* Detail Modal */}
			{currentCard && (
				<CardDetailModal
					key={currentCard.id}
					card={isDetailOpen ? currentCard : null}
					isOpen={isDetailOpen}
					onClose={() => setIsDetailOpen(false)}
					onDelete={handleDelete}
					onArchive={handleArchive}
					availableSpaces={Array.from(new Set(cards.flatMap(c => c.tags))).sort()}
				/>
			)}
		</div>
	);
}

export default SerendipityClient;
