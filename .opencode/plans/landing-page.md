# Landing Page Plan — dext

## Goal
Create a static landing page in `website/` folder using pure HTML + CSS, following the exact design from `app.pen` frame `nf3al`. Ready for GitHub Pages deployment.

## Files to Create

### 1. `website/index.html`
Single HTML file with all 6 sections:

**Section 1 — Navbar**
- Logo mark (green square with "D") + "DEXT" text
- Nav links: FEATURES, TOOLS, DOWNLOAD, GITHUB (anchor scroll + external)
- Download CTA button (green) + "v1.0.0" version text
- Mobile: hamburger menu toggle

**Section 2 — Hero**
- Badge: green dot + "LOCAL-FIRST DEV TOOLS — v1.0.0 NOW AVAILABLE"
- Title: "Developer tools. Simplified." (Space Grotesk 72px → 40px mobile)
- Subtitle: tool descriptions
- 2 buttons: "DOWNLOAD FOR FREE" (green primary) + "VIEW ON GITHUB" (secondary)
- Platform list: "Windows / macOS / Linux"
- App Preview mockup: window bar (3 dots) + sidebar (4 nav items) + content area (Base64 tool mock with input/output)

**Section 3 — Features** (`#features`, `#tools`)
- Section label: "// FEATURES" (green, uppercase)
- Title: "4 essential tools. Zero configuration." (Space Grotesk 40px)
- 2x2 grid of feature cards:
  - JWT Decoder (key-round icon)
  - Base64 (file-code icon)
  - UUID Generator (# text icon)
  - JSON Diff (<> text icon)
- Each card: icon box (48x48, green tint) + title + description

**Section 4 — Why** (`#why`)
- Section label: "// WHY DEXT"
- Title: "Built different."
- 3 columns:
  - Local First (shield icon)
  - Lightning Fast (zap icon)
  - Open Source ({ } text icon)
- Each column: centered, icon + title + description

**Section 5 — Download CTA** (`#download`)
- Section label: "// DOWNLOAD"
- Title: "Ready to simplify your workflow?" (Space Grotesk 48px)
- 3 buttons: Windows (green primary), macOS (secondary), Linux (secondary)
- Version info: "v1.0.0 · ~8MB · MIT License"
- All buttons link to GitHub Releases

**Section 6 — Footer**
- Top: Logo + links (GitHub, Documentation, License, Releases)
- 1px divider
- Bottom: copyright + "Built with Tauri + React + TypeScript"

### 2. `website/style.css`
Complete stylesheet with:

**CSS Custom Properties (matching Pencil design tokens):**
```
--bg-main: #0C0C0C
--bg-sidebar: #080808
--bg-card: #0A0A0A
--bg-elevated: #141414
--accent: #00FF88
--accent-dim: #00FF8810
--accent-border: #00FF8840
--accent-bg: #00FF8815
--accent-muted: #00FF8830
--accent-glow: #00FF8866
--text-primary: #FFFFFF
--text-secondary: #6a6a6a
--text-muted: #8A8A8A
--border: #2f2f2f
--warning: #FF8800
--error: #FF4444
--font-mono: 'JetBrains Mono', monospace
--font-heading: 'Space Grotesk', sans-serif
```

**Responsive breakpoints:**
- Desktop: 1440px design (max-width container)
- Tablet: ≤1024px (2x1 feature grid, smaller fonts)
- Mobile: ≤768px (single column, stacked buttons, hamburger nav, reduced padding)
- Small mobile: ≤480px (further reductions)

**Key responsive behaviors:**
- Navbar: horizontal → hamburger menu on mobile
- Hero title: 72px → 48px → 36px
- Feature grid: 2x2 → 2x1 → 1x1
- Why columns: 3 cols → 1 col
- CTA buttons: horizontal → stacked
- App preview: hidden on small mobile (too complex to scale)
- Padding: 80px → 40px → 24px

### 3. `website/favicon.svg`
Simple SVG favicon: green (#00FF88) square with white "D" letter in JetBrains Mono style.

## Technical Details

- **Icons**: Inline SVGs from Lucide (no external JS dependency)
- **Fonts**: Google Fonts CDN (JetBrains Mono + Space Grotesk)
- **Smooth scroll**: CSS `scroll-behavior: smooth`
- **Mobile menu**: Minimal inline JS (one classList.toggle line)
- **No build step**: Pure static files, deployable anywhere
- **GitHub Pages**: Works with `gh-pages` branch or `/docs` folder config

## External Links
- Download buttons → `https://github.com/Caiollaz/dext/releases`
- GitHub button → `https://github.com/Caiollaz/dext`
- Footer links → respective GitHub URLs

## Verification
- Open `website/index.html` in browser
- Check all 6 sections render correctly
- Test responsive at 1440px, 1024px, 768px, 480px
- Verify all links point to correct URLs
- Check smooth scroll navigation works
