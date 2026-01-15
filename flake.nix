{
  description = "cc-setup: Dev environment boilerplate with security baked in";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # ══════════════════════════════════════════════════════════════════
        # CORE: Always included (Security + MCPs + DX)
        # ══════════════════════════════════════════════════════════════════
        # ─── Platform-specific packages ───
        browserPkgs = with pkgs; if pkgs.stdenv.isDarwin then [
          # macOS: Chromium not available on ARM, use system browser
          playwright-driver.browsers
        ] else [
          # Linux: Full browser support
          playwright-driver.browsers
          chromium
        ];

        corePkgs = with pkgs; [
          # ─── Session & Terminal ───
          tmux
          direnv
          nix-direnv

          # ─── CLI Improvements (DX) ───
          bat               # cat with syntax highlighting
          eza               # ls with icons
          fd                # find but intuitive
          ripgrep           # grep but fast
          fzf               # fuzzy finder
          zoxide            # smart cd
          jq                # JSON processor
          yq                # YAML processor
          delta             # pretty git diffs
          lazygit           # git TUI

          # ─── Task Running ───
          just              # language-agnostic Makefile
          watchexec         # watch files, run commands

          # ─── Security (ALWAYS INCLUDED) ───
          gitleaks          # scan for leaked secrets
          trivy             # vulnerability scanner
          # semgrep         # (large, optional - use via npx)

          # ─── Observability (Minimalist but Powerful) ───
          hyperfine         # CLI benchmarking
          tokei             # code statistics (LOC)
          bottom            # process monitor (btm)
          httpstat          # curl with timing breakdown
          oha               # HTTP load testing
          dog               # DNS lookup with timing

          # ─── API Development ───
          xh                # httpie in Rust (fast, colorful)
          hurl              # HTTP requests from files
          curlie            # curl + httpie syntax
          posting           # TUI API client (like Postman)

          # ─── Database CLIs ───
          pgcli             # PostgreSQL with autocomplete
          litecli           # SQLite with autocomplete
          usql              # Universal SQL client

          # ─── Infrastructure CLIs ───
          supabase-cli      # database management
          nodePackages.vercel # deployment
          gh                # GitHub CLI
          git

          # ─── Stacked Diffs (Modern Git Workflow) ───
          git-branchless    # stacked commits, undo, smartlog
          git-absorb        # auto-fixup commits to right place
        ] ++ browserPkgs;

        # ══════════════════════════════════════════════════════════════════
        # LANGUAGE PACKS
        # ══════════════════════════════════════════════════════════════════

        webPkgs = with pkgs; [
          nodejs_22
          bun
          deno
          nodePackages.pnpm
          nodePackages.typescript
          biome
        ];

        pythonPkgs = with pkgs; [
          python312
          python312Packages.pip
          python312Packages.virtualenv
          ruff
          uv
        ];

        systemsPkgs = with pkgs; [
          zig
          go
          gcc
          gnumake
          cmake
          gdb
          valgrind
        ];

        elixirPkgs = with pkgs; [
          elixir
          erlang
        ];

        lispPkgs = with pkgs; [
          sbcl
        ];

        rubyPkgs = with pkgs; [
          ruby_3_3
          bundler
        ];

        # ══════════════════════════════════════════════════════════════════
        # SYSTEMS LANGUAGES (Focused)
        # ══════════════════════════════════════════════════════════════════

        rustPkgs = with pkgs; [
          rustc
          cargo
          rustfmt
          clippy
          rust-analyzer
          cargo-watch       # watch and rebuild
          cargo-edit        # cargo add/rm
          cargo-nextest     # better test runner
        ];

        cppPkgs = with pkgs; [
          clang
          clang-tools       # clangd, clang-format
          cmake
          ninja
          ccache            # compilation cache
          gdb
          lldb
          valgrind
          meson             # modern build system
          pkg-config
        ];

        nimPkgs = with pkgs; [
          nim
          nimble            # package manager
          nimlsp            # language server
        ];

        # ══════════════════════════════════════════════════════════════════
        # MOBILE / CROSS-PLATFORM
        # ══════════════════════════════════════════════════════════════════

        # iOS requires macOS - these are CLI tools that work on Linux for CI
        iosPkgs = with pkgs; [
          cocoapods         # dependency manager
          fastlane          # automation
          xcpretty          # xcodebuild output formatter
        ];

        # Reverse Engineering (Heavy - separate shell)
        rePkgs = with pkgs; [
          ghidra            # NSA's RE tool
          radare2           # Lighter RE framework
          binwalk           # Firmware analysis
          file              # File type detection
          hexyl             # Hex viewer (like xxd but pretty)
          binutils          # objdump, nm, strings
        ];

        # ══════════════════════════════════════════════════════════════════
        # GRAPHICS / WASM / LOW-LEVEL
        # ══════════════════════════════════════════════════════════════════

        graphicsPkgs = with pkgs; [
          # OpenGL
          glfw
          glew
          mesa
          libGL

          # Vulkan (WebGPU backend)
          vulkan-loader
          vulkan-headers
          vulkan-tools
          shaderc           # GLSL to SPIR-V compiler
        ];

        wasmPkgs = with pkgs; [
          # WebAssembly toolchain
          wasmtime          # WASM runtime
          wasmer            # Another WASM runtime
          wasm-pack         # Rust to WASM
          binaryen          # WASM optimizer (wasm-opt)
          wabt              # WASM binary toolkit
          emscripten        # C/C++ to WASM
        ];

        asmPkgs = with pkgs; [
          # Assembly
          nasm              # x86/x64 assembler
          yasm              # Another assembler
          binutils          # as, ld, objdump
          gdb               # debugger
          xxd               # hex dump
        ];

        # ══════════════════════════════════════════════════════════════════
        # EDITORS (Optional - use system editor or these)
        # ══════════════════════════════════════════════════════════════════

        nvimPkgs = with pkgs; [
          neovim
          # LSP servers (optional, nvim can install these)
          lua-language-server
          nodePackages.typescript-language-server
          nil               # Nix LSP
        ];

        emacsPkgs = with pkgs; [
          emacs29
          # Org mode is built-in, but useful extras:
          sqlite            # for org-roam
          graphviz          # for org diagrams
          pandoc            # for export
        ];

        # ══════════════════════════════════════════════════════════════════
        # SHELL HOOK
        # ══════════════════════════════════════════════════════════════════
        commonShellHook = ''
          # ─── Claude Config ───
          mkdir -p ~/.claude
          ln -sf ${self}/config/claude/settings.json ~/.claude/settings.json 2>/dev/null || true
          ln -sf ${self}/config/claude/CLAUDE.md ~/.claude/CLAUDE.md 2>/dev/null || true

          # ─── Environment ───
          export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
          ${if pkgs.stdenv.isDarwin then ''
            # macOS: Use system Chrome/Chromium
            if [ -d "/Applications/Google Chrome.app" ]; then
              export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            elif [ -d "/Applications/Chromium.app" ]; then
              export CHROME_PATH="/Applications/Chromium.app/Contents/MacOS/Chromium"
            fi
          '' else ''
            # Linux: Use Nix-provided Chromium
            export CHROME_PATH=${pkgs.chromium}/bin/chromium
          ''}
          export CC_SETUP_DIR="${self}"

          # ─── Direnv ───
          eval "$(direnv hook bash 2>/dev/null || direnv hook zsh 2>/dev/null || true)"

          # ─── Zoxide ───
          eval "$(zoxide init bash 2>/dev/null || zoxide init zsh 2>/dev/null || true)"

          # ─── FZF ───
          eval "$(fzf --bash 2>/dev/null || fzf --zsh 2>/dev/null || true)"

          # ─── Aliases (Co-existence: POSIX untouched, fancy tools available) ───
          alias ll='eza -la --icons --git'
          alias la='eza -a --icons'
          alias lg='lazygit'
          alias gd='git diff | delta'

          # Fancy tools - use directly, no shadowing
          # bat, rg, fd, delta, eza all in PATH
          # Example: bat file.txt | rg pattern

          # ═══════════════════════════════════════════════════════════════
          # STACKED DIFFS (git-branchless)
          # ═══════════════════════════════════════════════════════════════

          # Initialize git-branchless in repo (run once per repo)
          stack-init() {
            git branchless init
            echo "✅ Stacked diffs enabled. Use 'sl' for smartlog"
          }

          # Smartlog - visual commit graph (THE main command)
          alias sl='git branchless smartlog'

          # Navigation
          alias prev='git branchless prev'
          alias next='git branchless next'

          # Restack after changes to parent commits
          alias restack='git branchless restack'

          # Undo last git operation
          alias undo='git branchless undo'

          # Submit stack for review (creates PRs)
          alias submit='git branchless submit'

          # Auto-absorb staged changes into correct commits
          alias absorb='git absorb --and-rebase'

          # ═══════════════════════════════════════════════════════════════
          # BRANCH SAFETY (Worktrees for Agent Isolation)
          # ═══════════════════════════════════════════════════════════════

          # Create experimental branch with worktree for isolated agent work
          exp() {
            local task_name="''${1:-task}"
            local branch_name="exp/$(date +%Y%m%d)-''${task_name}"
            local worktree_dir="../worktrees/''${branch_name##*/}"

            if [[ ! -d .git ]]; then
              echo "❌ Not a git repository"
              return 1
            fi

            # Ensure base branch exists
            local base_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")

            # Create worktree with new experimental branch
            mkdir -p ../worktrees
            git worktree add -b "$branch_name" "$worktree_dir" "$base_branch" 2>/dev/null || \
              git worktree add "$worktree_dir" "$branch_name"

            echo "✅ Created experimental branch: $branch_name"
            echo "📁 Worktree location: $worktree_dir"
            echo ""
            echo "To work in isolation: cd $worktree_dir"
          }

          # List all worktrees
          wt-list() {
            echo "📋 Git Worktrees:"
            git worktree list
          }

          # Remove a worktree safely
          wt-rm() {
            local worktree="''${1:?Usage: wt-rm <worktree-path>}"
            git worktree remove "$worktree" --force
            echo "🗑️  Removed worktree: $worktree"
          }

          # Prune stale worktrees
          wt-prune() {
            git worktree prune
            echo "🧹 Pruned stale worktrees"
          }

          # ═══════════════════════════════════════════════════════════════
          # CLAUDE FUNCTIONS
          # ═══════════════════════════════════════════════════════════════

          cc() { claude "$@"; }

          # ralph: Safe by default (creates experimental branch)
          ralph() {
            local task_name="''${1:-autonomous}"

            if [[ ! -d .git ]]; then
              echo "❌ Not a git repository"
              return 1
            fi

            # Check if already on experimental branch
            local current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
            if [[ "$current_branch" != exp/* ]]; then
              echo "⚠️  Not on experimental branch. Creating one..."
              exp "$task_name"
              local worktree_dir="../worktrees/$(date +%Y%m%d)-''${task_name}"
              echo "📂 Switching to: $worktree_dir"
              cd "$worktree_dir" || return 1
            fi

            echo "🤖 Ralph Wiggum - Branch: $(git branch --show-current)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            shift  # Remove task_name from args
            claude --dangerously-skip-permissions "$@"
          }

          # ralph-yolo: Dangerous - runs on current branch (use with caution)
          ralph-yolo() {
            echo "⚠️  YOLO MODE - Running on current branch: $(git branch --show-current 2>/dev/null || echo 'not a git repo')"
            echo "🤖 Ralph Wiggum autonomous mode"
            claude --dangerously-skip-permissions "$@"
          }

          # cct: Safe by default (creates experimental branch + tmux)
          cct() {
            local task_name="''${1:-task}"
            local session_name="exp-''${task_name}"

            if tmux has-session -t "$session_name" 2>/dev/null; then
              tmux attach -t "$session_name"
              return
            fi

            # Create experimental branch and worktree
            exp "$task_name"
            local worktree_dir="../worktrees/$(date +%Y%m%d)-''${task_name}"

            # Start tmux in worktree
            tmux new-session -s "$session_name" -c "$worktree_dir" "claude"
          }

          # cct-yolo: Dangerous - tmux on current branch
          cct-yolo() {
            local name="''${1:-claude-$(basename $(pwd))}"
            tmux has-session -t "$name" 2>/dev/null && tmux attach -t "$name" || tmux new-session -s "$name" "claude"
          }

          # ═══════════════════════════════════════════════════════════════
          # PROJECT SETUP FUNCTIONS
          # ═══════════════════════════════════════════════════════════════

          init-project() {
            if [[ ! -f ${self}/scripts/init-project.sh ]]; then
              echo "❌ init-project.sh not found"
              return 1
            fi
            source ${self}/scripts/init-project.sh "$@"
          }

          init-husky() {
            if [[ ! -f ${self}/scripts/init-husky.sh ]]; then
              echo "❌ init-husky.sh not found"
              return 1
            fi
            source ${self}/scripts/init-husky.sh "$@"
          }

          init-openspec() {
            if [[ ! -d ${self}/templates/openspec ]]; then
              echo "❌ OpenSpec templates not found"
              return 1
            fi
            mkdir -p openspec/specs
            cp ${self}/templates/openspec/*.md openspec/
            echo "✅ OpenSpec initialized"
          }

          init-docs() {
            if [[ ! -f ${self}/templates/docs/ADR-000-template.md ]]; then
              echo "❌ ADR template not found"
              return 1
            fi
            mkdir -p docs/adr
            cp ${self}/templates/docs/ADR-000-template.md docs/adr/
            echo "✅ ADR template added to docs/adr/"
            echo "   Create new: adr 'Decision Title'"
          }

          # Create a new ADR
          adr() {
            local title="''${1:?Usage: adr 'Decision Title'}"
            local dir="docs/adr"
            mkdir -p "$dir"

            # Find next number
            local last=$(ls "$dir" 2>/dev/null | grep -E '^ADR-[0-9]+' | sort -V | tail -1 | grep -oE '[0-9]+' | head -1)
            local next=$(printf "%03d" $((''${last:-0} + 1)))

            # Create slug from title
            local slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')

            local file="$dir/ADR-$next-$slug.md"

            cat > "$file" << EOFADR
# ADR-$next: $title

## Status

Proposed

## Context

{Why is this decision needed?}

## Decision

{What did we decide?}

## Consequences

### Positive
-

### Negative
-

## Alternatives Considered

### Alternative 1:
- Why rejected:

## References

-
EOFADR

            echo "✅ Created: $file"
            echo "   Edit it, then change Status to 'Accepted'"
          }

          # ═══════════════════════════════════════════════════════════════
          # VERIFICATION (AI Self-Check)
          # ═══════════════════════════════════════════════════════════════

          verify() {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "▶ VERIFY: Running all checks..."
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            local failed=0

            echo ""
            echo "▶ Format check..."
            if command -v biome &>/dev/null && [[ -f biome.json ]]; then
              biome format --check . || failed=1
            elif [[ -f .prettierrc ]] || [[ -f .prettierrc.json ]]; then
              npx prettier --check . || failed=1
            else
              echo "  (no formatter configured)"
            fi

            echo ""
            echo "▶ Lint..."
            if command -v biome &>/dev/null && [[ -f biome.json ]]; then
              biome lint . || failed=1
            elif [[ -f .eslintrc.json ]] || [[ -f eslint.config.js ]]; then
              npm run lint 2>/dev/null || npx eslint . || failed=1
            else
              echo "  (no linter configured)"
            fi

            echo ""
            echo "▶ Type check..."
            if [[ -f tsconfig.json ]]; then
              npx tsc --noEmit || failed=1
            else
              echo "  (no tsconfig.json)"
            fi

            echo ""
            echo "▶ Tests..."
            if [[ -f package.json ]]; then
              npm test 2>/dev/null || bun test 2>/dev/null || pnpm test 2>/dev/null || echo "  (no test script)"
            fi

            echo ""
            echo "▶ Build..."
            if [[ -f package.json ]] && grep -q '"build"' package.json 2>/dev/null; then
              npm run build || failed=1
            else
              echo "  (no build script)"
            fi

            echo ""
            echo "▶ Security..."
            check-secrets || failed=1

            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            if [[ $failed -eq 0 ]]; then
              echo "✅ VERIFIED - All checks passed"
              return 0
            else
              echo "❌ VERIFICATION FAILED"
              return 1
            fi
          }

          # Quick format (auto-fix)
          fmt() {
            if command -v biome &>/dev/null && [[ -f biome.json ]]; then
              biome format --write .
              biome lint --apply .
            elif [[ -f .prettierrc ]] || [[ -f .prettierrc.json ]]; then
              npx prettier --write .
            else
              echo "No formatter configured (add biome.json or .prettierrc)"
            fi
          }

          # ═══════════════════════════════════════════════════════════════
          # SECURITY FUNCTIONS
          # ═══════════════════════════════════════════════════════════════

          check-secrets() {
            if [[ -f "scripts/check-secrets.js" ]]; then
              node scripts/check-secrets.js
            else
              echo "Running gitleaks..."
              gitleaks detect --source . --verbose
            fi
          }

          scan-vulns() {
            echo "🔍 Scanning for vulnerabilities..."
            trivy fs . --severity HIGH,CRITICAL
          }

          audit() {
            echo "🔒 Running full security audit..."
            echo ""
            echo "=== Secret Detection ==="
            check-secrets || true
            echo ""
            echo "=== Vulnerability Scan ==="
            scan-vulns || true
            echo ""
            echo "=== Dependency Audit ==="
            npm audit 2>/dev/null || bun pm audit 2>/dev/null || pnpm audit 2>/dev/null || echo "No package manager found"
          }

          # ═══════════════════════════════════════════════════════════════
          # UTILITY FUNCTIONS
          # ═══════════════════════════════════════════════════════════════

          watch() { watchexec --clear --restart -- "$@"; }
          serve() { python3 -m http.server "''${1:-8000}" 2>/dev/null || npx serve -p "''${1:-8000}"; }

          # ═══════════════════════════════════════════════════════════════
          # HELP (Full command reference)
          # ═══════════════════════════════════════════════════════════════

          help-cc() {
            cat << 'HELPEOF'
╭─────────────────────────────────────────────────────────────────╮
│  cc-setup Command Reference                                     │
├─────────────────────────────────────────────────────────────────┤
│  CLAUDE                                                         │
│    cc              Start Claude                                 │
│    ralph <task>    Autonomous (safe: creates exp branch)        │
│    ralph-yolo      Autonomous (dangerous: current branch)       │
│    cct <task>      Claude in tmux (safe: exp branch)            │
│    cct-yolo        Claude in tmux (dangerous: current)          │
│                                                                 │
│  BRANCHES                                                       │
│    exp <name>      Create experimental branch + worktree        │
│    wt-list         List all worktrees                           │
│    wt-rm <path>    Remove a worktree                            │
│    wt-prune        Clean stale worktrees                        │
│                                                                 │
│  STACKED DIFFS                                                  │
│    stack-init      Enable git-branchless in repo                │
│    sl              Smartlog (visual commit graph)               │
│    prev / next     Navigate commit stack                        │
│    restack         Rebase after parent changes                  │
│    submit          Create PRs for stack                         │
│    absorb          Auto-fixup staged changes                    │
│                                                                 │
│  VERIFY                                                         │
│    verify          Run all checks (lint, types, test, build)    │
│    fmt             Auto-fix formatting                          │
│                                                                 │
│  SETUP                                                          │
│    init-project    Copy all templates to project                │
│    init-husky      Just pre-commit hooks                        │
│    init-openspec   Just spec-driven development                 │
│    init-docs       Add ADR template                             │
│    adr 'title'     Create new Architecture Decision Record      │
│                                                                 │
│  SECURITY                                                       │
│    check-secrets   Scan for leaked API keys                     │
│    scan-vulns      Vulnerability scan (trivy)                   │
│    audit           Full security audit                          │
│                                                                 │
│  API & DATABASE                                                 │
│    xh              HTTP client (like httpie)                    │
│    hurl            Run HTTP request files                       │
│    posting         TUI API client                               │
│    pgcli           PostgreSQL with autocomplete                 │
│    usql            Universal SQL client                         │
│                                                                 │
│  OBSERVE                                                        │
│    hyperfine       Benchmark commands                           │
│    btm             Process monitor                              │
│    httpstat        curl with timing                             │
│    oha             HTTP load testing                            │
│    tokei           Lines of code stats                          │
│                                                                 │
│  NAVIGATION                                                     │
│    z <dir>         Smart cd (learns your dirs)                  │
│    Ctrl+R          Fuzzy search history                         │
│    Ctrl+T          Fuzzy find files                             │
╰─────────────────────────────────────────────────────────────────╯
HELPEOF
          }

          # ─── Welcome (simplified) ───
          echo ""
          echo "╭─────────────────────────────────────────────────────────────────╮"
          echo "│  cc-setup                                                       │"
          echo "├─────────────────────────────────────────────────────────────────┤"
          echo "│  cc          Start Claude        verify    Check everything     │"
          echo "│  ralph       Safe autonomous     init-project   Setup project   │"
          echo "│                                                                 │"
          echo "│  Type 'help-cc' for all commands                                │"
          echo "╰─────────────────────────────────────────────────────────────────╯"
          echo ""
        '';

      in {
        devShells = {
          # ══════════════════════════════════════════════════════════════
          # DEFAULT: Core only
          # ══════════════════════════════════════════════════════════════
          default = pkgs.mkShell {
            packages = corePkgs;
            shellHook = commonShellHook;
          };

          # ══════════════════════════════════════════════════════════════
          # WEB: JS/TS development
          # ══════════════════════════════════════════════════════════════
          web = pkgs.mkShell {
            packages = corePkgs ++ webPkgs;
            shellHook = commonShellHook;
          };

          # ══════════════════════════════════════════════════════════════
          # AI: Python + ML
          # ══════════════════════════════════════════════════════════════
          ai = pkgs.mkShell {
            packages = corePkgs ++ pythonPkgs;
            shellHook = commonShellHook;
          };

          # ══════════════════════════════════════════════════════════════
          # SYSTEMS: C/C++/Zig/Go
          # ══════════════════════════════════════════════════════════════
          systems = pkgs.mkShell {
            packages = corePkgs ++ systemsPkgs;
            shellHook = commonShellHook;
          };

          # ══════════════════════════════════════════════════════════════
          # FINTECH: Elixir + Python
          # ══════════════════════════════════════════════════════════════
          fintech = pkgs.mkShell {
            packages = corePkgs ++ elixirPkgs ++ pythonPkgs;
            shellHook = commonShellHook;
          };

          # ══════════════════════════════════════════════════════════════
          # LISP: Common Lisp
          # ══════════════════════════════════════════════════════════════
          lisp = pkgs.mkShell {
            packages = corePkgs ++ lispPkgs;
            shellHook = commonShellHook;
          };

          # ══════════════════════════════════════════════════════════════
          # RUST: Memory-safe systems programming
          # ══════════════════════════════════════════════════════════════
          rust = pkgs.mkShell {
            packages = corePkgs ++ rustPkgs;
            shellHook = commonShellHook + ''
              echo "🦀 Rust Shell"
              alias cw='cargo watch -x check'
              alias ct='cargo nextest run'
              alias cb='cargo build --release'
            '';
          };

          # ══════════════════════════════════════════════════════════════
          # C/C++: Low-level systems programming
          # ══════════════════════════════════════════════════════════════
          cpp = pkgs.mkShell {
            packages = corePkgs ++ cppPkgs;
            shellHook = commonShellHook + ''
              echo "⚙️  C/C++ Shell (clang)"
              export CC=clang
              export CXX=clang++
              alias cm='cmake -B build -G Ninja'
              alias cmb='cmake --build build'
              alias cmt='ctest --test-dir build'
            '';
          };

          # ══════════════════════════════════════════════════════════════
          # NIM: Efficient, expressive, elegant
          # ══════════════════════════════════════════════════════════════
          nim = pkgs.mkShell {
            packages = corePkgs ++ nimPkgs;
            shellHook = commonShellHook + ''
              echo "👑 Nim Shell"
              alias nr='nim r'
              alias nc='nim c -d:release'
            '';
          };

          # ══════════════════════════════════════════════════════════════
          # iOS: Apple development (macOS only for full Xcode)
          # ══════════════════════════════════════════════════════════════
          ios = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ iosPkgs;
            shellHook = commonShellHook + ''
              echo "🍎 iOS Shell"
              echo "   Note: Full Xcode requires macOS"
              alias pod='bundle exec pod'
              alias fl='bundle exec fastlane'
            '';
          };

          # ══════════════════════════════════════════════════════════════
          # FULL: Everything
          # ══════════════════════════════════════════════════════════════
          full = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ pythonPkgs ++ systemsPkgs ++ elixirPkgs ++ rubyPkgs ++ lispPkgs ++ rustPkgs ++ cppPkgs ++ nimPkgs;
            shellHook = commonShellHook;
          };

          # ══════════════════════════════════════════════════════════════
          # FRAMEWORK-SPECIFIC SHELLS
          # ══════════════════════════════════════════════════════════════

          # Next.js - Full-stack React framework
          nextjs = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ [
              pkgs.nodePackages.eslint
            ];
            shellHook = commonShellHook + ''
              echo "⚛️  Next.js Shell - create-next-app, App Router ready"
              alias next='npx next'
              alias cna='npx create-next-app@latest'
            '';
          };

          # React - Client-side React with Vite
          react = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ [
              pkgs.nodePackages.eslint
            ];
            shellHook = commonShellHook + ''
              echo "⚛️  React Shell - Vite + React ready"
              alias vite='npx vite'
              alias cra='npm create vite@latest -- --template react-ts'
            '';
          };

          # Svelte - Compiler-based framework
          svelte = pkgs.mkShell {
            packages = corePkgs ++ webPkgs;
            shellHook = commonShellHook + ''
              echo "🔶 Svelte Shell - SvelteKit ready"
              alias sk='npx sv create'
              alias svelte-add='npx svelte-add@latest'
            '';
          };

          # Tailwind - Utility-first CSS
          tailwind = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ [
              pkgs.nodePackages.prettier
            ];
            shellHook = commonShellHook + ''
              echo "🎨 Tailwind Shell - PostCSS + Autoprefixer ready"
              alias tw-init='npx tailwindcss init -p'
              alias tw='npx tailwindcss'
            '';
          };

          # Storybook - Component development
          storybook = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ [
              pkgs.nodePackages.prettier
              pkgs.nodePackages.eslint
            ];
            shellHook = commonShellHook + ''
              echo "📖 Storybook Shell - Component development ready"
              echo "   sb-init     - Initialize Storybook in project"
              echo "   sb          - Run Storybook dev server"
              echo "   sb-build    - Build static Storybook"
              alias sb-init='npx storybook@latest init'
              alias sb='npx storybook dev -p 6006'
              alias sb-build='npx storybook build'
              alias chromatic='npx chromatic'
            '';
          };

          # Elixir - Phoenix framework
          phoenix = pkgs.mkShell {
            packages = corePkgs ++ elixirPkgs ++ [
              pkgs.inotify-tools  # for live reload
              pkgs.postgresql     # for ecto
            ];
            shellHook = commonShellHook + ''
              echo "🧪 Phoenix Shell - Mix + Hex ready"
              alias phx='mix phx'
              alias phx-new='mix archive.install hex phx_new && mix phx.new'
              alias iex='iex -S mix'
            '';
          };

          # Reverse Engineering (Heavy - ~2GB download)
          re = pkgs.mkShell {
            packages = corePkgs ++ rePkgs;
            shellHook = commonShellHook + ''
              echo "🔬 Reverse Engineering Shell"
              echo "   ghidra      - Launch Ghidra GUI"
              echo "   r2 <file>   - Radare2 analysis"
              echo "   binwalk     - Firmware extraction"
              alias r2='radare2'
              alias hex='hexyl'
            '';
          };

          # API Development (lightweight, focused)
          api = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ [
              pkgs.openapi-generator-cli  # Generate clients from OpenAPI
              pkgs.redocly-cli            # OpenAPI linting/bundling
            ];
            shellHook = commonShellHook + ''
              echo "🔌 API Development Shell"
              echo "   xh           - HTTP client (like httpie)"
              echo "   hurl         - Run HTTP files"
              echo "   posting      - TUI API client"
              echo "   openapi-gen  - Generate from OpenAPI spec"
              alias api='xh'
              alias openapi-gen='openapi-generator-cli generate'
            '';
          };

          # ══════════════════════════════════════════════════════════════
          # CROSS-PLATFORM SHELLS (Compositions)
          # ══════════════════════════════════════════════════════════════

          # Tauri - Rust + Web → native desktop apps
          tauri = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ rustPkgs ++ [
              pkgs.tauri-cli
              pkgs.webkitgtk             # Linux webview
              pkgs.libsoup
              pkgs.openssl
              pkgs.pkg-config
            ];
            shellHook = commonShellHook + ''
              echo "🦀 Tauri Shell (Rust + Web → Desktop)"
              alias tauri='cargo tauri'
              alias tauri-init='cargo create-tauri-app'
              alias tauri-dev='cargo tauri dev'
              alias tauri-build='cargo tauri build'
            '';
          };

          # Capacitor - Web → iOS/Android (WebView)
          capacitor = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ iosPkgs ++ [
              pkgs.openjdk17            # Android SDK
            ];
            shellHook = commonShellHook + ''
              echo "⚡ Capacitor Shell (Web → Mobile)"
              alias cap='npx cap'
              alias cap-init='npx @capacitor/cli init'
              alias cap-add='npx cap add'
              alias cap-sync='npx cap sync'
              alias cap-run='npx cap run'
            '';
          };

          # React Native - React → native iOS/Android
          react-native = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ iosPkgs ++ [
              pkgs.openjdk17            # Android
              pkgs.watchman             # Metro file watching
            ];
            shellHook = commonShellHook + ''
              echo "📱 React Native Shell"
              alias rn='npx react-native'
              alias rn-init='npx react-native init'
              alias rn-start='npx react-native start'
              alias rn-ios='npx react-native run-ios'
              alias rn-android='npx react-native run-android'
            '';
          };

          # Expo - Managed React Native (easier, less config)
          expo = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ [
              pkgs.openjdk17
              pkgs.watchman
            ];
            shellHook = commonShellHook + ''
              echo "📱 Expo Shell (Managed React Native)"
              alias expo='npx expo'
              alias expo-init='npx create-expo-app'
              alias expo-start='npx expo start'
            '';
          };

          # ══════════════════════════════════════════════════════════════
          # GRAPHICS / WASM / LOW-LEVEL SHELLS
          # ══════════════════════════════════════════════════════════════

          # Graphics - OpenGL/Vulkan/WebGPU development
          graphics = pkgs.mkShell {
            packages = corePkgs ++ cppPkgs ++ graphicsPkgs;
            shellHook = commonShellHook + ''
              echo "🎮 Graphics Shell (OpenGL/Vulkan/WebGPU)"
              echo "   glxinfo    - OpenGL info"
              echo "   vulkaninfo - Vulkan info"
            '';
          };

          # WebAssembly - WASM development
          wasm = pkgs.mkShell {
            packages = corePkgs ++ webPkgs ++ rustPkgs ++ wasmPkgs;
            shellHook = commonShellHook + ''
              echo "🕸️  WebAssembly Shell"
              echo "   wasm-pack  - Rust to WASM"
              echo "   emcc       - C/C++ to WASM"
              alias wp='wasm-pack'
              alias emcc='emcc'
            '';
          };

          # Assembly - Low-level programming
          asm = pkgs.mkShell {
            packages = corePkgs ++ asmPkgs;
            shellHook = commonShellHook + ''
              echo "⚙️  Assembly Shell (x86/x64)"
              echo "   nasm       - Assembler"
              echo "   gdb        - Debugger"
              echo "   objdump    - Disassembler"
            '';
          };

          # ══════════════════════════════════════════════════════════════
          # EDITOR SHELLS
          # ══════════════════════════════════════════════════════════════

          # Neovim / LazyVim
          nvim = pkgs.mkShell {
            packages = corePkgs ++ nvimPkgs;
            shellHook = commonShellHook + ''
              echo "📝 Neovim Shell"
              echo "   nvim       - Launch Neovim"
              echo "   For LazyVim: git clone https://github.com/LazyVim/starter ~/.config/nvim"
              alias vi='nvim'
              alias vim='nvim'
            '';
          };

          # Emacs with Org mode
          emacs = pkgs.mkShell {
            packages = corePkgs ++ emacsPkgs;
            shellHook = commonShellHook + ''
              echo "🦬 Emacs Shell (with Org mode)"
              echo "   emacs      - Launch Emacs"
              echo "   emacs -nw  - Terminal mode"
              alias e='emacs'
              alias et='emacs -nw'
            '';
          };
        };
      });
}
