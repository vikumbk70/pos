
import { useState, useEffect } from 'react';
import { Customer } from '@/types/pos';
import { customersApi } from '@/services/api';
import { toast } from 'sonner';

export const useCustomers = (isOnline: boolean, pendingOperations: any[], setPendingOperations: (ops: any[]) => void) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Load customers from API or localStorage
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        if (isOnline) {
          const customersData = await customersApi.getAll();
          setCustomers(customersData);
        } else {
          // Offline mode - load from localStorage
          const storedCustomers = localStorage.getItem('posCustomers');
          if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        }
      } catch (error) {
        console.error("Error loading customers:", error);
        toast.error("Failed to load customers from server. Using local data.");
        
        // Fallback to localStorage
        const storedCustomers = localStorage.getItem('posCustomers');
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
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
        setPendingOperations([
          ...pendingOperations, 
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
        setPendingOperations([
          ...pendingOperations, 
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
        setPendingOperations([
          ...pendingOperations, 
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

  return {
    customers,
    selectedCustomer,
    selectCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer
  };
};
