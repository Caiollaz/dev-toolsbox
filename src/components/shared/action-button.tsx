import type { ReactNode } from 'react';
import styles from './action-button.module.css';

interface ActionButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function ActionButton({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
}: ActionButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
