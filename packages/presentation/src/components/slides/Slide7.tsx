import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

export default function Slide7() {
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

  return (
    <motion.div
      className="slide slide-7 detail-slide"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content" variants={itemVariants}>
        <div className="step-badge">Step 4 of 4</div>

        <motion.h2 className="slide-title" variants={itemVariants}>
          Request for Quote
        </motion.h2>

        <motion.p className="slide-subtitle" variants={itemVariants}>
          Generate the official quote and send it to your customer with a single click
        </motion.p>

        <motion.div className="detail-grid" variants={containerVariants}>
          {/* Main Content */}
          <motion.div className="detail-main" variants={itemVariants}>
            <div className="detail-step-box">
              <div className="step-icon">📄</div>
              <h3>Generate & Submit</h3>
              <p>
                Click to generate the official quote with a unique quote number. It's
                automatically saved to Salesforce and ready to send to your customer
                via email, portal, or your preferred delivery method.
              </p>

              {/* Quote Summary Card */}
              <motion.div className="quote-summary" variants={containerVariants}>
                <div className="summary-header">
                  <div>
                    <div className="summary-label">Quote Number</div>
                    <div className="summary-value">Q-0000123</div>
                  </div>
                  <div>
                    <div className="summary-label">Status</div>
                    <div className="summary-value status-draft">Draft</div>
                  </div>
                </div>

                <div className="summary-body">
                  <div className="summary-row">
                    <span>Account:</span>
                    <strong>Acme Corp</strong>
                  </div>
                  <div className="summary-row">
                    <span>Total Value:</span>
                    <strong>$3,250.00</strong>
                  </div>
                  <div className="summary-row">
                    <span>Items:</span>
                    <strong>2 products</strong>
                  </div>
                  <div className="summary-row">
                    <span>Generated:</span>
                    <strong>Today</strong>
                  </div>
                </div>
              </motion.div>

              <div className="code-highlight">
                <span className="code-label">Powered by:</span>
                <span className="code-item">Salesforce Quote Management</span>
                <span className="code-item">Automatic Quote Numbering</span>
                <span className="code-item">Multi-Channel Delivery</span>
              </div>
            </div>
          </motion.div>

          {/* Side Info */}
          <motion.div className="detail-info" variants={itemVariants}>
            <div className="info-card">
              <h4>What Happens Next</h4>
              <ul>
                <li>✅ Quote saved to Salesforce</li>
                <li>📧 Send to customer via email</li>
                <li>🔗 Share customer portal link</li>
                <li>📊 Track acceptance/rejection</li>
                <li>🔄 Convert to order when ready</li>
              </ul>
            </div>

            <div className="info-card">
              <h4>Complete Workflow</h4>
              <ul>
                <li>✓ Account identified</li>
                <li>✓ Products searched & selected</li>
                <li>✓ Items added to cart</li>
                <li>✓ Pricing calculated</li>
                <li>✓ Quote generated & sent</li>
              </ul>
            </div>
          </motion.div>
        </motion.div>

        <motion.div className="next-step-hint" variants={itemVariants}>
          Next: Add quantities and build your shopping cart →
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
