
import { useState } from 'react';
import { Product, CartItem } from '@/types/pos';
import { toast } from 'sonner';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

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
  };

  const scanBarcode = (barcode: string, products: Product[]): Product | null => {
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

  return {
    cart,
    setCart,
    isScanning,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    scanBarcode,
    startScanning,
    stopScanning,
    calculateSubtotal,
    calculateTax,
    calculateTotal
  };
};
