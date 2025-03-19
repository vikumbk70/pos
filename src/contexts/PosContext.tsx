import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { productsApi, customersApi, salesApi } from '../services/api';

// Types for our POS system
export type Product = {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  subtotal: number;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
};

export type Sale = {
  id: string;
  cashierId: number;
  cashierName: string;
  customerId?: number;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  paymentAmount: number;
  change: number;
  date: Date;
};

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

// Import mock data (in a real app, these would come from a local database)
import { mockProducts, mockCustomers } from '../utils/mockData';

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process pending operations when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      const processPendingOperations = async () => {
        for (const operation of pendingOperations) {
          try {
            await operation.execute();
          } catch (error) {
            console.error("Failed to process pending operation:", error);
          }
        }
        setPendingOperations([]);
      };

      processPendingOperations();
    }
  }, [isOnline, pendingOperations]);

  // Load data from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isOnline) {
          const [productsData, customersData, salesData] = await Promise.all([
            productsApi.getAll(),
            customersApi.getAll(),
            salesApi.getAll()
          ]);
          
          setProducts(productsData);
          setCustomers(customersData);
          setSales(salesData);
        } else {
          // Offline mode - load from localStorage
          const storedProducts = localStorage.getItem('posProducts');
          const storedCustomers = localStorage.getItem('posCustomers');
          const storedSales = localStorage.getItem('posSales');
          
          if (storedProducts) setProducts(JSON.parse(storedProducts));
          if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
          if (storedSales) setSales(JSON.parse(storedSales));
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data from server. Using local data.");
        
        // Fallback to localStorage
        const storedProducts = localStorage.getItem('posProducts');
        const storedCustomers = localStorage.getItem('posCustomers');
        const storedSales = localStorage.getItem('posSales');
        
        if (storedProducts) setProducts(JSON.parse(storedProducts));
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        if (storedSales) setSales(JSON.parse(storedSales));
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('posProducts', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('posCustomers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('posSales', JSON.stringify(sales));
  }, [sales]);

  // Add a product to the cart
  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock < quantity) {
      toast.error(`Not enough stock for ${product.name}`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Update existing item
        const newQuantity = existingItem.quantity + quantity;
        
        if (product.stock < newQuantity) {
          toast.error(`Not enough stock for ${product.name}`);
          return prevCart;
        }
        
        return prevCart.map(item => 
          item.product.id === product.id
            ? { ...item, quantity: newQuantity, subtotal: product.price * newQuantity }
            : item
        );
      } else {
        // Add new item
        return [...prevCart, { 
          product, 
          quantity, 
          subtotal: product.price * quantity 
        }];
      }
    });
    
    toast.success(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateCartItemQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => {
        if (item.product.id === productId) {
          if (item.product.stock < quantity) {
            toast.error(`Not enough stock for ${item.product.name}`);
            return item;
          }
          return {
            ...item,
            quantity,
            subtotal: item.product.price * quantity
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  const scanBarcode = (barcode: string): Product | null => {
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      addToCart(product);
      return product;
    }
    
    toast.error(`Product with barcode ${barcode} not found`);
    return null;
  };

  const startScanning = () => setIsScanning(true);
  const stopScanning = () => setIsScanning(false);

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTax = () => {
    // Assuming 10% tax rate
    return calculateSubtotal() * 0.1;
  };

  const calculateTotal = (discount = 0) => {
    return calculateSubtotal() + calculateTax() - discount;
  };

  const selectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      toast.success(`Customer ${customer.name} selected`);
    }
  };

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
        setPendingOperations(prev => [
          ...prev, 
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
        setPendingOperations(prev => [
          ...prev, 
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
        setPendingOperations(prev => [
          ...prev, 
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

  // CRUD operations for customers
  const addCustomer = async (customerData: Omit<Customer, "id">): Promise<Customer> => {
    try {
      if (isOnline) {
        const newCustomer = await customersApi.create(customerData);
        setCustomers(prev => [...prev, newCustomer]);
        toast.success(`Customer "${newCustomer.name}" added successfully`);
        return newCustomer;
      } else {
        // Offline mode - generate temporary ID and save to localStorage
        const newCustomer = { ...customerData, id: Date.now() };
        setCustomers(prev => [...prev, newCustomer]);
        
        // Add to pending operations
        setPendingOperations(prev => [
          ...prev, 
          { 
            execute: async () => {
              const serverCustomer = await customersApi.create(customerData);
              // Update local customer with server ID
              setCustomers(prev => prev.map(c => 
                c.id === newCustomer.id ? serverCustomer : c
              ));
            }
          }
        ]);
        
        toast.success(`Customer "${newCustomer.name}" added successfully (offline mode)`);
        return newCustomer;
      }
    } catch (error) {
      console.error("Failed to add customer:", error);
      toast.error("Failed to add customer");
      throw error;
    }
  };

  const updateCustomer = async (customer: Customer): Promise<Customer> => {
    try {
      if (isOnline) {
        await customersApi.update(customer);
        setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
        toast.success(`Customer "${customer.name}" updated successfully`);
        return customer;
      } else {
        // Offline mode - update in localStorage
        setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
        
        // Add to pending operations
        setPendingOperations(prev => [
          ...prev, 
          { 
            execute: async () => {
              await customersApi.update(customer);
            }
          }
        ]);
        
        toast.success(`Customer "${customer.name}" updated successfully (offline mode)`);
        return customer;
      }
    } catch (error) {
      console.error("Failed to update customer:", error);
      toast.error("Failed to update customer");
      throw error;
    }
  };

  const deleteCustomer = async (id: number): Promise<void> => {
    try {
      if (isOnline) {
        await customersApi.delete(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
        toast.success("Customer deleted successfully");
      } else {
        // Offline mode - delete from localStorage
        setCustomers(prev => prev.filter(c => c.id !== id));
        
        // Add to pending operations
        setPendingOperations(prev => [
          ...prev, 
          { 
            execute: async () => {
              await customersApi.delete(id);
            }
          }
        ]);
        
        toast.success("Customer deleted successfully (offline mode)");
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error("Failed to delete customer");
      throw error;
    }
  };

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
        setPendingOperations(prev => [
          ...prev, 
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
            setPendingOperations(prev => [
              ...prev, 
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
      setSales(prevSales => [...prevSales, sale]);
      setProducts(updatedProducts);
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
