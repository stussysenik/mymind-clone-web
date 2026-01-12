/**
 * MyMind Clone - Space Card Component
 * 
 * Displays a single space card with hover hide/delete functionality.
 * Hide = non-destructive (cards keep their tags)
 * Delete = destructive (deletes all cards in space)
 * 
 * @fileoverview Client component for space cards with hide/delete
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Hash, X, Trash2, EyeOff } from 'lucide-react';

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
                        className="group relative aspect-square bg-white rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md transition-all p-6 flex flex-col justify-between"
                >
                        {/* Action Buttons (appear on hover) */}
                        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                                {/* Hide Button */}
                                {onHide && (
                                        <button
                                                onClick={handleHide}
                                                className={`p-1.5 rounded-full transition-all ${showConfirm
                                                        ? 'bg-amber-500 text-white opacity-100'
                                                        : 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-amber-100 hover:text-amber-500'
                                                        }`}
                                                title={showConfirm ? 'Click again to confirm' : 'Hide this space'}
                                        >
                                                <EyeOff className="w-4 h-4" />
                                        </button>
                                )}

                                {/* Delete Button */}
                                {onDelete && (
                                        <button
                                                onClick={handleDelete}
                                                className="p-1.5 rounded-full bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 transition-all"
                                                title="Delete space and all its posts"
                                        >
                                                <Trash2 className="w-4 h-4" />
                                        </button>
                                )}
                        </div>

                        {/* Hide Confirmation overlay */}
                        {showConfirm && (
                                <div
                                        className="absolute inset-0 bg-amber-50/95 rounded-xl flex flex-col items-center justify-center z-5 backdrop-blur-sm"
                                        onClick={handleCancelConfirm}
                                >
                                        <p className="text-sm font-medium text-amber-700 mb-3 text-center px-4">
                                                Hide &quot;{tag}&quot; space?
                                        </p>
                                        <div className="flex gap-2">
                                                <button
                                                        onClick={handleHide}
                                                        className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                                >
                                                        Hide
                                                </button>
                                                <button
                                                        onClick={handleCancelConfirm}
                                                        className="px-3 py-1.5 text-xs font-medium bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
                                                >
                                                        Cancel
                                                </button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2 text-center px-4">
                                                Cards keep their tags
                                        </p>
                                </div>
                        )}

                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Hash className="w-6 h-6 text-[var(--accent-primary)]" />
                        </div>

                        <div>
                                <h3 className="text-lg font-medium text-[var(--foreground)] capitalize group-hover:text-[var(--accent-primary)] transition-colors">
                                        {tag}
                                </h3>
                                <p className="text-sm text-[var(--foreground-muted)]">
                                        {count} {count === 1 ? 'item' : 'items'}
                                </p>
                        </div>
                </Link>
        );
}

export default SpaceCard;

