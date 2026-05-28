import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

export default function Slide1() {
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
      className="slide slide-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content" variants={itemVariants}>
        <motion.h1 className="value-title" variants={itemVariants}>
          Transform Your Quoting Process
        </motion.h1>

        <motion.p className="value-subtitle" variants={itemVariants}>
          Deliver accurate quotes in minutes, not days
        </motion.p>

        <motion.div className="value-grid" variants={itemVariants}>
          <motion.div className="value-item" whileHover={{ scale: 1.05 }}>
            <div className="value-icon">⚡</div>
            <h3>Real-Time Pricing</h3>
            <p>Access live pricing from your catalog instantly</p>
          </motion.div>

          <motion.div className="value-item" whileHover={{ scale: 1.05 }}>
            <div className="value-icon">🎯</div>
            <h3>Intelligent Search</h3>
            <p>Find the right products with natural language</p>
          </motion.div>

          <motion.div className="value-item" whileHover={{ scale: 1.05 }}>
            <div className="value-icon">✨</div>
            <h3>Seamless Integration</h3>
            <p>Works with your existing Salesforce data</p>
          </motion.div>

          <motion.div className="value-item" whileHover={{ scale: 1.05 }}>
            <div className="value-icon">📊</div>
            <h3>Smart Insights</h3>
            <p>Track quotes and customer patterns automatically</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
