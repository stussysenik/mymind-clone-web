/**
 * MyMind Clone - Add Button Component
 * 
 * Floating action button for adding new items.
 * Opens AddModal on click.
 * 
 * @fileoverview FAB for adding new cards
 */

'use client';

import { useState } from 'react';
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

        return (
                <>
                        {/* Floating Action Button */}
                        <button
                                onClick={() => setIsModalOpen(true)}
                                data-testid="add-button"
                                className="
          fixed bottom-6 right-6 z-50
          flex h-14 w-14 items-center justify-center
          rounded-full bg-[var(--accent-primary)] text-white
          shadow-lg shadow-purple-500/30
          transition-all duration-200
          hover:scale-110 hover:shadow-xl hover:shadow-purple-500/40
          active:scale-95
        "
                                aria-label="Add new item"
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
