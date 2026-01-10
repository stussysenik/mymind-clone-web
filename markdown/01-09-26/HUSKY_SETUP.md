# Husky Git Hooks Setup Guide

This guide walks you through setting up Husky Git hooks for the MyMind Clone project to prevent API key leaks and enforce code quality standards.

---

## 🎯 What is Husky?

Husky is a Git hooks manager that allows you to run scripts before Git actions (commit, push, etc.). We use it to:

- **Prevent API key leaks** - Automatically scan files before committing
- **Enforce code quality** - Run linters and tests
- **Catch mistakes early** - Validate code before it's shared

---

## 📋 Prerequisites

Before setting up Husky, ensure you have:

- ✅ Git installed
- ✅ Node.js 20+ installed
- ✅ Project cloned locally
- ✅ npm or yarn package manager

---

## 🚀 Installation & Setup

### Step 1: Install Husky

```bash
cd /path/to/mymind-clone
npm install --save-dev husky
```

### Step 2: Initialize Husky

```bash
# This creates the .husky directory and sets up Git hooks
npx husky install
```

After running this command, you should see:
```
.git/config updated
.husky/ created
pre-commit hook created
```

### Step 3: Make Pre-Commit Hook Executable

```bash
chmod +x .husky/pre-commit
```

### Step 4: Verify Hook is Configured

```bash
# Check that Git is using the hooks
cat .git/config | grep -A 2 "hooks"
```

You should see:
```
[core]
    hooksPath = .husky
```

### Step 5: Test the Hook

```bash
# Create a test commit
git add .
git commit -m "test: verify husky hook works"
```

Expected output:
```
🔒 Running pre-commit checks...
🔍 Scanning for secrets...

Scanning X file(s)...

✅ No secrets detected in staged files

✅ Pre-commit checks passed!
```

---

## 🔧 What the Pre-Commit Hook Does

The `.husky/pre-commit` hook executes the following:

1. **Runs secret detection script** (`scripts/check-secrets.js`)
2. **Scans staged files** for:
   - API keys
   - JWT tokens
   - Service credentials
   - Other sensitive information
3. **Blocks commit** if secrets are found
4. **Allows commit** if no secrets detected

---

## 🛠 Customizing Hooks

### Adding Additional Hooks

You can add other Git hooks as needed:

```bash
# Pre-push hook (runs before git push)
npx husky add .husky/pre-push "npm test"

# Pre-rebase hook (runs before git rebase)
npx husky add .husky/pre-rebase "npm run lint"

# Commit-msg hook (validates commit messages)
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

### Example: Enhanced Pre-Commit Hook

Create `.husky/pre-commit` with multiple checks:

```bash
#!/bin/sh
set -e

echo "🔒 Running pre-commit checks..."

# 1. Check for secrets
echo "🔍 Scanning for secrets..."
node scripts/check-secrets.js

# 2. Run linter
echo "🧹 Running linter..."
npm run lint -- --quiet

# 3. Run tests
echo "🧪 Running tests..."
npm test -- --passWithNoTests

echo "✅ All pre-commit checks passed!"
```

---

## 🧪 Testing Hooks

### Manual Hook Execution

You can run hooks without committing:

```bash
# Run pre-commit hook manually
.husky/pre-commit

# Or run the secret detection script directly
node scripts/check-secrets.js
```

### Testing with Real Keys (Safe)

Create a temporary test file with a fake key:

```bash
# Create test file with obvious fake key
echo "API_KEY=your-fake-api-key-here-12345678" > test-leak.js

# Stage the file
git add test-leak.js

# Try to commit (should be blocked)
git commit -m "test: leaking api key"

