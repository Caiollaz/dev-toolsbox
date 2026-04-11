# Design System

## Theme: Industrial Technical

Dark theme inspired by terminal interfaces and industrial control panels. High contrast green accent on deep black backgrounds.

## Design Tokens (CSS Custom Properties)

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0C0C0C` | Main background |
| `--bg-sidebar` | `#080808` | Sidebar background |
| `--bg-card` | `#0A0A0A` | Cards, input boxes, panels |
| `--bg-surface` | `#141414` | Elevated surfaces (copy btn bg) |
| `--accent` | `#00FF88` | Primary accent (buttons, labels, links) |
| `--accent-dim` | `#00FF8810` | Active nav bg, subtle highlights |
| `--accent-border` | `#00FF8840` | Accent border (status bar, accent cards) |
| `--accent-glow` | `#00FF8866` | Glow effect on status dots |
| `--text-primary` | `#FFFFFF` | Primary text |
| `--text-secondary` | `#6A6A6A` | Secondary text, descriptions |
| `--text-muted` | `#8A8A8A` | Muted text, hints, metadata |
| `--border` | `#2F2F2F` | Default border color |
| `--border-light` | `#3F3F3F` | Lighter border (hover states) |
| `--color-success` | `#00FF88` | Success states |
| `--color-warning` | `#FF8800` | Warning states |
| `--color-error` | `#FF4444` | Error states |

### Typography

| Style | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| Heading XL | Space Grotesk | 48px | 700 | Tool titles |
| Heading LG | Space Grotesk | 40px | 700 | Section titles |
| Heading MD | Space Grotesk | 24px | 700 | Card headings |
| Heading SM | Space Grotesk | 18px | 600 | Sub-headings |
| Body | JetBrains Mono | 13px | 400 | Body text |
| Body Secondary | JetBrains Mono | 12px | 400 | Subtitles, descriptions |
| Body Muted | JetBrains Mono | 11px | 400 | Metadata, timestamps |
| Section Label | JetBrains Mono | 9-10px | 500 | `// LABEL` pattern, green, uppercase |
| Caption | JetBrains Mono | 9px | 600 | Table headers, small tags |

### Spacing Scale

| Token | Value |
|-------|-------|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 12px |
| `--spacing-lg` | 16px |
| `--spacing-xl` | 20px |
| `--spacing-2xl` | 24px |
| `--spacing-3xl` | 32px |
| `--spacing-4xl` | 40px |

### Layout Constants

| Constant | Value |
|----------|-------|
| Sidebar width | 240px |
| Content padding | 32px top, 40px horizontal |
| Content gap | 24px |
| App width | 1440px |
| App height | 900px |

## Component Catalog

### Buttons

