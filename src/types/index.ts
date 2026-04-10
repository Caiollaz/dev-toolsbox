export type ToolType = 'jwt-decoder' | 'json-diff' | 'base64' | 'uuid-generator';

export interface HistoryEntry {
  tool: ToolType;
  input: string;
  output: string;
  createdAt: string;
}

export interface ToolConfig {
  id: ToolType;
  label: string;
  icon: string;
  description: string;
}

export const TOOLS: ToolConfig[] = [
  {
    id: 'jwt-decoder',
    label: 'JWT DECODER',
    icon: 'key-round',
    description: 'Decode and validate JWT tokens',
  },
  {
    id: 'json-diff',
    label: 'JSON DIFF',
    icon: 'git-compare',
    description: 'Compare two JSON objects',
  },
  {
    id: 'base64',
    label: 'BASE64',
    icon: 'file-code',
    description: 'Encode and decode Base64 strings',
  },
  {
    id: 'uuid-generator',
    label: 'UUID GENERATOR',
    icon: 'hash',
    description: 'Generate UUID v4 identifiers',
  },
];
