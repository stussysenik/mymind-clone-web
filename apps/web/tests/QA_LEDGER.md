# 🛡️ Quality Assurance Ledger & Test Documentation

> **Status Dashboard**: Tracks the health, purpose, and versioning of the Playwright test suite for the MyMind Clone.

| Test Suite | Focus Area | Status | Last Run | Notes |
|------------|------------|--------|----------|-------|
| `ai-enrichment.spec.ts` | **AI Pipeline**: Scraper, API `save/enrich`, Tagging, Fallbacks | 🟢 **PASS** | `v1.0.0` | Robust. Handles 404s, missing images, and retries. API-centric. |
| `visual-knowledge.spec.ts` | **UI/UX**: Cards, Black screen fixes, MindNotes, Fallbacks | 🟢 **PASS** | `v1.0.1` | Fixed hydration & selector issues. Verified fallback gradients/screenshots. |
| `search.spec.ts` | **Search**: Querying, Filtering, Result grids | 🟢 **PASS** | `v1.0.0` | 9/9 tests passed. Core search functionality intact. |
| `card-modal.spec.ts` | **Interactions**: Opening, Closing, Edits | 🟢 **PASS** | `v1.0.1` | Fixed timeouts by using global locators and robust hydration waits. |
| `archive-delete.spec.ts` | **Lifecycle**: Archive, Unarchive, Soft Delete (Trash) | 🟡 **PENDING** | `v1.0.0` | **New Suite**: Validates `archived_at` logic. Failed previously due to missing DB column; fixed via migration. |
| `auth-security.spec.ts` | **Security**: Protected routes, Supabase RLS | 🟢 **PASS** | `v1.0.0` | Passed in batch run. Basic auth flow verified. |
| `ux-performance.spec.ts` | **Perf**: LCP, CLS, loading states | 🔴 **FAIL** | `v1.0.0` | **Tag Filter**: Tag click doesn't update URL. Click event might be intercepted. |
| `interactions.spec.ts` | **Actions**: Drag/drop, Multi-select | 🟢 **PASS** | `v1.0.0` | Verified interactions, responsive layout, and loading states. |

## 🐞 Known Issues Ledger

### `archive-delete.spec.ts` Failure Analysis
- **Status**: ✅ **FIXED (Schema)**
- **Root Cause**: `column cards.archived_at does not exist` in Supabase.
- **Fix**: Created migration `20260110_add_archived_at.sql`.
- **Verification**: Run `npx playwright test tests/archive-delete.spec.ts` after migration.

### `ux-performance.spec.ts` Failure Analysis
- **Status**: 🔴 **FAIL**
- **Symptom**: `tag click filters correctly` times out waiting for URL update.
- **Root Cause**: Next.js Router race condition or event bubbling blockage.
- **Action**: Lower priority. Manual filtering works.

## 📝 Test Versioning Log

- **Run #2** (Current): Archive & Editable AI Fields.
    - `archive-delete.spec.ts`: Added to suite.
    - `CardDetailModal`: Updated to allow editing Title and Summary.

---

*Last Updated: 2026-01-10*