| Variant | Background | Text Color | Border | Usage |
|---------|-----------|------------|--------|-------|
| Primary | `--accent` (#00FF88) | `--bg-primary` (#0C0C0C) | none | Main actions (ENCODE, DECODE, GENERATE, SEND) |
| Secondary | `--bg-card` (#0A0A0A) | `--text-primary` (#FFF) | 1px `--border` | Alternative actions (DECODE, BULK, CLEAR) |
| Ghost | transparent | `--text-secondary` | none | Tertiary / dismiss actions |
| Danger | `--color-error` (#FF4444) | `--text-primary` | none | Destructive actions |

All buttons: `padding: 10px 20px`, `gap: 8px` (icon + label), `JetBrains Mono 10px`, uppercase.

### Section Label

Green uppercase labels used throughout the UI as section identifiers:
```
// TOOL_01
// INPUT
// OUTPUT
// SYSTEM_STATUS
// LOCAL_MODE
// AUTH_TYPE
// BODY_TYPE
```

Pattern: `JetBrains Mono`, 9-10px, weight 500, `--accent` color, letter-spacing 1px.

### Status Bar

Full-width bar at the bottom of each tool:
- Background: `--bg-card`
- Border: 1px `--accent-border`
- Left: glowing dot (6px ellipse, `--accent` with box-shadow `--accent-glow`) + status text
- Right: tool identifier tag (e.g., `BASE64_UTF8`, `JWT_HS256`, `HTTP_RUNNER`)

### Badges

| Variant | Background | Text Color |
|---------|-----------|------------|
| Default | `#00FF8820` | `--accent` |
| Outline | transparent | `--accent` (border: `--accent-border`) |
| Warning | `#FF880020` | `--color-warning` |
| Error | `#FF444420` | `--color-error` |

### Cards & Panels

| Variant | Background | Border | Padding |
|---------|-----------|--------|---------|
| Card | `--bg-card` | 1px `--border` | 20px |
| Card Accent | `--bg-card` | 1px `--accent-border` | 20px |
| Panel | `--bg-card` | 1px `--border` | Header: 12px 16px, Content: 16px |
| Input Box | `--bg-card` | 1px `--border` | 16px |
| Output Box | `--bg-card` | 1px `--border` | 16px (text color: `--accent`) |

### Navigation Items

| State | Background | Text | Left Border |
|-------|-----------|------|-------------|
| Default | transparent | `--text-secondary` | none |
| Active | `--accent-dim` | `--text-primary` | 2px `--accent` |

Padding: 12px 20px, gap: 12px (icon 16px + label).

### Sidebar

- Width: 240px, background: `--bg-sidebar`
- Top: Logo (green 32x32 mark + "DEXT")
- System Info card: `--bg-card`, key-value rows
- Navigation: vertical list of 10 Nav Items
- Bottom: `// LOCAL_MODE` with description

### Icons

Using **Lucide** icon set. Tool icons:

| Tool | Icon |
|------|------|
| JWT Decoder | `key-round` |
| JSON Diff | `git-compare` |
| Base64 | `file-code` |
| UUID Generator | `hash` |
| Hash Generator | `shield` |
| URL Encoder | `link` |
| Timestamp Converter | `timer` |
| Regex Tester | `regex` |
| JSON Formatter | `braces` |
| HTTP Runner | `send` |

Common action icons:
- `lock` / `lock-open` (encode/decode), `search` (decode JWT)
- `refresh-cw` (generate), `layers` (bulk), `trash-2` (clear/delete)
- `copy` (copy button), `check` (copied state)
- `plus` (add row), `loader-2` (loading spinner)

## Pencil Design File (app.pen)

The design system is also defined in `app.pen` as reusable Pencil components under the frame `vxiR7` ("Design System -- DEXT").

### Screen Frames

| Frame | Pencil ID | Description |
|-------|-----------|-------------|
| Base64 Encoder/Decoder | `ynldz` | App screen for Base64 tool |
| JWT Decoder | `RxEXO` | App screen for JWT tool |
| UUID Generator | `IcWj0` | App screen for UUID tool |
| JSON Diff | `6Ig1Z` | App screen for JSON Diff tool |
| Hash Generator | `hgDbM` | App screen for Hash tool |
| URL Encoder | `jzKNv` | App screen for URL Encoder tool |
| Timestamp Converter | `POEnV` | App screen for Timestamp tool |
| Regex Tester | `ZgawY` | App screen for Regex tool |
| JSON Formatter | `bQxC5` | App screen for JSON Formatter tool |
| HTTP Runner | `ea7nu` | App screen for HTTP Runner tool |
| Landing Page | `nf3al` | Marketing/download page |
| Design System | `vxiR7` | Reusable components catalog |

### Reusable Component IDs

| Component | Pencil ID |
|-----------|-----------|
| Button Primary | `Kajo3` |
| Button Secondary | `34FdS` |
| Button Ghost | `CZE7c` |
| Button Danger | `vhBaI` |
| Nav Item Default | `8Wp5b` |
| Nav Item Active | `6HHmg` |
| Section Label | `cjIvn` |
| Section Label Large | `soAOE` |
| Badge | `BFJwI` |
| Badge Outline | `FfVQu` |
| Badge Warning | `kB4Za` |
| Badge Error | `zqbhX` |
| Status Dot Success | `zajhg` |
| Status Dot Error | `qFubE` |
| Status Dot Warning | `X1RIZ` |
| Copy Button | `7dx5P` |
| Status Bar | `3x1Wa` |
| Input Box | `bJerd` |
| Output Box | `C8kyw` |
| Input Group | `ZZIug` |
| Output Group | `HvVEd` |
| Tool Header | `crfOw` |
| Card | `tv5W5` |
| Card Accent | `dSHw4` |
| Panel | `v2e2t` |
| Divider | `ce9Rj` |
| Key Value Row | `iMuea` |
| Icon Container | `Sx27N` |
| Icon Container Small | `qi5ec` |
| Logo Mark | `bdcCf` |
| System Info Card | `Im8Ol` |
| Table Row | `Kp9is` |
| Table Header Row | `lwZXu` |
| Sidebar | `ZGSyG` |
| App Shell | `0x2UH` |

### Typography Components

| Component | Pencil ID |
|-----------|-----------|
| Heading XL | `hoOwe` |
| Heading LG | `RhuJB` |
| Heading MD | `opaI3` |
| Heading SM | `TJ9zC` |
| Body Primary | `iRcoi` |
| Body Secondary | `MjGJZ` |
| Body Muted | `f2zKi` |
| Caption | `NN8dQ` |

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
