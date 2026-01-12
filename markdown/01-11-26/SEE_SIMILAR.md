# See Similar — Feature Specification

## Overview
Transform the Pinecone vector search into a discovery tool that enables users to find semantically related cards and create spaces from the results.

---

## User Flow

```
1. User opens CardDetailModal for any card
2. Clicks "See Similar" button
3. System calls Pinecone with card's embedding text
4. Main view updates to show similarity search results
5. "Create Space from These" button appears above results
6. User clicks → prompted for space name → all cards get that tag
```

---

## Technical Design

### 1. Trigger Point
**Location:** CardDetailModal bottom action bar (next to Archive/Delete)
**Button:** `<Sparkles />` icon with "See Similar" tooltip

### 2. Search Execution
```typescript
// When user clicks "See Similar"
const handleSeeSimilar = async () => {
  // 1. Build query text from current card
  const queryText = buildEmbeddingText(card);
  
  // 2. Navigate to main page with similarity mode
  router.push(`/?similar=${card.id}`);
  
  // 3. Main page detects 'similar' param and fetches from /api/similar
};
```

### 3. API Layer
**Endpoint:** `GET /api/similar?cardId=xxx&topK=20`

**Response:**
```json
{
  "results": [
    { "id": "card-uuid-1", "score": 0.92, "title": "...", "imageUrl": "..." },
    { "id": "card-uuid-2", "score": 0.87, "title": "...", "imageUrl": "..." }
  ],
  "queryCard": { "id": "xxx", "title": "..." }
}
```

### 4. Frontend Display
- CardGridClient detects `?similar=xxx` param
- Fetches from `/api/similar` instead of normal cards
- Shows banner: "Similar to: [Card Title]" with Clear button
- "Create Space from These" button in controls bar

### 5. Create Space from Results
```typescript
const handleCreateSpaceFromSimilar = async (spaceName: string) => {
  const tagName = spaceName.toLowerCase().replace(/\s+/g, '-');
  
  // Batch update all visible similar cards
  for (const card of similarCards) {
    await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        tags: [...card.tags, tagName] 
      })
    });
  }
  
  // Navigate to the new space
  router.push(`/?q=%23${tagName}`);
};
```

---

## Edge Cases

1. **No similar cards found** → Show "No similar items in your mind yet"
2. **Current card not indexed** → Trigger enrichment first, then search
3. **User navigates away** → Clear similarity mode

---

## Playwright Test Plan

```typescript
test('see similar navigates to similarity view', async ({ page }) => {
  // Open a card modal
  await page.click('[data-testid="card"]');
  
  // Click See Similar
  await page.click('button[aria-label="See Similar"]');
  
  // Should navigate to similarity mode
  await expect(page).toHaveURL(/similar=/);
  
  // Should show banner
  await expect(page.locator('text=Similar to:')).toBeVisible();
});

test('create space from similar cards', async ({ page }) => {
  // Navigate to similarity view
  await page.goto('/?similar=test-card-id');
  
  // Click Create Space
  await page.click('text=Create Space from These');
  
  // Enter space name
  await page.fill('input[placeholder="Space name..."]', 'my-vibe');
  await page.click('text=Create');
  
  // Should navigate to new space
  await expect(page).toHaveURL(/q=%23my-vibe/);
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `CardDetailModal.tsx` | Add "See Similar" button |
| `CardGridClient.tsx` | Handle `?similar=` param, show banner, add Create Space button |
| `/api/similar/route.ts` | Enhance to return card previews |
| New: `SimilarityBanner.tsx` | Component for the "Similar to: X" banner |
