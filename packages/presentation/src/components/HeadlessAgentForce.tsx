import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, LogOut, Code, RotateCw, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { startSession, sendMessage as sendAgentMessage, endSession } from '../services/agentApi';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { useSession } from '../context/SessionContext';
import AccountCard from './cards/AccountCard';
import ProductCard from './cards/ProductCard';
import CartCard from './cards/CartCard';
import QuoteCard from './cards/QuoteCard';
import '../styles/agent.css';

const THINKING_MESSAGES = [
  'Exercising those neurons...',
  'Using them tokens...',
  'Making the magic happen...',
  'Channeling my inner Claude...',
  'Hallucinating the response...',
  'Spinning up the LLM...',
  'Asking the genie...',
  'Consulting the digital tea leaves...',
  'Decoding the matrix...',
  'Summoning the quoting gods...',
  'Brewing some coffee...',
  'Reticulating splines...',
  'Buffering brain cells...',
  'Juicing the tangerines...',
  'Consulting my rubber duck...',
  'Tokenizing reality...',
  'Searching deep into the vaults...',
  'Connecting the dots...',
];

interface Message {
  id: string;
  role: 'user' | 'agent';
  content?: string;
  timestamp: Date;
}

export default function HeadlessAgentForce() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setSessionId: setContextSessionId } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [liveResponseData, setLiveResponseData] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [quoteName, setQuoteName] = useState('');
  const [isRestarting, setIsRestarting] = useState(false);
  const [isLoggingOff, setIsLoggingOff] = useState(false);

  const { transcript, interimTranscript, isListening, isSupported: isSpeechSupported, error: speechError, startListening, stopListening } = useSpeechRecognition();
  const [showSpeechError, setShowSpeechError] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (transcript && !isListening) {
      setInputValue(transcript);
      handleSendMessage(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  useEffect(() => {
    if (speechError) {
      setShowSpeechError(true);
      setTimeout(() => setShowSpeechError(false), 3000);
    }
  }, [speechError]);

  const handleLogin = async () => {
    setAuthenticated(true);
    setIsConnecting(true);
    setIsSessionReady(false);
    // Initialize session when entering live mode
    try {
      const session = await startSession();
      setSessionId(session.sessionId);
      setContextSessionId(session.sessionId);
      setMessages([]);

      // Session is initialized server-side with JSON mode enabled

      // Display Tally's greeting after agent is ready
      const greetingMsg: Message = {
        id: Date.now().toString(),
        role: 'agent',
        content: "Hi! I'm Tally, your Quoting Assistant. I'm here to help you create quotes for your customers. Let's start by identifying the account you want to quote for. What's the account name, or any details you can provide to help me find it?",
        timestamp: new Date(),
      };
      setMessages([greetingMsg]);
      setIsSessionReady(true);
    } catch (e) {
      console.error('Failed to start session:', e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    console.log('[LOGOUT] Starting logout...');

    // Clear all UI state immediately for snappy feedback
    setMessages([]);
    setLiveResponseData(null);
    setInputValue('');
    setShowJson(false);
    setSelectedAccount(null);
    setIsCreatingQuote(false);
    setThinkingMessage('');
    setQuoteName('');
    setIsLoggingOff(true);
    setIsSessionReady(false);

    // End session if exists (background task)
    if (sessionId) {
      console.log('[LOGOUT] Ending session:', sessionId);
      try {
        await endSession(sessionId);
        console.log('[LOGOUT] Session ended successfully');
      } catch (e) {
        console.error('[LOGOUT] Failed to end session:', e);
      }
    }

    // Return to login screen
    setAuthenticated(false);
    setSessionId(null);
    setContextSessionId(null);
    setIsLoggingOff(false);
  };

  const handleNewSession = async () => {
    console.log('[RESTART] Starting new session...');

    // Clear all UI state immediately for snappy feedback
    setMessages([]);
    setLiveResponseData(null);
    setInputValue('');
    setShowJson(false);
    setSelectedAccount(null);
    setIsCreatingQuote(false);
    setThinkingMessage('');
    setQuoteName('');
    setIsRestarting(true);
    setIsSessionReady(false);

    // End current session if exists (background task)
    if (sessionId) {
      console.log('[RESTART] Ending old session:', sessionId);
      try {
        await endSession(sessionId);
        console.log('[RESTART] Old session ended successfully');
      } catch (e) {
        console.error('[RESTART] Failed to end old session:', e);
      }
    }

    // Transition to "Connecting..." state
    setIsRestarting(false);
    setIsConnecting(true);

    // Start fresh session
    try {
      console.log('[RESTART] Creating new session...');
      const session = await startSession();
      console.log('[RESTART] New session created:', session.sessionId);
      setSessionId(session.sessionId);
      setContextSessionId(session.sessionId);

      // Session initialized server-side with JSON mode enabled
      // Display Tally's greeting after agent is ready
      const greetingMsg: Message = {
        id: Date.now().toString(),
        role: 'agent',
        content: "Hi! I'm Tally, your Quoting Assistant. I'm here to help you create quotes for your customers. Let's start by identifying the account you want to quote for. What's the account name, or any details you can provide to help me find it?",
        timestamp: new Date(),
      };
      setMessages([greetingMsg]);
      setIsSessionReady(true);
    } catch (e) {
      console.error('[RESTART] Failed to create new session:', e);
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
    setThinkingMessage(THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)]);

    try {
      const response = await sendAgentMessage(activeSessionId!, message);
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

  const handleSendMessage = (messageOverride?: string) => {
    const messageToSend = messageOverride || inputValue;
    if (!messageToSend.trim()) return;
    handleLiveMessage(messageToSend);
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
              <span className="account-name">{selectedAccount?.Name || 'Account Selected'}</span>
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

      case 'pricing':
        // Show draft quote with line items and total, plus quote name input
        const isReadyToSubmit = quoteName.trim().length > 0;
        const items = data?.items || [];
        const grandTotal = data?.grandTotal || 0;

        return (
          <motion.div
            className="viz-draft-quote"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 217, 255, 0.05)',
              border: '1px solid rgba(0, 217, 255, 0.2)',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>
                {data?.accountName || 'Quote'}
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px' }}>
                {Array.isArray(items) && items.length > 0 ? (
                  <div>
                    {items.map((item: any, idx: number) => {
                      const price = item.unitPrice || item.unit_price || 0;
                      const total = item.lineTotal || item.subtotal || 0;
                      return (
                        <div key={idx} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <div style={{ fontWeight: '500', color: 'rgba(0, 217, 255, 0.8)' }}>{item.name}</div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px', fontSize: '10px' }}>
                            SKU: {item.sku}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '6px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', fontSize: '10px' }}>
                            <span>Qty:</span>
                            <span>{item.quantity} @ ${Number(price).toFixed(2)}</span>
                            <span>Line:</span>
                            <span style={{ color: 'rgba(0, 217, 255, 0.8)' }}>${Number(total).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No items in quote</div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(0, 217, 255, 0.3)', paddingTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px', fontSize: '13px', marginBottom: '16px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Grand Total:</span>
                <span style={{ color: 'rgba(0, 217, 255, 0.9)', fontWeight: '600' }}>
                  ${Number(grandTotal).toFixed(2)} {data?.currency || 'USD'}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(0, 217, 255, 0.8)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  QUOTE NAME (Required)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Project Alpha Q2 2024"
                  value={quoteName}
                  onChange={(e) => setQuoteName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isReadyToSubmit && !isLoading) {
                      handleLiveMessage(`Create quote with name: ${quoteName}`);
                      setQuoteName('');
                    }
                  }}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: isReadyToSubmit ? '1px solid rgba(0, 217, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <motion.button
                onClick={() => {
                  if (isReadyToSubmit && !isLoading) {
                    handleLiveMessage(`Create quote with name: ${quoteName}`);
                    setQuoteName('');
                  }
                }}
                disabled={!isReadyToSubmit || isLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: isReadyToSubmit && !isLoading ? 'rgba(0, 217, 255, 0.8)' : 'rgba(0, 217, 255, 0.3)',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: isReadyToSubmit && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: isReadyToSubmit && !isLoading ? 1 : 0.5,
                }}
                whileHover={isReadyToSubmit && !isLoading ? { scale: 1.02 } : {}}
                whileTap={isReadyToSubmit && !isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? 'Creating...' : 'Create Quote'}
              </motion.button>
            </div>
          </motion.div>
        );

      case 'quote_confirm':
      case 'quote_created':
        // Transform agent response to QuoteCard format
        const transformedQuoteData = {
          quoteNumber: data?.quoteNumber,
          quoteId: data?.quoteId,
          accountName: data?.accountName,
          grandTotal: Number(data?.grandTotal || 0),
          status: 'Generated',
          currency: data?.currency || 'USD',
          itemCount: (data?.items || []).length,
          items: (data?.items || []).map((item: any) => ({
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.lineTotal,
          })),
        };
        return <QuoteCard quoteData={transformedQuoteData} />;

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
            {isLoggingOff && (
              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 200, 0, 0.8)',
                fontFamily: "'Monaco', 'Courier New', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ display: 'inline-block', animation: 'pulse 1.5s infinite' }}>●</span>
                Logging off...
              </span>
            )}
            {(isConnecting || isRestarting) && !isLoggingOff && (
              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 200, 0, 0.8)',
                fontFamily: "'Monaco', 'Courier New', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ display: 'inline-block', animation: 'pulse 1.5s infinite' }}>●</span>
                {isRestarting ? 'Restarting session...' : 'Connecting...'}
              </span>
            )}
            {sessionId && !isConnecting && !isRestarting && !isLoggingOff && (
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
            {sessionId && !isConnecting && !isRestarting && !isLoggingOff && (
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
              disabled={isLoggingOff || isConnecting || !sessionId}
              whileHover={!(isLoggingOff || isConnecting || !sessionId) ? { scale: 1.1 } : undefined}
              whileTap={!(isLoggingOff || isConnecting || !sessionId) ? { scale: 0.95 } : undefined}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                    {thinkingMessage}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="agent-input">
          <input
            type="text"
            value={isListening ? (interimTranscript || inputValue) : inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading && !isListening) { e.preventDefault(); handleSendMessage(); } }}
            placeholder={authenticated && sessionId ? (isListening ? "Listening..." : "Type or click mic...") : "Click 'Try It Live' to start"}
            disabled={isLoading || !authenticated || !sessionId || isListening || !isSessionReady || isRestarting || isLoggingOff}
            className="input-field"
            style={isLoading || isListening || isRestarting || isLoggingOff ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          />
          {isSpeechSupported && (
            <motion.button
              onClick={() => isListening ? stopListening() : startListening()}
              disabled={isLoading || !authenticated || !sessionId || !isSessionReady || isRestarting || isLoggingOff}
              className={`microphone-button ${isListening ? 'listening' : ''}`}
              whileHover={!isLoading && !isListening && !isRestarting && !isLoggingOff ? { scale: 1.05 } : {}}
              whileTap={!isLoading && !isRestarting && !isLoggingOff ? { scale: 0.95 } : {}}
              style={isLoading || isListening || isRestarting || isLoggingOff ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              title={isListening ? "Stop listening" : "Click to speak"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </motion.button>
          )}
          <motion.button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading || !authenticated || !sessionId || isListening || !isSessionReady || isRestarting || isLoggingOff}
            className="send-button"
            whileHover={!isLoading && !isListening && !isRestarting && !isLoggingOff ? { scale: 1.05 } : {}}
            whileTap={!isLoading && !isRestarting && !isLoggingOff ? { scale: 0.95 } : {}}
            style={isLoading || isListening || isRestarting || isLoggingOff ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            <Send size={18} />
          </motion.button>
        </div>
        {showSpeechError && speechError && (
          <div style={{
            color: '#ff6b6b',
            fontSize: '12px',
            padding: '8px 12px',
            marginTop: '8px',
            textAlign: 'center',
          }}>
            {speechError === 'network' ? 'Network error. Please check your connection.' : `Error: ${speechError}`}
          </div>
        )}
      </div>

      <div className="agent-right">
        <div className="viz-header">
          <h3>
            {liveResponseData && !showJson
              ? (liveResponseData.type === 'account_search' ? 'Accounts'
                 : liveResponseData.type === 'account_confirm' ? 'Account'
                 : liveResponseData.type === 'product_search' ? 'Products'
                 : liveResponseData.type === 'cart_update' ? (isCreatingQuote ? 'Draft Quote' : 'Shopping Cart')
                 : liveResponseData.type === 'pricing' ? 'Draft Quote'
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
