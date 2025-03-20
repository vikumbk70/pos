
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

export type PendingOperation = {
  execute: () => Promise<void>;
};
