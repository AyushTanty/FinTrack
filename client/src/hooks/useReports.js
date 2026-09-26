import { useState, useEffect } from 'react';
import { reportsService } from '../services/reportsService';

export function useReports(type, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let res;
      switch(type) {
        case 'monthlyTrend': res = await reportsService.monthlyTrend(params.months); break;
        case 'categoryBreakdown': res = await reportsService.categoryBreakdown(params.month, params.year); break;
        case 'budgetVsActual': res = await reportsService.budgetVsActual(params.month, params.year); break;
        case 'fixedVsVariable': res = await reportsService.fixedVsVariable(params.month, params.year); break;
        case 'dailySpending': res = await reportsService.dailySpending(params.month, params.year); break;
        case 'subscriptionSpending': res = await reportsService.subscriptionSpending(params.year); break;
        case 'costOfLiving': res = await reportsService.costOfLiving(params.months); break;
        default: throw new Error('Unknown report type');
      }
      setData(res.data.data || res.data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [type, JSON.stringify(params)]);
  return { data, loading, error, refetch: fetchReport };
}
