# Auto-Tagging Feature: 3-Layer Hierarchical System

> Implementation date: 2026-01-11

## Overview

Enhanced the AI auto-tagging system to generate **hierarchical, cross-disciplinary tags** that enable serendipitous discovery. Inspired by the "Obsidian graph effect" where a breakdance video can connect to a JavaScript animation via a shared "kinetic" vibe tag.

## The 3-Layer Architecture

| Layer | Purpose | Examples |
|-------|---------|----------|
| **Primary** | The essence — what makes it unique | `bmw`, `breakdance`, `terence-tao` |
| **Contextual** | The broader field or subject | `automotive`, `dance`, `mathematics` |
| **Vibe/Mood** | Abstract feeling or energy | `kinetic`, `atmospheric`, `minimalist` |

### Vibe Vocabulary

The system uses these abstract descriptors to create "portals" between unrelated content:

```
kinetic, atmospheric, minimalist, raw, nostalgic, elegant, 
chaotic, ethereal, tactile, visceral, contemplative, 
playful, precise, organic, geometric
```

## The "Gardener Bot" (Tag Normalization)

Prevents tag fragmentation by remapping new tags to existing ones:

```
"building"      → "architecture"  (if architecture exists)
"photo"         → "photography"   (if photography exists)
"instructional" → "tutorial"      (if tutorial exists)
```

This consolidation happens via LLM call before saving new tags.

## Files Modified

- [`lib/ai.ts`](file:///home/senik/Desktop/mymind-clone/apps/web/lib/ai.ts) — Updated `CLASSIFICATION_TOOL` prompts, added `normalizeTagsToExisting()`
- [`app/api/enrich/route.ts`](file:///home/senik/Desktop/mymind-clone/apps/web/app/api/enrich/route.ts) — Integrated tag normalization

## Future: Vector Embeddings (Pinecone)

For true semantic similarity ("See Similar" feature), vector embeddings would store content representations in Pinecone. This enables finding related items even when tags don't overlap.

### ✅ Now Implemented!

**Files created:**
- [`lib/pinecone.ts`](file:///home/senik/Desktop/mymind-clone/apps/web/lib/pinecone.ts) — Upsert, query, delete functions
- [`app/api/similar/route.ts`](file:///home/senik/Desktop/mymind-clone/apps/web/app/api/similar/route.ts) — GET endpoint for similarity search

**How it works:**
1. Card is saved and enriched with AI tags
2. Embedding text is built from `title + summary + tags`
3. Record is upserted to Pinecone with integrated llama-text-embed-v2
4. Query `/api/similar?cardId=xxx` returns semantically similar cards

**API Usage:**
```
GET /api/similar?cardId=<card-id>&topK=5
GET /api/similar?text=<search-text>&topK=10
```

**Requirements:**
1. Create Pinecone account (free tier: 100K vectors)
2. Create index with dimension `768` or `1536`
3. Add `PINECONE_API_KEY` and `PINECONE_INDEX` to `.env.local`
