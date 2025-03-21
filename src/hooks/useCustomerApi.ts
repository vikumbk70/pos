
import { useState, useCallback } from 'react';
import { customersApi, Customer } from '../services/api';
import { toast } from 'sonner';

export const useCustomerApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customers = await customersApi.getAll();
      return customers;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to fetch customers');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createCustomer = useCallback(async (customer: Pick<Customer, 'name' | 'phone' | 'email'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newCustomer = await customersApi.create(customer);
      toast.success('Customer created successfully');
      return newCustomer;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to create customer');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const updateCustomer = useCallback(async (id: number, customer: Partial<Customer>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedCustomer = await customersApi.update(id, customer);
      toast.success('Customer updated successfully');
      return updatedCustomer;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to update customer');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const deleteCustomer = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await customersApi.delete(id);
      toast.success('Customer deleted successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error('Failed to delete customer');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
};
