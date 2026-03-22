import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TransactionList from '../components/Transactions/TransactionList';

const Transactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [autoOpenForm, setAutoOpenForm] = useState(false);

  // Dashboard "Add Transaction" quick action passes ?action=create
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setAutoOpenForm(true);
      // Clean the URL param without re-rendering the whole page
      setSearchParams({}, { replace: true });
    }
  }, []);

  return <TransactionList autoOpen={autoOpenForm} />;
};

export default Transactions;