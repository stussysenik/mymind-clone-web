# API Key Security Guide

This guide covers best practices for securing API keys and secrets in the MyMind Clone project. Following these practices will prevent unauthorized access to your Supabase database, Zhipu AI services, and other sensitive resources.

---

## 🚨 Why This Matters

Every day, developers accidentally expose API keys in public repositories, leading to:
- Unauthorized access to databases
- Massive API usage bills (thousands of dollars in hours)
- Data breaches and privacy violations
- Reputation damage

**The #1 rule: Never commit real API keys to version control.**

---

## 📋 Table of Contents

1. [Local Security Setup](#local-security-setup)
2. [Git Best Practices](#git-best-practices)
3. [Deployment Security](#deployment-security)
4. [Specific Key Security](#specific-key-security)
5. [What to Do If Keys Leak](#what-to-do-if-keys-leak)
6. [Monitoring and Rotation](#monitoring-and-rotation)
7. [Security Checklist](#security-checklist)

---

## 🔐 Local Security Setup

### Step 1: Use .env Files

All sensitive data should be stored in environment files:

```
apps/web/
├── .env.example        # ✅ Committed to git (templates only)
├── .env.local          # ❌ Never committed (real keys)
└── .env.development    # ❌ Never committed (dev-specific keys)
```

**What goes in `.env.example`:**
- Variable names
- Example values (obviously fake)
- Comments explaining each variable
- Documentation on where to get real values

**What goes in `.env.local`:**
- Your real API keys
- Actual database URLs
- Production credentials
- **NEVER commit this file**

### Step 2: Verify .gitignore

Your `.gitignore` file should include:

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# All .env files (except .env.example)
*.env
*.env.*

# Keep .env.example (remove the negation to ignore all .env files)
# !.env.example
```

**Current project status:** Your `.gitignore` already properly excludes all `.env` files except `.env.example`. ✅

### Step 3: Environment-Specific Files

For different environments, use separate files:

```bash
# Development (local)
.env.local

# Testing
.env.test.local

# Staging (optional)
.env.staging.local

# Production (managed by Vercel, not in code)
```

### Step 4: Accessing Keys in Code

Use `process.env` to access environment variables:

```typescript
// ✅ Correct - Reads from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ❌ Wrong - Never hardcode keys
const supabaseUrl = "https://my-real-project.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

---

## 🛡️ Git Best Practices

### Never Commit Real Keys

1. **Always use `.gitignore`:** Ensure `.env.local` is ignored
2. **Use `.env.example`:** Commit templates, not real values
3. **Review before committing:** Check diffs for any real keys
4. **Use commit hooks:** Prevent accidental commits (see below)

### Pre-Commit Hooks

Add a pre-commit hook to scan for potential secrets:

```bash
# Install husky
npm install --save-dev husky

# Initialize
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx ts-node scripts/check-secrets.ts"
```

Create `scripts/check-secrets.ts`:

```typescript
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SECRET_PATTERNS = [
  /NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
  /SUPABASE_SERVICE_ROLE_KEY=eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
  /ZHIPU_API_KEY=[a-zA-Z0-9._-]{20,}/,
  /sk-[a-zA-Z0-9]{20,}/,  // OpenAI pattern
  /AIza[a-zA-Z0-9_-]{35}/,  // Google API pattern
];

function checkForSecrets(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`❌ Potential secret found in ${filePath}`);
        console.error(`   Pattern: ${pattern}`);
        return true;
      }
    }
  } catch (error) {
    // Ignore unreadable files
  }
  
  return false;
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = readFileSync(filePath);
    
    if (stat?.isDirectory() && !filePath.includes('node_modules')) {
      getAllFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx|js|jsx|json|md)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const allFiles = getAllFiles('.');
let hasSecrets = false;

for (const file of allFiles) {
  if (file !== '.env.example' && !file.includes('.env')) {
    if (checkForSecrets(file)) {
      hasSecrets = true;
    }
  }
}

if (hasSecrets) {
  console.error('\n❌ Commit blocked: Potential secrets found in files');
  console.error('   Please remove or obfuscate any API keys before committing\n');
  process.exit(1);
}

console.log('✅ No secrets detected in staged files');
```

### Using GitGuardian (Recommended)

For enterprise-level secret detection:

1. Install GitGuardian CLI:
   ```bash
   curl -s https://updates.gitguardian.com/ggshield/latest/linux_amd64/ggshield > ggshield
   chmod +x ggshield
   ```

2. Add to pre-commit:
   ```bash
   ./ggshield secret scan pre-commit
   ```

### Check Git History for Leaked Keys

Even if you've removed keys from the current code, they might still be in Git history:

```bash
# Search for potential secrets in history
git log -p --all -S "NEXT_PUBLIC_SUPABASE_ANON_KEY=" | grep -i "supabase\|zhipu\|api.*key"

# Or use GitGuardian
ggshield secret scan history
```

If you find leaked keys, see [What to Do If Keys Leak](#what-to-do-if-keys-leak).

---

## 🚀 Deployment Security

### Vercel Environment Variables

**Never include real keys in `vercel.json`:**

```json
// ❌ Wrong - Never do this
{
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://my-project.supabase.co",
    "ZHIPU_API_KEY": "my-real-key-here"
  }
}

// ✅ Correct - Use Vercel dashboard
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next"
}
```

**Proper Vercel setup:**

1. Go to Vercel → Settings → Environment Variables
2. Add each variable manually
3. Select appropriate environments (Production, Preview, Development)
4. **Variables are encrypted and never exposed in code**

### Production vs Preview Environments

Use different keys for different environments:

| Environment | Keys | Purpose |
|-------------|------|---------|
| Development | Local `.env.local` | Testing on your machine |
| Preview | Vercel Preview variables | Testing pull requests |
| Production | Vercel Production variables | Live site |

**Why separate?**
- Prevent accidental changes to production
- Isolate environments for debugging
- Different rate limits and quotas

### CI/CD Security

For automated deployments (GitHub Actions, etc.):

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Uses environment secrets
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      # Secrets from GitHub
      - name: Build
        run: |
          echo "$NEXT_PUBLIC_SUPABASE_URL" > .env.production
          npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

**Never hardcode secrets in workflow files.**

---

## 🔑 Specific Key Security

### Supabase Keys

You have two Supabase keys:

#### Anon/Public Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- **Exposure Level:** Browser-visible (starts with `NEXT_PUBLIC_`)
- **Risk:** Lower, but still sensitive
- **Protected by:** Row Level Security (RLS) policies
- **If leaked:** Update RLS policies immediately
- **Rotation:** Easy, doesn't break app immediately

**Best practices:**
- Enable RLS on all tables
- Never trust client-side requests
- Use service role for sensitive operations

#### Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
- **Exposure Level:** Server-only (never in browser)
- **Risk:** **CRITICAL** - Full database access
- **Protected by:** Must never be in client code
- **If leaked:** Rotate IMMEDIATELY
- **Rotation:** Requires app redeployment

**Best practices:**
- Never use in client components
- Only use in API routes (`app/api/*`)
- Never commit to git
- Rotate regularly (every 90 days)

### Zhipu AI API Key (`ZHIPU_API_KEY`)
- **Exposure Level:** Server-only
- **Risk:** High - Access to AI services
- **If leaked:** Rotate immediately
- **Cost:** Could lead to unauthorized usage charges

**Best practices:**
- Never commit to git
- Use only on server-side
- Monitor usage in Zhipu dashboard
- Set up usage alerts

---

## 🆘 What to Do If Keys Leak

### Immediate Actions (Do This NOW)

If you discover leaked keys in a public repository:

1. **Delete the keys from the source**
   ```bash
   # Remove from current code
   # Delete from Vercel environment
   # Remove from any documentation
   ```

2. **Rotate the keys immediately**
   - Generate new Supabase keys
   - Generate new Zhipu AI key
   - Update in Vercel (not in code)
   - Redeploy application

3. **Remove from Git history**
   ```bash
   # Option 1: Use BFG Repo-Cleaner
   bfg --delete-files .env.local
   
   # Option 2: Use git filter-branch
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env.local' \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (be careful with this!)
   git push origin --force --all
   ```

4. **Notify affected services**
   - Email Supabase support: support@supabase.com
   - Check Zhipu AI dashboard for unauthorized usage
   - Review audit logs

5. **Audit your application**
   - Check for unauthorized data access
   - Review database for suspicious queries
   - Check API usage logs

### Prevention Going Forward

1. **Enable secret scanning**
   - GitHub Advanced Security (private repos)
   - GitGuardian
   - TruffleHog

2. **Add pre-commit hooks** (see above)

3. **Regular audits**
   ```bash
   # Scan all branches
   ggshield secret scan repo
   
   # Check recent commits
   git log -p --all --since="1 month ago" | grep -i "api.*key\|secret"
   ```

4. **Team training**
   - Educate all contributors about security
   - Require code review for changes involving env vars
   - Document security practices

---

## 📊 Monitoring and Rotation

### Key Rotation Schedule

Recommended rotation frequency:

| Key Type | Rotation Frequency | Difficulty |
|----------|-------------------|------------|
| Supabase Anon Key | Every 90 days | Easy |
| Supabase Service Role Key | Every 60 days | Medium |
| Zhipu AI API Key | Every 90 days | Easy |

### How to Rotate Keys

#### Supabase Anon Key
1. Go to Supabase Dashboard → Settings → API
2. Click "Regenerate" next to anon key
3. Update in Vercel environment variables
4. Redeploy
5. Test application

#### Supabase Service Role Key
1. Go to Supabase Dashboard → Settings → API
2. Click "Regenerate" next to service role key
3. Update in Vercel environment variables
4. Redeploy immediately (app may break briefly)
5. Test all API routes

#### Zhipu AI Key
1. Log in to open.bigmodel.cn
2. Go to API Keys
3. Generate new key
4. Delete old key
5. Update in Vercel environment variables
6. Redeploy
7. Test AI classification

### Monitoring Usage

Set up alerts for unusual activity:

**Supabase:**
- Dashboard → Database → Usage
- Set up alerts for:
  - Sudden spikes in queries
  - Failed authentication attempts
  - Data export volume

**Zhipu AI:**
- Dashboard → API Usage
- Set up alerts for:
  - Token usage spikes
  - Unusual request patterns
  - Rate limit errors

---

## ✅ Security Checklist

### Before Committing
- [ ] Reviewed git diff for any API keys
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.example` only has placeholder values
- [ ] No real keys in `.md` or `.json` files
- [ ] Pre-commit hooks are running

### Before Deploying
- [ ] Environment variables set in Vercel (not in code)
- [ ] Different keys for production vs preview
- [ ] Service role key only in API routes
- [ ] Checked Vercel build logs for exposed variables
- [ ] Reviewed recent commits for secrets

### After Deployment
- [ ] Tested authentication flow
- [ ] Verified database access works
- [ ] Confirmed AI classification functions
- [ ] Set up usage monitoring alerts
- [ ] Documented deployment

### Regular Maintenance
- [ ] Rotated Supabase keys (every 60-90 days)
- [ ] Rotated Zhipu AI key (every 90 days)
- [ ] Audited Git history for secrets
- [ ] Reviewed RLS policies
- [ ] Updated security documentation

---

## 🎯 Quick Reference

### Do's ✅
- Use `.env.local` for real keys
- Commit `.env.example` with placeholders
- Add environment variables in Vercel dashboard
- Use `process.env.VARIABLE_NAME` in code
- Implement pre-commit hooks
- Rotate keys regularly
- Monitor usage for anomalies

### Don'ts ❌
- Commit `.env.local` or any real `.env` files
- Hardcode API keys in source code
- Include real keys in documentation or comments
- Push service role keys to frontend code
- Share keys via email or chat
- Use the same keys across environments
- Ignore unusual usage patterns

---

## 📚 Additional Resources

### Tools
- [GitGuardian](https://www.gitguardian.com) - Secret scanning
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - Credential scanner
- [dotenv](https://github.com/motdotla/dotenv) - Environment variable management
- [Husky](https://github.com/typicode/husky) - Git hooks

### Documentation
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [OWASP Secrets Management](https://owasp.org/www-project-secrets-management/)
- [GitHub Secret Scanning](https://docs.github.com/code-security/secret-scanning)

### Learning
- [How to Secure API Keys](https://www.youtube.com/watch?v=27irj9GkRRI)
- [Environment Variables Security](https://dev.to/eprenzlin/env-gitignore-and-protecting-api-keys-2b9l)
- [Git Security Best Practices](https://www.atlassian.com/git/tutorials/git-security)

---

## 🚨 Emergency Contacts

If you discover a security breach:

1. **Supabase Support**: support@supabase.com
2. **Zhipu AI Support**: Contact via their dashboard
3. **Vercel Security**: security@vercel.com
4. **GitHub Security**: Report via [GitHub's security form](https://github.com/security)

---

**Remember:** Security is an ongoing process, not a one-time setup. Stay vigilant, follow best practices, and regularly audit your code and infrastructure.

---

**Last Updated:** January 2026  
**Maintained by:** Senik & Antigravity

**Questions?** Refer to the main README.md or create an issue in the repository.