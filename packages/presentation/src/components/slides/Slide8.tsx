import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

const HeadlessAgentForce = lazy(() => import('../HeadlessAgentForce'));

export default function Slide8() {
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
      className="slide slide-8 detail-slide"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content" variants={itemVariants}>
        <div className="step-badge">Final</div>

        <motion.h2 className="slide-title" variants={itemVariants}>
          Try It Live
        </motion.h2>

        <motion.p className="slide-subtitle" variants={itemVariants}>
          Experience Tally, the headless Quoting Assistant powered by Agentforce
        </motion.p>

        <motion.div className="agent-embed" variants={itemVariants}>
          <Suspense fallback={<div className="agent-loading">Loading Quoting Assistant...</div>}>
            <HeadlessAgentForce />
          </Suspense>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
