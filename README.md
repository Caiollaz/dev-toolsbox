# DEXT

**Local-first developer tools. 17 essential offline utilities in one desktop app.**

DEXT is a collection of developer tools that run entirely on your machine. No accounts, no tracking, no cloud, no backend. Built with [Tauri v2](https://v2.tauri.app/) + React + TypeScript for native performance without the Electron bloat.

Available for **Windows**, **macOS** (Apple Silicon + Intel), and **Linux**.

![DEXT - Base64 Tool](docs/screenshots/base64.png)

---

## Table of Contents

- [Tools](#tools)
- [Download](#download)
- [Development](#development)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Design System](#design-system)
- [Adding a New Tool](#adding-a-new-tool)
- [Release Process](#release-process)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Tools

17 tools organized in 6 categories. Every tool works offline with zero external dependencies.

### Encode / Decode

| Tool | Description |
|------|-------------|
| **JWT Decoder** | Decode JWT tokens, inspect header/payload, validate expiration timestamps |
| **Base64** | Encode and decode Base64 strings with full UTF-8 support |
| **Hash Generator** | Generate MD5, SHA-1, SHA-256, SHA-512 hashes from any text input |
| **URL Encoder** | Encode and decode URL components, query strings, and special characters |

<details>
<summary>Screenshots</summary>

![JWT Decoder](docs/screenshots/jwt-decoder.png)
![Base64](docs/screenshots/base64.png)
![Hash Generator](docs/screenshots/hash-generator.png)
![URL Encoder](docs/screenshots/url-encoder.png)

</details>

### JSON

| Tool | Description |
|------|-------------|
| **JSON Formatter** | Beautify, minify, and validate JSON data with one click |
| **JSON Diff** | Compare two JSON objects side by side with highlighted additions, deletions, and modifications |
| **JSON to TypeScript** | Convert JSON objects to TypeScript interfaces with recursive type inference |

<details>
<summary>Screenshots</summary>

![JSON Formatter](docs/screenshots/json-formatter.png)
![JSON Diff](docs/screenshots/json-diff.png)
![JSON to TypeScript](docs/screenshots/json-to-typescript.png)

</details>

### Generators

| Tool | Description |
|------|-------------|
| **UUID Generator** | Generate RFC-compliant UUID v4 values with history tracking |
| **Secret Generator** | Generate secure tokens, API keys, passwords, and JWT secrets with strength meter |
| **Mock Generator** | Generate realistic mock data from interface definitions with 50+ field name patterns |

<details>
<summary>Screenshots</summary>

![UUID Generator](docs/screenshots/uuid-generator.png)
![Secret Generator](docs/screenshots/secret-generator.png)
![Mock Generator](docs/screenshots/mock-generator.png)

</details>

### Converters

| Tool | Description |
|------|-------------|
| **Timestamp Converter** | Convert between Unix timestamps, ISO 8601, and human-readable dates |
| **Color Converter** | Convert colors between HEX, RGB, HSL with Tailwind CSS matching and palette generation |
| **cURL Converter** | Parse cURL commands and convert to Fetch, Axios, Python requests, and Go |

<details>
<summary>Screenshots</summary>

![Timestamp Converter](docs/screenshots/timestamp-converter.png)
![Color Converter](docs/screenshots/color-converter.png)
![cURL Converter](docs/screenshots/curl-converter.png)

</details>

### Text

| Tool | Description |
|------|-------------|
| **Regex Tester** | Test regular expressions with real-time matching, highlighting, groups, and capture results |
| **Markdown Preview** | Write Markdown with a live split-view preview (zero-dependency regex parser) |

<details>
<summary>Screenshots</summary>

![Regex Tester](docs/screenshots/regex-tester.png)
![Markdown Preview](docs/screenshots/markdown-preview.png)

</details>

### DevOps

| Tool | Description |
|------|-------------|
| **HTTP Runner** | Send HTTP requests with method selector, headers, auth presets, body editor, and response viewer (desktop only) |
| **ENV Manager** | Compare and manage .env files side by side with diff badges, template generation, and merge |

<details>
<summary>Screenshots</summary>

![HTTP Runner](docs/screenshots/http-runner.png)
![ENV Manager](docs/screenshots/env-manager.png)

</details>

---

## Download

Get the latest release from the [Releases page](https://github.com/Caiollaz/dext/releases).

| Platform | Formats |
|----------|---------|
| Windows | `.exe` (installer), `.msi` |
| macOS Apple Silicon | `.dmg` |
| macOS Intel | `.dmg` |
| Linux | `.deb`, `.AppImage`, `.rpm` |

Or visit the [landing page](https://caiollaz.github.io/dext/) for a quick overview.

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) (for Tauri desktop builds)
- npm

### Setup

```bash
git clone https://github.com/Caiollaz/dext.git
cd dext
npm install
```

### Run in browser (no Rust needed)

```bash
npm run dev
```

Opens at `http://localhost:1420`. All tools work in the browser except HTTP Runner, which requires the Tauri desktop shell for CORS-free requests.

### Run as desktop app

```bash
npm run tauri:dev
```

Requires Rust and platform-specific dependencies. See the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

### Build

```bash
npm run build          # TypeScript check + Vite production build
npm run tauri:build    # Full desktop app build
```

The web build outputs to `dist/`. No tests are configured yet.

---

## Project Structure

```
dext/
├── src/
│   ├── App.tsx                              # Root component
│   ├── main.tsx                             # Entry point
│   ├── styles/global.css                    # Design tokens + CSS reset
│   ├── types/index.ts                       # ToolType union, TOOLS registry, groups
│   ├── hooks/
│   │   ├── use-clipboard.ts                 # Copy-to-clipboard with feedback
│   │   └── use-history.ts                   # Per-tool operation history
│   ├── services/                            # Pure business logic (no React)
│   │   ├── base64.service.ts
│   │   ├── jwt.service.ts
│   │   ├── uuid.service.ts
│   │   ├── json-diff.service.ts
│   │   ├── hash.service.ts
│   │   ├── url-encoder.service.ts
│   │   ├── timestamp.service.ts
│   │   ├── regex.service.ts
│   │   ├── json-formatter.service.ts
│   │   ├── http-runner.service.ts           # Tauri HTTP plugin (desktop only)
│   │   ├── storage.service.ts               # Tauri FS / localStorage fallback
│   │   ├── color-converter.service.ts
│   │   ├── curl-converter.service.ts
│   │   ├── env-manager.service.ts
│   │   ├── json-to-typescript.service.ts
│   │   ├── markdown-preview.service.ts
│   │   ├── mock-generator.service.ts
│   │   └── secret-generator.service.ts
│   └── components/
│       ├── layout/
│       │   ├── layout.tsx                   # Tool switch/case router
│       │   ├── sidebar.tsx                  # Grouped collapsible navigation
│       │   ├── sidebar.module.css
│       │   └── tool-container.tsx           # Section label + scroll wrapper
│       ├── shared/
│       │   ├── input-area.tsx               # Reusable text input
│       │   ├── output-area.tsx              # Reusable output display
│       │   ├── action-button.tsx            # Primary/secondary buttons
│       │   └── copy-button.tsx              # One-click copy with feedback
│       └── tools/                           # 17 tool components + CSS modules
│           ├── base64-tool.tsx
│           ├── base64-tool.module.css
│           ├── jwt-decoder-tool.tsx
│           └── ...                          # (one .tsx + .module.css per tool)
├── src-tauri/
│   ├── Cargo.toml                           # Rust dependencies
│   ├── tauri.conf.json                      # App config, window size, permissions
│   ├── capabilities/default.json            # HTTP + shell permissions
│   └── src/main.rs                          # Tauri entry point
├── docs/
│   ├── index.html                           # Landing page (GitHub Pages)
│   ├── style.css                            # Landing page styles
│   ├── adding-tools.md                      # Guide for contributors
│   └── screenshots/                         # Tool screenshots
├── app.pen                                  # Design file (Pencil format)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .github/workflows/release.yml            # Multi-platform CI/CD
```

---

## Architecture

### Separation of concerns

Every tool follows the same three-layer pattern:

1. **Service** (`src/services/*.service.ts`) -- Pure functions with zero React or DOM dependencies. All business logic lives here: encoding, parsing, hashing, formatting, diffing. Services are synchronous when possible and independently testable.

2. **Component** (`src/components/tools/*.tsx`) -- React component that wires the service to the UI. Uses shared components (InputArea, OutputArea, ActionButton, CopyButton) and tool-specific CSS modules. Manages local state with `useState`.

3. **Layout** (`src/components/layout/`) -- The sidebar holds the grouped navigation. `layout.tsx` contains a single `switch/case` that renders the active tool. `tool-container.tsx` wraps each tool with a `// TOOL_XX` section label.

### Grouped navigation

The 17 tools are organized into 6 collapsible groups defined in `src/types/index.ts`:

```typescript
export const TOOL_GROUPS: ToolGroup[] = [
  { id: 'encode-decode', label: 'ENCODE / DECODE' },
  { id: 'json',          label: 'JSON' },
  { id: 'generators',    label: 'GENERATORS' },
  { id: 'converters',    label: 'CONVERTERS' },
  { id: 'text',          label: 'TEXT' },
  { id: 'devops',        label: 'DEVOPS' },
];
```

Each `ToolConfig` has a `group` field that associates it with a group. The sidebar auto-expands the group containing the active tool.

### Tauri runtime detection

The app runs in both desktop (Tauri) and browser modes. Services that need native APIs (HTTP, filesystem) use dynamic imports with a try/catch pattern:

```typescript
// storage.service.ts — simplified
async function getTauriFS() {
  try {
    return await Function('m', 'return import(m)')('@tauri-apps/plugin-fs');
  } catch {
    return null;
  }
}
```

- **Tauri present**: Uses native file system and HTTP APIs (CORS-free requests, local file storage)
- **Browser/dev mode**: Falls back to `localStorage` and shows a "desktop only" message for HTTP Runner

### Shared components

| Component | File | Purpose |
|-----------|------|---------|
| `InputArea` | `shared/input-area.tsx` | Labeled textarea with placeholder |
| `OutputArea` | `shared/output-area.tsx` | Read-only output with green accent text |
| `ActionButton` | `shared/action-button.tsx` | Primary (green) and secondary (dark) buttons |
| `CopyButton` | `shared/copy-button.tsx` | One-click copy with checkmark feedback |

### Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useClipboard` | `hooks/use-clipboard.ts` | Copy text to clipboard with success/error state |
| `useHistory` | `hooks/use-history.ts` | Per-tool operation history (stored in localStorage) |

---

## Design System

The app uses an industrial technical dark theme. All design tokens are CSS custom properties defined in `src/styles/global.css`.

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0C0C0C` | Main background |
| `--bg-sidebar` | `#080808` | Sidebar background |
| `--bg-card` | `#0A0A0A` | Cards, inputs, outputs |
| `--accent` | `#00FF88` | Primary accent (neon green) |
| `--text-primary` | `#FFFFFF` | Primary text |
| `--text-secondary` | `#6A6A6A` | Secondary text |
| `--text-muted` | `#8A8A8A` | Muted text |
| `--border` | `#2F2F2F` | Borders |
| `--color-warning` | `#FF8800` | Warning states |
| `--color-error` | `#FF4444` | Error states |

### Typography

| Font | Usage |
|------|-------|
| JetBrains Mono | UI text, code, labels, buttons |
| Space Grotesk | Headings |

### Visual patterns

- **Section labels**: Green uppercase text like `// SECTION_NAME` (9-10px, JetBrains Mono)
- **Active nav item**: `#00FF8810` background + 2px left green border + white text
- **Primary buttons**: Green background, dark text
- **Secondary buttons**: Dark background, border, white text
- **Output text**: Uses accent green (`#00FF88`)
- **Status bar**: Bottom bar with glowing green dot + status text + tool ID tag

### Design file

The `app.pen` file (Pencil format) contains the full design: 17 tool screens, 1 landing page, and a design system catalog with 44 reusable components. It serves as the source of truth for the visual design.

---

## Adding a New Tool

See [`docs/adding-tools.md`](docs/adding-tools.md) for the full guide. Quick summary:

1. Add the type to `ToolType` union + `TOOLS` array in `src/types/index.ts` (include `group` field)
2. Create `src/services/{tool}.service.ts` with pure logic
3. Create `src/components/tools/{tool}.tsx` + `.module.css`
4. Wire into switch/case in `src/components/layout/layout.tsx`
5. Add Lucide icon to `ICON_MAP` in `src/components/layout/sidebar.tsx`
6. Run `npm run build` to verify

All filenames must use **kebab-case**. No exceptions.

---

## Release Process

Releases are fully automated via GitHub Actions (`.github/workflows/release.yml`).

### Trigger a release

Push a version tag:

```bash
git tag v2.1.0
git push --tags
```

Or trigger manually via GitHub Actions workflow dispatch.

### What happens

1. The workflow extracts the version from the tag and syncs it across `package.json`, `tauri.conf.json`, and `Cargo.toml`
2. Builds run in parallel for 4 targets:
   - Linux x64 (`.deb`, `.AppImage`, `.rpm`)
   - macOS Apple Silicon (`.dmg`)
   - macOS Intel (`.dmg`)
   - Windows x64 (`.exe`, `.msi`)
3. All artifacts are uploaded to a GitHub Release

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript 5 (strict) |
| Bundler | Vite 6 |
| Desktop | Tauri v2 (Rust) |
| Styling | CSS Modules + CSS Custom Properties |
| Icons | Lucide React |
| Fonts | JetBrains Mono, Space Grotesk |
| CI/CD | GitHub Actions |
| Design | Pencil (.pen format) |

### Dependencies

The project is intentionally minimal:

**Runtime**: `react`, `react-dom`, `lucide-react`, `@tauri-apps/api`, `@tauri-apps/cli`, `@tauri-apps/plugin-http`

**Dev**: `typescript`, `vite`, `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`

No Tailwind, no CSS-in-JS, no state management libraries, no routing. Every tool's logic is implemented from scratch with zero external utility dependencies.

---

## License

MIT
