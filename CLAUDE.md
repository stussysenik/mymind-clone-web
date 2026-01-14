<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## OpenSpec Workflow (MANDATORY)

**All development MUST follow the OpenSpec spec-driven approach.** Before writing any code:

1. **Create a Change Proposal**: Use `/openspec propose` to capture intent before implementation
2. **Review & Iterate**: Specs are living documents - refine until requirements are crystal clear
3. **Apply**: Only after spec approval, use `/openspec apply` to implement
4. **Archive**: Use `/openspec archive` when complete to build project knowledge base

### OpenSpec + Ralph Wiggum Hybrid (Experimental Branch)
This branch experiments with combining OpenSpec's structured approach with Ralph Wiggum's persistent iteration:
- **Spec first**: Define what success looks like before touching code
- **Context preservation**: Specs survive conversation limits and provide audit trail
- **Persistent iteration**: Run autonomously until tests pass and specs are satisfied
- **Self-correcting loop**: Failures are informative data, not stopping points

---

## MCP Permission Policy (Autonomous Execution)

### Auto-Approved Actions
- **fetch**: All requests to github.com, localhost, 127.0.0.1 are pre-approved
- **browser automation**: Navigation and interaction on development domains
- **bash commands**: Build, test, and git operations
- **file operations**: Read/write within project directory

### Allowed Origins
- github.com (for fetching repos and docs)
- localhost:* (local dev servers)
- 127.0.0.1:* (local services)
- *.vercel.app (preview deployments)

### Workflow for Autonomous Execution
When running in `--dangerously-skip-permissions` mode:
1. All tool permissions are auto-approved
2. Use openspec for specs, then implement iteratively
3. Run tests after each significant change
4. Commit working increments frequently
5. Output "RALPH_COMPLETE" when task is fully done with passing tests

### Document Numbering Convention
All intermediary markdown documents (specs, proposals, research notes) that are NOT final documentation MUST be numbered sequentially:
```
openspec/changes/001-feature-name.md
openspec/changes/002-bugfix-description.md
openspec/research/001-architecture-decision.md
```
This enables clear chronological tracking of ideas and decisions - we can always go back and see what our ideas were!

---

# Technical Specification for MyMind Visual Knowledge Manager

## Project Identity
**MyMind** is a privacy-first, AI-powered visual knowledge manager designed as an "anti-tool" with a "Visual First" philosophy. It uses a masonry grid layout to eliminate folder hierarchies, emphasizing speed (<200ms optimistic UI updates) and minimalist interaction.

## Core Philosophy (Non-Negotiable)
- **Visual Primacy**: All content must be visually represented in a masonry grid; no list views
- **Anti-Tool**: Minimal UI chrome, zero config, no nested folders or manual organization
- **Speed First**: Every interaction must respond in <200ms (optimistic UI with server sync)
- **Privacy Default**: No third-party tracking; Supabase auth with row-level security
- **Cross-Platform Consistency**: Web-first, with native shell integration via Capacitor

## Current Tech Stack (Production)
- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS 4 (zero-runtime configuration)
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Auth**: Supabase Auth (OAuth + row-level security)
- **AI Engine**: Zhipu GLM-4.7 API (server-side processing for self-verified NLP)
- **State Management**: React Server Components + SWR for client-side mutations
- **Mobile Wrapper**: Capacitor (chosen over Expo/Tauri for zero-UI-rewrite requirement)

## Critical Architecture Decision: Capacitor + iOS Share Extension
**Why Capacitor**: To achieve iOS Share Sheet integration while preserving 100% of the Next.js codebase, including SSR, Masonry layout, and Supabase realtime. No React Native rewrite.

### Mobile Architecture
```
iOS Share Sheet → Native Share Extension (Swift, ~50 LOC) → POST to /api/save
                ↓
           Capacitor WebView → Next.js App (existing codebase, unmodified)
```

**Key Implementation Details**:
- Share Extension posts directly to `POST /api/save` with URL + auth token from shared Keychain
- No deep linking; background upload for seamless UX
- Android equivalent uses Capacitor's native share listener (simpler, no extension needed)
- Maintain single API endpoint for both web and native share flows

