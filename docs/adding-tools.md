# Adding a New Tool

Step-by-step guide to add a new tool to dev-toolsbox.

## 1. Register the tool type

Edit `src/types/index.ts`:

```ts
// Add to the ToolType union
export type ToolType = 'jwt-decoder' | 'json-diff' | 'base64' | 'uuid-generator' | 'your-tool';

// Add to the TOOLS array
export const TOOLS: ToolConfig[] = [
  // ... existing tools
  {
    id: 'your-tool',
    label: 'YOUR TOOL',
    icon: 'wrench',           // Lucide icon name
    description: 'Short description of what it does',
  },
];
```

## 2. Create the service

Create `src/services/your-tool.service.ts`:

```ts
// Pure logic — no React, no DOM, no side effects
export function processInput(input: string): string {
  // Your tool logic here
  return result;
}
```

Keep services pure and synchronous when possible. No UI concerns.

## 3. Create the component

Create `src/components/tools/your-tool.tsx`:

```tsx
import { useState } from 'react';
import { InputArea } from '../shared/input-area';
import { OutputArea } from '../shared/output-area';
import { ActionButton } from '../shared/action-button';
import { useHistory } from '../../hooks/use-history';
import { processInput } from '../../services/your-tool.service';
import styles from './your-tool.module.css';

export function YourTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const { addEntry } = useHistory('your-tool');

  const handleProcess = () => {
    try {
      setError('');
      const result = processInput(input);
      setOutput(result);
      addEntry({ tool: 'your-tool', input, output: result });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOutput('');
    }
  };

  return (
    <div className={styles.container}>
      <InputArea
        label="// INPUT"
        value={input}
        onChange={setInput}
        placeholder="Enter text here..."
      />

      <div className={styles.actions}>
        <ActionButton variant="primary" onClick={handleProcess} icon="play">
          PROCESS
        </ActionButton>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <OutputArea label="// OUTPUT" value={output} />

      {/* Status bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span>READY</span>
        </div>
        <span className={styles.statusTag}>YOUR_TOOL</span>
      </div>
    </div>
  );
}
```

## 4. Create the CSS module

Create `src/components/tools/your-tool.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
  width: 100%;
}

.actions {
  display: flex;
  gap: var(--spacing-sm);
}

.error {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-error);
  padding: var(--spacing-md) var(--spacing-lg);
  background: #ff444410;
  border: 1px solid #ff444440;
}

.statusBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--accent-border);
}

.statusLeft {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.statusDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent-glow);
}

.statusTag {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  color: var(--text-secondary);
}
```

## 5. Wire it into the layout

Edit `src/components/layout/layout.tsx`:

```tsx
import { YourTool } from '../tools/your-tool';

// Inside the switch/case for rendering tools:
case 'your-tool':
  return <YourTool />;
```

## 6. (Optional) Create the Pencil design

In `app.pen`, use the App Shell component to create a new screen:

```javascript
// Using the Design System components:
screen=I(document,{type:"ref",ref:"0x2UH"})  // App Shell
// Update the sidebar nav to mark your tool as active
// Add tool header, input, output, status bar to the content area
```

## Checklist

- [ ] Added tool type to `ToolType` union in `src/types/index.ts`
- [ ] Added tool config to `TOOLS` array in `src/types/index.ts`
- [ ] Created service file: `src/services/your-tool.service.ts`
- [ ] Created component: `src/components/tools/your-tool.tsx`
- [ ] Created CSS module: `src/components/tools/your-tool.module.css`
- [ ] Wired component in `src/components/layout/layout.tsx` switch/case
- [ ] All filenames use **kebab-case**
- [ ] Build passes: `npm run build`

## File Naming

**Always use kebab-case for all files:**
- `your-tool.tsx` (not `YourTool.tsx`)
- `your-tool.module.css` (not `YourTool.module.css`)
- `your-tool.service.ts` (not `yourTool.service.ts`)
