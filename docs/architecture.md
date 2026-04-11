# Architecture

## Overview

DEXT is a local-first developer toolbox built with **React 18 + TypeScript + Vite**. It is designed to run as a **Tauri v2** desktop app but works perfectly in the browser with localStorage fallback.

The app ships 10 tools: JWT Decoder, Base64 Encoder/Decoder, UUID Generator, JSON Diff, Hash Generator, URL Encoder, Timestamp Converter, Regex Tester, JSON Formatter, and HTTP Runner. All processing happens client-side — zero network requests, zero backend. The HTTP Runner is a desktop-only feature that uses Tauri's native HTTP plugin for CORS-free requests.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 (StrictMode) |
| Language | TypeScript 5 (strict) |
| Bundler | Vite 6 |
| Desktop | Tauri v2 (optional) |
| Styling | CSS Modules + CSS Custom Properties |
| Icons | Lucide React |
| Fonts | JetBrains Mono (UI), Space Grotesk (headings) |

## Project Structure

```
dext/
├── index.html                    # Vite entry HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── app.pen                       # Design system & screen specs (Pencil)
├── docs/                         # Documentation + Landing page
│   ├── architecture.md           # This file
│   ├── design-system.md          # Design tokens & component catalog
│   ├── adding-tools.md           # Guide: how to add a new tool
│   ├── index.html                # Landing page (GitHub Pages)
│   ├── style.css                 # Landing page styles
│   └── favicon.svg               # Landing page favicon
├── .github/workflows/
│   └── release.yml               # Multi-platform Tauri release (auto-versioned from tag)
├── src/
│   ├── main.tsx                  # ReactDOM.createRoot entry
│   ├── App.tsx                   # Root component (imports global CSS + Layout)
│   ├── vite-env.d.ts             # Vite & CSS module type declarations
│   ├── styles/
│   │   └── global.css            # CSS reset, design tokens, base styles
│   ├── types/
│   │   └── index.ts              # ToolType, HistoryEntry, TOOLS registry
│   ├── hooks/
│   │   ├── use-clipboard.ts      # Copy-to-clipboard hook
│   │   └── use-history.ts        # Persistent history hook
│   ├── services/
│   │   ├── base64.service.ts     # Base64 encode/decode (UTF-8 safe)
│   │   ├── jwt.service.ts        # JWT decode + expiration check
│   │   ├── uuid.service.ts       # UUID v4 generation (crypto API)
│   │   ├── json-diff.service.ts  # Recursive JSON object diff
│   │   ├── hash.service.ts       # MD5, SHA-1, SHA-256, SHA-512 hashes
│   │   ├── url-encoder.service.ts     # URL encode/decode
│   │   ├── timestamp.service.ts       # Unix timestamp conversion
│   │   ├── regex.service.ts           # Regex pattern matching
│   │   ├── json-formatter.service.ts  # JSON beautify/minify/validate
│   │   ├── http-runner.service.ts     # HTTP requests via Tauri plugin (desktop only)
│   │   └── storage.service.ts    # Tauri fs / localStorage persistence
│   └── components/
│       ├── layout/               # App shell: sidebar + content area
│       │   ├── layout.tsx
│       │   ├── sidebar.tsx
│       │   └── tool-container.tsx
│       ├── shared/               # Reusable UI components
│       │   ├── input-area.tsx
│       │   ├── output-area.tsx
│       │   ├── action-button.tsx
│       │   └── copy-button.tsx
│       └── tools/                # Tool implementations (10 tools)
│           ├── base64-tool.tsx
│           ├── jwt-decoder-tool.tsx
│           ├── uuid-generator-tool.tsx
│           ├── json-diff-tool.tsx
│           ├── hash-generator-tool.tsx
│           ├── url-encoder-tool.tsx
│           ├── timestamp-converter-tool.tsx
│           ├── regex-tester-tool.tsx
│           ├── json-formatter-tool.tsx
│           └── http-runner-tool.tsx
├── src-tauri/
│   ├── tauri.conf.json           # Tauri config (window, bundle, security)
│   ├── Cargo.toml                # Rust dependencies (tauri, shell, http plugins)
│   ├── capabilities/
│   │   └── default.json          # Tauri v2 permissions (HTTP, shell)
│   └── src/
│       ├── lib.rs                # Plugin registration (shell + http)
│       └── main.rs               # Entry point
```

Each `.tsx` component has a corresponding `.module.css` file (same name).

## Data Flow

```
User Input → Tool Component → Service (pure logic) → Output State → Render
                  ↓
            useHistory hook → storage.service → Tauri fs / localStorage
```

Each tool follows the same pattern:
1. User enters input in a textarea/field
2. Clicks an action button (ENCODE, DECODE, COMPARE, GENERATE, SEND)
3. The tool calls its service function (pure, synchronous — except HTTP Runner which is async)
4. Result is stored in component state and displayed in the output area
5. Entry is persisted to history via `useHistory` hook

### HTTP Runner (special case)

The HTTP Runner breaks the typical pattern:
- Uses Tauri's `@tauri-apps/plugin-http` for native CORS-free requests
- Async operation with loading state and abort controller
- Browser fallback: shows "Desktop only" message instead of falling back to localStorage
- Complex state: request config (method, URL, query params, headers, auth, body) + response (status, headers, body, cookies)
- No history persistence (requests are not saved)

## Rendering Architecture

```
App
└── Layout
    ├── Sidebar (navigation, system info, local mode badge)
    └── main
        └── ToolContainer (header: label + title + description)
            └── <ActiveTool /> (one of 10 tool components)
```

- `Layout` manages `activeTool` state and renders the corresponding tool
- `ToolContainer` wraps each tool with a standard header (auto-generates `// TOOL_XX` label from index)
- Tool components are self-contained with their own state, service calls, and CSS modules

## Storage

`storage.service.ts` provides a unified API:

- **Tauri mode**: Reads/writes JSON to `{appDataDir}/dext-history.json` using `@tauri-apps/plugin-fs`
- **Browser mode**: Falls back to `localStorage` with the same key
- Maximum 100 history entries, LIFO order
- Detection uses `Function('m', 'return import(m)')` pattern to avoid TypeScript errors without installing Tauri packages

## Tauri Plugins

| Plugin | Cargo Crate | NPM Package | Usage |
|--------|-------------|-------------|-------|
| Shell | `tauri-plugin-shell` | — | Open external links |
| HTTP | `tauri-plugin-http` | `@tauri-apps/plugin-http` | HTTP Runner (CORS-free requests) |

Permissions are configured in `src-tauri/capabilities/default.json`.

## Naming Convention

**All files use kebab-case** — no camelCase, no PascalCase for filenames:
- Components: `base64-tool.tsx`, `copy-button.tsx`
- CSS Modules: `base64-tool.module.css`
- Services: `base64.service.ts`
- Hooks: `use-clipboard.ts`

## Build & Release

```bash
npm install         # Install dependencies
npm run dev         # Start dev server (port 1420)
npm run build       # TypeScript check + Vite production build
npm run preview     # Preview production build
```

The GitHub Actions workflow (`.github/workflows/release.yml`) builds for Linux, macOS (Intel + Apple Silicon), and Windows. It extracts the version from the git tag and syncs all config files before building, so artifact filenames always match the release tag.
