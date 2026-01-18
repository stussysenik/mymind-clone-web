/**
 * Settings Modal Component
 *
 * Allows users to customize visual preferences:
 * - Dark mode toggle
 * - Background color presets
 * - Font family selection
 * - Highlight color selection
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Moon, Sun, Palette, Type } from 'lucide-react';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

type Theme = 'light' | 'dark' | 'auto';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const [theme, setTheme] = useState<Theme>('auto');

	// Load theme preference from localStorage
	useEffect(() => {
		const saved = localStorage.getItem('theme') as Theme;
		if (saved) {
			setTheme(saved);
			applyTheme(saved);
		}
	}, []);

	// Apply theme to document
	const applyTheme = (newTheme: Theme) => {
		const root = document.documentElement;

		if (newTheme === 'dark') {
			root.setAttribute('data-theme', 'dark');
		} else if (newTheme === 'light') {
			root.setAttribute('data-theme', 'light');
		} else {
			// Auto: remove attribute, let prefers-color-scheme handle it
			root.removeAttribute('data-theme');
		}
	};

	// Handle theme change
	const handleThemeChange = (newTheme: Theme) => {
		setTheme(newTheme);
		localStorage.setItem('theme', newTheme);
		applyTheme(newTheme);
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-200"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
				<div
					className="bg-white dark:bg-[#252525] rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-in zoom-in-95 duration-200"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
						<h2 className="text-lg font-serif font-bold text-[var(--foreground)]">
							Visual Settings
						</h2>
						<button
							onClick={onClose}
							className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							aria-label="Close settings"
						>
							<X className="h-5 w-5 text-[var(--foreground-muted)]" />
						</button>
					</div>

					{/* Content */}
					<div className="p-6 space-y-6">
						{/* Theme Selection */}
						<div>
							<div className="flex items-center gap-2 mb-3">
								<Palette className="h-4 w-4 text-[var(--foreground-muted)]" />
								<h3 className="text-sm font-semibold text-[var(--foreground)]">
									Theme
								</h3>
							</div>

							<div className="grid grid-cols-3 gap-2">
								<button
									onClick={() => handleThemeChange('light')}
									className={`p-3 rounded-lg border-2 transition-all ${
										theme === 'light'
											? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
											: 'border-[var(--border)] hover:border-[var(--border-hover)]'
									}`}
								>
									<Sun className="h-5 w-5 mx-auto mb-1 text-[var(--foreground)]" />
									<span className="text-xs font-medium text-[var(--foreground)]">
										Light
									</span>
								</button>

								<button
									onClick={() => handleThemeChange('dark')}
									className={`p-3 rounded-lg border-2 transition-all ${
										theme === 'dark'
											? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
											: 'border-[var(--border)] hover:border-[var(--border-hover)]'
									}`}
								>
									<Moon className="h-5 w-5 mx-auto mb-1 text-[var(--foreground)]" />
									<span className="text-xs font-medium text-[var(--foreground)]">
										Dark
									</span>
								</button>

								<button
									onClick={() => handleThemeChange('auto')}
									className={`p-3 rounded-lg border-2 transition-all ${
										theme === 'auto'
											? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
											: 'border-[var(--border)] hover:border-[var(--border-hover)]'
									}`}
								>
									<div className="flex items-center justify-center gap-0.5 h-5 mb-1">
										<Sun className="h-3 w-3 text-[var(--foreground)]" />
										<Moon className="h-3 w-3 text-[var(--foreground)]" />
									</div>
									<span className="text-xs font-medium text-[var(--foreground)]">
										Auto
									</span>
								</button>
							</div>

							{theme === 'auto' && (
								<p className="mt-2 text-xs text-[var(--foreground-muted)]">
									Follows your system preference
								</p>
							)}
						</div>

						{/* Info Note */}
						<div className="p-4 bg-[var(--background-secondary)] rounded-lg">
							<p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
								<strong className="text-[var(--foreground)]">Visual First:</strong>{' '}
								MyMind emphasizes visual recall. Your theme choice affects how you
								remember saved content.
							</p>
						</div>
					</div>

					{/* Footer */}
					<div className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)] rounded-b-2xl">
						<p className="text-[10px] text-[var(--foreground-muted)] text-center">
							More customization options coming soon
						</p>
					</div>
				</div>
			</div>
		</>
	);
}

export default SettingsModal;
