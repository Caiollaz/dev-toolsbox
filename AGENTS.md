# AGENTS.md — AI Context for dev-toolsbox

## What is this project?

**dev-toolsbox** is a local-first developer toolbox app — a collection of essential offline tools for developers. Built with React 18 + TypeScript + Vite, designed to run as a Tauri v2 desktop app (but works in browser too).

Current tools: JWT Decoder, Base64 Encoder/Decoder, UUID Generator, JSON Diff.

## Quick Reference

| Aspect | Detail |
|--------|--------|
| Framework | React 18 + TypeScript 5 (strict) |
| Bundler | Vite 6 |
| Desktop | Tauri v2 (optional, graceful fallback to browser) |
| Styling | CSS Modules + CSS Custom Properties (no Tailwind, no CSS-in-JS) |
| Icons | `lucide-react` |
| Fonts | JetBrains Mono (UI/mono), Space Grotesk (headings) |
| Build | `npm run build` → `tsc && vite build` |
| Dev | `npm run dev` → `vite` on port 1420 |
| Design file | `app.pen` (Pencil design tool format) |

## Critical Conventions

### File Naming: KEBAB-CASE ONLY

Every file in this project uses **kebab-case**. No exceptions.

```
✅ base64-tool.tsx
✅ jwt-decoder-tool.tsx
✅ use-clipboard.ts
✅ base64.service.ts
✅ action-button.module.css

❌ Base64Tool.tsx
❌ jwtDecoderTool.tsx
❌ useClipboard.ts
```

### Project Structure

```
src/
├── App.tsx                          # Root component
├── main.tsx                         # Entry point
├── vite-env.d.ts                    # Type declarations
├── styles/global.css                # Design tokens + CSS reset
├── types/index.ts                   # ToolType union, TOOLS registry
├── hooks/                           # Custom React hooks
│   ├── use-clipboard.ts
│   └── use-history.ts
├── services/                        # Pure business logic (no React)
│   ├── base64.service.ts
│   ├── jwt.service.ts
│   ├── uuid.service.ts
│   ├── json-diff.service.ts
│   └── storage.service.ts
└── components/
    ├── layout/                      # App shell (sidebar + content)
    │   ├── layout.tsx
    │   ├── sidebar.tsx
    │   └── tool-container.tsx
    ├── shared/                      # Reusable UI components
    │   ├── input-area.tsx
    │   ├── output-area.tsx
    │   ├── action-button.tsx
    │   └── copy-button.tsx
    └── tools/                       # Tool implementations
        ├── base64-tool.tsx
        ├── jwt-decoder-tool.tsx
        ├── uuid-generator-tool.tsx
        └── json-diff-tool.tsx
```

Each `.tsx` component has a corresponding `.module.css` file (same name).

### Architecture Pattern

1. **Types** → `src/types/index.ts` holds the `ToolType` union and `TOOLS` config array
2. **Services** → Pure functions, no React. One file per tool: `{tool}.service.ts`
3. **Hooks** → Reusable React hooks: `use-{name}.ts`
4. **Components** → Split into `layout/`, `shared/`, `tools/`
5. **Layout** manages `activeTool` state and renders the selected tool via switch/case

### Adding a New Tool

See `docs/adding-tools.md` for the full checklist. Summary:

1. Add type to `ToolType` union + `TOOLS` array in `src/types/index.ts`
2. Create `src/services/{tool}.service.ts` with pure logic
3. Create `src/components/tools/{tool}.tsx` + `.module.css`
4. Wire into switch/case in `src/components/layout/layout.tsx`
5. Run `npm run build` to verify

## Design System

### Theme: Industrial Technical (dark)

The app uses a distinctive dark industrial aesthetic:

- **Background**: `#0C0C0C` (main), `#080808` (sidebar), `#0A0A0A` (cards)
- **Accent**: `#00FF88` (neon green) — used for primary buttons, labels, active states, output text
- **Text**: `#FFFFFF` (primary), `#6A6A6A` (secondary), `#8A8A8A` (muted)
- **Border**: `#2F2F2F`
- **Warning**: `#FF8800`, **Error**: `#FF4444`

### Visual Patterns

- **Section labels**: Green uppercase text like `// SECTION_NAME` (9-10px, JetBrains Mono)
- **Active nav item**: `#00FF8810` background + 2px left green border + white text
- **Primary button**: `#00FF88` background, `#0C0C0C` (dark) text
- **Secondary button**: `#0A0A0A` background, `#2F2F2F` border, white text
- **Status bar**: Bottom bar with glowing green dot + status text + tool ID tag
- **Input/Output boxes**: `#0A0A0A` background, `#2F2F2F` border, 16px padding
- **Output text**: Uses accent green (`#00FF88`) color

