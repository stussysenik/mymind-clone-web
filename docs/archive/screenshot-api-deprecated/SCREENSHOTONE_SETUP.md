# ScreenshotOne Setup Guide

> **TL;DR**: Get free high-quality screenshots (1080p+) for URLs without OG images. Optional but recommended.

## Overview

MyMind Clone automatically captures high-quality screenshots when URLs don't have Open Graph images. This document explains how to set up ScreenshotOne API for optimal screenshot quality.

## Architecture

```
URL saved → Scraper checks for OG image
                ↓
        [Has OG image?]
          Yes → Use OG image ✅
          No  → Capture screenshot
                    ↓
            [ScreenshotOne configured?]
              Yes → ScreenshotOne (1080p+) ✅
              No  → Microlink fallback (~480p) ✅
```

**Result**: System always works, but screenshot quality improves from ~480p to 1080p+ when ScreenshotOne is configured.

## Do I Need This?

### ❌ Skip ScreenshotOne if:
- You're just testing locally
- Your saved URLs mostly have OG images (Twitter, YouTube, etc.)
- You're fine with ~480p screenshots for edge cases

### ✅ Set up ScreenshotOne if:
- You save many URLs without OG images (GitHub repos, Reddit threads, etc.)
- You want archival-quality screenshots (1080p+)
- You want platform-optimized captures (Instagram mobile viewport, YouTube desktop, etc.)

## Pricing

### Free Tier (Recommended to start)
- **100 screenshots/month**
- No credit card required
- Perfect for testing and small projects

### Paid Tiers (If needed)
- **Basic**: $17/month - 2,000 screenshots
- **Growth**: $79/month - 10,000 screenshots
- **Scale**: $259/month - 50,000 screenshots

### Cost Estimate
Assuming 70-80% of URLs already have OG images:
- **100 free screenshots** = ~500 URLs saved per month
- **If exceeded**: Automatic fallback to Microlink (no errors)

## Quick Setup

### Step 1: Get API Key (2 minutes)

