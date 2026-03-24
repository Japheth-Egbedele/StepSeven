import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TransactionList from '../components/Transactions/TransactionList';

const Transactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoOpenTransfer, setAutoOpenTransfer] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') setAutoOpen(true);
    if (action === 'transfer') setAutoOpenTransfer(true);
    if (action) setSearchParams({}, { replace: true });
  }, []);

  return <TransactionList autoOpen={autoOpen} autoOpenTransfer={autoOpenTransfer} />;
};

export default Transactions;