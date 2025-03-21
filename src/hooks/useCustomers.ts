
import { useState, useEffect } from 'react';
import { Customer } from '@/types/pos';
import { toast } from 'sonner';

export const useCustomers = (isOnline: boolean, pendingOperations: any[], setPendingOperations: (ops: any[]) => void) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Load customers from localStorage only since we're not using the API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Offline mode - load from localStorage
        const storedCustomers = localStorage.getItem('posCustomers');
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      } catch (error) {
        console.error("Error loading customers:", error);
        toast.error("Failed to load customers from local data.");
      }
      
      setLoading(false);
    };

    fetchCustomers();
  }, [isOnline]);

  // Save to localStorage whenever customers change
  useEffect(() => {
    localStorage.setItem('posCustomers', JSON.stringify(customers));
  }, [customers]);

  const selectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      toast.success(`Customer ${customer.name} selected`);
    }
  };

  // CRUD operations for customers - only working with localStorage
  const addCustomer = async (customerData: Omit<Customer, "id">): Promise<Customer> => {
    try {
      // Generate temporary ID and save to localStorage
      const newCustomer = { ...customerData, id: Date.now() };
      setCustomers(prev => [...prev, newCustomer]);
      
      toast.success(`Customer "${newCustomer.name}" added successfully`);
      return newCustomer;
    } catch (error) {
      console.error("Failed to add customer:", error);
      toast.error("Failed to add customer");
      throw error;
    }
  };

  const updateCustomer = async (customer: Customer): Promise<Customer> => {
    try {
      // Update in localStorage
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      
      toast.success(`Customer "${customer.name}" updated successfully`);
      return customer;
    } catch (error) {
      console.error("Failed to update customer:", error);
      toast.error("Failed to update customer");
      throw error;
    }
  };

  const deleteCustomer = async (id: number): Promise<void> => {
    try {
      // Delete from localStorage
      setCustomers(prev => prev.filter(c => c.id !== id));
      
      toast.success("Customer deleted successfully");
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error("Failed to delete customer");
      throw error;
    }
  };

  return {
    customers,
    selectedCustomer,
    selectCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer
  };
};
