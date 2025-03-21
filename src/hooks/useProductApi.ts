
import { useState, useCallback } from 'react';
import { productService } from '../services/productService';
import { Product } from '../contexts/PosContext';
import { toast } from 'sonner';

export const useProductApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const products = await productService.getProducts();
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
  
  const createProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newProduct = await productService.createProduct(product);
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
      const updatedProduct = await productService.updateProduct(id, product);
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
      await productService.deleteProduct(id);
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
