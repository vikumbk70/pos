
import apiClient from './apiClient';
import { Product } from '../contexts/PosContext';

export const productService = {
  // Get all products
  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get('/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  // Get a single product by ID
  getProduct: async (id: number): Promise<Product> => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new product
  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    try {
      const response = await apiClient.post('/products', product);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },
  
  // Update an existing product
  updateProduct: async (id: number, product: Partial<Product>): Promise<Product> => {
    try {
      const response = await apiClient.put(`/products/${id}`, product);
      return response.data;
    } catch (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Delete a product
  deleteProduct: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      throw error;
    }
  }
};
