import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, LogOut, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/agent.css';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content?: string;
  cards?: any[];
  cardType?: 'account' | 'product';
  timestamp: Date;
}

interface Account {
  id: string;
  name: string;
  industry: string;
  arr: number;
  location: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description: string;
}

interface CartItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  price: number;
  total: number;
}

type ConversationStage = 'start' | 'account-search' | 'product-search' | 'cart-management' | 'quote-generated';

export default function HeadlessAgentForce() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mockAccounts: Account[] = [
    { id: '1', name: 'Acme Corp', industry: 'Manufacturing', arr: 2500000, location: 'New York' },
    { id: '2', name: 'TechVision Inc', industry: 'Technology', arr: 5000000, location: 'San Francisco' },
    { id: '3', name: 'Global Industries', industry: 'Distribution', arr: 1800000, location: 'Chicago' },
    { id: '4', name: 'Summit Solutions', industry: 'Consulting', arr: 3200000, location: 'Boston' },
  ];

  const mockProducts: Product[] = [
    { id: 'P1', name: 'Heavy Duty Valve', sku: 'CHEM-008', price: 250, description: 'Industrial grade chemical valve' },
    { id: 'P2', name: 'Safety Relief', sku: 'CHEM-045', price: 150, description: 'Safety relief valve system' },
    { id: 'P3', name: 'Flow Control', sku: 'CHEM-052', price: 320, description: 'Precision flow control device' },
    { id: 'P4', name: 'Pressure Gauge', sku: 'CHEM-089', price: 85, description: 'Digital pressure monitoring' },
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content: "Hi! I'm the Quoting Assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [stage, setStage] = useState<ConversationStage>('start');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showJson, setShowJson] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleLogin = () => {
    setAuthenticated(true);
    setStage('start');
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setStage('start');
    setSelectedAccount(null);
    setSelectedProducts([]);
    setCartItems([]);
    setShowJson(false);
    setMessages([
      {
        id: '1',
        role: 'agent',
        content: "Hi! I'm the Quoting Assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setStage('product-search');
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: account.name,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Great! I've selected ${account.name}. Now, what products would you like to add to the quote? Search for a product name.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsLoading(false);
    }, 800);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProducts((prev) => [...prev, product]);
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      qty: 1,
      price: product.price,
      total: product.price,
    };
    setCartItems((prev) => [...prev, cartItem]);
    setStage('cart-management');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: product.name,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Added ${product.name} to your cart. You can type to adjust quantities or add more products.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsLoading(false);
    }, 500);
  };

  const handleMessageSubmit = (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      let agentContent = '';
      let agentCards: any[] | undefined;
      let cardType: 'account' | 'product' | undefined;

      if (stage === 'start') {
        // Search for accounts
        const searchResults = mockAccounts.filter((acc) =>
          acc.name.toLowerCase().includes(message.toLowerCase())
        );

        if (searchResults.length === 1) {
          handleAccountClick(searchResults[0]);
          setIsLoading(false);
          return;
        } else if (searchResults.length > 1) {
          agentContent = `Found ${searchResults.length} companies. Please select one:`;
          agentCards = searchResults;
          cardType = 'account';
          setStage('account-search');
        } else {
          agentContent = `No companies found with "${message}". Try searching for: ${mockAccounts.map((a) => a.name).join(', ')}`;
        }
      } else if (stage === 'product-search') {
        // Search for products
        const searchResults = mockProducts.filter((prod) =>
          prod.name.toLowerCase().includes(message.toLowerCase())
        );

        if (searchResults.length > 0) {
          if (searchResults.length === 1) {
            handleProductClick(searchResults[0]);
            setIsLoading(false);
            return;
          } else {
            agentContent = `Found ${searchResults.length} products. Please select one:`;
            agentCards = searchResults;
            cardType = 'product';
          }
        } else {
          agentContent = `No products found with "${message}". Try: ${mockProducts.map((p) => p.name).join(', ')}`;
        }
      } else if (stage === 'cart-management') {
        // Parse cart commands
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('add') || lowerMsg.includes('more')) {
          agentContent = `What product would you like to add?`;
          agentCards = mockProducts.filter(
            (p) => !selectedProducts.some((sp) => sp.id === p.id)
          );
          cardType = 'product';
          setStage('product-search');
        } else if (lowerMsg.includes('remove') || lowerMsg.includes('delete')) {
          agentContent = `Which product would you like to remove?`;
        } else if (lowerMsg.match(/\d+/)) {
          // Assume it's a quantity update
          const qty = parseInt(message);
          if (cartItems.length > 0) {
            const updatedCart = [...cartItems];
            updatedCart[0].qty = qty;
            updatedCart[0].total = qty * updatedCart[0].price;
            setCartItems(updatedCart);
            agentContent = `Updated quantity to ${qty} for ${updatedCart[0].name}.`;
          }
        } else {
          agentContent = `You can adjust quantities by typing numbers, or type "add more" to add more products.`;
        }
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: agentContent,
        cards: agentCards,
        cardType: cardType,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsLoading(false);
    }, 800);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    handleMessageSubmit(inputValue);
  };

  const handleGenerateQuote = () => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Generate quote',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStage('quote-generated');
    setIsLoading(true);

    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Your quote has been generated successfully!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsLoading(false);
    }, 800);
  };

  const getAgentResponseJson = () => {
    const total = cartItems.reduce((sum, item) => sum + item.total, 0);
    return {
      stage,
      selectedAccount,
      cartItems,
      total,
      quoteNumber: 'Q-0000123',
      timestamp: new Date().toISOString(),
    };
  };

  const renderVizContent = () => {
    if (stage === 'cart-management' || stage === 'quote-generated') {
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
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: "'Monaco', 'Courier New', monospace",
              color: '#00ff88',
              margin: 0,
              lineHeight: '1.4',
            }}>
              {JSON.stringify(getAgentResponseJson(), null, 2)}
            </pre>
          </div>
        );
      }

      if (stage === 'quote-generated') {
        const total = cartItems.reduce((sum) => sum + 0, 0) + cartItems.reduce((sum, item) => sum + item.total, 0);
        return (
          <div className="quote-display">
            <div className="quote-header">
              <div className="quote-number">Quote #Q-0000123</div>
              <div className="quote-status status-draft">Draft</div>
            </div>
            <div className="quote-details">
              <div className="quote-row">
                <span>Account:</span>
                <strong>{selectedAccount?.name}</strong>
              </div>
              <div className="quote-row">
                <span>Items:</span>
                <strong>{cartItems.length} products</strong>
              </div>
              <div className="quote-row">
                <span>Total Value:</span>
                <strong>${cartItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}</strong>
              </div>
              <div className="quote-row">
                <span>Generated:</span>
                <strong>{new Date().toLocaleDateString()}</strong>
              </div>
              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0, 217, 255, 0.2)', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#00d9ff', marginBottom: '8px' }}>ITEMS</div>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ fontSize: '11px', marginBottom: '8px', padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px' }}>
                    <div style={{ color: '#ffffff', fontWeight: '600' }}>{item.name}</div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '10px' }}>{item.sku}</div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '10px' }}>Qty: {item.qty} × ${item.price} = ${item.total}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // Cart management view
      const total = cartItems.reduce((sum, item) => sum + item.total, 0);
      return (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-display">
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-sku">{item.sku}</div>
                </div>
                <div className="item-qty">Qty: {item.qty}</div>
                <div className="item-price">${item.total}</div>
              </div>
            ))}
            <div className="cart-total-display">
              <span>Total:</span>
              <span className="total-value">${total.toLocaleString()}</span>
            </div>
          </div>
          <motion.button
            onClick={handleGenerateQuote}
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #00d9ff 0%, #0099ff 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Generate Quote
          </motion.button>
        </div>
      );
    }

    return null;
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
          <div className="agent-title">
            <MessageCircle size={20} />
            <span>Quoting Assistant</span>
          </div>
          <motion.button
            className="logout-button"
            onClick={handleLogout}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={18} />
          </motion.button>
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
              {message.cards && message.cards.length > 0 && (
                <div className="message-cards-container">
                  {message.cards.map((card) => (
                    <motion.div
                      key={card.id}
                      onClick={() => {
                        if (message.cardType === 'account') {
                          handleAccountClick(card);
                        } else if (message.cardType === 'product') {
                          handleProductClick(card);
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {message.cardType === 'account' ? (
                        <div className="account-card-inline">
                          <div className="account-name">{card.name}</div>
                          <div className="account-detail">{card.industry}</div>
                          <div className="account-detail">${(card.arr / 1000000).toFixed(1)}M ARR</div>
                        </div>
                      ) : (
                        <div className="product-card-inline">
                          <div className="product-name">{card.name}</div>
                          <div className="product-sku">{card.sku}</div>
                          <div className="product-price">${card.price}</div>
                        </div>
                      )}
                    </motion.div>
                  ))}
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
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              stage === 'start'
                ? 'Search for a company...'
                : stage === 'product-search'
                ? 'Search for a product...'
                : 'Type a quantity or command...'
            }
            disabled={isLoading}
            className="input-field"
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>

      <div className="agent-right">
        <div className="viz-header">
          <h3>
            {stage === 'cart-management' || stage === 'quote-generated'
              ? stage === 'quote-generated'
                ? 'Generated Quote'
                : 'Shopping Cart'
              : 'Order Summary'}
          </h3>
          {(stage === 'cart-management' || stage === 'quote-generated') && (
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
