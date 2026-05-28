import React from 'react';
import { motion } from 'framer-motion';

interface CartItem {
  sku: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface CartData {
  items: CartItem[];
  itemCount: number;
  grandTotal: number;
}

interface CartCardProps {
  cartData: CartData;
  onCreateQuote?: () => void;
  isCreatingQuote?: boolean;
}

export default function CartCard({ cartData, onCreateQuote, isCreatingQuote }: CartCardProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="viz-cart-card"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="viz-cart-header">
        Shopping Cart ({cartData.itemCount} item{cartData.itemCount !== 1 ? 's' : ''})
      </div>

      <motion.div className="viz-cart-items" variants={containerVariants}>
        {cartData.items.map((item, idx) => (
          <motion.div key={idx} className="viz-cart-item" variants={itemVariants}>
            <div className="cart-item-left">
              <div className="cart-item-name">{item.productName}</div>
              <div className="cart-item-sku">{item.sku}</div>
            </div>
            <div className="cart-item-details">
              <div className="cart-item-quantity">Qty: {item.quantity}</div>
              <div className="cart-item-price">${item.unitPrice.toFixed(2)}/ea</div>
              <div className="cart-item-total">${item.lineTotal.toFixed(2)}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="viz-cart-total" variants={itemVariants}>
        <span>Grand Total:</span>
        <span className="total-amount">${cartData.grandTotal.toFixed(2)}</span>
      </motion.div>

      {onCreateQuote && !isCreatingQuote && (
        <motion.button
          className="create-quote-button"
          onClick={onCreateQuote}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Create Quote
        </motion.button>
      )}
    </motion.div>
  );
}
