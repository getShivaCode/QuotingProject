import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

export default function Slide2() {
  const challenges = [
    {
      title: 'Fragmented Systems',
      description: 'Accounts in Salesforce, pricing in spreadsheets, products scattered across databases',
      icon: '🔀',
    },
    {
      title: 'Manual Search Process',
      description: 'Product catalogs are massive. Reps manually flip through specs to find what customers need',
      icon: '🔍',
    },
    {
      title: 'Complex Pricing Rules',
      description: 'Volume discounts, special pricing, regional rates - nearly impossible to calculate manually',
      icon: '💰',
    },
    {
      title: 'Data Entry Errors',
      description: 'Every manual step introduces risk of mistakes - wrong SKU, wrong quantity, wrong price',
      icon: '⚠️',
    },
    {
      title: 'Time Waste',
      description: 'Sales reps spend hours on quoting instead of closing deals',
      icon: '⏱️',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="slide slide-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content" variants={itemVariants}>
        <motion.h2 className="slide-title" variants={itemVariants}>
          The Challenge
        </motion.h2>

        <motion.p className="slide-subtitle" variants={itemVariants}>
          Today's quoting process is fragmented, manual, and error-prone
        </motion.p>

        <motion.div className="challenges-grid" variants={containerVariants}>
          {challenges.map((challenge, index) => (
            <motion.div
              key={index}
              className="challenge-card"
              variants={itemVariants}
              whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }}
            >
              <div className="challenge-icon">{challenge.icon}</div>
              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
