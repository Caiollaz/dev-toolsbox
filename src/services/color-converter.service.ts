export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorResult {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  tailwind: string;
}

// --- Conversion functions ---

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  let fullHex = clean;

  // Handle shorthand (#abc → #aabbcc)
  if (clean.length === 3) {
    fullHex = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }

  const num = parseInt(fullHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

// --- Tailwind color matching ---

const TAILWIND_COLORS: Record<string, string> = {
  'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8', 'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155',
  'slate-800': '#1e293b', 'slate-900': '#0f172a', 'slate-950': '#020617',
  'red-50': '#fef2f2', 'red-100': '#fee2e2', 'red-200': '#fecaca', 'red-300': '#fca5a5',
  'red-400': '#f87171', 'red-500': '#ef4444', 'red-600': '#dc2626', 'red-700': '#b91c1c',
  'red-800': '#991b1b', 'red-900': '#7f1d1d', 'red-950': '#450a0a',
  'orange-50': '#fff7ed', 'orange-500': '#f97316', 'orange-600': '#ea580c',
  'yellow-50': '#fefce8', 'yellow-500': '#eab308', 'yellow-600': '#ca8a04',
  'green-50': '#f0fdf4', 'green-100': '#dcfce7', 'green-200': '#bbf7d0', 'green-300': '#86efac',
  'green-400': '#4ade80', 'green-500': '#22c55e', 'green-600': '#16a34a', 'green-700': '#15803d',
  'green-800': '#166534', 'green-900': '#14532d', 'green-950': '#052e16',
  'emerald-400': '#34d399', 'emerald-500': '#10b981',
  'blue-50': '#eff6ff', 'blue-100': '#dbeafe', 'blue-200': '#bfdbfe', 'blue-300': '#93c5fd',
  'blue-400': '#60a5fa', 'blue-500': '#3b82f6', 'blue-600': '#2563eb', 'blue-700': '#1d4ed8',
  'blue-800': '#1e40af', 'blue-900': '#1e3a8a', 'blue-950': '#172554',
  'purple-500': '#a855f7', 'purple-600': '#9333ea',
  'pink-500': '#ec4899', 'pink-600': '#db2777',
  'gray-50': '#f9fafb', 'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-300': '#d1d5db',
  'gray-400': '#9ca3af', 'gray-500': '#6b7280', 'gray-600': '#4b5563', 'gray-700': '#374151',
  'gray-800': '#1f2937', 'gray-900': '#111827', 'gray-950': '#030712',
  'zinc-50': '#fafafa', 'zinc-500': '#71717a', 'zinc-900': '#18181b',
  'neutral-50': '#fafafa', 'neutral-500': '#737373', 'neutral-900': '#171717',
  'white': '#ffffff', 'black': '#000000',
};

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2),
  );
}

export function toTailwind(hex: string): string {
  const target = hexToRgb(hex);
  let closest = 'gray-500';
  let minDist = Infinity;

  for (const [name, twHex] of Object.entries(TAILWIND_COLORS)) {
    const rgb = hexToRgb(twHex);
    const dist = colorDistance(target, rgb);
    if (dist < minDist) {
      minDist = dist;
      closest = name;
    }
  }

  return closest;
}

// --- Parse any color format ---

export function parseColor(input: string): ColorResult | null {
  const trimmed = input.trim().toLowerCase();

  // HEX
  const hexMatch = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hexMatch) {
    const hex = `#${hexMatch[1].length === 3 ? hexMatch[1][0] + hexMatch[1][0] + hexMatch[1][1] + hexMatch[1][1] + hexMatch[1][2] + hexMatch[1][2] : hexMatch[1]}`;
    const rgb = hexToRgb(hex);
    return { hex, rgb, hsl: rgbToHsl(rgb), tailwind: toTailwind(hex) };
  }

  // RGB
  const rgbMatch = trimmed.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgbMatch) {
    const rgb: RGB = { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
    const hex = rgbToHex(rgb);
    return { hex, rgb, hsl: rgbToHsl(rgb), tailwind: toTailwind(hex) };
  }

  // HSL
  const hslMatch = trimmed.match(/^hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/);
  if (hslMatch) {
    const hsl: HSL = { h: parseInt(hslMatch[1]), s: parseInt(hslMatch[2]), l: parseInt(hslMatch[3]) };
    const rgb = hslToRgb(hsl);
    const hex = rgbToHex(rgb);
    return { hex, rgb, hsl, tailwind: toTailwind(hex) };
  }

  return null;
}

// --- Palette generation ---

export function generatePalette(hex: string, steps = 9): string[] {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  return Array.from({ length: steps }, (_, i) => {
    const lightness = 95 - (i * 85) / (steps - 1); // from 95% to 10%
    const adjusted = hslToRgb({ h: hsl.h, s: hsl.s, l: Math.round(lightness) });
    return rgbToHex(adjusted);
  });
}
