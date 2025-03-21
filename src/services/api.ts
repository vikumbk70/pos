
import { Product, Customer, Sale, CartItem } from "@/types/pos";
import { supabase } from "@/integrations/supabase/client";

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
      // Try to fetch from Supabase first
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) throw error;
      
      // If we have data, return it
      if (data && data.length > 0) {
        return data as Product[];
      }
      
      // If Supabase has no data, try the local API
      const response = await fetch(`${API_URL}/api/products`);
      const products = await handleResponse(response);
      
      // Store in localStorage as backup
      localStorage.setItem('posProducts', JSON.stringify(products));
      
      return products;
    } catch (error) {
      console.error("Failed to fetch products:", error);
      // Fall back to localStorage if API fails
      const storedProducts = localStorage.getItem('posProducts');
      return storedProducts ? JSON.parse(storedProducts) : [];
    }
  },
  
  create: async (product: Omit<Product, "id">): Promise<Product> => {
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      
      return data as Product;
    } catch (error) {
      console.error("Failed to create product:", error);
      throw error;
    }
  },
  
  update: async (product: Product): Promise<Product> => {
    try {
      const { id, ...updateData } = product;
      
      // Update in Supabase
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data as Product;
    } catch (error) {
      console.error("Failed to update product:", error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<void> => {
    try {
      // First, check if the product exists in any sales
      const { data: saleItems, error: checkError } = await supabase
        .from('sale_items')
        .select('id')
        .eq('product_id', id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      // If product is used in sales, update its stock to 0 instead of deleting
      if (saleItems && saleItems.length > 0) {
        // Update stock to 0 instead of deleting
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: 0 })
          .eq('id', id);
        
        if (updateError) throw updateError;
        
        console.log("Product is used in sales. Stock set to 0 instead of deleting.");
        return;
      }
      
      // If product is not used in sales, delete it
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Failed to delete product:", error);
      throw error;
    }
  }
};

// Sales API
export const salesApi = {
  getAll: async (): Promise<Sale[]> => {
    try {
      // Try to fetch from Supabase first
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (salesError) throw salesError;
      
      // If we have data, return it
      if (salesData && salesData.length > 0) {
        // Need to fetch sale items for each sale
        const sales: Sale[] = [];
        
        for (const sale of salesData) {
          // Get items for this sale
          const { data: itemsData, error: itemsError } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', sale.id);
            
          if (itemsError) throw itemsError;
          
          // Map database fields to our CartItem type
          const cartItems: CartItem[] = itemsData?.map(item => ({
            product: {
              id: item.product_id,
              name: item.product_name,
              price: item.price,
              // These fields aren't in the sale_items table, but are required by the Product type
              barcode: '',
              stock: 0,
              category: ''
            },
            quantity: item.quantity,
            subtotal: item.subtotal
          })) || [];
          
          // Map the database fields to our Sale type
          sales.push({
            id: sale.id,
            cashierId: sale.cashier_id,
            cashierName: sale.cashier_name,
            customerId: sale.customer_id || undefined,
            customerName: sale.customer_name || undefined,
            items: cartItems,
            subtotal: sale.subtotal,
            tax: sale.tax,
            discount: sale.discount,
            total: sale.total,
            paymentMethod: sale.payment_method as 'cash' | 'card' | 'digital',
            paymentAmount: sale.payment_amount,
            change: sale.change,
            date: new Date(sale.created_at)
          });
        }
        
        return sales;
      }
      
      // If Supabase has no data, return empty array
      return [];
    } catch (error) {
      console.error("Failed to fetch sales:", error);
      // Fall back to localStorage if API fails
      const storedSales = localStorage.getItem('posSales');
      if (storedSales) {
        try {
          const parsedSales = JSON.parse(storedSales);
          // Ensure dates are parsed as Date objects
          return parsedSales.map((sale: any) => ({
            ...sale,
            date: new Date(sale.date)
          }));
        } catch (e) {
          console.error("Failed to parse stored sales:", e);
          return [];
        }
      }
      return [];
    }
  },
  
  create: async (sale: Sale): Promise<Sale> => {
    try {
      // We need to handle the sale items separately
      const { items, ...saleData } = sale;
      
      // Insert the sale first
      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert([{
          cashier_id: saleData.cashierId,
          cashier_name: saleData.cashierName,
          customer_id: saleData.customerId,
          customer_name: saleData.customerName,
          subtotal: saleData.subtotal,
          tax: saleData.tax,
          discount: saleData.discount,
          total: saleData.total,
          payment_method: saleData.paymentMethod,
          payment_amount: saleData.paymentAmount,
          change: saleData.change
        }])
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      // Then insert each sale item
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert([{
            sale_id: saleResult.id,
            product_id: item.product.id,
            product_name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            subtotal: item.subtotal
          }]);
        
        if (itemError) throw itemError;
        
        // Update product stock
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: Math.max(0, item.product.stock - item.quantity) })
          .eq('id', item.product.id);
          
        if (stockError) throw stockError;
      }
      
      return {
        ...sale,
        id: saleResult.id
      };
    } catch (error) {
      console.error("Failed to create sale:", error);
      throw error;
    }
  }
};

// Add function to get recent sales history
export const getSalesHistory = async (): Promise<Sale[]> => {
  return salesApi.getAll();
};
