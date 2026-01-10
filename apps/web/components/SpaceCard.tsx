/**
 * MyMind Clone - Space Card Component
 * 
 * Displays a single space card with hover delete functionality.
 * Uses localStorage to persist hidden spaces (non-destructive deletion).
 * 
 * @fileoverview Client component for space cards with delete
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Hash, X } from 'lucide-react';

interface SpaceCardProps {
        tag: string;
        count: number;
        onDelete: (tag: string) => void;
}

export function SpaceCard({ tag, count, onDelete }: SpaceCardProps) {
        const [showConfirm, setShowConfirm] = useState(false);

        const handleDelete = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                if (showConfirm) {
                        onDelete(tag);
                        setShowConfirm(false);
                } else {
                        setShowConfirm(true);
                }
        };

        const handleCancelDelete = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                setShowConfirm(false);
        };

        return (
                <Link
                        href={`/?q=%23${encodeURIComponent(tag)}`}
                        className="group relative aspect-square bg-white rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md transition-all p-6 flex flex-col justify-between"
                >
                        {/* Delete Button (appears on hover) */}
                        <button
                                onClick={handleDelete}
                                className={`absolute top-3 right-3 p-1.5 rounded-full transition-all z-10 ${showConfirm
                                        ? 'bg-red-500 text-white opacity-100'
                                        : 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500'
                                        }`}
                                title={showConfirm ? 'Click again to confirm' : 'Hide this space'}
                        >
                                <X className="w-4 h-4" />
                        </button>

                        {/* Confirmation overlay */}
                        {showConfirm && (
                                <div
                                        className="absolute inset-0 bg-red-50/90 rounded-xl flex flex-col items-center justify-center z-5 backdrop-blur-sm"
                                        onClick={handleCancelDelete}
                                >
                                        <p className="text-sm font-medium text-red-600 mb-3 text-center px-4">
                                                Hide "{tag}" space?
                                        </p>
                                        <div className="flex gap-2">
                                                <button
                                                        onClick={handleDelete}
                                                        className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                >
                                                        Hide
                                                </button>
                                                <button
                                                        onClick={handleCancelDelete}
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
