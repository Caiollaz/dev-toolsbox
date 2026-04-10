# Architecture

## Overview

dev-toolsbox is a local-first developer toolbox built with **React 18 + TypeScript + Vite**. It is designed to run as a **Tauri v2** desktop app but works perfectly in the browser with localStorage fallback.

The app ships 4 tools: JWT Decoder, Base64 Encoder/Decoder, UUID Generator, and JSON Diff. All processing happens client-side — zero network requests, zero backend.

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
dev-toolsbox/
├── index.html                    # Vite entry HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── app.pen                       # Design system & screen specs (Pencil)
├── docs/                         # Documentation
│   ├── architecture.md           # This file
│   ├── design-system.md          # Design tokens & component catalog
│   └── adding-tools.md           # Guide: how to add a new tool
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
│       └── tools/                # Tool implementations
│           ├── base64-tool.tsx
│           ├── jwt-decoder-tool.tsx
│           ├── uuid-generator-tool.tsx
│           └── json-diff-tool.tsx
```

## Data Flow

```
User Input → Tool Component → Service (pure logic) → Output State → Render
                  ↓
            useHistory hook → storage.service → Tauri fs / localStorage
```

Each tool follows the same pattern:
1. User enters input in a textarea/field
2. Clicks an action button (ENCODE, DECODE, COMPARE, GENERATE)
3. The tool calls its service function (pure, synchronous)
4. Result is stored in component state and displayed in the output area
5. Entry is persisted to history via `useHistory` hook

## Rendering Architecture

```
App
└── Layout
    ├── Sidebar (navigation, system info, local mode badge)
    └── main
        └── ToolContainer (header: label + title + description)
            └── <ActiveTool /> (one of 4 tool components)
```

- `Layout` manages `activeTool` state and renders the corresponding tool
- `ToolContainer` wraps each tool with a standard header
- Tool components are self-contained with their own state, service calls, and CSS modules

## Storage

`storage.service.ts` provides a unified API:

- **Tauri mode**: Reads/writes JSON to `{appDataDir}/dev-toolsbox-history.json` using `@tauri-apps/plugin-fs`
- **Browser mode**: Falls back to `localStorage` with the same key
- Maximum 100 history entries, LIFO order

## Naming Convention

**All files use kebab-case** — no camelCase, no PascalCase for filenames:
- Components: `base64-tool.tsx`, `copy-button.tsx`
- CSS Modules: `base64-tool.module.css`
- Services: `base64.service.ts`
- Hooks: `use-clipboard.ts`
