import React from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../context/SessionContext';

interface CartItem {
  sku: string;
  productName?: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  unit_price?: number;
  lineTotal?: number;
  subtotal?: number;
}

interface QuoteData {
  quoteNumber?: string;
  quoteId?: string;
  accountName?: string;
  grandTotal: number;
  itemCount?: number;
  status?: string;
  cart?: CartItem[];
  items?: CartItem[];
}

interface QuoteCardProps {
  quoteData: QuoteData;
}

export default function QuoteCard({ quoteData }: QuoteCardProps) {
  const { instanceUrl } = useSession();

  console.log('[QuoteCard] Debug:', { quoteId: quoteData.quoteId, instanceUrl });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const items = ((quoteData.cart && quoteData.cart.length > 0) ? quoteData.cart : quoteData.items) || [];
  const hasLineItems = Array.isArray(items) && items.length > 0;

  const getQuoteUrl = () => {
    if (!quoteData.quoteId || !instanceUrl) return null;
    return `${instanceUrl}/${quoteData.quoteId}`;
  };

  return (
    <motion.div
      className="quote-summary"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Quote Number and Status */}
      <motion.div className="summary-header" variants={itemVariants}>
        <div>
          <div className="summary-label">Quote Number</div>
          <div className="summary-value">
            {getQuoteUrl() ? (
              <a
                href={getQuoteUrl()!}
                target="_blank"
                rel="noopener noreferrer"
                className="quote-number-link"
              >
                {quoteData.quoteNumber || 'Pending'}
              </a>
            ) : (
              quoteData.quoteNumber || 'Pending'
            )}
          </div>
        </div>
        <div>
          <div className="summary-label">Status</div>
          <div className="status-draft">
            {quoteData.status || 'Draft'}
          </div>
        </div>
      </motion.div>

      {/* Body with Summary Details */}
      <motion.div className="summary-body" variants={containerVariants}>
        {quoteData.accountName && (
          <motion.div className="summary-row" variants={itemVariants}>
            <span>Account:</span>
            <strong>{quoteData.accountName}</strong>
          </motion.div>
        )}

        <motion.div className="summary-row" variants={itemVariants}>
          <span>Total Value:</span>
          <strong>${quoteData.grandTotal ? quoteData.grandTotal.toFixed(2) : '0.00'}</strong>
        </motion.div>

        {quoteData.itemCount !== undefined && (
          <motion.div className="summary-row" variants={itemVariants}>
            <span>Items:</span>
            <strong>{quoteData.itemCount} product{quoteData.itemCount !== 1 ? 's' : ''}</strong>
          </motion.div>
        )}

        <motion.div className="summary-row" variants={itemVariants}>
          <span>Generated:</span>
          <strong>Today</strong>
        </motion.div>
      </motion.div>

      {/* Line Items - Shortened List */}
      {hasLineItems && (
        <motion.div className="quote-line-items" variants={containerVariants}>
          <div className="quote-items-title">Line Items:</div>
          {items.map((item, idx) => {
            const productName = item.productName || item.name || 'Unknown';
            const unitPrice = item.unitPrice || item.unit_price || 0;
            const lineTotal = item.lineTotal || item.subtotal || 0;
            return (
              <motion.div
                key={idx}
                className="quote-item-card"
                variants={itemVariants}
              >
                <div className="item-left">
                  <div className="item-sku">{item.sku}</div>
                  <div className="item-name">{productName}</div>
                </div>
                <div className="item-right">
                  <div className="item-qty">{item.quantity}x @ ${unitPrice.toFixed(2)}</div>
                  <div className="item-line-total">${lineTotal.toFixed(2)}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
