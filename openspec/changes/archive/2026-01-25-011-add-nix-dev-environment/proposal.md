# Change: Add Nix Development Environment

## Why
The project suffers from Node.js version drift (Vercel shows 20.x vs 24.x mismatch). Different developers and CI environments end up with different Node, pnpm, and Python versions, causing "works on my machine" bugs and inconsistent builds. Nix provides reproducible, declarative development environments that guarantee identical tooling across all machines.

## What Changes
- **BREAKING**: None - Nix is additive, existing workflows continue to work
- Add `flake.nix` for reproducible dev shell with pinned versions
- Add `shell.nix` for non-flake Nix users
- Add `.envrc` for automatic environment activation (direnv)
- Pin exact versions: Node.js 20.x, pnpm 9.x, Python 3.12, Playwright dependencies
- Remove Docker dependency for local development (DSPy service runs natively in Nix)
- Update documentation with Nix setup instructions

## Impact
- Affected specs: None (tooling-only change)
- Affected code: Root-level config files only
- New files: `flake.nix`, `flake.lock`, `shell.nix`, `.envrc`
- Modified files: `README.md`, `CLAUDE.md`

## Benefits
1. **Version Consistency**: Same Node/pnpm/Python everywhere
2. **Zero Config**: `nix develop` or `direnv allow` - done
3. **Fast Onboarding**: New devs get exact environment in one command
4. **CI Parity**: Same Nix shell in GitHub Actions
5. **No Docker Overhead**: Native execution, faster startup
6. **Playwright Ready**: System dependencies pre-installed

## Non-Goals
- Not replacing Vercel deployment (Vercel manages its own Node)
- Not replacing HuggingFace Spaces for DSPy (production stays on HF)
- Not requiring Nix (existing npm/pnpm workflows remain valid)
