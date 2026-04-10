import type { ReactNode } from 'react';
import type { ToolType } from '../../types';
import { TOOLS } from '../../types';
import styles from './tool-container.module.css';

interface ToolContainerProps {
  tool: ToolType;
  children: ReactNode;
}

export function ToolContainer({ tool, children }: ToolContainerProps) {
  const config = TOOLS.find((t) => t.id === tool);
  const toolIndex = TOOLS.findIndex((t) => t.id === tool) + 1;
  const toolLabel = String(toolIndex).padStart(2, '0');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.label}>// TOOL_{toolLabel}</span>
        <h1 className={styles.title}>{config?.label}</h1>
        <p className={styles.subtitle}>{config?.description}</p>
      </header>
      {children}
    </div>
  );
}
