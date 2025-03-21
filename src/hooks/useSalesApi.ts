
import { useState, useCallback } from 'react';
import { salesApi, Sale, SaleItem } from '../services/api';
import { toast } from 'sonner';

export const useSalesApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sales = await salesApi.getAll();
      return sales;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to fetch sales');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const fetchSale = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const sale = await salesApi.getById(id);
      return sale;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to fetch sale details');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const fetchSaleItems = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await salesApi.getItems(id);
      return items;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to fetch sale items');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createSale = useCallback(async (sale: Omit<Sale, 'id' | 'created_at'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newSale = await salesApi.create(sale);
      toast.success('Sale completed successfully');
      return newSale;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to complete sale');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    isLoading,
    error,
    fetchSales,
    fetchSale,
    fetchSaleItems,
    createSale
  };
};
