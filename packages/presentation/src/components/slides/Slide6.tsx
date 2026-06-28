import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

export default function Slide6() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const cartItems = [
    { name: 'Heavy Duty Valve (CHEM-008)', qty: 10, price: 250, total: 2500 },
    { name: 'Safety Relief (CHEM-045)', qty: 5, price: 150, total: 750 },
  ];

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <motion.div
      className="slide slide-6 detail-slide"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content" variants={itemVariants}>
        <div className="step-badge">Step 3 of 4</div>

        <motion.h2 className="slide-title" variants={itemVariants}>
          Shopping Cart
        </motion.h2>

        <motion.p className="slide-subtitle" variants={itemVariants}>
          Review selected products, adjust quantities, and prepare for quote generation
        </motion.p>

        <motion.div className="detail-grid" variants={containerVariants}>
          {/* Main Content - Shopping Cart */}
          <motion.div className="detail-main" variants={itemVariants}>
            <div className="detail-step-box">
              <div className="step-icon-title">
                <div className="step-icon">🛒</div>
                <h3>Manage Your Items</h3>
              </div>
              <p>
                Review the products you've selected. Adjust quantities as needed and see
                pricing update in real-time. Everything is calculated automatically with
                volume discounts applied.
              </p>

              {/* Cart Visualization */}
              <motion.div className="cart-preview" variants={containerVariants}>
              <div className="cart-header">Your Shopping Cart</div>
              {cartItems.map((item, idx) => (
                <motion.div key={idx} className="cart-item" variants={itemVariants}>
                  <div className="cart-item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">Qty: {item.qty}</span>
                  </div>
                  <div className="cart-item-price">
                    <span className="item-unit">${item.price}/ea</span>
                    <span className="item-total">${item.total}</span>
                  </div>
                </motion.div>
              ))}
              <div className="cart-total">
                <span>Subtotal:</span>
                <span className="total-amount">${total.toLocaleString()}</span>
              </div>
            </motion.div>

              <div className="code-highlight">
                <span className="code-label">Powered by:</span>
                <span className="code-item">Real-time Price Lookups</span>
                <span className="code-item">Automatic Discount Calculation</span>
                <span className="code-item">Currency & Tax Handling</span>
              </div>
            </div>
          </motion.div>

          {/* Side Info */}
          <motion.div className="detail-info" variants={itemVariants}>
            <div className="info-card">
              <h4>Cart Features</h4>
              <ul>
                <li>🔄 Adjust quantities on the fly</li>
                <li>💰 Dynamic pricing updates</li>
                <li>🏷️ Volume discounts calculated</li>
                <li>🌍 Multi-currency support</li>
                <li>📊 Live totals & breakdowns</li>
              </ul>
            </div>

            <div className="info-card">
              <h4>Next Step</h4>
              <ul>
                <li>✓ Ready to generate quote</li>
                <li>✓ Will create official record</li>
                <li>✓ Assign quote number</li>
                <li>✓ Save to Salesforce</li>
                <li>✓ Ready to send customer</li>
              </ul>
            </div>
          </motion.div>
        </motion.div>

        <motion.div className="next-step-hint" variants={itemVariants}>
          Next: Generate and request the quote →
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
