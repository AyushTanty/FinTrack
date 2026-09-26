import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboard(month, year) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getDashboard(month, year);
      setData(res.data?.data || res.data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, [month, year]);
  return { data, loading, error, refetch: fetchDashboard };
}
