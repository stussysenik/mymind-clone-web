# NLP Deep Search — Feature Specification

## Overview
Enhance search to understand natural language queries like "design grid" or "atmospheric photography" by leveraging Pinecone's semantic vector search alongside keyword matching.

---

## The Problem

**Current search:** Keyword matching on title, content, and tags
```
Query: "design grid"
→ Only finds cards with literal "design" or "grid" in text
→ Misses: "responsive layout", "12-column system", "figma mockup"
```

**NLP search:** Semantic understanding
```
Query: "design grid"
→ Finds: cards about layout systems, UI frameworks, responsive design
→ Works because embeddings understand conceptual similarity
```

---

## User Flow

```
1. User types query in search bar
2. Toggle switch: "Exact" ⟷ "Smart" (default: Exact)
3. If "Smart" mode:
   a. Query sent to /api/search (NLP)
   b. Pinecone returns semantically similar cards
   c. Results ranked by similarity score
4. If "Exact" mode:
   a. Current keyword matching behavior
```

---

## Technical Design

### 1. Search Bar Enhancement
```tsx
// SearchBar.tsx additions
const [searchMode, setSearchMode] = useState<'exact' | 'smart'>('exact');

<div className="flex items-center gap-2">
  <input type="text" value={query} onChange={...} />
  <button 
    onClick={() => setSearchMode(m => m === 'exact' ? 'smart' : 'exact')}
    className={searchMode === 'smart' ? 'bg-purple-500 text-white' : 'bg-gray-100'}
  >
    {searchMode === 'smart' ? '✨ Smart' : '🔍 Exact'}
  </button>
</div>
```

### 2. New API Endpoint
**Path:** `POST /api/search`

**Request:**
```json
{
  "query": "atmospheric photography",
  "mode": "smart",
  "topK": 30
}
```

**Response:**
```json
{
  "results": [
    { "id": "...", "score": 0.89, "title": "Moody lighting...", "tags": ["atmospheric"] },
    { "id": "...", "score": 0.85, "title": "Fog photography...", "tags": ["nature"] }
  ],
  "mode": "smart",
  "query": "atmospheric photography"
}
```

### 3. Backend Implementation
```typescript
// /api/search/route.ts
export async function POST(request: Request) {
  const { query, mode, topK = 30 } = await request.json();
  
  if (mode === 'smart') {
    // Use Pinecone for semantic search
    const matches = await querySimilar(query, topK);
    
    // Fetch full card data for matches
    const cardIds = matches.map(m => m.id);
    const { data: cards } = await supabase
      .from('cards')
      .select('*')
      .in('id', cardIds);
    
    // Sort by Pinecone score
    const sorted = cards.sort((a, b) => {
      const scoreA = matches.find(m => m.id === a.id)?.score || 0;
      const scoreB = matches.find(m => m.id === b.id)?.score || 0;
      return scoreB - scoreA;
    });
    
    return Response.json({ results: sorted, mode: 'smart', query });
  }
  
  // Fallback to keyword search (existing behavior)
  const { data } = await supabase
    .from('cards')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`);
  
  return Response.json({ results: data, mode: 'exact', query });
}
```

### 4. Frontend Integration
```typescript
// CardGridClient.tsx or a custom hook
const fetchCards = async () => {
  if (searchMode === 'smart' && query) {
    const res = await fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query, mode: 'smart', topK: 50 })
    });
    const data = await res.json();
    setCards(data.results);
    setSearchMeta({ mode: 'smart', count: data.results.length });
  } else {
    // Existing keyword search behavior
  }
};
```

---

## Design Considerations

### Why a Toggle?
1. **Transparency:** User knows which mode they're in
2. **Control:** Exact search is still useful for specific lookups
3. **Performance:** Smart search is slightly slower (API call)

### Visual Indicators
- "Smart" mode: Purple accent, sparkle icon ✨
- Results show similarity badge: "92% match"
- Banner: "Showing smart results for: atmospheric photography"

---

## Playwright Test Plan

```typescript
test('smart search toggle switches modes', async ({ page }) => {
  await page.goto('/');
  
  // Default should be Exact
  await expect(page.locator('button:has-text("Exact")')).toBeVisible();
  
  // Toggle to Smart
  await page.click('button:has-text("Exact")');
  await expect(page.locator('button:has-text("Smart")')).toBeVisible();
});

test('smart search returns semantic results', async ({ page }) => {
  await page.goto('/');
  
  // Enable smart mode
  await page.click('button:has-text("Exact")');
  
  // Search for conceptual query
  await page.fill('input[placeholder*="Search"]', 'atmospheric mood');
  await page.press('input[placeholder*="Search"]', 'Enter');
  
  // Should show results (if any cards with similar embeddings exist)
  // Check for "smart results" banner
  await expect(page.locator('text=Showing smart results')).toBeVisible();
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `SearchBar.tsx` | Add toggle button, mode state |
| New: `/api/search/route.ts` | NLP search endpoint |
| `CardGridClient.tsx` | Handle smart search mode |
| `lib/pinecone.ts` | Expose `querySimilar` for text queries |

---

## Connection to GEMINI-PROMPT.md

This feature directly addresses the user's vision from the original prompt:

> "How would you build the application so there's a possibility of crossing paths?"

Smart search enables:
- **Cross-disciplinary discovery:** "kinetic energy" finds both breakdance videos AND JavaScript animations
- **Vibe-based queries:** "atmospheric" returns weather viz AND moody photography
- **Abstract concept search:** "complexity" returns math papers AND generative art

This is the **serendipity layer** that transforms a bookmark manager into a **visual knowledge system**.