### CSS Variables

All design tokens are defined as CSS custom properties in `src/styles/global.css`:
```css
--bg-primary, --bg-sidebar, --bg-card, --bg-surface
--accent, --accent-dim, --accent-border, --accent-glow
--text-primary, --text-secondary, --text-muted
--border, --color-warning, --color-error
--font-mono, --font-heading
--spacing-xs through --spacing-4xl
--sidebar-width
```

Always use these variables — never hardcode colors.

## Design File (app.pen)

The `app.pen` file contains all screen designs and a full design system with reusable components. Key frames:

| Frame | ID | Description |
|-------|----|-------------|
| Base64 Screen | `ynldz` | App screen for Base64 tool |
| JWT Decoder Screen | `RxEXO` | App screen for JWT tool |
| UUID Generator Screen | `IcWj0` | App screen for UUID tool |
| JSON Diff Screen | `6Ig1Z` | App screen for JSON Diff tool |
| Landing Page | `nf3al` | Marketing/download page |
| Design System | `vxiR7` | Reusable components catalog |

### Reusable Pencil Components (in Design System frame)

| Component | ID | Usage |
|-----------|----|-------|
| Button Primary | `Kajo3` | Green CTA buttons |
| Button Secondary | `34FdS` | Alt actions |
| Button Ghost | `CZE7c` | Tertiary actions |
| Button Danger | `vhBaI` | Destructive actions |
| Nav Item Default | `8Wp5b` | Inactive sidebar nav |
| Nav Item Active | `6HHmg` | Active sidebar nav |
| Section Label | `cjIvn` | `// LABEL` pattern (9px) |
| Section Label Large | `soAOE` | `// LABEL` pattern (10px) |
| Badge | `BFJwI` | Green status badge |
| Badge Outline | `FfVQu` | Outlined badge |
| Badge Warning | `kB4Za` | Orange warning badge |
| Badge Error | `zqbhX` | Red error badge |
| Status Dot Success | `zajhg` | Green glowing dot + text |
| Status Dot Error | `qFubE` | Red glowing dot + text |
| Status Dot Warning | `X1RIZ` | Orange glowing dot + text |
| Copy Button | `7dx5P` | Small copy action |
| Status Bar | `3x1Wa` | Full-width bottom bar |
| Input Box | `bJerd` | Text input container |
| Output Box | `C8kyw` | Output display (green text) |
| Input Group | `ZZIug` | Label + Input Box |
| Output Group | `HvVEd` | Label + Copy btn + Output Box |
| Tool Header | `crfOw` | Label + Title + Subtitle |
| Card | `tv5W5` | Generic card container |
| Card Accent | `dSHw4` | Card with accent border |
| Panel | `v2e2t` | Card with header row |
| Divider | `ce9Rj` | 1px horizontal separator |
| Key Value Row | `iMuea` | Property: Value display |
| Icon Container | `Sx27N` | 48x48 icon box (accent tint) |
| Icon Container Small | `qi5ec` | 32x32 icon box |
| Logo Mark | `bdcCf` | 32x32 solid accent mark |
| System Info Card | `Im8Ol` | Sidebar info panel |
| Table Row | `Kp9is` | Data table row |
| Table Header Row | `lwZXu` | Table header row |
| Sidebar | `ZGSyG` | Full sidebar component |
| App Shell | `0x2UH` | Sidebar + content layout |

### Design Token Variables (Pencil)

The `app.pen` file has these variables defined:
```
$accent: #00FF88       $accent-dim: #00FF8810    $accent-border: #00FF8840
$accent-bg: #00FF8815  $accent-muted: #00FF8830  $accent-glow: #00FF8866
$accent-badge: #00FF8820
$bg-main: #0C0C0C      $bg-sidebar: #080808     $bg-card: #0A0A0A
$bg-elevated: #141414
$text-primary: #FFFFFF  $text-secondary: #6a6a6a  $text-muted: #8A8A8A
$border: #2f2f2f
$warning: #FF8800       $error: #FF4444
```

## Storage & Persistence

`storage.service.ts` uses dynamic imports to detect Tauri at runtime:
- **Tauri present**: Uses `@tauri-apps/plugin-fs` for file-based storage
- **Browser/dev mode**: Falls back to `localStorage`
- The detection uses `Function('m', 'return import(m)')` pattern to avoid TypeScript errors without installing Tauri packages

## Build & Test

```bash
npm install         # Install dependencies
npm run dev         # Start dev server (port 1420)
npm run build       # TypeScript check + Vite production build
npm run preview     # Preview production build
```

The build output goes to `dist/`. No tests are configured yet.
