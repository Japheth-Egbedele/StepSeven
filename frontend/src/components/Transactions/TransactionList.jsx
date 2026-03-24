import { useState, useEffect } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import TransactionItem from './TransactionItem';
import TransactionForm from './TransactionForm';
import TransferForm from './TransferForm';
import TransactionFilters from './TransactionFilters';
import Pagination from '../Common/Pagination';
import Modal from '../Common/Modal';
import '../../styles/components/TransactionList.css';

const TransactionList = ({ autoOpen = false, autoOpenTransfer = false }) => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const {
    transactions,
    pagination,
    loading,
    error,
    deleteTransaction,
    refresh
  } = useTransactions(filters, page, 50);

  useEffect(() => {
    if (autoOpen) setShowForm(true);
    if (autoOpenTransfer) setShowTransfer(true);
  }, [autoOpen, autoOpenTransfer]);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction? This cannot be undone.')) {
      await deleteTransaction(id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setShowTransfer(false);
    setEditingTransaction(null);
    refresh();
  };

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="transaction-list-container">
      <div className="list-header">
        <h1>Transactions</h1>
        <div className="list-header-actions">
          <button
            className="btn-secondary"
            onClick={() => { setEditingTransaction(null); setShowTransfer(true); }}
          >
            🔄 Transfer
          </button>
          <button
            className="btn-primary"
            onClick={() => { setEditingTransaction(null); setShowForm(true); }}
          >
            + New Transaction
          </button>
        </div>
      </div>

      <TransactionFilters filters={filters} onFilterChange={(f) => { setFilters(f); setPage(1); }} />

      <div className="transaction-list">
        {loading && transactions.length === 0 ? (
          <div className="loading">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Log Your First Transaction
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
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingTransaction(null); }}>
        <TransactionForm
          initialData={editingTransaction}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingTransaction(null); }}
        />
      </Modal>

      {/* Transfer Form Modal */}
      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)}>
        <TransferForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowTransfer(false)}
        />
      </Modal>
    </div>
  );
};

export default TransactionList;