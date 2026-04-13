/**
 * WebSocket Tester Service
 * Uses browser-native WebSocket API (works in both browser and Tauri).
 */

export type WsReadyState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export interface WsMessage {
  id: string;
  direction: 'sent' | 'received';
  content: string;
  timestamp: string;
}

export function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function getReadyStateLabel(state: number | undefined): WsReadyState {
  switch (state) {
    case WebSocket.CONNECTING: return 'CONNECTING';
    case WebSocket.OPEN: return 'OPEN';
    case WebSocket.CLOSING: return 'CLOSING';
    case WebSocket.CLOSED: return 'CLOSED';
    default: return 'CLOSED';
  }
}

let messageIdCounter = 0;

export function createMessageId(): string {
  return `ws-msg-${++messageIdCounter}-${Date.now()}`;
}
