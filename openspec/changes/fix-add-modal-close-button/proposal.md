# Change: Fix Add Modal close button visibility and responsiveness

## Why
The close (X) button on the Add Modal is nearly invisible — it uses `absolute -top-3 -right-3` positioning which places it partially outside the modal's `overflow-hidden` container, clipping it. The button also uses `text-gray-400` on a white background with a thin border, making it hard to see against the blurred backdrop. On smaller screens it can be completely hidden.

## What Changes
- Move close button inside the modal bounds (no negative offsets) so `overflow-hidden` doesn't clip it
- Increase button contrast: darker icon color, more visible background/border
- Ensure minimum 44x44px tap target for mobile
- Make the modal properly responsive on small screens (remove `inset-x-4` hard offset, use proper padding)

## Impact
- Affected code: `apps/web/components/AddModal.tsx` (lines 291-305, close button; line 279-286, modal container)
- No API changes, no new dependencies
