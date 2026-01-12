'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateSpace() {
        const [isOpen, setIsOpen] = useState(false);
        const [name, setName] = useState('');
        const [loading, setLoading] = useState(false);
        const router = useRouter();

        const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                if (!name.trim()) return;

                setLoading(true);
                try {
                        // Create a welcome note with the new tag effectively creating the space
                        await fetch('/api/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        type: 'note',
                                        title: `Welcome to ${name} Space`,
                                        content: `This is the beginning of your new space. Add more items with tag #${name} to populate it.`,
                                        tags: [name]
                                })
                        });

                        setIsOpen(false);
                        setName('');
                        router.refresh();
                } catch (err) {
                        console.error('Failed to create space:', err);
                } finally {
                        setLoading(false);
                }
        };

        if (!isOpen) {
                return (
                        <button
                                onClick={() => setIsOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
                        >
                                <Plus className="w-4 h-4" />
                                <span>Create Space</span>
                        </button>
                );
        }

        return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
                                <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-[var(--foreground)]">Create New Space</h3>
                                        <button
                                                onClick={() => setIsOpen(false)}
                                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                                <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                                                        Space Name (Tag)
                                                </label>
                                                <input
                                                        autoFocus
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        placeholder="e.g. Design, Recipes, Work"
                                                        className="w-full border border-[var(--border)] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
                                                />
                                        </div>

                                        <button
                                                type="submit"
                                                disabled={loading || !name.trim()}
                                                className="w-full bg-[var(--accent-primary)] text-white p-2 rounded-lg flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] transition-colors"
                                        >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Space'}
                                        </button>
                                </form>
                        </div>
                </div>
        );
}
