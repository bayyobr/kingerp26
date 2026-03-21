import { useState, useEffect, useCallback } from 'react';
import { exchangeRateService } from '../services/exchangeRateService';

export const useExchangeRate = () => {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedRate = await exchangeRateService.getUSDRate();
      setRate(fetchedRate);
    } catch (err: any) {
      console.error('Failed to fetch exchange rate', err);
      setError(err.message || 'Erro ao buscar cotação');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchRate, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  return { rate, loading, error, refresh: fetchRate };
};
