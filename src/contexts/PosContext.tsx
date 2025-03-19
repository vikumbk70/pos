
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

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
  completeSale: (paymentMethod: 'cash' | 'card' | 'digital', paymentAmount: number, discount?: number) => Sale;
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
  completeSale: () => ({} as Sale),
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

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedProducts = localStorage.getItem('posProducts');
    const storedCustomers = localStorage.getItem('posCustomers');
    const storedSales = localStorage.getItem('posSales');
    
    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    if (storedSales) setSales(JSON.parse(storedSales));
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

  const completeSale = (
    paymentMethod: 'cash' | 'card' | 'digital', 
    paymentAmount: number,
    discount = 0
  ): Sale => {
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

      // Update product stock
      const updatedProducts = products.map(product => {
        const cartItem = cart.find(item => item.product.id === product.id);
        if (cartItem) {
          return {
            ...product,
            stock: product.stock - cartItem.quantity
          };
        }
        return product;
      });

      // Update state
      setSales(prevSales => [...prevSales, sale]);
      setProducts(updatedProducts);
      clearCart();
      
      toast.success('Sale completed successfully');
      return sale;
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
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => useContext(PosContext);