# Expected: ❌ POTENTIAL SECRETS FOUND!
```

### Clean Up Test

```bash
# Remove test file
rm test-leak.js
git reset HEAD test-leak.js
```

---

## 🐛 Troubleshooting

### Problem: Hook Not Executing

**Symptoms:**
- Commits happen without any hook output
- Secrets are not being detected

**Solutions:**

1. **Check if hooks are configured:**
   ```bash
   cat .git/config | grep hooksPath
   ```

   If you don't see `hooksPath = .husky`, run:
   ```bash
   npx husky install
   ```

2. **Verify hook is executable:**
   ```bash
   ls -la .husky/pre-commit
   ```

   You should see `-rwxr-xr-x` (executable). If not:
   ```bash
   chmod +x .husky/pre-commit
   ```

3. **Check Git version:**
   ```bash
   git --version
   ```

   Husky requires Git 2.9+.

---

### Problem: Permission Denied

**Symptom:**
```
sh: .husky/pre-commit: Permission denied
```

**Solution:**
```bash
chmod +x .husky/pre-commit
```

---

### Problem: Hook Scripts Not Found

**Symptom:**
```
node: scripts/check-secrets.js: No such file or directory
```

**Solutions:**

1. **Verify script exists:**
   ```bash
   ls -la scripts/check-secrets.js
   ```

2. **Check working directory:**
   ```bash
   pwd
   # Should be in /path/to/mymind-clone
   ```

3. **Update hook path if needed:**
   ```bash
   # In .husky/pre-commit, use absolute path or ensure relative path is correct
   node scripts/check-secrets.js
   ```

---

### Problem: Husky Install Fails

**Symptom:**
```
Error: EACCES: permission denied, open '/.husky/pre-commit'
```

**Solutions:**

1. **Check directory permissions:**
   ```bash
   ls -la .husky/
   ```

2. **Ensure directory exists:**
   ```bash
   mkdir -p .husky
   ```

3. **Try with sudo (not recommended, use as last resort):**
   ```bash
   sudo npx husky install
   ```

---

## 🔄 Team Setup

### Automatic Setup for Team Members

Add this to `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

Now when team members run `npm install`, Husky will be automatically configured.

### Manual Setup Instructions for Team

Add this to your onboarding documentation:

```markdown
## Git Hooks Setup

After cloning the repository:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Enable Git hooks:
   ```bash
   npm run prepare
   # or
   npx husky install
   ```

3. Make hooks executable:
   ```bash
   chmod +x .husky/pre-commit
   ```

4. Verify setup:
   ```bash
   git commit -m "test: verify hooks work"
   ```

You should see "Running pre-commit checks..." before the commit.
```

---

## ⚙️ Configuration Options

### Husky Configuration

Create `.huskyrc.json` (optional) for advanced configuration:

```json
{
  "hooks": {
    "pre-commit": "npm run lint-staged",
    "pre-push": "npm test"
  },
  "skipCI": true
}
```

### Git Configuration

You can configure Git to skip hooks in specific situations:

```bash
# Skip hooks for a single commit (use carefully!)
git commit --no-verify -m "your commit message"

# Set up an alias for faster commits (NOT recommended)
git config alias.nocommit "commit --no-verify"
```

---

## 📊 Hook Performance

### Monitoring Hook Execution Time

Add timing to your pre-commit hook:

```bash
#!/bin/sh
set -e

START_TIME=$(date +%s)

echo "🔒 Running pre-commit checks..."

# Run your checks
node scripts/check-secrets.js

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "⏱️  Pre-commit checks completed in ${DURATION}s"
```

### Optimizing Hook Performance

If hooks are slow:

1. **Only run on changed files:**
   ```bash
   # In scripts/check-secrets.js, use git to get staged files
   git diff --cached --name-only
   ```

2. **Cache results:**
   ```bash
   # Use a cache directory to store results
   mkdir -p .husky/cache
   ```

3. **Run in parallel:**
   ```bash
   # Run multiple checks concurrently
   npm run lint & npm run test &
   wait
   ```

---

## 🛡️ Security Best Practices

### 1. Always Commit Hooks

The `.husky/` directory should be committed to Git:

