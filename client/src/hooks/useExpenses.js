import { useState, useEffect } from 'react';
import { expenseService } from '../services/expenseService';

export function useExpenses(filters) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseService.getExpenses(filters);
      setExpenses(res.data.data || res.data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, [JSON.stringify(filters)]);
  return { expenses, loading, error, refetch: fetchExpenses };
}
