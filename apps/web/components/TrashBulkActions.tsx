'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';

interface TrashBulkActionsProps {
        itemCount: number;
}

export function TrashBulkActions({ itemCount }: TrashBulkActionsProps) {
        const router = useRouter();
        const [isEmptying, setIsEmptying] = useState(false);
        const [isRestoring, setIsRestoring] = useState(false);
        const [showConfirm, setShowConfirm] = useState<'empty' | null>(null);

        const handleEmptyTrash = async () => {
                setIsEmptying(true);
                try {
                        const res = await fetch('/api/cards/bulk', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'empty-trash' }),
                        });
                        if (res.ok) {
                                router.refresh();
                        }
                } catch (err) {
                        console.error('Failed to empty trash:', err);
                } finally {
                        setIsEmptying(false);
                        setShowConfirm(null);
                }
        };

        const handleRestoreAll = async () => {
                setIsRestoring(true);
                try {
                        const res = await fetch('/api/cards/bulk', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'restore-all' }),
                        });
                        if (res.ok) {
                                router.refresh();
                        }
                } catch (err) {
                        console.error('Failed to restore all:', err);
                } finally {
                        setIsRestoring(false);
                }
        };

        return (
                <div className="flex flex-wrap items-center gap-3">
                        {/* Restore All Button */}
                        <button
                                onClick={handleRestoreAll}
                                disabled={isRestoring || isEmptying}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
                        >
                                {isRestoring ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                        <RotateCcw className="w-4 h-4" />
                                )}
                                Restore All ({itemCount})
                        </button>

                        {/* Empty Trash Button with Confirmation */}
                        {showConfirm === 'empty' ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        <span className="text-sm text-red-700">Delete forever?</span>
                                        <button
                                                onClick={handleEmptyTrash}
                                                disabled={isEmptying}
                                                className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                                        >
                                                {isEmptying ? 'Deleting...' : 'Yes'}
                                        </button>
                                        <button
                                                onClick={() => setShowConfirm(null)}
                                                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                        >
                                                Cancel
                                        </button>
                                </div>
                        ) : (
                                <button
                                        onClick={() => setShowConfirm('empty')}
                                        disabled={isRestoring || isEmptying}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50"
                                >
                                        <Trash2 className="w-4 h-4" />
                                        Empty Trash
                                </button>
                        )}
                </div>
        );
}
