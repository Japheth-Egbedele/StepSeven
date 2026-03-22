import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import '../../styles/components/TransactionItem.css';

const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const { formatMoney } = useCurrency();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'INCOME': return '💰';
      case 'EXPENSE': return '💸';
      case 'TRANSFER': return '🔄';
      default: return '📝';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="transaction-item">
      <div className={`transaction-type-badge ${transaction.type.toLowerCase()}`}>
        {getTypeIcon(transaction.type)}
      </div>

      <div className="transaction-info">
        <h4>{transaction.description || transaction.category?.name || 'Transaction'}</h4>
        <p>
          {formatDate(transaction.date)} • {transaction.account?.name}
          {transaction.category && ` • ${transaction.category.name}`}
        </p>
      </div>

      <div className={`transaction-amount ${transaction.type.toLowerCase()}`}>
        {transaction.type === 'EXPENSE' && '−'}
        {transaction.type === 'INCOME' && '+'}
        {formatMoney(transaction.amount)}
      </div>

      <div className="transaction-actions">
        <button onClick={() => onEdit(transaction)} className="btn-icon">
          ✏️
        </button>
        <button onClick={() => onDelete(transaction._id)} className="btn-icon">
          🗑️
        </button>
      </div>
    </div>
  );
};

export default TransactionItem;