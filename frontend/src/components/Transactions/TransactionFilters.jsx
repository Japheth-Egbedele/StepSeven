import React from 'react';
import '../../styles/components/TransactionFilters.css';

const TransactionFilters = ({ filters, onFilterChange }) => {
  const handleChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="transaction-filters">
      <div className="filter-group">
        <label>Type</label>
        <select
          value={filters.type || ''}
          onChange={(e) => handleChange('type', e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
          <option value="TRANSFER">Transfer</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Start Date</label>
        <input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => handleChange('startDate', e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <label>End Date</label>
        <input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => handleChange('endDate', e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <label>Search</label>
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder="Search description..."
          className="filter-input"
        />
      </div>

      {Object.keys(filters).length > 0 && (
        <button onClick={clearFilters} className="clear-filters-btn">
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default TransactionFilters;