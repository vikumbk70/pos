
import { useState, useCallback } from 'react';
import { productsApi, Product } from '../services/api';
import { toast } from 'sonner';

export const useProductApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const products = await productsApi.getAll();
      return products;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to fetch products');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newProduct = await productsApi.create(product);
      toast.success('Product created successfully');
      return newProduct;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to create product');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const updateProduct = useCallback(async (id: number, product: Partial<Product>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedProduct = await productsApi.update(id, product);
      toast.success('Product updated successfully');
      return updatedProduct;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to update product');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const deleteProduct = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await productsApi.delete(id);
      toast.success('Product deleted successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to delete product');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    isLoading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};
