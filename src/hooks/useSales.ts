
import { useState, useEffect } from 'react';
import { Sale } from '@/types/pos';
import { salesApi } from '@/services/api';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const useSales = (
  isOnline: boolean, 
  pendingOperations: any[], 
  setPendingOperations: (ops: any[]) => void
) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load sales from API or localStorage
  useEffect(() => {
    const fetchSales = async () => {
      try {
        if (isOnline) {
          const salesData = await salesApi.getAll();
          setSales(salesData);
        } else {
          // Offline mode - load from localStorage
          const storedSales = localStorage.getItem('posSales');
          if (storedSales) setSales(JSON.parse(storedSales));
        }
      } catch (error) {
        console.error("Error loading sales:", error);
        toast.error("Failed to load sales from server. Using local data.");
        
        // Fallback to localStorage
        const storedSales = localStorage.getItem('posSales');
        if (storedSales) setSales(JSON.parse(storedSales));
      }
      
      setLoading(false);
    };

    fetchSales();
  }, [isOnline]);

  // Save to localStorage whenever sales change
  useEffect(() => {
    localStorage.setItem('posSales', JSON.stringify(sales));
  }, [sales]);

  return {
    sales,
    setSales,
    isProcessing,
    setIsProcessing
  };
};
