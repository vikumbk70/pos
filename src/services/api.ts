
import { Product, Customer, Sale } from "@/contexts/PosContext";

const API_URL = "http://localhost:3000";

// Helper function for handling API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "API request failed");
  }
  return response.json();
};

// Products API
export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await handleResponse(response);
      return data.products;
    } catch (error) {
      console.error("Failed to fetch products:", error);
      // Fall back to localStorage if API fails
      const storedProducts = localStorage.getItem('posProducts');
      return storedProducts ? JSON.parse(storedProducts) : [];
    }
  },
  
  create: async (product: Omit<Product, "id">): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      const data = await handleResponse(response);
      return { ...product, id: data.id };
    } catch (error) {
      console.error("Failed to create product:", error);
      throw error;
    }
  },
  
  update: async (product: Product): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      await handleResponse(response);
      return product;
    } catch (error) {
      console.error("Failed to update product:", error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
      });
      await handleResponse(response);
    } catch (error) {
      console.error("Failed to delete product:", error);
      throw error;
    }
  }
};

// Customers API
export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    try {
      const response = await fetch(`${API_URL}/customers`);
      const data = await handleResponse(response);
      return data.customers;
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      // Fall back to localStorage if API fails
      const storedCustomers = localStorage.getItem('posCustomers');
      return storedCustomers ? JSON.parse(storedCustomers) : [];
    }
  },
  
  create: async (customer: Omit<Customer, "id">): Promise<Customer> => {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
      });
      const data = await handleResponse(response);
      return { ...customer, id: data.id };
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error;
    }
  },
  
  update: async (customer: Customer): Promise<Customer> => {
    try {
      const response = await fetch(`${API_URL}/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
      });
      await handleResponse(response);
      return customer;
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
      });
      await handleResponse(response);
    } catch (error) {
      console.error("Failed to delete customer:", error);
      throw error;
    }
  }
};

// Sales API
export const salesApi = {
  getAll: async (): Promise<Sale[]> => {
    try {
      const response = await fetch(`${API_URL}/sales`);
      const data = await handleResponse(response);
      return data.sales;
    } catch (error) {
      console.error("Failed to fetch sales:", error);
      // Fall back to localStorage if API fails
      const storedSales = localStorage.getItem('posSales');
      return storedSales ? JSON.parse(storedSales) : [];
    }
  },
  
  create: async (sale: Sale): Promise<Sale> => {
    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sale),
      });
      await handleResponse(response);
      return sale;
    } catch (error) {
      console.error("Failed to create sale:", error);
      throw error;
    }
  }
};
