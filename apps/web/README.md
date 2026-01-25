# MyMind Clone - Web Client

The frontend application for the MyMind clone, built with Next.js 14 and Supabase.

## 🛠 Setup

### 1. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp ../../.env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (for API routes)
- `ZHIPU_API_KEY`: API Key for Zhipu AI (GLM-4)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Access at [http://localhost:3000](http://localhost:3000)

## 🏗 Scripts

- `npm run dev`: Start dev server with Turbo
- `npm run build`: Production build
- `npm run start`: Start production server
- `npx playwright test`: Run End-to-End tests

## 📂 Structure

- `/app`: App Router pages (`api`, `spaces`, `serendipity`)
- `/components`: React components (`Card`, `Header`, `AddModal`)
- `/lib`: Utilities (`supabase`, `ai`, `platforms`)
- `/hooks`: Custom hooks (`useDebounce`)

## ✨ Key Features
- **Optimistic UI**: Instant interactions for Save/Delete
- **Server Components**: Heavy lifting (DB fetch) done on server
- **Tailwind v4**: Styling engine
- **Serendipity Mode**: Focused discovery with single-card focus view, keyboard navigation (←/→, j/k), swipe gestures, and shuffle functionality
