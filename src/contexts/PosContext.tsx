
import React, { createContext, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { productsApi, salesApi } from '../services/api';

// Import types
import { Product, CartItem, Customer, Sale } from '@/types/pos';

// Import hooks
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useSales } from '@/hooks/useSales';
import { useCart } from '@/hooks/useCart';
import { useOffline } from '@/hooks/useOffline';

// Import mock data (in a real app, these would come from a local database)
import { mockProducts, mockCustomers } from '../utils/mockData';

type PosContextType = {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  cart: CartItem[];
  selectedCustomer: Customer | null;
  isScanning: boolean;
  isProcessing: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  scanBarcode: (barcode: string) => Product | null;
  startScanning: () => void;
  stopScanning: () => void;
  calculateSubtotal: () => number;
  calculateTax: () => number;
  calculateTotal: (discount?: number) => number;
  selectCustomer: (customer: Customer | null) => void;
  completeSale: (paymentMethod: 'cash' | 'card' | 'digital', paymentAmount: number, discount?: number) => Promise<Sale>;
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  addCustomer: (customer: Omit<Customer, "id">) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<void>;
};

// Create the context with default values
const PosContext = createContext<PosContextType>({
  products: [],
  customers: [],
  sales: [],
  cart: [],
  selectedCustomer: null,
  isScanning: false,
  isProcessing: false,
  addToCart: () => {},
  removeFromCart: () => {},
  updateCartItemQuantity: () => {},
  clearCart: () => {},
  scanBarcode: () => null,
  startScanning: () => {},
  stopScanning: () => {},
  calculateSubtotal: () => 0,
  calculateTax: () => 0,
  calculateTotal: () => 0,
  selectCustomer: () => {},
  completeSale: async () => ({} as Sale),
  addProduct: async () => ({} as Product),
  updateProduct: async () => ({} as Product),
  deleteProduct: async () => {},
  addCustomer: async () => ({} as Customer),
  updateCustomer: async () => ({} as Customer),
  deleteCustomer: async () => {},
});

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use our custom hooks for different functionalities
  const { isOnline, pendingOperations, setPendingOperations } = useOffline();
  
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useProducts(isOnline, pendingOperations, setPendingOperations);
  
  const { 
    customers, 
    selectedCustomer, 
    selectCustomer, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer 
  } = useCustomers(isOnline, pendingOperations, setPendingOperations);
  
  const { 
    sales, 
    setSales, 
    isProcessing, 
    setIsProcessing 
  } = useSales(isOnline, pendingOperations, setPendingOperations);
  
  const { 
    cart, 
    setCart, 
    isScanning, 
    addToCart, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart: clearCartOnly, 
    scanBarcode: scanBarcodeBase, 
    startScanning, 
    stopScanning, 
    calculateSubtotal, 
    calculateTax, 
    calculateTotal 
  } = useCart();

  // Combined clear cart that also clears selected customer
  const clearCart = () => {
    clearCartOnly();
    selectCustomer(null);
  };

  // Barcode scanner that uses our products
  const scanBarcode = (barcode: string): Product | null => {
    return scanBarcodeBase(barcode, products);
  };

  // Complete sale function
  const completeSale = async (
    paymentMethod: 'cash' | 'card' | 'digital', 
    paymentAmount: number,
    discount = 0
  ): Promise<Sale> => {
    setIsProcessing(true);
    
    try {
      if (cart.length === 0) {
        toast.error('Cannot complete sale with empty cart');
        throw new Error('Cannot complete sale with empty cart');
      }

      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal(discount);
      
      if (paymentAmount < total) {
        toast.error('Payment amount is less than total');
        throw new Error('Payment amount is less than total');
      }

      // Create the sale object
      const sale: Sale = {
        id: uuidv4(),
        cashierId: 1, // This would come from the authenticated user
        cashierName: 'Admin', // This would come from the authenticated user
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        items: [...cart],
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        paymentAmount,
        change: paymentAmount - total,
        date: new Date(),
      };

      if (isOnline) {
        // Save to server
        await salesApi.create(sale);
      } else {
        // Add to pending operations when offline
        setPendingOperations([
          ...pendingOperations, 
          { 
            execute: async () => {
              await salesApi.create(sale);
            }
          }
        ]);
      }

      // Update product stock
      const updatedProducts = products.map(product => {
        const cartItem = cart.find(item => item.product.id === product.id);
        if (cartItem) {
          const updatedProduct = {
            ...product,
            stock: product.stock - cartItem.quantity
          };
          
          // Queue product update for when online
          if (!isOnline) {
            setPendingOperations([
              ...pendingOperations, 
              { 
                execute: async () => {
                  await productsApi.update(updatedProduct);
                }
              }
            ]);
          }
          
          return updatedProduct;
        }
        return product;
      });

      // Update state
      setSales([...sales, sale]);
      
      // Update each product
      for (const product of updatedProducts) {
        const originalProduct = products.find(p => p.id === product.id);
        if (originalProduct && originalProduct.stock !== product.stock) {
          updateProduct(product);
        }
      }
      
      clearCart();
      
      toast.success('Sale completed successfully');
      return sale;
    } catch (error) {
      console.error("Error completing sale:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PosContext.Provider
      value={{
        products,
        customers,
        sales,
        cart,
        selectedCustomer,
        isScanning,
        isProcessing,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        scanBarcode,
        startScanning,
        stopScanning,
        calculateSubtotal,
        calculateTax,
        calculateTotal,
        selectCustomer,
        completeSale,
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        deleteCustomer,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => useContext(PosContext);
