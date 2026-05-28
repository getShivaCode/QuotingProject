import React from 'react';
import { motion } from 'framer-motion';

interface Account {
  Name: string;
  Id: string;
  Phone?: string;
  BillingCity?: string;
  BillingState?: string;
}

interface AccountCardProps {
  account: Account;
  index: number;
  onSelect: (index: number) => void;
  disabled?: boolean;
}

export default function AccountCard({ account, index, onSelect, disabled }: AccountCardProps) {
  const handleClick = () => {
    if (!disabled) {
      onSelect(index);
    }
  };

  return (
    <motion.div
      className={`viz-account-card ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          handleClick();
        }
      }}
    >
      <div className="account-header">
        <span className="account-number">#{index}</span>
        <span className="account-name">{account.Name}</span>
      </div>
      {account.BillingCity && account.BillingState && (
        <div className="account-location">
          {account.BillingCity}, {account.BillingState}
        </div>
      )}
      {account.Phone && (
        <div className="account-phone">{account.Phone}</div>
      )}
    </motion.div>
  );
}
