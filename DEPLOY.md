# MyMind Clone - Deployment Guide

## Prerequisites

Before deploying, ensure these are configured in your Supabase dashboard:

### 1. Authentication Settings

1. Go to **Authentication → Providers**
2. Ensure **Email** provider is enabled
3. Optional: Enable **Google**, **GitHub**, etc.

### 2. Site URL Configuration

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your production domain (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

---

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
cd /home/senik/Desktop/mymind-clone
git add .
git commit -m "Add auth and prepare for deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select **apps/web** as the root directory
4. Configure environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `ZHIPU_API_KEY` | Your GLM API key |
| `ZHIPU_API_BASE` | `https://api.z.ai/api/coding/paas/v4` |

### Step 3: Deploy

Click **Deploy** and wait for the build to complete.

---

## Post-Deployment

1. **Update Supabase Site URL** to your Vercel domain
2. **Test the auth flow** - Sign up, login, save a card
3. **Verify GLM classification** - Save a URL and check tags

---

## Environment Variables Reference

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# GLM AI
ZHIPU_API_KEY=your-api-key
ZHIPU_API_BASE=https://api.z.ai/api/coding/paas/v4
```
