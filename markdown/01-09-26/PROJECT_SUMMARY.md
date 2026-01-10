# MyMind Clone - Project Summary

> AI-powered visual knowledge manager inspired by mymind.com

---

## 🏗️ Project Structure

```
apps/web/
├── app/
│   ├── globals.css          # Light theme, design tokens
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Main grid page
│   └── api/
│       ├── save/route.ts    # POST endpoint
│       └── search/route.ts  # GET endpoint
├── components/
│   ├── AddButton.tsx        # Floating + button
│   ├── AddModal.tsx         # Save modal
│   ├── Card.tsx             # Smart card router
│   ├── CardGrid.tsx         # Server Component grid
│   ├── Header.tsx           # Navigation tabs
│   ├── SearchBar.tsx        # Serif italic search
│   ├── TagScroller.tsx      # Horizontal filter pills
│   └── cards/
│       ├── TwitterCard.tsx  # X/Twitter styling
│       ├── InstagramCard.tsx
│       ├── YouTubeCard.tsx
│       ├── RedditCard.tsx
│       └── MovieCard.tsx    # IMDB/Letterboxd
├── lib/
│   ├── ai.ts                # AI classification
│   ├── demo-data.ts         # 17 sample cards
│   ├── platforms.ts         # Platform detection
│   ├── supabase.ts          # Database client
│   └── types.ts             # TypeScript types
└── hooks/
    └── useDebounce.ts       # Debounce hook
```

---

## ✅ Features Built

### UI/UX
- **Light theme** - Warm off-white (#F7F6F3)
- **Serif typography** - Libre Baskerville for search
- **Navigation tabs** - Everything | Spaces | Serendipity
- **Tag scroller** - Horizontal filter pills with icons
- **Masonry grid** - Pinterest-style responsive layout

### Platform-Specific Cards
| Platform | Features |
|----------|----------|
| **Twitter/X** | X logo, tweet text, author handle |
| **Instagram** | Gradient border, play button for reels |
| **YouTube** | Red accent, play button, duration |
| **Reddit** | Orange border, subreddit, upvotes |
| **IMDB** | Yellow accent, rating, movie poster |
| **Letterboxd** | Green accent, rating, director |

### Save Functionality
- Floating **+** button
- Modal with Link/Note/Image tabs
- Auto-detects platform from URL
- API endpoint at `/api/save`

### Demo Mode
- 17 sample cards (Twitter, Instagram, YouTube, Reddit, films, articles, products, notes)
- Works without any API keys

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (optional) |
| AI | OpenAI (optional fallback) |
| Fonts | Inter + Libre Baskerville |

---

## ▶️ Running the App

```bash
cd /home/senik/Desktop/mymind-clone/apps/web
npm run dev
# Open http://localhost:3000
```

---

## 📸 Screenshots

![Platform cards](/home/senik/.gemini/antigravity/brain/dab1844b-21c4-4273-896f-977f27f48d59/platform_cards_grid.png)

![Add modal](/home/senik/.gemini/antigravity/brain/dab1844b-21c4-4273-896f-977f27f48d59/add_modal.png)
