# MyMind Clone - Vercel Deployment Guide

This guide walks you through deploying the MyMind Clone to Vercel, with special attention to the monorepo structure where the application lives in `apps/web`.

---

## Table of Contents

1. [Understanding the Project Structure](#understanding-the-project-structure)
2. [Deployment Options](#deployment-options)
3. [Environment Variables](#environment-variables)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Troubleshooting 404 Errors](#troubleshooting-404-errors)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Custom Domain Setup](#custom-domain-setup)

---

## Understanding the Project Structure

### Monorepo Layout

```
mymind-clone/
├── apps/
│   ├── web/              # ← Next.js application (THIS IS WHAT WE DEPLOY)
│   │   ├── app/          # App Router pages & API routes
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities & configurations
│   │   ├── package.json  # Web app dependencies
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   └── extension/        # Chrome extension (not deployed to Vercel)
├── package.json          # Root package.json (workspaces config)
├── vercel.json           # Vercel configuration (at root)
└── .env.example          # Environment variables template
```

### Why This Matters

Vercel needs to know that your application is inside `apps/web`, not at the repository root. Without proper configuration, Vercel will look for `package.json` at the root level and fail to find your Next.js app.

---

## Deployment Options

### Option 1: Using vercel.json (Recommended)

We've already created a `vercel.json` file at the repository root with the correct configuration:

```json
{
  "buildCommand": "cd apps/web && npm install && npm run build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

**Advantages:**
- Configuration is committed to git
- Works automatically when you import the repo
- Team members have consistent setup
- Version-controlled deployment settings

**How it works:**
1. Vercel detects the `vercel.json` file
2. Reads the configuration automatically
3. Builds the app from `apps/web`
4. Deploys to production

---

### Option 2: Using Vercel Dashboard Settings

If you prefer configuring in the Vercel web interface:

1. Import your repository in Vercel
2. Go to **Settings → General → Build & Development Settings**
3. Configure the following:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

**Note:** When you set Root Directory to `apps/web`, Vercel automatically adjusts paths, so you don't need `cd apps/web` in your commands.

---

### Option 3: Using Workspace Configuration

With the root `package.json` workspaces configuration, Vercel can also auto-detect monorepos:

```json
{
  "workspaces": ["apps/*"]
}
```

Vercel will detect this and ask which workspace to deploy. Select `apps/web`.

---

## Environment Variables

### Required Variables

These MUST be set in Vercel for the application to work:

| Variable | Value | Purpose | Browser Exposed? |
|----------|-------|---------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Database connection | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Public API access | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Admin API access | ❌ No |
| `ZHIPU_API_KEY` | Your Zhipu AI API key | AI classification | ❌ No |
| `ZHIPU_API_BASE` | `https://api.z.ai/api/coding/paas/v4` | AI API endpoint | ❌ No |

### Getting Your Values

#### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

#### Zhipu AI

1. Go to [open.bigmodel.cn](https://open.bigmodel.cn/)
2. Sign up or login
3. Go to API Keys
4. Generate a new key → `ZHIPU_API_KEY`

### Adding Variables to Vercel

1. Go to your project in Vercel
2. Navigate to **Settings → Environment Variables**
3. Click **Add New**
4. Enter variable name and value
5. Select **All** environments (or specific ones)
6. Click **Save**

**Important:** After adding variables, you must redeploy for them to take effect.

---

## Step-by-Step Deployment

### Pre-Deployment Checks

Before deploying to Vercel, ensure everything works locally:

```bash
# 1. Navigate to the web app directory
cd apps/web

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Copy .env.example to .env.local and fill in values
cp .env.example .env.local

# 4. Run the development server
npm run dev

# 5. Test locally at http://localhost:3000
# - Does the grid load?
# - Can you save a card?
# - Does search work?
# - Is authentication working?

# 6. Test the build process
npm run build

# 7. Run the production build locally
npm start
```

If everything works locally, you're ready to deploy!

---

### Deploying to Vercel

#### Step 1: Push to GitHub

```bash
# From the repository root
cd /path/to/mymind-clone

# Add all changes
git add .

# Commit with a descriptive message
git commit -m "Prepare for Vercel deployment"

# Push to your repository
git push origin main
```

**Files to verify are committed:**
- ✅ `package.json` (root)
- ✅ `vercel.json` (root)
- ✅ `apps/web/package.json`
- ✅ `apps/web/next.config.ts`
- ✅ `apps/web/tsconfig.json`

#### Step 2: Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Project"**
3. Select your GitHub repository
4. Vercel will automatically detect:
   - Framework: Next.js
   - Root Directory: (from `vercel.json`)

#### Step 3: Configure Project Settings

If Vercel doesn't auto-detect correctly, manually configure:

**Framework Preset:** Next.js

**Build & Development Settings:**
- Root Directory: `apps/web`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

#### Step 4: Add Environment Variables

Add all required environment variables (see [Environment Variables](#environment-variables) section).

#### Step 5: Deploy

Click the **"Deploy"** button. Vercel will:

1. Clone your repository
2. Install dependencies in `apps/web`
3. Build the Next.js application
4. Deploy to a CDN

**Build Time:** Usually 1-3 minutes

**Watch for:**
- ✅ "Build completed in X seconds"
- ✅ "Deployed to production"
- ❌ Red error messages in logs

---

## Troubleshooting 404 Errors

If you're seeing a 404 error after deployment, here's how to fix it:

### Common Cause 1: Wrong Root Directory

**Symptom:**
- Build succeeds
- Deployed site shows "404: Page Not Found"
- Build logs show "Output directory not found"

**Solution:**
1. Go to Vercel project
2. Navigate to **Settings → General → Build & Development**
3. Change **Root Directory** to `apps/web`
4. Click **Save**
5. Go to **Deployments** and click **Redeploy**

---

### Common Cause 2: vercel.json Not Detected

**Symptom:**
- Vercel asks for framework preset
- Build command defaults to `next build`
- Doesn't know where to find the app

**Solution:**
1. Verify `vercel.json` exists at repository root
2. Ensure it's valid JSON (use a JSON validator)
3. Commit and push to GitHub
4. Redeploy

---

### Common Cause 3: Missing package.json in apps/web

**Symptom:**
- Build fails with "package.json not found"
- Error: "Cannot find module 'next'"

**Solution:**
1. Verify `apps/web/package.json` exists
2. Ensure it has all required dependencies
3. Run `npm install` in `apps/web` locally
4. Commit `package-lock.json`
5. Redeploy

---

### Common Cause 4: Next.js Version Mismatch

**Symptom:**
- Build fails with "Next.js version not found"
- Compatibility errors

**Solution:**
1. Check `apps/web/package.json` for Next.js version
2. Ensure it's compatible with Vercel (v13+ recommended)
3. Run `npm install` locally to fix version
4. Update `apps/web/package.json` if needed
5. Redeploy

---

### Common Cause 5: Build Output in Wrong Location

**Symptom:**
- 404 error on deployed site
- Build logs show successful build

**Solution:**
1. Check `vercel.json` output directory
2. It should be: `"outputDirectory": "apps/web/.next"`
3. Or if using Root Directory: `".next"`
4. Update and redeploy

---

### Debugging Steps

If you're still seeing 404 errors:

1. **Check Build Logs:**
   - Go to Vercel → Deployments
   - Click on latest deployment
   - Review build logs for errors

2. **Verify Build Output:**
   ```bash
   # Locally, run build
   cd apps/web
   npm run build
   
   # Check that .next was created
   ls -la .next/
   ```

3. **Test Build Command:**
   ```bash
   # From repository root
   cd apps/web && npm run build
   # Should complete without errors
   ```

4. **Clear Vercel Cache:**
   - Go to Deployments → Click "Redeploy"
   - Enable "Clear build cache" option
   - Redeploy

5. **Contact Support:**
   - If all else fails, share build logs with Vercel support

---

## Post-Deployment Checklist

After successful deployment, verify everything works:

### Functionality Tests

- [ ] Homepage loads (not 404)
- [ ] Cards display in grid
- [ ] Search bar is visible and functional
- [ ] Can click the "+" button to save
- [ ] Authentication works (sign up/login)
- [ ] Can save a URL
- [ ] Can save an image
- [ ] Can save a note
- [ ] AI classification works (tags appear)
- [ ] Tag filtering works
- [ ] Card detail view opens

### Configuration Tests

- [ ] Environment variables are loaded
- [ ] Supabase connection works
- [ ] Zhipu AI is accessible
- [ ] Database queries succeed
- [ ] Image optimization works

### Performance Tests

- [ ] Page loads in < 3 seconds
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Images load properly
- [ ] Responsive on mobile

### Browser Tests

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari/iOS
- [ ] Mobile Chrome/Android

---

## Custom Domain Setup

To use your own domain instead of `your-project.vercel.app`:

### Step 1: Add Domain in Vercel

1. Go to **Settings → Domains**
2. Enter your domain (e.g., `mymind.com`)
3. Click **Add**

### Step 2: Configure DNS

Vercel will show you the DNS records to add:

**For Apex Domain (mymind.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For Subdomain (www.mymind.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Update DNS Provider

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add the DNS records shown by Vercel.

### Step 4: Wait for Propagation

DNS changes typically take 5-30 minutes to propagate worldwide. Vercel will show a checkmark when the domain is active.

### Step 5: Update Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Update **Site URL** to your new domain
3. Add your domain to **Redirect URLs**

### Step 6: Force SSL

Vercel automatically provisions SSL certificates. Your site will use HTTPS.

---

## Continuous Deployment

Vercel automatically rebuilds and deploys when you push to your Git repository.

### Preview Deployments

For every branch or pull request, Vercel creates a preview URL:

1. Create a branch: `git checkout -b feature/new-feature`
2. Make changes and push: `git push origin feature/new-feature`
3. Vercel creates a preview URL like: `https://feature-new-feature-your-project.vercel.app`
4. Share this URL for testing
5. Merge to main when ready for production

### Deployment Protection

To prevent accidental deployments to production:

1. Go to **Settings → Git**
2. Enable **Protected Branches**
3. Require review for main branch deployments

---

## Monitoring & Analytics

### Vercel Analytics

Vercel provides built-in analytics:

- Page views
- Core Web Vitals
- Real user monitoring (RUM)
- Geographic distribution

### Build Logs

Monitor build logs for:
- Failed builds
- Build duration
- Bundle size changes
- Error rates

### Functions Logs

View real-time logs for API routes:
- Request/response times
- Error tracking
- Function execution

---

## Best Practices

### 1. Keep vercel.json in Git

Always commit your `vercel.json` configuration:
- Ensures team consistency
- Version-controlled deployment settings
- Easier onboarding for new developers

### 2. Use Environment-Specific Variables

Separate variables for different environments:
- Production (live site)
- Preview (staging/testing)
- Development (local development)

### 3. Optimize Build Time

To speed up builds:
- Use Next.js Image optimization
- Minimize dependencies
- Enable caching in `next.config.ts`
- Use Vercel's Edge Network

### 4. Monitor Costs

Vercel's free tier includes:
- 100GB bandwidth per month
- Unlimited deployments
- Team collaboration (up to 1 member)

Monitor usage in **Settings → Billing**.

### 5. Set Up Alerts

Configure Vercel to notify you of:
- Deployment failures
- Build errors
- Site downtime
- Security vulnerabilities

---

## Getting Help

### Vercel Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Community Forum](https://github.com/vercel/vercel/discussions)
- [Vercel Support](https://vercel.com/support)

### Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs for specific errors |
| 404 on all pages | Verify Root Directory setting |
| Environment variables not working | Redeploy after adding variables |
| Images not loading | Check `next.config.ts` image domains |
| API routes failing | Verify server-side environment variables |

---

## Summary

To deploy MyMind Clone to Vercel:

1. ✅ Verify `vercel.json` exists at repository root
2. ✅ Push code to GitHub
3. ✅ Import repository in Vercel
4. ✅ Set Root Directory to `apps/web` (or let vercel.json handle it)
5. ✅ Add all environment variables
6. ✅ Deploy
7. ✅ Test functionality
8. ✅ Set up custom domain (optional)

The key to successful deployment is correctly configuring Vercel to understand your monorepo structure. The `vercel.json` file handles this automatically, but you can also configure it manually in the Vercel dashboard if needed.

---

**Last Updated:** January 2026

**For questions or issues, refer to the Vercel documentation or the project's main README.md.**
