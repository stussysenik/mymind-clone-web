# MyMind Clone

> **A privacy-first, AI-powered visual knowledge manager.**
> Save anything with one click. Find it naturally. No folders, no manual tags—just pure, visual memory.

![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black)
![Tailwind 4](https://img.shields.io/badge/Tailwind-4-cyan)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-emerald)
![AI](https://img.shields.io/badge/AI-GLM--4-purple)

---

## 🧭 Project Status: The Status Quo

As of **January 2026**, the project has evolved from a static MVP to a **production-ready visual knowledge base**.

### ✅ Implemented (What Works)
- **Core Architecture**: Next.js App Router with Server Components for optimal performance.
- **Authentication**: Full Supabase Auth integration (Email/Password, Magic Link) with protected routes.
- **Visual Memory**: Masonry grid layout with type-aware cards (Notes, Images, Links).
- **Smart Saving**: 
    - **Optimistic UI**: Instant save feedback (<200ms).
    - **Async AI Pipeline**: Background classification using Zhipu GLM-4.
    - **Drag & Drop Upload**: Support for image uploads via base64.
- **Search & Retrieval**: Full-text search filtered by user content.
- **Testing**: End-to-end coverage with Playwright (9/9 specs passing).

### 🚧 In Progress (The Future)
- **Smart Spaces**: UI tabs exist, but logic for "smart folders" based on queries is pending.
- **List View**: Toggle between Grid and List views for density preference.
- **Supabase Storage**: Migrating from base64 image strings to scalable Object Storage.
- **Browser Extension**: A chrome extension to save from any tab effectively.

---

## 📜 History: The Past

### Phase 1: MVP & Design (Completed)
- Established the "Visual Memory" aesthetic (Masonry, clean typography).
- Built high-performance Server Components for the grid.
- Implemented "Demo Mode" for friction-free testing without backend keys.

### Phase 2: Intelligence & Persistence (Completed - Current)
- Integrated **Zhipu GLM-4** for cost-effective, high-accuracy content classification.
- Migrated from local storage -> **Supabase PostgreSQL**.
- Implemented **Supabase SSR** for secure, server-side session management.
- Solved the "slow save" problem with an **Optimistic Save → Background Enrich** pattern.

---

## 🛠 Tech Stack & Architecture

| Component | Technology | Reasoning |
|-----------|------------|-----------|
| **Framework** | Next.js 16 (App Router) | Server Components for speed, SEO, and developer experience. |
| **Styling** | Tailwind CSS 4 | Zero-runtime CSS, modern design tokens. |
| **Database** | Supabase (PostgreSQL) | Relational integrity, built-in Auth, Row Level Security. |
| **AI Engine** | Zhipu GLM-4 | High performance/cost ratio for classification logic. |
| **Testing** | Playwright | Reliable E2E testing for critical user flows. |
| **Icons** | Lucide React | Consistent, lightweight SVG icons. |

### The Save Pipeline
1. **User Action**: Pastes URL or Uploads Image.
2. **Optimistic Save**: API returns `200 OK` immediately with a temporary "processing" state.
3. **Background Job**:
    - Fetches URL metadata (OG tags).
    - Sends content to GLM-4 AI.
    - Updates DB with `tags`, `summary`, and normalized `type`.
4. **Real-time Update**: UI reflects the enriched card (on refresh/polling).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase Project (Free Tier works)
- Zhipu AI Key

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/mymind-clone.git
   cd mymind-clone/apps/web
   npm install
   ```

2. **Environment Config**
   Copy `.env.example` to `.env.local` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ZHIPU_API_KEY=your_glm_key
   ZHIPU_API_BASE=https://api.z.ai/api/coding/paas/v4
   ```

3. **Database Setup**
   Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor.

4. **Run**
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

We use **Playwright** for End-to-End testing.

```bash
# Run all tests
npx playwright test

# Run UI mode
npx playwright test --ui
```

---

## 📚 Maintenance Guide

- **Adding new Card Types**: Update `normalizeType` in `lib/ai.ts` and `Card.tsx` rendering logic.
- **AI Tweak**: Adjust prompts in `classifyContent` (`lib/ai.ts`) to refine tagging behavior.
- **Deploy**: 
    - Push to GitHub.
    - Connect to Vercel.
    - Add Environment Variables.
    - Redeploy.

---

**Built with 💜 by Senik & Antigravity**
