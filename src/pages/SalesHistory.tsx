import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sale } from "@/types/pos";
import { format } from "date-fns";
import { salesApi } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

const SalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Fetch sales data
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesData = await salesApi.getAll();
        setSales(salesData);
      } catch (error) {
        console.error("Error fetching sales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // Subscribe to real-time updates for sales
  useEffect(() => {
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sales' 
      }, async () => {
        // Refresh the sales data when changes occur
        const salesData = await salesApi.getAll();
        setSales(salesData);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const viewReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setReceiptOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Sales History</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Payment Method</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No sales records found
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono">{sale.id.split('-')[0]}...</TableCell>
                      <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell>{sale.cashierName}</TableCell>
                      <TableCell>{sale.customerName || 'Walk-in Customer'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${sale.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right capitalize">
                        {sale.paymentMethod}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => viewReceipt(sale)}>
                          <Eye size={16} className="mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Sale Receipt
            </DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="font-mono text-sm bg-white p-4 border rounded-lg">
              <div className="text-center mb-4">
                <h2 className="font-bold text-xl">SALES RECEIPT</h2>
                <p>Receipt ID: {selectedSale.id}</p>
                <p>Date: {format(new Date(selectedSale.date), 'MMM dd, yyyy HH:mm')}</p>
                <p>Cashier: {selectedSale.cashierName}</p>
                {selectedSale.customerName && <p>Customer: {selectedSale.customerName}</p>}
              </div>
              
              <div className="my-4">
                <div className="flex justify-between border-b pb-2 mb-2 font-bold">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Total</span>
                </div>
                
                {selectedSale.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-1">
                    <span className="w-1/3 truncate">{item.product.name}</span>
                    <span className="w-1/6 text-center">{item.quantity}x</span>
                    <span className="w-1/6 text-right">${item.product.price.toFixed(2)}</span>
                    <span className="w-1/6 text-right">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${selectedSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${selectedSale.tax.toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-${selectedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>${selectedSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>Payment Method:</span>
                  <span className="capitalize">{selectedSale.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Amount:</span>
                  <span>${selectedSale.paymentAmount.toFixed(2)}</span>
                </div>
                {selectedSale.change > 0 && (
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>${selectedSale.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="text-center mt-6 pt-6 border-t">
                <p>Thank you for your purchase!</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SalesHistory;
