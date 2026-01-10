'use client';

import { X, ExternalLink, Archive, Share2, MoreHorizontal, Loader2, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/lib/types';
import { extractDomain } from '@/lib/platforms';

interface CardDetailModalProps {
        card: Card | null;
        isOpen: boolean;
        onClose: () => void;
        onDelete?: (id: string) => void;
        onRestore?: (id: string) => void;
}

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ... (imports remain)

export function CardDetailModal({ card, isOpen, onClose, onDelete, onRestore }: CardDetailModalProps) {
        const router = useRouter();
        const [tags, setTags] = useState<string[]>([]);
        const [isAddingTag, setIsAddingTag] = useState(false);
        const [newTagVal, setNewTagVal] = useState('');
        const [note, setNote] = useState('');
        const [isSavingNote, setIsSavingNote] = useState(false);

        useEffect(() => {
                if (card) {
                        setTags(card.tags || []);
                        setNote(card.metadata.note || '');
                }
        }, [card]);

        const handleSaveNote = async () => {
                if (!card) return;
                setIsSavingNote(true);
                // We store 'note' in metadata.note
                // We need to fetch current card to merge metadata? Or just patch?
                // The API PATCH probably does a shallow merge if we pass { metadata: { ... } }?
                // Let's assume we need to pass the full metadata or backend handles partial update.
                // Supabase update is partial on row, but JSONB metadata is tricky.
                // We should pass the updated metadata object.
                const updatedMeta = { ...card.metadata, note };

                await fetch(`/api/cards/${card.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ metadata: updatedMeta })
                });
                setIsSavingNote(false);
                router.refresh();
        };

        const handleAddTag = async () => {
                if (!newTagVal.trim() || !card) return;
                const normalized = newTagVal.trim().toLowerCase().replace(/\s+/g, '-');
                if (tags.includes(normalized)) {
                        setNewTagVal('');
                        setIsAddingTag(false);
                        return;
                }

                const updated = [...tags, normalized];
                setTags(updated);
                setNewTagVal('');
                setIsAddingTag(false);

                await fetch(`/api/cards/${card.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ tags: updated })
                });
                router.refresh();
        };

        const handleRemoveTag = async (tagToRemove: string) => {
                if (!card) return;
                const updated = tags.filter(t => t !== tagToRemove);
                setTags(updated);

                await fetch(`/api/cards/${card.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ tags: updated })
                });
                router.refresh();
        };

        // Polling for AI completion
        useEffect(() => {
                if (!isOpen || !card?.metadata?.processing) return;

                const interval = setInterval(() => {
                        router.refresh();
                }, 3000);

                return () => clearInterval(interval);
        }, [isOpen, card?.metadata?.processing, router]);

        if (!isOpen || !card) return null;

        const domain = extractDomain(card.url);

        return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />

                        <div className="relative w-full max-w-7xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">

                                {/* Close Button (Absolute) */}
                                <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 z-[110] p-2 bg-black/10 hover:bg-black/20 md:bg-gray-100 md:hover:bg-gray-200 rounded-full text-white md:text-gray-500 transition-colors"
                                >
                                        <X className="w-5 h-5" />
                                </button>

                                {/* LEFT: Visual Content */}
                                <div className="w-full md:w-2/3 bg-[#0a0a0a] flex items-center justify-center relative group">
                                        {card.imageUrl ? (
                                                <div className="relative w-full h-full">
                                                        <Image
                                                                src={card.imageUrl}
                                                                alt={card.title || 'Card content'}
                                                                fill
                                                                className="object-contain"
                                                                sizes="(max-width: 768px) 100vw, 70vw"
                                                                priority
                                                        />
                                                </div>
                                        ) : (
                                                <div className="p-12 text-center max-w-2xl">
                                                        <h2 className="text-3xl font-serif text-white mb-6 leading-tight">{card.title}</h2>
                                                        <p className="text-xl text-gray-400 leading-relaxed whitespace-pre-wrap font-serif">
                                                                {card.content || 'No content provided'}
                                                        </p>
                                                </div>
                                        )}
                                </div>

                                {/* RIGHT: Metadata & Notes */}
                                <div className="w-full md:w-1/3 bg-white flex flex-col border-l border-gray-100">
                                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                                                {/* Header Info */}
                                                <div className="mb-8">
                                                        <h1 className="text-2xl font-serif font-medium text-gray-900 mb-2 leading-snug">
                                                                {card.title || 'Untitled'}
                                                        </h1>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                                                {new Date(card.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                {domain && (
                                                                        <>
                                                                                <span>•</span>
                                                                                <a
                                                                                        href={card.url || '#'}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors"
                                                                                >
                                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                                        {domain}
                                                                                </a>
                                                                        </>
                                                                )}
                                                        </div>
                                                </div>

                                                {/* Note/Description */}
                                                {card.imageUrl && card.content && (
                                                        <div className="mb-8 text-gray-600 leading-relaxed text-sm font-serif">
                                                                {card.content}
                                                        </div>
                                                )}

                                                {/* Processing Banner */}
                                                {card.metadata.processing && (
                                                        <div className="mb-8 group">
                                                                <div className="mb-3 px-4 py-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 font-mono text-xs">
                                                                        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                                                                <span className="flex items-center gap-2 text-[var(--accent-primary)] font-bold tracking-tight">
                                                                                        <div className="relative">
                                                                                                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-ping absolute inset-0 opacity-75"></div>
                                                                                                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full relative"></div>
                                                                                        </div>
                                                                                        AI PROCESSING ACTIVE
                                                                                </span>
                                                                                <span className="text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded text-[10px]">
                                                                                        ETA: ~15s
                                                                                </span>
                                                                        </div>

                                                                        <ProcessingLog createdAt={card.createdAt} />
                                                                </div>
                                                        </div>
                                                )}

                                                {/* AI Summary Section */}
                                                {card.metadata.summary && (
                                                        <div className="mb-8 p-5 bg-gray-50/50 rounded-xl border border-gray-100">
                                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                                                                        AI Summary
                                                                </h4>
                                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                                        {card.metadata.summary}
                                                                </p>
                                                        </div>
                                                )}

                                                {/* Tags Section */}
                                                <div className="mb-8">
                                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                Mind Tags / Spaces
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                                {isAddingTag ? (
                                                                        <div className="flex items-center gap-2">
                                                                                <input
                                                                                        autoFocus
                                                                                        type="text"
                                                                                        className="w-32 px-3 py-1.5 rounded-full bg-gray-50 border border-[var(--accent-primary)] text-xs text-gray-900 focus:outline-none"
                                                                                        placeholder="tag-name"
                                                                                        value={newTagVal}
                                                                                        onChange={(e) => setNewTagVal(e.target.value)}
                                                                                        onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') handleAddTag();
                                                                                                if (e.key === 'Escape') setIsAddingTag(false);
                                                                                        }}
                                                                                        onBlur={() => {
                                                                                                if (newTagVal) handleAddTag();
                                                                                                else setIsAddingTag(false);
                                                                                        }}
                                                                                />
                                                                        </div>
                                                                ) : (
                                                                        <button
                                                                                onClick={() => setIsAddingTag(true)}
                                                                                className="px-4 py-1.5 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm shadow-orange-200 flex items-center gap-1"
                                                                        >
                                                                                + Add Tag / Create Space
                                                                        </button>
                                                                )}

                                                                {tags.map(tag => (
                                                                        <span
                                                                                key={tag}
                                                                                onClick={() => {
                                                                                        const params = new URLSearchParams();
                                                                                        params.set('q', tag);
                                                                                        router.push('/?' + params.toString());
                                                                                        onClose();
                                                                                }}
                                                                                className="group relative px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200 hover:bg-gray-100 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                                                                        >
                                                                                {tag}
                                                                                <button
                                                                                        onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleRemoveTag(tag);
                                                                                        }}
                                                                                        className="ml-1.5 text-gray-400 hover:text-red-500 hidden group-hover:inline-block transition-colors"
                                                                                >
                                                                                        <X className="w-3 h-3" />
                                                                                </button>
                                                                        </span>
                                                                ))}
                                                        </div>
                                                </div>

                                                {/* Notes Input */}
                                                <div>
                                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                Mind Notes
                                                        </h4>
                                                        <textarea
                                                                className="w-full h-32 p-4 bg-transparent rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/10 focus:border-[var(--accent-primary)] transition-all placeholder:text-gray-300"
                                                                placeholder="Type here to add a note..."
                                                                value={note}
                                                                onChange={(e) => setNote(e.target.value)}
                                                                onBlur={handleSaveNote}
                                                        />
                                                        {isSavingNote && (
                                                                <span className="text-[10px] text-[var(--accent-primary)] font-medium mt-1 inline-block animate-pulse">
                                                                        Saving...
                                                                </span>
                                                        )}
                                                </div>
                                        </div>

                                        {/* Bottom Actions Bar */}
                                        <div className="p-6 border-t border-gray-100 flex items-center justify-center gap-4 bg-white">
                                                <button className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-900 border border-gray-100 hover:border-gray-300">
                                                        <div className="w-4 h-4 rounded-full border-2 border-current" />
                                                </button>
                                                <button className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-900 border border-gray-100 hover:border-gray-300">
                                                        <Share2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete?.(card.id);
                                                        }}
                                                        className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-red-500 border border-gray-100 hover:border-red-200"
                                                        title="Archive / Delete"
                                                >
                                                        <Archive className="w-5 h-5" />
                                                </button>
                                                {onRestore && (
                                                        <button
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onRestore(card.id);
                                                                }}
                                                                className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-green-500 border border-gray-100 hover:border-green-200"
                                                                title="Restore"
                                                        >
                                                                <RotateCcw className="w-5 h-5" />
                                                        </button>
                                                )}
                                        </div>
                                </div>
                        </div>
                </div>

        );
}

function ProcessingLog({ createdAt }: { createdAt: string }) {
        const [elapsed, setElapsed] = useState(0);

        useEffect(() => {
                const start = new Date(createdAt).getTime();
                const interval = setInterval(() => {
                        setElapsed(Date.now() - start);
                }, 100);
                return () => clearInterval(interval);
        }, [createdAt]);

        const format = (ms: number) => {
                const s = Math.floor(ms / 1000);
                const sms = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
                return `00:${s.toString().padStart(2, '0')}.${sms}`;
        };

        return (
                <div className="space-y-2 text-gray-500">
                        {/* Static Start */}
                        <div className="flex gap-3 items-start opacity-60">
                                <span className="text-gray-300 whitespace-nowrap">{format(120)}</span>
                                <span>Buffer received</span>
                        </div>

                        {/* Dynamic Steps */}
                        <div className={`flex gap-3 items-start transition-opacity duration-300 ${elapsed > 500 ? 'opacity-80' : 'opacity-30'}`}>
                                <span className="text-gray-300 whitespace-nowrap">{format(elapsed > 500 ? 450 : 0)}</span>
                                <span><span className="text-purple-500 font-bold">GLM-4V</span> initialized</span>
                        </div>

                        {elapsed > 1500 && (
                                <div className="flex gap-3 items-start text-gray-700 animate-in fade-in slide-in-from-left-2">
                                        <span className="text-gray-300 whitespace-nowrap">{format(elapsed)}</span>
                                        <span className="flex items-center gap-2">
                                                Analyzing vectors
                                                <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-primary)]" />
                                        </span>
                                </div>
                        )}

                        {elapsed > 4000 && (
                                <div className="flex gap-3 items-start text-gray-400 pl-[4.5rem] text-[10px] animate-in fade-in">
                                        <span>&gt; Extracting semantic tags...</span>
                                </div>
                        )}

                        {elapsed > 8000 && (
                                <div className="flex gap-3 items-start text-gray-400 pl-[4.5rem] text-[10px] animate-in fade-in">
                                        <span>&gt; Generating synthesis...</span>
                                </div>
                        )}

                        {elapsed > 12000 && (
                                <div className="flex gap-3 items-start text-orange-400 pl-[4.5rem] text-[10px] animate-in fade-in">
                                        <span>&gt; Finalizing...</span>
                                </div>
                        )}
                </div>
        );
}
