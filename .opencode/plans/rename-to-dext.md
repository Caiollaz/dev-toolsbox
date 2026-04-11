# Rename Plan: dev-toolsbox → DEXT

## Branding Rules
- UI / logos / section labels: **DEXT** (all caps)
- Package names / file refs / URLs: **dext** (lowercase)
- Frame names (app.pen): **Dext** (PascalCase)
- Rust crate: **dext** (snake_case stays `dext`)
- Logo mark: Keep **D**

## Storage: No migration (history resets)

---

## Step 1: Source Code (5 files)

### src/components/layout/sidebar.tsx
- Line 43: `DEV-TOOLSBOX` → `DEXT`

### src/components/tools/http-runner-tool.tsx
- Line 315: `dev-toolsbox` → `DEXT`

### src/services/storage.service.ts
- Line 3: `dev-toolsbox-history.json` → `dext-history.json`

### src/styles/global.css
- Line 2: `DEV-TOOLSBOX` → `DEXT` (comment)

### index.html
- Line 7: `<title>dev-toolsbox</title>` → `<title>dext</title>`

---

## Step 2: Config Files (6 files)

### package.json
- Line 2: `"name": "dev-toolsbox"` → `"name": "dext"`

### src-tauri/tauri.conf.json
- Line 3: `"productName": "dev-toolsbox"` → `"productName": "dext"`
- Line 5: `"identifier": "com.devtoolsbox.app"` → `"identifier": "com.dext.app"`
- Line 16: `"title": "dev-toolsbox"` → `"title": "dext"`
- Line 58: `"copyright": "Copyright 2026 dev-toolsbox"` → `"copyright": "Copyright 2026 dext"`

### src-tauri/Cargo.toml
- Line 2: `name = "dev-toolsbox"` → `name = "dext"`
- Line 5: `authors = ["dev-toolsbox"]` → `authors = ["dext"]`
- Line 9: `name = "dev_toolsbox_lib"` → `name = "dext_lib"`

### src-tauri/src/main.rs
- Line 4: `dev_toolsbox_lib::run()` → `dext_lib::run()`

### src-tauri/capabilities/default.json
- Line 3: `"description": "Default capabilities for dev-toolsbox"` → `"description": "Default capabilities for dext"`

### .github/workflows/release.yml
- Line 44: `release_name: dev-toolsbox` → `release_name: dext`
- Line 46: `## dev-toolsbox` → `## dext`

---

## Step 3: Landing Page (2 files)

### docs/index.html (~20 replacements)
All `dev-toolsbox` → `dext`, `DEV-TOOLSBOX` → `DEXT`
GitHub URLs: `Caiollaz/dev-toolsbox` → `Caiollaz/dext`
Key replacements:
- `<title>dev-toolsbox` → `<title>DEXT`
- og:title, og:url
- Logo texts (navbar, mock sidebar, footer)
- `// WHY DEV-TOOLSBOX` → `// WHY DEXT`
- Download/GitHub link hrefs
- Footer copyright

### docs/style.css
- Line 2: comment `dev-toolsbox` → `dext`

---

## Step 4: Documentation (5 files)

### AGENTS.md
- All `dev-toolsbox` → `dext`, `DEV-TOOLSBOX` → `DEXT`
- GitHub URLs updated
- NOTE: Will need broader rewrite since name appears ~4 times plus context

### docs/architecture.md
- Lines 5, 24, 138: `dev-toolsbox` → `dext`

### docs/adding-tools.md
- Line 3: `dev-toolsbox` → `dext`

### docs/design-system.md
- Lines 134, 164: update references

### .opencode/plans/landing-page.md
- 5 occurrences

---

## Step 5: Design File (app.pen via Pencil MCP)

### Sidebar logos (11 text nodes — "DEV-TOOLSBOX" → "DEXT")
- Reusable Sidebar + 10 screen inline sidebars
- Need to find all text nodes with content "DEV-TOOLSBOX" and update

### Frame names (10 frames — "DevToolsBox — X" → "Dext — X")
- Base64: `ynldz`, JWT: `RxEXO`, UUID: `IcWj0`, JSON Diff: `6Ig1Z`
- Hash: frame after `hgDbM`, URL Encoder: `jzKNv`, Timestamp: `POEnV`
- Regex: `ZgawY`, JSON Formatter: `bQxC5`, HTTP Runner: `ea7nu`

### Landing page in app.pen
- Navbar logo: "DEV-TOOLSBOX" → "DEXT"
- Mock sidebar logo: "DEV-TOOLSBOX" → "DEXT"
- Section label: "// WHY DEV-TOOLSBOX" → "// WHY DEXT"
- CTA text: "Download dev-toolsbox" → "Download DEXT"
- Footer logo text: "dev-toolsbox" → "DEXT"
- Copyright: "dev-toolsbox" → "DEXT"
- Hello sample text: "Hello, dev-toolsbox!" → "Hello, DEXT!"

### Design System frame
- Name: "Design System — dev-toolsbox" → "Design System — DEXT"
- Title content: "dev-toolsbox\nDesign System" → "DEXT\nDesign System"

### Sample JSON data (in JSON Diff & JSON Formatter screens)
- `"name": "dev-toolsbox"` → `"name": "dext"` (4 occurrences)

---

## Step 6: Build & Verify
- `npm run build` — TypeScript + Vite
- `npm install` — regenerate package-lock.json

---

## Step 7: GitHub Repo Rename + Release
- `gh repo rename dext`
- `git remote set-url origin https://github.com/Caiollaz/dext.git`
- Commit all changes
- Push
- Tag `v2.0.2` and push tag
