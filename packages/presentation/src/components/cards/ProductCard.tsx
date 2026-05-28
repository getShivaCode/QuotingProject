import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface Product {
  sku: string;
  name: string;
  description: string;
}

interface ProductCardProps {
  product: Product;
  index: number;
  onAddToCart: (sku: string, quantity: number) => void;
}

export default function ProductCard({ product, index, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [showQuantity, setShowQuantity] = useState(false);

  const handleAdd = () => {
    onAddToCart(product.sku, quantity);
    setQuantity(1);
    setShowQuantity(false);
  };

  return (
    <motion.div
      className="viz-product-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="product-sku">{product.sku}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-description">{product.description}</div>

      {!showQuantity ? (
        <motion.button
          className="product-add-button"
          onClick={() => setShowQuantity(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={14} />
          Add
        </motion.button>
      ) : (
        <motion.div
          className="quantity-selector"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="quantity-inputs">
            <button
              className="qty-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="qty-input"
            />
            <button
              className="qty-btn"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>
          <div className="quantity-actions">
            <button className="qty-confirm" onClick={handleAdd}>
              Add {quantity}
            </button>
            <button className="qty-cancel" onClick={() => setShowQuantity(false)}>
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
