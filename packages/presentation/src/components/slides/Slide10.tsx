import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../../styles/slides.css';

export default function Slide10() {
  const [activePrompt, setActivePrompt] = useState<'setup' | 'agent' | 'app' | 'arch'>('setup');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const setupContent = ` # Getting Started

1. Install the Salesforce CLI (sf)
2. Install sf-skills for Claude Code:
   github.com/forcedotcom/sf-skills

3. Install the Agentforce scripting skill:
   mcpmarket.com/tools/skills/agentforce-scripting-for-salesforce

4. Authenticate to your Salesforce org:
   sf org login web --alias demo-org

5. Open Claude Code in your project directory and start prompting...`;

  const agentPrompt = `I want to create an Agentforce agent. Use Agent Script and not the older
Agentforce Builder technique. Use sf-skills and the sf-ai-agentforce skills.
Create a proper directory structure for this project.

I want the agent to behave in the following way:

(1) First determine which account the quote is being created for. Do an
    appropriate Salesforce search if needed, let the end user confirm the account.

(2) Search the products for which the quote is requested. The search function is
    available at https://pricingmcp.onrender.com/mcp as an MCP endpoint. It allows
    for semantic search. After getting results back, ensure the end user validates
    the product. If appropriate results are not returned, modify the search query
    based on your knowledge to get the right products from the MCP endpoint.
    Note: these products may not exist in Salesforce and that's okay.

(3) After finalizing the quantities and products, use the same MCP server to get
    a quote that includes the product description too. Present it to the user and
    if the user approves, save it as a quote in Salesforce against that account,
    with the grand price and description that includes the product names and
    quantities. Let this agent have access to other quote management functions
    too like history, approvals, etc.`;

  const appPrompt = `Now let's get started with the React app. Even before you drop the quoting
functionality in there, I want the app to first be a slide presentation that
visually displays how the quoting agent works.

Start with the opening slide of the value statement — how quoting is difficult,
special pricing, products are hard to search, different systems for different
functions. Then talk about our conversational agent that seamlessly runs you
through this process.

Then the next few slides walk you through the steps: account selection, product
selection and basic "shopping cart" management. Finally, request for quote and
pricing which creates the quote.

Make it visually appealing, add breadcrumbs, use the Agentforce logo. In each
detail slide, talk about functionality used as one of the descriptions. I haven't
decided where to put the actual functionality of the app yet — just have a
placeholder in the last slide for now.`;

  const renderArchitecture = () => (
    <div className="arch-layout-v2">
      {/* Left column: Surface */}
      <div className="arch-col-left">
        <div className="arch-zone zone-surface">
          <div className="zone-label">CONVERSATIONAL INTERFACE</div>
          <div className="surface-logos-grid">
            <div className="surface-logo-item" title="Slack">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
            </div>
            <div className="surface-logo-item" title="Claude">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            <div className="surface-logo-item" title="ChatGPT">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/></svg>
            </div>
            <div className="surface-logo-item" title="Gemini">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 3.6a8.4 8.4 0 1 1 0 16.8 8.4 8.4 0 0 1 0-16.8zm0 2.4a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/></svg>
            </div>
            <div className="surface-logo-item" title="Messages">💬</div>
            <div className="surface-logo-item" title="Custom App">🌐</div>
          </div>
        </div>
      </div>

      {/* Arrow: Surface → Agent */}
      <div className="arch-arrow-h arch-arrow-main">
        <div className="arrow-line-h"></div>
      </div>

      {/* Center column: Agentforce stacked above Salesforce, same width */}
      <div className="arch-col-center">
        <div className="arch-zone zone-agent zone-stacked">
          <div className="zone-label">
            <span className="zone-logo">⚡</span> AGENTFORCE
          </div>
          <div className="agent-inner">
            <div className="arch-card card-agent card-agent-main">
              <div className="card-title">Intelligent Quoting Agent</div>
              <div className="card-desc">Built with AgentScript, SubAgents, Session Variables, Flow Control</div>
            </div>
            <div className="arch-card card-agent card-mcp-client">
              <div className="card-title">MCP<br/>Client</div>
            </div>
          </div>
        </div>

        <div className="arch-arrow-v-center">
          <div className="arrow-line-v"></div>
        </div>

        <div className="arch-zone zone-salesforce zone-stacked">
          <div className="zone-label">
            <span className="zone-logo-sf">☁️</span> SALESFORCE
          </div>
          <div className="sf-items-square">
            <div className="sf-card-square">
              <div className="sf-card-icon">🏢</div>
              <div className="card-title">Accounts</div>
            </div>
            <div className="sf-card-square">
              <div className="sf-card-icon">🎯</div>
              <div className="card-title">Opptys</div>
            </div>
            <div className="sf-card-square">
              <div className="sf-card-icon">📋</div>
              <div className="card-title">Quotes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow: MCP Client → MCP Server */}
      <div className="arch-arrow-h arch-arrow-mcp">
        <div className="arrow-line-h"></div>
        <div className="arrow-label-h">MCP Protocol</div>
      </div>

      {/* Right column: MCP Server + Tools */}
      <div className="arch-col-right">
        <div className="arch-zone zone-mcp">
          <div className="zone-label">MCP SERVER</div>
          <div className="arch-card card-mcp-server">
            <div className="card-title">Pricing MCP</div>
            <div className="card-desc">Tool picker: productsearch &amp; calculate_quote</div>
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
                <div className="card-desc">Semantic search</div>
              </div>
            </div>
            <div className="arch-zone zone-tool">
              <div className="zone-label">PRICING ENGINE</div>
              <div className="arch-card card-tool">
                <div className="card-icon">💰</div>
                <div className="card-title">Zilliant / PROS</div>
                <div className="card-desc">Real-time pricing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      className="slide slide-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="slide-content prompts-content" variants={itemVariants}>
        <motion.h2 className="slide-title" variants={itemVariants}>
          How It All Started
        </motion.h2>
        <motion.p className="slide-subtitle" variants={itemVariants}>
          Two prompts. One afternoon. A fully functional quoting agent.
        </motion.p>

        <motion.div className="prompts-layout" variants={containerVariants}>
          <motion.div className="prompts-tabs" variants={itemVariants}>
            <button
              className={`prompt-tab ${activePrompt === 'setup' ? 'active' : ''}`}
              onClick={() => setActivePrompt('setup')}
            >
              <span className="tab-number">0</span>
              <span className="tab-label">Setup</span>
            </button>
            <button
              className={`prompt-tab ${activePrompt === 'agent' ? 'active' : ''}`}
              onClick={() => setActivePrompt('agent')}
            >
              <span className="tab-number">1</span>
              <span className="tab-label">Build the Agent</span>
            </button>
            <button
              className={`prompt-tab ${activePrompt === 'app' ? 'active' : ''}`}
              onClick={() => setActivePrompt('app')}
            >
              <span className="tab-number">2</span>
              <span className="tab-label">Build the App</span>
            </button>
            <button
              className={`prompt-tab ${activePrompt === 'arch' ? 'active' : ''}`}
              onClick={() => setActivePrompt('arch')}
            >
              <span className="tab-number">3</span>
              <span className="tab-label">Architecture</span>
            </button>
          </motion.div>

          {activePrompt !== 'arch' ? (
            <motion.div className="prompt-display" variants={itemVariants}>
              <div className="prompt-header">
                <div className="prompt-terminal-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <span className="prompt-terminal-title">
                  {activePrompt === 'setup' && 'terminal — prerequisites'}
                  {activePrompt === 'agent' && 'claude-code — prompt #1'}
                  {activePrompt === 'app' && 'claude-code — prompt #2'}
                </span>
              </div>
              <div className="prompt-body">
                <div className="prompt-prefix">
                  {activePrompt === 'setup' ? '$ ' : '❯ '}
                </div>
                <pre className="prompt-text">
                  {activePrompt === 'setup' && setupContent}
                  {activePrompt === 'agent' && agentPrompt}
                  {activePrompt === 'app' && appPrompt}
                </pre>
              </div>
            </motion.div>
          ) : (
            <motion.div className="arch-tab-content" variants={itemVariants}>
              {renderArchitecture()}
            </motion.div>
          )}

          <motion.div className="prompts-footnote" variants={itemVariants}>
            <p>That's it. No boilerplate. No scaffolding commands. Just describe what you want and iterate.</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
