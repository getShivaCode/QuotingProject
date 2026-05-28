import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

export default function Slide9() {
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
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const arrowVariants = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: { opacity: 1, scaleX: 1, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="slide slide-9"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content arch-content" variants={itemVariants}>
        <motion.h2 className="slide-title" variants={itemVariants}>
          Architecture
        </motion.h2>
        <motion.p className="slide-subtitle" variants={itemVariants}>
          How the Intelligent Quoting Agent connects surfaces, reasoning, and data
        </motion.p>

        <motion.div className="arch-layout" variants={containerVariants}>

          {/* Left: Persona + Interaction Surface */}
          <motion.div className="arch-left" variants={itemVariants}>
            <div className="arch-persona">
              <div className="persona-icon">👤</div>
              <div className="persona-label">Sales Rep / Partner / Customer</div>
            </div>
            <div className="arch-zone zone-surface">
              <div className="zone-label">CONVERSATIONAL INTERFACE</div>
              <div className="surface-logos">
                <div className="surface-logo-item" title="Agentforce Chat">💬</div>
                <div className="surface-logo-item" title="Slack">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
                </div>
                <div className="surface-logo-item" title="Gemini">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 3.6a8.4 8.4 0 1 1 0 16.8 8.4 8.4 0 0 1 0-16.8zm0 2.4a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/></svg>
                </div>
                <div className="surface-logo-item" title="Claude">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                </div>
                <div className="surface-logo-item" title="ChatGPT">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/></svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Arrow: Surface → Agent */}
          <motion.div className="arch-arrow-h arch-arrow-main" variants={arrowVariants}>
            <div className="arrow-line-h"></div>
          </motion.div>

          {/* Center: Agentforce (Atlas + MCP Client side by side) + Salesforce below */}
          <motion.div className="arch-center" variants={itemVariants}>
            <div className="arch-zone zone-agent">
              <div className="zone-label">
                <span className="zone-logo">⚡</span> AGENTFORCE
              </div>
              <div className="agent-inner">
                <div className="arch-card card-agent card-agent-main">
                  <div className="card-title">Atlas Reasoning Engine</div>
                  <div className="card-desc">Agent Script, subagents, session variables, flow control</div>
                </div>
                <div className="arch-card card-agent card-mcp-client">
                  <div className="card-title">MCP Client</div>
                </div>
              </div>
            </div>

            {/* Arrow: Agent → Salesforce (vertical) */}
            <motion.div className="arch-arrow-v" variants={arrowVariants}>
              <div className="arrow-line-v"></div>
            </motion.div>

            <div className="arch-zone zone-salesforce">
              <div className="zone-label">
                <span className="zone-logo-sf">☁️</span> SALESFORCE
              </div>
              <div className="sf-items">
                <div className="arch-card card-salesforce">
                  <div className="sf-card-icon">🏢</div>
                  <div className="card-title">Accounts</div>
                </div>
                <div className="arch-card card-salesforce">
                  <div className="sf-card-icon">🎯</div>
                  <div className="card-title">Opportunities</div>
                </div>
                <div className="arch-card card-salesforce">
                  <div className="sf-card-icon">📋</div>
                  <div className="card-title">Quotes</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Arrow: MCP Client → MCP Server */}
          <motion.div className="arch-arrow-h arch-arrow-mcp" variants={arrowVariants}>
            <div className="arrow-line-h"></div>
            <div className="arrow-label-h">MCP Protocol</div>
          </motion.div>

          {/* Right: MCP Server + Tools */}
          <motion.div className="arch-right" variants={itemVariants}>
            <div className="arch-zone zone-mcp">
              <div className="zone-label">MCP SERVER</div>
              <div className="arch-card card-mcp-server">
                <div className="card-title">Pricing MCP</div>
                <div className="card-desc">Tool router exposing search &amp; calculate_quote</div>
              </div>
            </div>

            <div className="mcp-tools-branch">
              <div className="branch-line"></div>
              <div className="mcp-tools">
                <div className="arch-zone zone-tool">
                  <div className="zone-label">PRODUCT SEARCH</div>
                  <div className="arch-card card-tool">
                    <div className="card-icon">🔍</div>
                    <div className="card-title">Vector DB</div>
                    <div className="card-desc">Semantic catalog search</div>
                  </div>
                </div>
                <div className="arch-zone zone-tool">
                  <div className="zone-label">PRICING ENGINE</div>
                  <div className="arch-card card-tool">
                    <div className="card-icon">💰</div>
                    <div className="card-title">Zilliant / PROS</div>
                    <div className="card-desc">Real-time pricing &amp; discounts</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </motion.div>
    </motion.div>
  );
}
