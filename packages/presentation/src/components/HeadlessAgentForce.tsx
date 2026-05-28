import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, LogOut, Code, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { startSession, sendMessage as sendAgentMessage, endSession } from '../services/agentApi';
import AccountCard from './cards/AccountCard';
import ProductCard from './cards/ProductCard';
import CartCard from './cards/CartCard';
import QuoteCard from './cards/QuoteCard';
import '../styles/agent.css';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content?: string;
  timestamp: Date;
}

export default function HeadlessAgentForce() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [liveResponseData, setLiveResponseData] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleLogin = async () => {
    setAuthenticated(true);
    setIsConnecting(true);
    // Initialize session when entering live mode
    try {
      const session = await startSession();
      setSessionId(session.sessionId);
      // Add welcome message when entering live mode
      setMessages([
        {
          id: '1',
          role: 'agent',
          content: "Hi! I'm Tally the Quoting Assistant. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    } catch (e) {
      console.error('Failed to start session:', e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    if (sessionId) {
      try { await endSession(sessionId); } catch {}
    }
    setAuthenticated(false);
    setShowJson(false);
    setSessionId(null);
    setIsFirstMessage(true);
    setLiveResponseData(null);
    setMessages([]);
    setIsConnecting(false);
    setSelectedAccount(null);
    setIsCreatingQuote(false);
  };

  const handleNewSession = async () => {
    // End current session if exists
    if (sessionId) {
      try { await endSession(sessionId); } catch {}
    }
    // Start fresh session
    setIsConnecting(true);
    try {
      const session = await startSession();
      setSessionId(session.sessionId);
      setMessages([
        {
          id: '1',
          role: 'agent',
          content: "Hi! I'm Tally, the Quoting Assistant. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
      setShowJson(false);
      setLiveResponseData(null);
      setIsFirstMessage(true);
      setSelectedAccount(null);
      setIsCreatingQuote(false);
    } catch (e) {
      console.error('Failed to start new session:', e);
    } finally {
      setIsConnecting(false);
    }
  };


  const handleLiveMessage = async (message: string) => {
    if (!sessionId) {
      console.error('No active session');
      return;
    }
    const activeSessionId = sessionId;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const utterance = isFirstMessage
        ? `output_format: json. ${message}`
        : message;
      setIsFirstMessage(false);

      const response = await sendAgentMessage(activeSessionId!, utterance);
      setLiveResponseData(response);

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'Error communicating with agent. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    handleLiveMessage(inputValue);
  };


  const renderVizContent = () => {
    if (!liveResponseData) return null;

    // Show raw JSON if toggled
    if (showJson) {
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <pre style={{
            flex: 1,
            overflow: 'auto',
            padding: '12px',
            background: '#2c3e50',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: "'Monaco', 'Courier New', monospace",
            color: '#66dd99',
            margin: 0,
            lineHeight: '1.4',
          }}>
            {JSON.stringify(liveResponseData, null, 2)}
          </pre>
        </div>
      );
    }

    const { type, data } = liveResponseData;

    switch (type) {
      case 'account_search':
        if (!data || !Array.isArray(data)) {
          return (
            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>
              No accounts found
            </div>
          );
        }
        return (
          <div className="card-grid">
            {data.map((account: any, idx: number) => (
              <AccountCard
                key={account.Id}
                account={account}
                index={idx + 1}
                disabled={selectedAccount !== null}
                onSelect={(index: number) => {
                  const selected = data[index - 1];
                  setSelectedAccount(selected);
                  const message = `Select the account "${selected.Name}"`;
                  handleLiveMessage(message);
                }}
              />
            ))}
          </div>
        );

      case 'account_confirm':
        // Show selected account card with location and phone
        return (
          <motion.div
            className="viz-account-card-selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="account-header">
              <span className="account-number">✓</span>
              <span className="account-name">{data.account_name}</span>
            </div>
            {selectedAccount && (
              <>
                <div className="account-location-large">
                  {selectedAccount.BillingCity && selectedAccount.BillingState && (
                    `${selectedAccount.BillingCity}, ${selectedAccount.BillingState}`
                  )}
                </div>
                {selectedAccount.Phone && (
                  <div className="account-phone-large">{selectedAccount.Phone}</div>
                )}
              </>
            )}
            <div className="account-status">Account Confirmed</div>
          </motion.div>
        );

      case 'product_search':
        if (!data || !Array.isArray(data)) {
          return (
            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>
              No products found
            </div>
          );
        }
        return (
          <div className="card-grid">
            {data.map((product: any, idx: number) => (
              <ProductCard
                key={product.sku}
                product={product}
                index={idx}
                onAddToCart={(sku: string, qty: number) => {
                  setInputValue(`Add ${qty} units of ${sku}`);
                  handleSendMessage();
                }}
              />
            ))}
          </div>
        );

      case 'cart_update':
        return (
          <CartCard
            cartData={data}
            isCreatingQuote={isCreatingQuote}
            onCreateQuote={() => {
              setIsCreatingQuote(true);
              handleLiveMessage("I'm ready to create a quote");
            }}
          />
        );

      case 'quote_confirm':
      case 'quote_created':
        return <QuoteCard quoteData={data} />;

      default:
        return (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <pre style={{
              flex: 1,
              overflow: 'auto',
              padding: '12px',
              background: '#2c3e50',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: "'Monaco', 'Courier New', monospace",
              color: '#66dd99',
              margin: 0,
              lineHeight: '1.4',
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (!authenticated) {
    return (
      <motion.div
        className="agent-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="login-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-card">
            <div className="login-icon">🤖</div>
            <h2>Quoting Assistant</h2>
            <p>Powered by Agentforce</p>
            <motion.button
              className="login-button"
              onClick={handleLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login with Salesforce
            </motion.button>
            <p className="login-hint">
              Note: This requires Salesforce OAuth to be configured
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="agent-wrapper">
      <div className="agent-left">
        <div className="agent-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <div className="agent-title">
              <MessageCircle size={20} />
              <span>Tally</span>
              {sessionId && <span className="live-badge">LIVE</span>}
            </div>
            {isConnecting && (
              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 200, 0, 0.8)',
                fontFamily: "'Monaco', 'Courier New', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ display: 'inline-block', animation: 'pulse 1.5s infinite' }}>●</span>
                Connecting...
              </span>
            )}
            {sessionId && !isConnecting && (
              <span style={{
                fontSize: '10px',
                color: '#1B9B9E',
                fontFamily: "'Monaco', 'Courier New', monospace",
                wordBreak: 'break-all',
              }}>
                Session: {sessionId}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {sessionId && !isConnecting && (
              <motion.button
                className="new-session-button"
                onClick={handleNewSession}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Start a new session"
              >
                <RotateCw size={18} />
              </motion.button>
            )}
            <motion.button
              className="logout-button"
              onClick={handleLogout}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={18} />
            </motion.button>
          </div>
        </div>

        <div className="agent-messages">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`message message-${message.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {message.content && (
                <div className="message-bubble">
                  {message.content}
                </div>
              )}
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              className="message message-agent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="agent-input">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) { e.preventDefault(); handleSendMessage(); } }}
            placeholder={authenticated && sessionId ? "Type your message..." : "Click 'Try It Live' to start"}
            disabled={isLoading || !authenticated || !sessionId}
            className="input-field"
            style={isLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !authenticated || !sessionId}
            className="send-button"
            whileHover={!isLoading ? { scale: 1.05 } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
            style={isLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>

      <div className="agent-right">
        <div className="viz-header">
          <h3>
            {liveResponseData && !showJson
              ? (liveResponseData.type === 'account_search' ? 'Accounts'
                 : liveResponseData.type === 'account_confirm' ? 'Account'
                 : liveResponseData.type === 'product_search' ? 'Products'
                 : liveResponseData.type === 'cart_update' ? (isCreatingQuote ? 'Draft Quote' : 'Shopping Cart')
                 : liveResponseData.type === 'quote_created' ? 'Quote Created'
                 : 'Agent Response')
              : 'Agent Response'}
          </h3>
          {liveResponseData && (
            <motion.button
              onClick={() => setShowJson(!showJson)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(0, 217, 255, 0.2)',
                borderRadius: '4px',
                color: 'rgba(0, 217, 255, 0.5)',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
              whileHover={{ color: 'rgba(0, 217, 255, 0.8)', borderColor: 'rgba(0, 217, 255, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Code size={12} />
            </motion.button>
          )}
        </div>
        <div className="viz-content">
          {renderVizContent()}
        </div>
      </div>
    </div>
  );
}
