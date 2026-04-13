import { useState, useRef, useCallback, useEffect } from 'react';
import { Plug, Send, Trash2 } from 'lucide-react';
import {
  formatTimestamp,
  getReadyStateLabel,
  createMessageId,
} from '../../services/websocket-tester.service';
import type { WsMessage, WsReadyState } from '../../services/websocket-tester.service';
import styles from './websocket-tester-tool.module.css';

export function WebsocketTesterTool() {
  const [url, setUrl] = useState('wss://echo.websocket.org');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [readyState, setReadyState] = useState<WsReadyState>('CLOSED');
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleConnect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      return;
    }

    setError(null);
    setReadyState('CONNECTING');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setReadyState(getReadyStateLabel(ws.readyState));
        setProtocol(ws.protocol || '');
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            direction: 'received',
            content: '[Connected]',
            timestamp: formatTimestamp(),
          },
        ]);
      };

      ws.onmessage = (event) => {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            direction: 'received',
            content: typeof event.data === 'string' ? event.data : '[Binary data]',
            timestamp: formatTimestamp(),
          },
        ]);
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
        setReadyState(getReadyStateLabel(ws.readyState));
      };

      ws.onclose = (event) => {
        setReadyState('CLOSED');
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            direction: 'received',
            content: `[Disconnected: code=${event.code}${event.reason ? `, reason=${event.reason}` : ''}]`,
            timestamp: formatTimestamp(),
          },
        ]);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setReadyState('CLOSED');
    }
  };

  const handleSend = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !message.trim()) return;

    wsRef.current.send(message);
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        direction: 'sent',
        content: message,
        timestamp: formatTimestamp(),
      },
    ]);
    setMessage('');
  };

  const handleClear = () => {
    setMessages([]);
  };

  const isConnected = readyState === 'OPEN';
  const sentCount = messages.filter((m) => m.direction === 'sent').length;
  const receivedCount = messages.filter((m) => m.direction === 'received').length;

  return (
    <>
      {/* Connection Bar */}
      <div className={styles.connectionBar}>
        <input
          type="text"
          className={styles.urlInput}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="wss://echo.websocket.org"
          disabled={isConnected}
          onKeyDown={(e) => { if (e.key === 'Enter' && !isConnected) handleConnect(); }}
        />
        {isConnected ? (
          <button className={styles.disconnectBtn} onClick={handleConnect}>
            DISCONNECT
          </button>
        ) : (
          <button className={styles.connectBtn} onClick={handleConnect}>
            <Plug size={14} />
            <span>CONNECT</span>
          </button>
        )}
      </div>

      {/* Connection Status */}
      {(isConnected || readyState === 'CONNECTING') && (
        <div className={styles.connectionStatus}>
          <span
            className={`${styles.connectionDot} ${
              isConnected ? styles.connectionDotOpen : styles.connectionDotConnecting
            }`}
          />
          <span className={styles.connectionLabel}>{readyState}</span>
          <span className={styles.connectionUrl}>{url}</span>
          {protocol && <span className={styles.protocolLabel}>protocol: {protocol}</span>}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Panel */}
      <div className={styles.messagesPanel}>
        <div className={styles.messagesHeader}>
          <span className={styles.messagesLabel}>// MESSAGES_LOG</span>
        </div>
        {messages.length === 0 ? (
          <div className={styles.emptyMessages}>Connect to start sending and receiving messages...</div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((msg) => (
              <div key={msg.id} className={styles.message}>
                <span className={styles.messageTime}>{msg.timestamp}</span>
                <span
                  className={`${styles.messageDirection} ${
                    msg.direction === 'sent' ? styles.messageSent : styles.messageReceived
                  }`}
                >
                  {msg.direction === 'sent' ? 'SND' : 'RCV'}
                </span>
                <span className={styles.messageContent}>{msg.content}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Send Bar */}
      <div className={styles.sendBar}>
        <input
          type="text"
          className={styles.messageInput}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder='{"type":"ping","id":1}'
          disabled={!isConnected}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!isConnected || !message.trim()}
        >
          <Send size={14} />
          <span>SEND</span>
        </button>
        <button className={styles.clearBtn} onClick={handleClear}>
          <Trash2 size={14} />
          <span>CLEAR</span>
        </button>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span
            className={`${styles.statusDot} ${!isConnected ? styles.statusDotDisconnected : ''}`}
          />
          <span className={styles.statusText}>
            {isConnected
              ? `CONNECTED — ${messages.length} messages (${sentCount} sent, ${receivedCount} received)`
              : readyState === 'CONNECTING'
                ? 'CONNECTING...'
                : 'DISCONNECTED — Enter a WebSocket URL to connect'}
          </span>
        </div>
        <span className={styles.statusRight}>WS_TEST</span>
      </div>
    </>
  );
}