1. Go to [screenshotone.com](https://screenshotone.com/)
2. Sign up for free account (no credit card needed)
3. Copy your API key from the dashboard

### Step 2: Add to Local Development

Create or edit `.env.local` in your project root:

```bash
# .env.local
SCREENSHOTONE_API_KEY=your-actual-api-key-here
```

**Example:**
```bash
SCREENSHOTONE_API_KEY=abc123def456ghi789
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

That's it! Screenshots will now use ScreenshotOne automatically.

## Production Setup (Vercel)

### Option 1: Vercel CLI

```bash
vercel env add SCREENSHOTONE_API_KEY production
# Paste your API key when prompted
```

### Option 2: Vercel Dashboard

1. Go to your project settings on Vercel
2. Navigate to **Environment Variables**
3. Add new variable:
   - **Name**: `SCREENSHOTONE_API_KEY`
   - **Value**: Your API key
   - **Environment**: Select "Production"
4. Click **Save**
5. Redeploy your application

## Testing Your Setup

### Local Testing

```bash
# Start dev server
npm run dev

# Save a URL without OG image (GitHub repo works great)
# Example: https://github.com/vercel/next.js
```

**Check console logs for:**
```
[Screenshot] ScreenshotOne success for github (1920x1080)
```

### Without API Key
- System automatically uses Microlink
- Screenshots are ~480p quality
- No errors, just lower resolution

### With API Key
- System uses ScreenshotOne first
- Screenshots are 1080p+ quality
- Falls back to Microlink if ScreenshotOne fails

## Platform Optimizations

When ScreenshotOne is configured, screenshots are automatically optimized per platform:

| Platform | Viewport | Notes |
|----------|----------|-------|
| **YouTube** | 1920x1080 (desktop) | Captures video player |
| **Instagram** | 375x812 (mobile, 2x) | Captures full post + caption |
| **Twitter** | 1200x800 | Captures tweet + media |
| **GitHub** | 1920x1080 | Captures repo overview |
| **Reddit** | 1920x1080 | Captures full thread |
| **Medium** | 1200x1600 | Captures article layout |
| **Generic** | 1920x1080 | Default for unknown sites |

All screenshots include:
- ✅ Ad blocking
- ✅ Cookie banner removal
- ✅ Platform-specific loading delays
- ✅ Retina/HiDPI support (where applicable)

## Troubleshooting

### Screenshots Still Low Quality

**Check 1: API key is set**
```bash
# In your terminal
echo $SCREENSHOTONE_API_KEY
# Should print your API key
```

**Check 2: Dev server was restarted after adding key**
```bash
# Kill and restart dev server
npm run dev
```

**Check 3: Check logs**
```bash
# Look for this in console:
[Screenshot] ScreenshotOne success for [platform]

# If you see this instead:
[Screenshot] Falling back to Microlink for [platform]
# Then ScreenshotOne failed or isn't configured
```

### API Key Not Working

**Verify key is correct:**
1. Go to [screenshotone.com](https://screenshotone.com/) dashboard
2. Copy API key again
3. Update `.env.local`
4. Restart dev server

**Check for typos:**
- No spaces before/after the key
- No quotes around the key value
- Correct environment variable name: `SCREENSHOTONE_API_KEY`

### Exceeded Free Tier

**What happens:**
- System automatically falls back to Microlink
- No errors thrown
- Screenshots just use ~480p quality
- Service continues working normally

**Solutions:**
- Upgrade to paid tier
- Accept Microlink quality for overflow
- Mix: Keep free tier, overflow uses Microlink

## Advanced Configuration

### Custom Screenshot Options

Edit `/apps/web/lib/screenshot.ts` to customize platform configs:

```typescript
const PLATFORM_CONFIGS: Record<Platform, PlatformConfig | null> = {
  youtube: {
    viewport_width: 1920,    // Viewport width
    viewport_height: 1080,    // Viewport height
    full_page: false,         // Full page or viewport only
    delay: 2,                 // Wait time before capture (seconds)
  },
  // ... add your custom configs
};
```

### Custom API URL (Optional)

If using ScreenshotOne self-hosted or enterprise:

```bash
# .env.local
SCREENSHOTONE_API_KEY=your-key
SCREENSHOTONE_API_URL=https://your-custom-endpoint.com/take
```

## Monitoring Usage

### Check ScreenshotOne Dashboard
1. Go to [screenshotone.com](https://screenshotone.com/) dashboard
2. View usage statistics
3. Monitor remaining quota

### Application Logs
```bash
# Successful ScreenshotOne capture
[Screenshot] ScreenshotOne success for github (1920x1080)

# Fallback to Microlink
[Screenshot] ScreenshotOne failed for github: API error
[Screenshot] Falling back to Microlink for github
```

## Security Notes

- ✅ API key is server-side only (never exposed to browser)
- ✅ Key is in `.env.local` (git-ignored)
- ✅ Production keys stored in Vercel env vars (encrypted)
- ⚠️ Never commit API keys to version control
- ⚠️ Use different keys for development and production

## FAQ

### Q: What if I don't set up ScreenshotOne?
**A:** System works fine! It automatically uses Microlink for screenshots (~480p quality).

### Q: Can I use both ScreenshotOne and Microlink?
**A:** Yes! That's the default behavior. ScreenshotOne first, Microlink as fallback.

### Q: What happens if ScreenshotOne goes down?
**A:** Automatic fallback to Microlink. No downtime for your app.

### Q: Do I need a credit card for the free tier?
**A:** No! Just sign up and get 100 free screenshots/month.

### Q: Can I upgrade/downgrade anytime?
**A:** Yes! Change plans anytime in ScreenshotOne dashboard.

### Q: What format are screenshots?
**A:** PNG (lossless) for archival quality.

### Q: Are screenshots cached?
**A:** No. Each URL capture counts toward quota. Consider implementing caching in your app if needed.

## Summary

- ✅ **Only need ONE key**: ScreenshotOne
- ✅ **Free tier**: 100 screenshots/month (no credit card)
- ✅ **Quick setup**: 2 minutes to get API key + add to `.env.local`
- ✅ **Optional**: System works fine without it (uses Microlink)
- ✅ **Production**: Add to Vercel environment variables
- ✅ **Automatic**: No code changes needed, just add the key

## Next Steps

1. **Test without key first** - See if Microlink quality is acceptable
2. **Add ScreenshotOne key** - If you want 1080p+ quality
3. **Monitor usage** - Check dashboard to track quota
4. **Upgrade if needed** - Scale to paid tier when ready

## Support

- **ScreenshotOne Docs**: [screenshotone.com/docs](https://screenshotone.com/docs)
- **Implementation Code**: `/apps/web/lib/screenshot.ts`
- **API Integration**: `/apps/web/app/api/save/route.ts` (lines 240-252)

---

**Remember**: Implementation is already complete and deployed. This guide just explains how to configure the optional API key for better quality! 🎉
