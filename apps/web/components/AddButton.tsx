/**
 * MyMind Clone - Add Button Component
 * 
 * Floating action button for adding new items.
 * Opens AddModal on click.
 * 
 * @fileoverview FAB for adding new cards
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AddModal } from '@/components/AddModal';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Floating action button that opens the add modal.
 */
export function AddButton() {
        const [isModalOpen, setIsModalOpen] = useState(false);

        // Global keyboard shortcut (Cmd+A or Cmd+I)
        useEffect(() => {
                const handleKeyDown = (e: KeyboardEvent) => {
                        // Check for Cmd/Ctrl + A or Cmd/Ctrl + I
                        if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'i')) {
                                e.preventDefault();
                                setIsModalOpen(true);
                        }
                };

                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
        }, []);

        return (
                <>
                        {/* Floating Action Button */}
                        <button
                                onClick={() => setIsModalOpen(true)}
                                data-testid="add-button"
                                className="
          fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 z-50
          flex h-14 w-14 items-center justify-center
          rounded-full bg-[var(--accent-primary)] text-white
          shadow-[var(--shadow-lg)]
          transition-all duration-200
          hover:scale-110 hover:shadow-[var(--shadow-xl)]
          active:scale-95
        "
                                aria-label="Add new item"
                                title="Add Item (Cmd+A)"
                        >
                                <Plus className="h-6 w-6" strokeWidth={2.5} />
                        </button>

                        {/* Add Modal */}
                        <AddModal
                                isOpen={isModalOpen}
                                onClose={() => setIsModalOpen(false)}
                        />
                </>
        );
}

export default AddButton;
