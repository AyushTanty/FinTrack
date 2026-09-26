import { useState, useEffect } from 'react';
import { savingsService } from '../services/savingsService';

export function useSavings() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await savingsService.listGoals();
      setGoals(res.data.data || res.data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);
  return { goals, loading, error, refetch: fetchGoals };
}
