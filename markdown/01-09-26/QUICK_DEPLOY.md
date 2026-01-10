# Quick Vercel Deployment Guide

Fast-track deployment for MyMind Clone to Vercel.

---

## ⚡ Pre-Flight Check

Ensure these files exist and are committed to Git:

```
mymind-clone/
├── vercel.json                    ← ✅ Already created
├── package.json                   ← ✅ Already created
├── apps/
│   └── web/
│       ├── package.json
│       ├── next.config.ts
│       └── tsconfig.json
```

---

## 🔐 Environment Variables (Required)

Add these in Vercel → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (your anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (your service role key)
ZHIPU_API_KEY=your-zhipu-key-here
ZHIPU_API_BASE=https://api.z.ai/api/coding/paas/v4
```

**⚠️ Important:** After adding variables, you MUST redeploy.

---

## 🚀 3-Step Deployment

### Step 1: Push to GitHub

```bash
cd /home/senik/Desktop/mymind-clone
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will **automatically detect** the Next.js app from `vercel.json`

### Step 3: Deploy

1. Add environment variables (see above)
2. Click **Deploy**
3. Wait ~2 minutes
4. Visit your new URL!

---

## 🔧 Fixing 404 Errors

If you see a 404 after deployment:

### Fix #1: Configure Root Directory (Most Common)

1. Go to Vercel → **Settings → General → Build & Development**
2. Set **Root Directory** to: `apps/web`
3. Click **Save**
4. Go to **Deployments** → Click **Redeploy**

### Fix #2: Check vercel.json

Verify `vercel.json` is at the repository root (not in `apps/web/`):

```json
{
  "buildCommand": "cd apps/web && npm install && npm run build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

### Fix #3: Clear Build Cache

1. Go to **Deployments**
2. Click on latest deployment
3. Click **Redeploy** with "Clear build cache" enabled

---

## 📋 Post-Deployment Checklist

- [ ] Homepage loads (no 404)
- [ ] Cards display in grid
- [ ] Search works
- [ ] Can click "+" to save
- [ ] Authentication works
- [ ] Can save a URL
- [ ] AI classification adds tags

---

## 🛠 Common Commands

```bash
# Local development
cd apps/web
npm run dev

# Build locally first (test before deploying)
npm run build

# Check environment variables locally
cat .env.local

# Test production build locally
npm start
```

---

## 📊 Vercel Settings Reference

If auto-detection fails, configure manually in Vercel Dashboard:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

---

## 🆘 Still Getting 404?

1. **Check Build Logs**: Vercel → Deployments → Click latest → Scroll to "Build Logs"
2. **Verify Build Output**: Should show "Build completed in X seconds"
3. **Test Locally**: Run `npm run build` in `apps/web` - does it succeed?
4. **Check Environment Variables**: Are all 5 variables added in Vercel?
5. **Redeploy**: Sometimes a fresh deploy fixes mysterious issues

---

## 📞 Quick Help

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Supabase Setup**: See `DEPLOY.md` for detailed Supabase configuration

---

## ✨ Success Indicators

You'll know it's working when you see:

- ✅ "Build completed in X seconds" (green checkmark)
- ✅ "Deployed to production" 
- ✅ Your site loads at `https://your-project.vercel.app`
- ✅ No 404 errors
- ✅ Cards appear in the grid

---

**Time to deploy:** ~5 minutes  
**Difficulty:** Beginner-friendly  
**Cost:** Free (Vercel Hobby Plan)

Good luck! 🚀