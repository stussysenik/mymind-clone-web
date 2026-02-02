/**
 * MyMind Clone - Analyzing Indicator Component
 *
 * Premium loading indicator shown on cards during AI enrichment.
 * Features animated gradient, pulse effects, and platform-aware styling.
 *
 * @fileoverview Shared analyzing indicator for all card types
 */

'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Brain, Wand2, AlertCircle, RefreshCw } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type TimeoutState = 'normal' | 'warning' | 'stuck';

interface AnalyzingIndicatorProps {
	/** Visual variant for different card backgrounds */
	variant?: 'dark' | 'light' | 'glass';
	/** Optional platform color for accent */
	accentColor?: string;
	/** Size variant */
	size?: 'sm' | 'md' | 'lg';
	/** Custom label text */
	label?: string;
	/** Show detailed stage info */
	showStage?: boolean;
	/** Current processing stage (0-100) */
	progress?: number;
	/** Unix timestamp (ms) when processing started - enables timeout detection */
	startTime?: number;
	/** Callback when processing is considered stuck (>60s) */
	onTimeout?: () => void;
	/** Callback to retry enrichment - shows retry button when stuck */
	onRetry?: () => void;
	/** Whether enrichment explicitly failed (shows failed state immediately) */
	failed?: boolean;
}

// =============================================================================
// TIMEOUT CONFIGURATION
// =============================================================================

const WARNING_THRESHOLD_MS = 30000; // 30 seconds - show warning
const STUCK_THRESHOLD_MS = 60000;   // 60 seconds - show stuck state

// =============================================================================
// ANIMATION STAGES
// =============================================================================

const STAGES = [
	{ label: 'Analyzing content', icon: Brain },
	{ label: 'Extracting insights', icon: Wand2 },
	{ label: 'Generating tags', icon: Sparkles },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Premium analyzing indicator with animated gradient and pulse effects.
 * Designed to overlay on cards during AI enrichment.
 */
export function AnalyzingIndicator({
	variant = 'dark',
	accentColor,
	size = 'sm',
	label,
	showStage = false,
	progress,
	startTime,
	onTimeout,
	onRetry,
	failed = false,
}: AnalyzingIndicatorProps) {
	// Timeout detection state
	const [timeoutState, setTimeoutState] = useState<TimeoutState>(failed ? 'stuck' : 'normal');
	const [isRetrying, setIsRetrying] = useState(false);

	// Check for timeout based on startTime
	useEffect(() => {
		// If explicitly failed, always show stuck state
		if (failed) {
			setTimeoutState('stuck');
			return;
		}

		if (!startTime) {
			setTimeoutState('normal');
			return;
		}

		const checkTimeout = () => {
			const elapsed = Date.now() - startTime;
			if (elapsed > STUCK_THRESHOLD_MS) {
				setTimeoutState('stuck');
				onTimeout?.();
			} else if (elapsed > WARNING_THRESHOLD_MS) {
				setTimeoutState('warning');
			} else {
				setTimeoutState('normal');
			}
		};

		// Check immediately
		checkTimeout();

		// Check every second
		const interval = setInterval(checkTimeout, 1000);
		return () => clearInterval(interval);
	}, [startTime, onTimeout, failed]);

	// Handle retry click
	const handleRetry = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!onRetry || isRetrying) return;
		setIsRetrying(true);
		try {
			await onRetry();
		} finally {
			setIsRetrying(false);
		}
	};

	// Determine stage based on progress
	const stageIndex = progress !== undefined
		? Math.min(Math.floor(progress / 33), 2)
		: 0;
	const currentStage = STAGES[stageIndex];
	const StageIcon = currentStage?.icon || Brain;

	// Timeout-aware colors
	const timeoutColors = {
		normal: accentColor || undefined,
		warning: '#F59E0B', // Amber
		stuck: '#EF4444',   // Red
	};

	// Determine effective color
	const effectiveColor = timeoutColors[timeoutState];

	// Timeout-aware labels
	const timeoutLabels = {
		normal: null, // Use default label
		warning: 'Taking longer...',
		stuck: 'May have failed',
	};

	// Use timeout label if in warning/stuck state, otherwise use provided label or default
	const effectiveLabel = timeoutLabels[timeoutState] || label || (showStage ? currentStage?.label : 'Analyzing');

	// Size classes
	const sizeClasses = {
		sm: 'px-2.5 py-1.5 gap-1.5 text-[10px]',
		md: 'px-3 py-2 gap-2 text-xs',
		lg: 'px-4 py-2.5 gap-2.5 text-sm',
	};

	const iconSizes = {
		sm: 'h-3 w-3',
		md: 'h-3.5 w-3.5',
		lg: 'h-4 w-4',
	};

	// Variant styles
	const variantClasses = {
		dark: 'bg-black/70 text-white border border-white/10',
		light: 'bg-white/90 text-gray-700 border border-gray-200/50 shadow-sm',
		glass: 'bg-white/20 text-white border border-white/20',
	};

	return (
		<div
			className={`
				inline-flex items-center rounded-full backdrop-blur-md font-medium
				${sizeClasses[size]}
				${variantClasses[variant]}
				analyzing-indicator
			`}
			style={{
				// Apply accent color as subtle border glow if provided
				boxShadow: effectiveColor
					? `0 0 12px ${effectiveColor}40, inset 0 1px 0 rgba(255,255,255,0.1)`
					: undefined,
			}}
		>
			{/* Animated Icon */}
			<div className="relative">
				{/* Outer pulse ring - different color for timeout states */}
				<div
					className={`
						absolute inset-0 rounded-full animate-ping opacity-30
						${timeoutState === 'stuck' ? 'bg-red-400' : timeoutState === 'warning' ? 'bg-amber-400' : variant === 'light' ? 'bg-gray-500' : 'bg-white'}
					`}
					style={{ animationDuration: '1.5s' }}
				/>
				{/* Inner icon - AlertCircle for stuck, Loader2 for others */}
				{timeoutState === 'stuck' ? (
					<AlertCircle
						className={`${iconSizes[size]} text-red-400 animate-pulse`}
						style={{ animationDuration: '1s' }}
					/>
				) : showStage ? (
					<StageIcon
						className={`${iconSizes[size]} animate-pulse`}
						style={{ animationDuration: '1s' }}
					/>
				) : (
					<Loader2
						className={`${iconSizes[size]} animate-spin`}
						style={{ animationDuration: '1s' }}
					/>
				)}
			</div>

			{/* Label with gradient shimmer */}
			<span className="relative overflow-hidden">
				<span className="relative z-10">
					{effectiveLabel}
				</span>
				{/* Shimmer overlay */}
				<span
					className="absolute inset-0 -translate-x-full animate-shimmer-fast bg-gradient-to-r from-transparent via-white/30 to-transparent"
					style={{
						animationDuration: '2s',
						animationIterationCount: 'infinite',
					}}
				/>
			</span>

			{/* Progress indicator dots */}
			{showStage && timeoutState !== 'stuck' && (
				<div className="flex gap-0.5 ml-1">
					{STAGES.map((_, i) => (
						<div
							key={i}
							className={`
								w-1 h-1 rounded-full transition-all duration-300
								${i <= stageIndex
									? variant === 'light' ? 'bg-gray-700' : 'bg-white'
									: variant === 'light' ? 'bg-gray-300' : 'bg-white/30'
								}
								${i === stageIndex ? 'scale-125' : ''}
							`}
						/>
					))}
				</div>
			)}

			{/* Retry button - shown when stuck and onRetry is provided */}
			{timeoutState === 'stuck' && onRetry && (
				<button
					onClick={handleRetry}
					disabled={isRetrying}
					className={`
						ml-1 p-1 rounded-full transition-colors
						${variant === 'light'
							? 'hover:bg-gray-200 text-gray-600'
							: 'hover:bg-white/20 text-white/80 hover:text-white'
						}
						${isRetrying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
					`}
					title="Retry enrichment"
				>
					<RefreshCw className={`${iconSizes[size]} ${isRetrying ? 'animate-spin' : ''}`} />
				</button>
			)}
		</div>
	);
}

