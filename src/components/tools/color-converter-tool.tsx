import { useState, useMemo } from 'react';
import { ActionButton } from '../shared/action-button';
import { useClipboard } from '../../hooks/use-clipboard';
import { parseColor, generatePalette } from '../../services/color-converter.service';
import type { ColorResult } from '../../services/color-converter.service';
import styles from './color-converter-tool.module.css';

export function ColorConverterTool() {
  const [input, setInput] = useState('#00FF88');
  const [palette, setPalette] = useState<string[]>([]);
  const { copy, copied } = useClipboard();

  const result: ColorResult | null = useMemo(() => {
    if (!input.trim()) return null;
    return parseColor(input);
  }, [input]);

  const handleGeneratePalette = () => {
    if (result) {
      setPalette(generatePalette(result.hex));
    }
  };

  const handleCopyAll = () => {
    if (!result) return;
    const text = [
      `HEX: ${result.hex}`,
      `RGB: rgb(${result.rgb.r}, ${result.rgb.g}, ${result.rgb.b})`,
      `HSL: hsl(${result.hsl.h}, ${result.hsl.s}%, ${result.hsl.l}%)`,
      `Tailwind: ${result.tailwind}`,
    ].join('\n');
    copy(text);
  };

  return (
    <>
      <div className={styles.inputSection}>
        <span className={styles.label}>// COLOR_INPUT</span>
        <div className={styles.inputRow}>
          {result && (
            <div className={styles.swatch} style={{ backgroundColor: result.hex }} />
          )}
          <div className={styles.inputBox}>
            <input
              className={styles.colorInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="#00FF88 or rgb(0, 255, 136) or hsl(152, 100%, 50%)"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {result && (
        <div className={styles.cardsGrid}>
          <div className={styles.card} onClick={() => copy(result.hex)}>
            <span className={styles.cardLabel}>// HEX</span>
            <span className={styles.cardValue}>{result.hex}</span>
          </div>
          <div className={styles.card} onClick={() => copy(`rgb(${result.rgb.r}, ${result.rgb.g}, ${result.rgb.b})`)}>
            <span className={styles.cardLabel}>// RGB</span>
            <span className={styles.cardValue}>rgb({result.rgb.r}, {result.rgb.g}, {result.rgb.b})</span>
          </div>
          <div className={styles.card} onClick={() => copy(`hsl(${result.hsl.h}, ${result.hsl.s}%, ${result.hsl.l}%)`)}>
            <span className={styles.cardLabel}>// HSL</span>
            <span className={styles.cardValue}>hsl({result.hsl.h}, {result.hsl.s}%, {result.hsl.l}%)</span>
          </div>
          <div className={styles.card} onClick={() => copy(result.tailwind)}>
            <span className={styles.cardLabel}>// TAILWIND</span>
            <span className={styles.cardValue}>{result.tailwind}</span>
          </div>
        </div>
      )}

      {palette.length > 0 && (
        <div className={styles.paletteSection}>
          <span className={styles.label}>// PALETTE</span>
          <div className={styles.paletteRow}>
            {palette.map((color, i) => (
              <div
                key={i}
                className={styles.paletteSwatch}
                style={{ backgroundColor: color }}
                title={color}
                onClick={() => copy(color)}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <ActionButton onClick={handleCopyAll} disabled={!result}>
          {copied ? 'COPIED!' : 'COPY ALL'}
        </ActionButton>
        <ActionButton onClick={handleGeneratePalette} variant="secondary" disabled={!result}>
          GENERATE PALETTE
        </ActionButton>
      </div>

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {result
              ? `READY — Color parsed successfully`
              : 'READY — Enter a color value'}
          </span>
        </div>
        <span className={styles.statusRight}>COLOR_CONVERT</span>
      </div>
    </>
  );
}
