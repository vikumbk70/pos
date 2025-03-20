
import { useState, useEffect } from 'react';
import { Product } from '@/types/pos';
import { productsApi } from '@/services/api';
import { toast } from 'sonner';

export const useProducts = (isOnline: boolean, pendingOperations: any[], setPendingOperations: (ops: any[]) => void) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load products from API or localStorage
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (isOnline) {
          const productsData = await productsApi.getAll();
          setProducts(productsData);
        } else {
          // Offline mode - load from localStorage
          const storedProducts = localStorage.getItem('posProducts');
          if (storedProducts) setProducts(JSON.parse(storedProducts));
        }
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Failed to load products from server. Using local data.");
        
        // Fallback to localStorage
        const storedProducts = localStorage.getItem('posProducts');
        if (storedProducts) setProducts(JSON.parse(storedProducts));
      }
      
      setLoading(false);
    };

    fetchProducts();
  }, [isOnline]);

  // Save to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('posProducts', JSON.stringify(products));
  }, [products]);

  // CRUD operations for products
  const addProduct = async (productData: Omit<Product, "id">): Promise<Product> => {
    try {
      if (isOnline) {
        const newProduct = await productsApi.create(productData);
        setProducts(prev => [...prev, newProduct]);
        toast.success(`Product "${newProduct.name}" added successfully`);
        return newProduct;
      } else {
        // Offline mode - generate temporary ID and save to localStorage
        const newProduct = { ...productData, id: Date.now() };
        setProducts(prev => [...prev, newProduct]);
        
        // Add to pending operations
        setPendingOperations([
          ...pendingOperations, 
          { 
            execute: async () => {
              const serverProduct = await productsApi.create(productData);
              // Update local product with server ID
              setProducts(prev => prev.map(p => 
                p.id === newProduct.id ? serverProduct : p
              ));
            }
          }
        ]);
        
        toast.success(`Product "${newProduct.name}" added successfully (offline mode)`);
        return newProduct;
      }
    } catch (error) {
      console.error("Failed to add product:", error);
      toast.error("Failed to add product");
      throw error;
    }
  };

  const updateProduct = async (product: Product): Promise<Product> => {
    try {
      if (isOnline) {
        await productsApi.update(product);
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        toast.success(`Product "${product.name}" updated successfully`);
        return product;
      } else {
        // Offline mode - update in localStorage
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        
        // Add to pending operations
        setPendingOperations([
          ...pendingOperations, 
          { 
            execute: async () => {
              await productsApi.update(product);
            }
          }
        ]);
        
        toast.success(`Product "${product.name}" updated successfully (offline mode)`);
        return product;
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error("Failed to update product");
      throw error;
    }
  };

  const deleteProduct = async (id: number): Promise<void> => {
    try {
      if (isOnline) {
        await productsApi.delete(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success("Product deleted successfully");
      } else {
        // Offline mode - delete from localStorage
        setProducts(prev => prev.filter(p => p.id !== id));
        
        // Add to pending operations
        setPendingOperations([
          ...pendingOperations, 
          { 
            execute: async () => {
              await productsApi.delete(id);
            }
          }
        ]);
        
        toast.success("Product deleted successfully (offline mode)");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
      throw error;
    }
  };

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct
  };
};
