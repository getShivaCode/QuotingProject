import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

export default function Slide5() {
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
      className="slide slide-5 detail-slide"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content" variants={itemVariants}>
        <div className="step-badge">Step 2 of 4</div>

        <motion.h2 className="slide-title" variants={itemVariants}>
          Intelligent Product Search
        </motion.h2>

        <motion.p className="slide-subtitle" variants={itemVariants}>
          Find the right products using natural language, not SKU codes
        </motion.p>

        <motion.div className="detail-grid" variants={containerVariants}>
          {/* Main Content */}
          <motion.div className="detail-main" variants={itemVariants}>
            <div className="detail-step-box">
              <div className="step-icon">🔍</div>
              <h3>Semantic Product Search</h3>
              <p>
                Describe what you need in plain English: "heavy duty industrial valves" or "sulfuric acid".
                Our intelligent system searches your product catalog and returns relevant matches with
                live pricing. Keep iterating until you find the right products.
              </p>
              <div className="code-highlight">
                <span className="code-label">Powered by:</span>
                <span className="code-item">External MCP Product Search & Pricing Server</span>
                <span className="code-item">Semantic Search (AI-powered)</span>
                <span className="code-item">Real-time Catalog Integration</span>
              </div>
            </div>
          </motion.div>

          {/* Side Info */}
          <motion.div className="detail-info" variants={itemVariants}>
            <div className="info-card">
              <h4>What Happens Behind the Scenes</h4>
              <ul>
                <li>🗣️ Agent understands your request</li>
                <li>🌐 Searches external pricing server</li>
                <li>💡 Uses AI to match product names, descriptions, and SKUs</li>
                <li>👀 You review productsand select items</li>
              </ul>
            </div>

            <div className="info-card">
              <h4>Why This Matters</h4>
              <ul>
                <li>💬 No need to know SKU codes</li>
                <li>🎯 AI understands context & synonyms</li>
                <li>⚡ Instantly see pricing options</li>
                <li>📈 Access your full catalog</li>
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
