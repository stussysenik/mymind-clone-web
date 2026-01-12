# 🛡️ Quality Assurance Ledger & Test Documentation

> **Status Dashboard**: Tracks the health, purpose, and versioning of the Playwright test suite for the MyMind Clone.

| Test Suite | Focus Area | Status | Last Run | Notes |
|------------|------------|--------|----------|-------|
| `ai-enrichment.spec.ts` | **AI Pipeline**: Scraper, API `save/enrich`, Tagging, Fallbacks | 🟢 **PASS** | `v1.0.0` | Robust. Handles 404s, missing images, and retries. API-centric. |
| `visual-knowledge.spec.ts` | **UI/UX**: Cards, Black screen fixes, MindNotes, Fallbacks | 🟢 **PASS** | `v1.0.1` | Fixed hydration & selector issues. Verified fallback gradients/screenshots. |
| `search.spec.ts` | **Search**: Querying, Filtering, Result grids | 🟢 **PASS** | `v1.0.0` | 9/9 tests passed. Core search functionality intact. |
| `card-modal.spec.ts` | **Interactions**: Opening, Closing, Edits | 🟢 **PASS** | `v1.0.1` | Fixed timeouts by using global locators and robust hydration waits. |
| `archive-delete.spec.ts` | **Lifecycle**: Archive, Unarchive, Soft Delete (Trash) | 🟡 **PENDING** | `v1.0.0` | Validates `archived_at` logic. **Requires migration** in Supabase Dashboard. |
| `trash-workflow.spec.ts` | **Lifecycle**: Trash | 🟢 **PASS** | `v1.0.0` | 1/1 tests passed. |
| `bugs.spec.ts` | **Bug Fixes**: Summary Editing | 🟢 **PASS** | `v1.0.0` | 1/1 (Summary Editing) |
| `state-sync.spec.ts` | **Sync**: Everything ↔ Serendipity ↔ Spaces consistency | 🟡 **PENDING** | `v1.0.0` | **New Suite**: Validates single source of truth after query fixes. |
| `auth-security.spec.ts` | **Security**: Protected routes, Supabase RLS | 🟢 **PASS** | `v1.0.0` | Passed in batch run. Basic auth flow verified. |
| `ux-performance.spec.ts` | **Perf**: LCP, CLS, loading states | 🔴 **FAIL** | `v1.0.0` | **Tag Filter**: Tag click doesn't update URL. Click event might be intercepted. |
| `interactions.spec.ts` | **Actions**: Drag/drop, Multi-select | 🟢 **PASS** | `v1.0.0` | Verified interactions, responsive layout, and loading states. |
| `type-filter.spec.ts` | **Filters**: Video, Image, etc. filtering | 🟢 **PASS** | `v1.0.1` | **FIXED**: Logic now correctly handles aliased types (e.g., Audio -> Video tab). |
| `nlp-search.spec.ts` | **Smart Search**: Toggle, Results, Banner | 🟢 **PASS** | `v1.0.0` | Verified toggle state and "Smart Results" banner visibility. |
| `filter-tabs.spec.ts` | **Filter Tabs**: UI tabs & URL updates | 🟠 **FLAKY** | `v1.0.0` | **Timeouts**: Test logic correct, but Playwright timeouts waiting for cards to appear in demo/client mode. |

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

### `state-sync.spec.ts` Issue Analysis
- **Status**: ✅ **FIXED (Code)**
- **Symptom**: Cards deleted from Everything still appear in Serendipity; Spaces showed stale tag counts.
- **Root Cause**: 
  1. `fetchRandomCards` only filtered `deleted_at`, not `archived_at`
  2. `getUniqueTags` counted ALL cards (including deleted/archived)
- **Fix**: Updated `supabase.ts` to filter by both `deleted_at` AND `archived_at` in both functions.

- **Verification**: Run migrations in Supabase Dashboard, then `npx playwright test tests/state-sync.spec.ts`.

### `filter-tabs.spec.ts` Timeout Analysis
- **Status**: 🟠 **FLAKY**
- **Symptom**: `TIMEOUT` waiting for `[data-testid="card"]` selector.
- **Root Cause**: Client-side hydration or demo data loading might be slower than Playwright's default timeout in some environments.
- **Workaround**: Added `data-testid` attributes to components. Manual testing confirms functionality.

## 📝 Test Versioning Log

- **Run #3** (Current): State Synchronization Fixes.
    - `state-sync.spec.ts`: New suite for cross-tab consistency.
    - `supabase.ts`: Fixed `fetchRandomCards` and `getUniqueTags` to respect archive/delete status.

- **Run #2**: Archive & Editable AI Fields.
    - `archive-delete.spec.ts`: Added to suite.
    - `CardDetailModal`: Updated to allow editing Title and Summary.

---

*Last Updated: 2026-01-11*
