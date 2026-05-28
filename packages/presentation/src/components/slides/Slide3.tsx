import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

export default function Slide3() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      className="slide slide-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content solution-content" variants={itemVariants}>
        <motion.h2 className="slide-title" variants={itemVariants}>
          Our Solution: An Intelligent Agent
        </motion.h2>

        <motion.p className="slide-subtitle" variants={itemVariants}>
          A conversational AI guide that walks you through the quoting process seamlessly
        </motion.p>

        <motion.div className="solution-flow" variants={containerVariants}>
          {/* Step 1 */}
          <motion.div className="flow-item" variants={itemVariants}>
            <div className="flow-number">1</div>
            <h3>Account Selection</h3>
            <p>Tell the agent which customer you're quoting for</p>
          </motion.div>

          <motion.div className="flow-arrow" variants={itemVariants}>→</motion.div>

          {/* Step 2 */}
          <motion.div className="flow-item" variants={itemVariants}>
            <div className="flow-number">2</div>
            <h3>Product Search</h3>
            <p>Describe what you need in plain English</p>
          </motion.div>

          <motion.div className="flow-arrow" variants={itemVariants}>→</motion.div>

          {/* Step 3 */}
          <motion.div className="flow-item" variants={itemVariants}>
            <div className="flow-number">3</div>
            <h3>Build Quote</h3>
            <p>Add items and finalize pricing</p>
          </motion.div>

          <motion.div className="flow-arrow" variants={itemVariants}>→</motion.div>

          {/* Step 4 */}
          <motion.div className="flow-item" variants={itemVariants}>
            <div className="flow-number">4</div>
            <h3>Request Quote</h3>
            <p>Send to customer in seconds</p>
          </motion.div>
        </motion.div>

        <motion.div className="solution-benefits" variants={containerVariants}>
          <motion.div className="benefit" variants={itemVariants}>
            <div className="benefit-check">✓</div>
            <span>Conversational & intuitive - no training required</span>
          </motion.div>
          <motion.div className="benefit" variants={itemVariants}>
            <div className="benefit-check">✓</div>
            <span>Unified view of accounts, products, and pricing</span>
          </motion.div>
          <motion.div className="benefit" variants={itemVariants}>
            <div className="benefit-check">✓</div>
            <span>Automatic accuracy - no manual calculations</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