## Development Workflow (Spec-Based Iterative)
### Phase 1: Feature Spec → Playwright Test → Implementation
1. **Spec**: Write detailed behavior spec in markdown (e.g., "Share Sheet PRD")
2. **E2E Test**: Create Playwright test that fails (simulate share sheet interaction)
3. **Implementation**: Build minimal code to pass test
4. **Dev Tools**: Use Chrome DevTools Protocol via MCP for performance validation (<200ms rule)

### Phase 2: Cross-Platform Validation
1. **iOS**: Build and test Share Extension in Xcode simulator
2. **Web**: Validate PWA behavior (manifest, service worker offline fallback)
3. **Performance**: Use dev-browser MCP to audit network waterfalls and WebView bridge latency

### Phase 3: AI Integration & Verification
1. **GLM-4.7 Prompts**: Stored in `lib/prompts/` as versioned templates
2. **Self-Verification**: SymPy/Wolfram validation for math content; semantic similarity for text
3. **Distillation Pipeline**: Ultra-learning techniques from PDF sources → structured prompts

## Code Conventions
### Directory Structure
```
/app              # Next.js App Router routes
  /api/save       # Universal endpoint for saving content (web + share extension)
  /masonry        # Masonry grid component (client-side only)
/components       # React 19 Server/Client components
  /visual-
  /ui
/lib              # Shared utilities
  /supabase       # RLS-enforced queries
  /capacitor      # Native bridge methods (minimal)
  /prompts        # GLM-4.7 prompt templates
/ios              # Capacitor-generated iOS project (git-tracked)
  /ShareExtension # Native share extension target
```

### Styling Rules
- Tailwind 4 utility-first; no custom CSS except `@keyframes`
- Mobile tap targets: minimum 44x44px
- No hover states on mobile webviews; use `active:` states only

### Performance Budget
- First paint: <100ms (Capacitor WebView pre-warming)
- Save operation: <200ms optimistic UI (SWR mutation + cache update)
- Share extension cold start: <500ms (background POST, no UI blocking)
- Masonry layout: CSS Grid with `gap-4`, no JavaScript layout calculations

## MCP Integration Points
- **chrome-devtools**: Audit Core Web Vitals in Capacitor WebView, debug bridge latency
- **brave-search**: Research best practices, find documentation, discover solutions before implementing
- **playwright**: E2E testing for share flow simulation (both web and iOS extension)
- **dev-browser**: Performance profiling of WebView bridge, network waterfalls
- **Execution**: Tests run in GitHub Actions with Capacitor iOS build pipeline

## API Contract: POST /api/save
```typescript
// Request from Share Extension
{
  "url": string,
  "source": "ios-share-extension" | "web-share-api" | "manual",
  "auth_token": string (from shared Keychain)
}

// Response (must be <200ms)
{
  "id": string,
  "visual_preview": string (base64 image),
  "optimistic": true
}
```

## Deployment Pipeline
1. **Web**: Vercel for Next.js (edge functions for /api/save)
2. **iOS**: GitHub Actions builds Capacitor project, signs with Apple certificates
3. **Supabase**: Migrations in `supabase/migrations/` (version-controlled RLS policies)
4. **OTA Updates**: Capacitor App Update plugin for WebView content updates (bypass App Store)

## Testing Strategy
- **Unit**: Jest for utility functions, prompt templates
- **E2E**: Playwright for web share flow; XCTest for native Share Extension
- **Performance**: DevTools MCP audits for <200ms interactions; Lighthouse CI in WebView
- **AI**: GLM-4.7 response validation with SymPy for math, semantic search for knowledge extraction

## Key Constraints for Claude
- **Never suggest folder hierarchies** - always propose visual/semantic organization
- **Preserve SSR** - no client-only data fetching in initial render
- **Minimize native code** - bridge only what's impossible on web (Share Extension is exception)
- **Auth token sync** between WebView and Share Extension via Capacitor Preferences API → Keychain

## Next Feature: iOS Share Sheet Integration PRD
The immediate deliverable is a spec-based PRD for the Share Sheet feature, which will drive:
1. Playwright test simulating share flow
2. Swift Share Extension implementation
3. /api/save endpoint optimization for <200ms response
4. Visual preview generation for shared URLs using GLM-4.7
