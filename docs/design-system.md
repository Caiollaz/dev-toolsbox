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
| Primary | `--accent` (#00FF88) | `--bg-primary` (#0C0C0C) | none | Main actions (ENCODE, DECODE, GENERATE) |
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
```

Pattern: `JetBrains Mono`, 9-10px, weight 500, `--accent` color, letter-spacing 1px.

### Status Bar

Full-width bar at the bottom of each tool:
- Background: `--bg-card`
- Border: 1px `--accent-border`
- Left: glowing dot (6px ellipse, `--accent` with box-shadow `--accent-glow`) + status text
- Right: tool identifier tag (e.g., `BASE64_UTF8`, `JWT_HS256`)

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
- Top: Logo (green 32x32 mark + "DEV-TOOLSBOX")
- System Info card: `--bg-card`, key-value rows
- Navigation: vertical list of Nav Items
- Bottom: `// LOCAL_MODE` with description

### Icons

Using **Lucide** icon set. Common icons used:
- `key-round` (JWT), `file-code` (Base64), `hash` (UUID), `git-compare` (JSON Diff)
- `lock` / `lock-open` (encode/decode), `search` (decode JWT)
- `refresh-cw` (generate), `layers` (bulk), `trash-2` (clear/delete)
- `copy` (copy button), `check` (copied state)
- `terminal` (logo mark)

## Pencil Design File (app.pen)

The design system is also defined in `app.pen` as reusable Pencil components under the frame `vxiR7` ("Design System — dev-toolsbox"). Key component IDs:

| Component | Pencil ID |
|-----------|-----------|
| Button Primary | `Kajo3` |
| Button Secondary | `34FdS` |
| Button Ghost | `CZE7c` |
| Button Danger | `vhBaI` |
| Nav Item Default | `8Wp5b` |
| Nav Item Active | `6HHmg` |
| Section Label | `cjIvn` |
| Badge | `BFJwI` |
| Status Bar | `3x1Wa` |
| Input Box | `bJerd` |
| Output Box | `C8kyw` |
| Input Group | `ZZIug` |
| Output Group | `HvVEd` |
| Tool Header | `crfOw` |
| Card | `tv5W5` |
| Panel | `v2e2t` |
| Sidebar | `ZGSyG` |
| App Shell | `0x2UH` |
| Copy Button | `7dx5P` |
| Icon Container | `Sx27N` |
| Key Value Row | `iMuea` |
| Table Row | `Kp9is` |
| Divider | `ce9Rj` |
