// Paginated Transaction List
import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import TransactionItem from './TransactionItem';
import TransactionForm from './TransactionForm';
import TransactionFilters from './TransactionFilters';
import Pagination from '../Common/Pagination';
import Modal from '../Common/Modal';

const TransactionList = ({ autoOpen = false }) => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Auto-open form when navigated from Dashboard quick action
  useEffect(() => {
    if (autoOpen) {
      setShowForm(true);
    }
  }, [autoOpen]);

  const {
    transactions,
    pagination,
    loading,
    error,
    updateTransaction,
    deleteTransaction,
    refresh
  } = useTransactions(filters, page, 50);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTransaction(null);
    refresh();
  };

  if (loading && transactions.length === 0) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="transaction-list-container">
      <div className="list-header">
        <h1>Transactions</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingTransaction(null);
            setShowForm(true);
          }}
        >
          + New Transaction
        </button>
      </div>

      <TransactionFilters filters={filters} onFilterChange={setFilters} />

      <div className="transaction-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
            <button
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              Create Your First Transaction
            </button>
          </div>
        ) : (
          <>
            {transactions.map(transaction => (
              <TransactionItem
                key={transaction._id}
                transaction={transaction}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}

            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Transaction Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTransaction(null);
        }}
      >
        <TransactionForm
          initialData={editingTransaction}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default TransactionList;