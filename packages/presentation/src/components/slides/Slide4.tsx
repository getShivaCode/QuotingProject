import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

export default function Slide4() {
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
      className="slide slide-4 detail-slide"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content" variants={itemVariants}>
        <div className="step-badge">Step 1 of 4</div>

        <motion.h2 className="slide-title" variants={itemVariants}>
          Account Selection
        </motion.h2>

        <motion.p className="slide-subtitle" variants={itemVariants}>
          Identify the customer you're creating a quote for
        </motion.p>

        <motion.div className="detail-grid" variants={containerVariants}>
          {/* Main Content */}
          <motion.div className="detail-main" variants={itemVariants}>
            <div className="detail-step-box">
              <div className="step-icon">👥</div>
              <h3>Search & Select Account</h3>
              <p>
                Simply tell the agent which customer you want to quote for. The system searches your
                Salesforce accounts in real-time using intelligent matching.
              </p>
              <div className="code-highlight">
                <span className="code-label">Powered by:</span>
                <span className="code-item">Salesforce Account Search via SOQL Query</span>
              </div>
            </div>
          </motion.div>

          {/* Side Info */}
          <motion.div className="detail-info" variants={itemVariants}>
            <div className="info-card">
              <h4>What Happens Behind the Scenes</h4>
              <ul>
                <li>🔄 Agent listens for account name</li>
                <li>🔍 Queries Salesforce</li>
                <li>📋 Shows matching results</li>
                <li>✓ Confirms your selection</li>
                <li>💾 Stores selectedaccount info for next step</li>
              </ul>
            </div>

            <div className="info-card">
              <h4>Key Benefits</h4>
              <ul>
                <li>✨ No manual typing of IDs</li>
                <li>⚡ Fuzzy matching handles typos and partial matches</li>
                <li>🛡️ Only searches your accounts</li>
                <li>📱 Works on any device</li>
              </ul>
            </div>
          </motion.div>
        </motion.div>

        <motion.div className="next-step-hint" variants={itemVariants}>
          Next: Search for the products your customer needs →
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
