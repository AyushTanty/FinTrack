import { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories();
      setCategories(res.data.data || res.data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);
  return { categories, loading, error, refetch: fetchCategories };
}
