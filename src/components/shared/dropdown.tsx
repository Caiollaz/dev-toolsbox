import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Render selected value with accent color (default: true) */
  accent?: boolean;
  /** Minimum width */
  minWidth?: number;
}

export function Dropdown({
  options,
  value,
  onChange,
  disabled = false,
  className = '',
  accent = true,
  minWidth,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusIdx, setFocusIdx] = useState(-1);
  const [dropUp, setDropUp] = useState(false);

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Determine if menu should open upward
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = Math.min(options.length * 32 + 8, 240);
    setDropUp(spaceBelow < menuHeight && rect.top > menuHeight);
  }, [open, options.length]);

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusIdx < 0 || !listRef.current) return;
    const items = listRef.current.children;
    if (items[focusIdx]) {
      (items[focusIdx] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [focusIdx, open]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => {
      if (!prev) {
        const idx = options.findIndex((o) => o.value === value);
        setFocusIdx(idx >= 0 ? idx : 0);
      }
      return !prev;
    });
  }, [disabled, options, value]);

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!open) {
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
          e.preventDefault();
          handleToggle();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusIdx((prev) => (prev + 1) % options.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIdx((prev) => (prev - 1 + options.length) % options.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusIdx >= 0 && focusIdx < options.length) {
            handleSelect(options[focusIdx].value);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusIdx(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusIdx(options.length - 1);
          break;
      }
    },
    [disabled, open, focusIdx, options, handleToggle, handleSelect],
  );

  const containerClasses = [
    styles.dropdown,
    open && styles.open,
    disabled && styles.disabled,
    accent && styles.accent,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={minWidth ? { minWidth } : undefined}
      tabIndex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
        tabIndex={-1}
        aria-label="Select option"
      >
        <span className={styles.value}>{selected?.label ?? value}</span>
        <ChevronDown size={12} className={styles.chevron} />
      </button>

      {open && (
        <div
          ref={listRef}
          className={`${styles.menu} ${dropUp ? styles.menuUp : ''}`}
          role="listbox"
        >
          {options.map((opt, i) => (
            <div
              key={opt.value}
              className={`${styles.item} ${opt.value === value ? styles.itemActive : ''} ${i === focusIdx ? styles.itemFocused : ''}`}
              role="option"
              aria-selected={opt.value === value}
              onMouseEnter={() => setFocusIdx(i)}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
