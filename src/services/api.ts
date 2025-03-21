
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://95.164.54.64:25553/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  product: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  cashier_id: number;
  cashier_name: string;
  customer_id?: number;
  customer_name?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_amount: number;
  change: number;
  created_at: string;
  items?: SaleItem[];
}

export const productsApi = {
  getAll: () => api.get<Product[]>('/products').then(res => res.data),
  getById: (id: number) => api.get<Product>(`/products/${id}`).then(res => res.data),
  create: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Product>('/products', data).then(res => res.data),
  update: (id: number, data: Partial<Product>) => 
    api.put<Product>(`/products/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const customersApi = {
  getAll: () => api.get<Customer[]>('/customers').then(res => res.data),
  getById: (id: number) => api.get<Customer>(`/customers/${id}`).then(res => res.data),
  create: (data: Pick<Customer, 'name' | 'phone' | 'email'>) => 
    api.post<Customer>('/customers', data).then(res => res.data),
  update: (id: number, data: Partial<Customer>) => 
    api.put<Customer>(`/customers/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

export const salesApi = {
  getAll: () => api.get<Sale[]>('/sales').then(res => res.data),
  getById: (id: string) => api.get<Sale>(`/sales/${id}`).then(res => res.data),
  create: (data: Omit<Sale, 'id' | 'created_at'>) => 
    api.post<Sale>('/sales', data).then(res => res.data),
  getItems: (id: string) => api.get<SaleItem[]>(`/sales/${id}/items`).then(res => res.data),
};

export const reportsApi = {
  getDailySales: (date?: string) => 
    api.get('/reports/daily-sales', { params: { date } }).then(res => res.data),
  getProductSales: () => api.get('/reports/product-sales').then(res => res.data),
};

export const inventoryApi = {
  adjust: (productId: number, adjustment: number, reason?: string) =>
    api.post('/inventory/adjust', { productId, adjustment, reason }).then(res => res.data),
};