```bash
# Verify .husky is tracked
git status .husky/

# Should show: nothing to commit (if committed)
# or show uncommitted changes (if not)
```

### 2. Verify Hooks on Pull Request

Add to your PR checklist:

- [ ] Verify Git hooks are set up
- [ ] Run pre-commit checks locally
- [ ] Check that hooks aren't being bypassed

### 3. Monitor Hook Failures

Set up alerts for hook failures in CI/CD:

```yaml
# .github/workflows/verify-hooks.yml
name: Verify Git Hooks

on: [pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Verify hooks
        run: |
          npx husky install
          .husky/pre-commit
```

---

## 📚 Additional Resources

### Official Documentation

- [Husky GitHub](https://github.com/typicode/husky)
- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Lint-Staged](https://github.com/okonet/lint-staged) - Run linters on staged files

### Related Tools

- [Commitlint](https://commitlint.js.org/) - Lint commit messages
- [Prettier](https://prettier.io/) - Code formatter
- [ESLint](https://eslint.org/) - JavaScript linter
- [GitGuardian](https://www.gitguardian.com/) - Secret scanning

---

## ✅ Setup Checklist

Use this checklist to verify your Husky setup:

- [ ] Husky installed (`npm list husky`)
- [ ] Husky initialized (`npx husky install`)
- [ ] Pre-commit hook executable (`chmod +x .husky/pre-commit`)
- [ ] Git hooks configured (`cat .git/config | grep hooksPath`)
- [ ] Secret detection script exists (`ls scripts/check-secrets.js`)
- [ ] Test commit runs hook successfully
- [ ] Hook detects fake secrets correctly
- [ ] Team documentation updated with setup instructions

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Husky logs:**
   ```bash
   # Run hooks with verbose output
   GIT_TRACE=1 git commit -m "test"
   ```

2. **Verify Git configuration:**
   ```bash
   git config --list | grep hook
   ```

3. **Test scripts manually:**
   ```bash
   # Run the secret detection script
   node scripts/check-secrets.js
   ```

4. **Check Git version:**
   ```bash
   git --version
   # Should be 2.9 or higher
   ```

5. **Reinstall Husky:**
   ```bash
   npm uninstall husky
   npm install --save-dev husky
   npx husky install
   ```

---

## 🎓 Advanced Topics

### Multi-Repo Hooks

For monorepos with multiple packages:

```bash
# .husky/pre-commit
#!/bin/sh
set -e

# Run checks in each package
for dir in apps/*/; do
  echo "Checking $dir..."
  cd "$dir" && node ../../scripts/check-secrets.js && cd -
done
```

### Conditional Hooks

Run hooks based on branch or file changes:

```bash
#!/bin/sh

# Get current branch
BRANCH=$(git branch --show-current)

# Only run full checks on main branch
if [ "$BRANCH" = "main" ]; then
  npm test
fi

# Always run secret detection
node scripts/check-secrets.js
```

### Webhook Integration

Send hook results to Slack/Discord:

```bash
#!/bin/sh

RESULT=$(node scripts/check-secrets.js)

if [ $? -ne 0 ]; then
  # Send alert to Slack
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 Pre-commit hook failed! Please check for secrets."}' \
    $SLACK_WEBHOOK_URL
fi
```

---

## 📝 Summary

Husky Git hooks provide automated protection against API key leaks and ensure code quality. By following this guide, you have:

✅ Installed and configured Husky  
✅ Set up pre-commit secret detection  
✅ Understood how to customize hooks  
✅ Learned troubleshooting techniques  
✅ Implemented best practices  

**Remember:** Git hooks are your first line of defense against security breaches. Keep them active and well-maintained!

---

**Last Updated:** January 2026  
**Maintained by:** Senik & Antigravity

For questions or issues, refer to:
- [SECURITY.md](SECURITY.md) - API key security guide
- [scripts/README.md](scripts/README.md) - Script documentation
- [Husky GitHub](https://github.com/typicode/husky) - Official documentation