// =============================================================================
// FULL CARD OVERLAY VARIANT
// =============================================================================

interface AnalyzingOverlayProps {
	/** Whether to show the overlay */
	visible: boolean;
	/** Platform accent color */
	accentColor?: string;
	/** Current progress percentage */
	progress?: number;
}

/**
 * Full-card overlay variant for more prominent loading state.
 * Use this for cards without images or when you want to emphasize the loading.
 */
export function AnalyzingOverlay({ visible, accentColor, progress }: AnalyzingOverlayProps) {
	if (!visible) return null;

	return (
		<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
			<div className="flex flex-col items-center gap-3">
				{/* Animated brain icon with orbiting dots */}
				<div className="relative">
					<div
						className="w-12 h-12 rounded-full flex items-center justify-center"
						style={{
							background: accentColor
								? `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`
								: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.2))',
						}}
					>
						<Brain className="w-6 h-6 text-white animate-pulse" />
					</div>

					{/* Orbiting dots */}
					<div
						className="absolute inset-0 animate-spin"
						style={{ animationDuration: '3s' }}
					>
						<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-white/80" />
					</div>
					<div
						className="absolute inset-0 animate-spin"
						style={{ animationDuration: '3s', animationDelay: '-1s' }}
					>
						<div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-1.5 h-1.5 rounded-full bg-white/60" />
					</div>
				</div>

				{/* Status text */}
				<div className="text-white text-sm font-medium text-center">
					<span className="analyzing-text">Analyzing content</span>
				</div>

				{/* Progress bar (if provided) */}
				{progress !== undefined && (
					<div className="w-24 h-1 rounded-full bg-white/20 overflow-hidden">
						<div
							className="h-full rounded-full bg-white transition-all duration-500 ease-out"
							style={{ width: `${progress}%` }}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

export default AnalyzingIndicator;
