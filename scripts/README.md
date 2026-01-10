# Scripts Directory

This directory contains utility scripts for development, security, and automation in the MyMind Clone project.

---

## 📋 Available Scripts

### 🔍 Secret Detection (`check-secrets.js`)

Scans files for potential API keys, secrets, and sensitive information before they're committed to Git.

**Purpose:** Prevent accidental exposure of API keys, tokens, and other secrets in version control.

**Usage:**

```bash
# Run manually on all files
node scripts/check-secrets.js

# Run on staged files only (Git pre-commit hook)
git commit  # Hook runs automatically
```

**What it detects:**
- JWT tokens (Supabase, Auth0, etc.)
- Supabase API keys (anon and service role)
- Zhipu AI API keys
- OpenAI API keys
- Google API keys
- AWS access keys
- Generic API key patterns

**What it ignores:**
- `.env.example` files
- Files with `.example` or `.sample` suffix
- Obvious placeholders (`your-api-key`, `YOUR_KEY`, etc.)
- Node modules, build artifacts, and Git directories

---

## 🪝 Pre-Commit Hooks

### Automatic Secret Detection

A Git pre-commit hook is configured at `.husky/pre-commit` to automatically run the secret detection script before every commit.

**How it works:**

1. When you run `git commit`, the hook executes
2. The secret detection script scans staged files
3. If secrets are found, the commit is blocked
4. You must remove or obfuscate the secrets before committing

**Setup:**

```bash
# Make the hook executable (if not already)
chmod +x .husky/pre-commit

# Test the hook
git commit -m "test: verify pre-commit hook works"
```

**To bypass (not recommended):**

```bash
# Only do this if you're absolutely sure the secret detection is a false positive
git commit --no-verify -m "your commit message"
```

---

## 🔧 Development Scripts

### Adding New Scripts

When adding new utility scripts:

1. Place them in this `scripts/` directory
2. Add documentation to this README
3. Include usage examples and dependencies
4. Consider adding to `package.json` scripts for easier access

**Example:**

```bash
# Add to package.json scripts section
{
  "scripts": {
    "check-secrets": "node scripts/check-secrets.js",
    "your-new-script": "node scripts/your-script.js"
  }
}
```

---

## 📚 Best Practices

### Secret Detection

1. **Never commit real API keys** - Use `.env.local` and `.env.example`
2. **Review the hook output** - Check what's being blocked
3. **Add false positives to ignore list** - Update `IGNORE_PATTERNS` in `check-secrets.js`
4. **Test before committing** - Run `node scripts/check-secrets.js` manually

### Pre-Commit Hooks

1. **Don't disable hooks** - They're there to protect you
2. **Keep hooks up to date** - Update as patterns evolve
3. **Share with team** - Commit `.husky/pre-commit` to the repository
4. **Document exceptions** - If you need to bypass, document why

### Script Development

1. **Make scripts executable** - Use `chmod +x` for shell scripts
2. **Add error handling** - Scripts should fail gracefully
3. **Provide clear output** - Show what's happening and why
4. **Include documentation** - Every script should be self-documenting
5. **Test thoroughly** - Run scripts on various scenarios

---

## 🛠 Dependencies

### Required for All Scripts

- **Node.js** 20+ (Runtime)
- **Git** (For pre-commit hooks)

### Optional for Advanced Features

- **Husky** (Git hooks management)
  ```bash
  npm install --save-dev husky
  npx husky install
  ```

- **GitGuardian CLI** (Enhanced secret scanning)
  ```bash
  curl -s https://updates.gitguardian.com/ggshield/latest/linux_amd64/ggshield > ggshield
  chmod +x ggshield
  ```

---

## 📖 Script Reference

### `check-secrets.js`

| Feature | Description |
|---------|-------------|
| **Type** | Node.js script |
| **Purpose** | Scan for API keys and secrets |
| **Usage** | `node scripts/check-secrets.js` |
| **Exit Codes** | 0 (no secrets), 1 (secrets found) |
| **Configurable** | Yes (edit SECRET_PATTERNS array) |

**Configuration Options:**

Edit the `SECRET_PATTERNS` array to add or modify detection patterns:

```javascript
const SECRET_PATTERNS = [
  // Add your custom patterns here
  /your-custom-pattern/gi,
];
```

Edit `IGNORE_PATTERNS` to add files to skip:

```javascript
const IGNORE_PATTERNS = [
  /\.your-file-type$/,
  /specific-directory/,
];
```

---

## 🐛 Troubleshooting

### Hook Not Running

**Problem:** Pre-commit hook doesn't execute when committing.

**Solutions:**

1. Check hook is executable:
   ```bash
   ls -la .husky/pre-commit
   # Should show -rwxr-xr-x (executable)
   ```

2. Make executable:
   ```bash
   chmod +x .husky/pre-commit
   ```

3. Verify Husky is installed (if using):
   ```bash
   npm list husky
   ```

### False Positives

**Problem:** Script flags legitimate code as a secret.

**Solutions:**

1. Add pattern to `IGNORE_PATTERNS` in `check-secrets.js`
2. Rename file to include `.example` or `.sample`
3. Update regex patterns to be more specific
4. Use placeholder values in example files

### Permission Denied

**Problem:** `sh: .husky/pre-commit: Permission denied`

**Solution:**
```bash
chmod +x .husky/pre-commit
```

---

## 📞 Getting Help

If you encounter issues with scripts:

1. **Check this README** - Look in the troubleshooting section
2. **Review script comments** - Most scripts are self-documenting
3. **Test manually** - Run scripts outside of hooks to see full output
4. **Check Node.js version** - Ensure you're using Node.js 20+
5. **Review Git configuration** - Verify hooks are enabled

---

## 🔄 Future Enhancements

Planned additions to the scripts directory:

- [ ] Database migration scripts
- [ ] Data seeding scripts
- [ ] Backup and restore utilities
- [ ] Performance monitoring scripts
- [ ] Test coverage reporters
- [ ] Automated deployment scripts

---

## 📝 Contributing

When adding new scripts:

1. Create the script in this directory
2. Add comprehensive documentation to this README
3. Include usage examples and error handling
4. Update this file's table of contents
5. Test on multiple scenarios
6. Consider adding to `package.json` scripts

---

**Last Updated:** January 2026  
**Maintained by:** Senik & Antigravity

For questions about specific scripts, refer to inline comments in each script file or create an issue in the repository.