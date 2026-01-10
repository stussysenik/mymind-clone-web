/**
 * Secret Detection Script
 *
 * Scans files for potential API keys, secrets, and sensitive information
 * before they're committed to Git. Use this as a pre-commit hook.
 *
 * Usage: node scripts/check-secrets.js
 *
 * @fileoverview Secret detection for Git pre-commit hooks
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Patterns that indicate secrets or API keys.
 * Each pattern is a regex that matches common secret formats.
 */
const SECRET_PATTERNS = [
  // JWT tokens (used by Supabase, Auth0, etc.)
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,

  // Supabase keys
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[a-zA-Z0-9_-]{50,}/gi,
  /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*[a-zA-Z0-9_-]{50,}/gi,

  // Zhipu AI API keys
  /ZHIPU_API_KEY\s*=\s*[a-zA-Z0-9._-]{20,}/gi,

  // OpenAI API keys
  /sk-[a-zA-Z0-9]{20,}/g,

  // Google API keys
  /AIza[a-zA-Z0-9_-]{35}/g,

  // AWS access keys
  /AKIA[0-9A-Z]{16}/g,

  // Generic API key patterns
  /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
  /secret[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
  /private[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
  /access[_-]?token\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
];

/**
 * File patterns to ignore (don't scan these).
 */
const IGNORE_PATTERNS = [
  /\.env\.example$/,
  /\.example$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /node_modules/,
  /\.next/,
  /\.git/,
  /coverage/,
  /apps\/web\/lib\/ai\.ts/,
];

/**
 * File extensions to scan.
 */
const INCLUDE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.yml', '.yaml', '.env'];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a file should be ignored based on its path.
 * @param {string} filePath - The file path to check
 * @returns {boolean} - True if the file should be ignored
 */
function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Check if a file has an extension that should be scanned.
 * @param {string} filePath - The file path to check
 * @returns {boolean} - True if the file should be scanned
 */
function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return INCLUDE_EXTENSIONS.includes(ext);
}

/**
 * Check if a file contains potential secrets.
 * @param {string} filePath - The file path to check
 * @returns {Object|null} - Object with secret info if found, null otherwise
 */
function checkForSecrets(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip files that are too large (>100KB)
    if (content.length > 102400) {
      return null;
    }

    // Skip .env.example and other example files
    if (filePath.includes('.example') || filePath.includes('.sample')) {
      return null;
    }

    for (const pattern of SECRET_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        // Filter out false positives
        const realMatches = matches.filter(match => {
          // Ignore common false positives
          if (match.includes('your-') || match.includes('YOUR_')) {
            return false;
          }
          if (match.includes('example') || match.includes('EXAMPLE')) {
            return false;
          }
          if (match.includes('your-project') || match.includes('YOUR_PROJECT')) {
            return false;
          }
          if (match.length < 30) {
            return false;
          }
          return true;
        });

        if (realMatches.length > 0) {
          return {
            filePath,
            pattern: pattern.source,
            matches: realMatches.slice(0, 3), // Show first 3 matches
            count: realMatches.length,
          };
        }
      }
    }
  } catch (error) {
    // Ignore unreadable files
  }

  return null;
}

/**
 * Recursively get all files in a directory.
 * @param {string} dir - The directory to scan
 * @param {string[]} fileList - The accumulating file list
 * @returns {string[]} - List of all files
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldIgnoreFile(filePath)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Get files that are currently staged for commit.
 * @returns {string[]} - List of staged files
 */
function getStagedFiles() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // If not in a git repo or git command fails, scan all files
    return getAllFiles('.');
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

function main() {
  console.log('🔍 Scanning for secrets...\n');

  // Get files to scan (prefer staged files for pre-commit)
  const filesToScan = getStagedFiles();

  if (filesToScan.length === 0) {
    console.log('✅ No files to scan\n');
    process.exit(0);
  }

  console.log(`Scanning ${filesToScan.length} file(s)...\n`);

  let secretsFound = [];

  filesToScan.forEach(filePath => {
    // Normalize path
    const normalizedPath = filePath.replace(/^\.\//, '');

    // Skip ignored files
    if (shouldIgnoreFile(normalizedPath)) {
      return;
    }

    // Skip files we shouldn't scan
    if (!shouldScanFile(normalizedPath)) {
      return;
    }

    // Check file for secrets
    const secret = checkForSecrets(normalizedPath);
    if (secret) {
      secretsFound.push(secret);
    }
  });

  // Report results
  if (secretsFound.length > 0) {
    console.error('❌ POTENTIAL SECRETS FOUND!\n');
    console.error('The following files may contain API keys, tokens, or other secrets:\n');

    secretsFound.forEach((secret, index) => {
      console.error(`${index + 1}. ${secret.filePath}`);
      console.error(`   Pattern: ${secret.pattern}`);
      console.error(`   Found ${secret.count} potential secret(s)`);

      secret.matches.forEach((match, i) => {
        // Truncate long matches for display
        const truncated = match.length > 50
          ? match.substring(0, 50) + '...'
          : match;
        console.error(`   ${i + 1}. ${truncated}`);
      });

      console.error('');
    });

    console.error('⚠️  COMMIT BLOCKED\n');
    console.error('Please remove or obfuscate any API keys before committing.\n');
    console.error('If these are false positives, add the files to the IGNORE_PATTERNS\n');
    console.error('array in scripts/check-secrets.js\n');

    process.exit(1);
  } else {
    console.log('✅ No secrets detected in staged files\n');
    console.log('Commit safe to proceed!\n');
    process.exit(0);
  }
}

// Run the script
main();
