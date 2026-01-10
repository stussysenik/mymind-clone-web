# MyMind Clone - Deployment Guide

This guide covers deploying the MyMind Clone to Vercel, including the monorepo configuration needed since the application lives in `apps/web`.

---

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

### Option 1: Using Vercel Dashboard (Recommended)

#### Step 1: Push to GitHub

```bash
cd /home/senik/Desktop/mymind-clone
git add .
git commit -m "Update for deployment"
git push origin main
```

#### Step 2: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **IMPORTANT**: In the project settings, configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### Step 3: Configure Environment Variables

Add these environment variables in Vercel:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | ✅ Yes |
| `ZHIPU_API_KEY` | Your GLM API key | ✅ Yes |
| `ZHIPU_API_BASE` | `https://api.z.ai/api/coding/paas/v4` | ✅ Yes |

#### Step 4: Deploy

Click **Deploy** and wait for the build to complete.

---

### Option 2: Using vercel.json (Alternative)

If you prefer using a `vercel.json` file at the root of your repository:

The file is already configured at the repository root with these settings:

```json
{
  "buildCommand": "cd apps/web && npm install && npm run build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

With this approach:
1. Push your code to GitHub
2. Import in Vercel
3. Vercel will automatically detect the Next.js framework and use the `vercel.json` configuration
4. Add environment variables
5. Deploy

---

## Troubleshooting

### 404 Error on Deployment

If you see a 404 error after deployment:

1. **Check Root Directory**: Ensure Vercel is using `apps/web` as the root directory
   - Go to Project Settings → General → Build & Development Settings
   - Set "Root Directory" to `apps/web`

2. **Verify Build Output**: Check the Vercel build logs to ensure the build succeeded
   - Look for "Build completed in X seconds"
   - Verify no errors in the build output

3. **Clear Build Cache**: If deployment was previously successful:
   - Go to Deployments → Click on latest deployment
   - Click "Redeploy" with "Clear build cache" option enabled

4. **Check Next.js Version**: Ensure `next.config.ts` is present in `apps/web`
   - The config file should be at: `apps/web/next.config.ts`

### Environment Variables Not Working

1. Verify variables are set in Vercel (not just locally)
2. Check for typos in variable names
3. Some variables need to be prefixed with `NEXT_PUBLIC_` to be available in the browser
4. After updating variables, redeploy to apply changes

### Build Errors

1. **Node Version Error**: Ensure you're using Node.js 20+
   - Vercel automatically uses the Node version specified in your `package.json` engines field
   - If not specified, it uses the latest LTS

2. **Dependency Issues**: Try a clean build:
   - Delete `node_modules` and `package-lock.json` locally
   - Run `npm install` to verify locally
   - Push changes and redeploy

3. **TypeScript Errors**: Check that `tsconfig.json` is properly configured in `apps/web`

### API Routes Not Working

1. Verify API routes are in `apps/web/app/api/`
2. Check that the API routes export named functions: `export async function POST(request: Request)`
3. Ensure you're using `async/await` properly in API routes

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Update Supabase Site URL to your Vercel domain
- [ ] Test authentication flow (sign up, login)
- [ ] Test saving a card with URL
- [ ] Test saving an image/note
- [ ] Verify search functionality
- [ ] Check AI classification is working
- [ ] Test on mobile devices (responsive design)
- [ ] Verify image optimization works
- [ ] Check browser console for errors

---

## Custom Domain Setup (Optional)

To use your own domain:

1. Go to **Settings → Domains** in Vercel
2. Add your domain (e.g., `yourdomain.com`)
3. Update DNS records as instructed by Vercel
4. Wait for SSL certificate (usually < 5 minutes)
5. Update Supabase Site URL to match your custom domain

---

## Environment Variables Reference

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Zhipu AI Configuration
ZHIPU_API_KEY=your-zhipu-api-key-here
ZHIPU_API_BASE=https://api.z.ai/api/coding/paas/v4
```

---

## Continuous Deployment

Vercel will automatically redeploy your site when you push to the connected Git branch. To preview changes before merging:

1. Create a new branch: `git checkout -b feature/new-feature`
2. Make changes and push: `git push origin feature/new-feature`
3. Vercel will create a preview deployment URL
4. Share the preview URL for testing
5. Merge to main when ready for production

---

## Monitoring & Logs

- **Build Logs**: Available in the Vercel dashboard under Deployments
- **Real-time Logs**: View function execution logs in the Functions tab
- **Analytics**: Vercel Analytics provides insights into performance and traffic
- **Error Tracking**: Consider integrating Sentry or Vercel's built-in error tracking

---

**Need Help?**

- Check the [Vercel Documentation](https://vercel.com/docs)
- Review the [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- Verify your Supabase configuration in the Supabase dashboard