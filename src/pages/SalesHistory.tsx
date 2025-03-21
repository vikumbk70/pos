
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sale } from '@/types/pos';
import { getSalesHistory } from '@/services/api';
import { Separator } from '@/components/ui/separator';
import { Search, Receipt, Calendar, DollarSign, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Fetch sales history on component mount
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesData = await getSalesHistory();
        setSales(salesData);
        setFilteredSales(salesData);
      } catch (error) {
        toast.error("Failed to load sales history");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        (payload) => {
          // When a new sale is added, refresh the sales list
          fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter sales based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSales(sales);
      return;
    }

    const filtered = sales.filter(sale => 
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredSales(filtered);
  }, [searchTerm, sales]);

  // Toggle expanded sale
  const toggleExpandSale = (saleId: string) => {
    if (expandedSale === saleId) {
      setExpandedSale(null);
    } else {
      setExpandedSale(saleId);
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    if (!selectedSale) return;
    
    const printContents = document.getElementById('receipt-content')?.innerHTML;
    if (!printContents) return;
    
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Close the dialog after printing
    setReceiptDialogOpen(false);
  };

  // Show receipt dialog
  const showReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setReceiptDialogOpen(true);
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy hh:mm a');
  };

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
            <p className="text-muted-foreground">View and search past sales</p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              {filteredSales.length} {filteredSales.length === 1 ? 'sale' : 'sales'} found
            </CardDescription>
            
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by receipt ID, cashier or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading sales history...</p>
              </div>
            ) : filteredSales.length > 0 ? (
              <div className="space-y-4">
                {filteredSales.map((sale) => (
                  <div key={sale.id} className="border rounded-md overflow-hidden">
                    <div 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-muted/30 cursor-pointer"
                      onClick={() => toggleExpandSale(sale.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Receipt className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium flex items-center">
                            Receipt #{sale.id.substring(0, 8)}
                            {expandedSale === sale.id ? 
                              <ChevronUp className="ml-2 h-4 w-4" /> : 
                              <ChevronDown className="ml-2 h-4 w-4" />
                            }
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>{formatDate(sale.date)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 sm:mt-0">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="font-bold">${sale.total.toFixed(2)}</p>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            showReceipt(sale);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                    
                    {expandedSale === sale.id && (
                      <div className="p-4 border-t">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Cashier</p>
                            <p>{sale.cashierName}</p>
                          </div>
                          
                          {sale.customerName && (
                            <div>
                              <p className="text-sm text-muted-foreground">Customer</p>
                              <p>{sale.customerName}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Payment Method</p>
                            <p className="capitalize">{sale.paymentMethod}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Items</p>
                            <p>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="space-y-2">
                          <p className="font-medium">Items</p>
                          <div className="space-y-2">
                            {sale.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="flex-1">
                                  {item.product.name} × {item.quantity}
                                </span>
                                <span className="text-right">${item.subtotal.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <Separator className="my-2" />
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span>${sale.subtotal.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tax:</span>
                              <span>${sale.tax.toFixed(2)}</span>
                            </div>
                            
                            {sale.discount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount:</span>
                                <span>-${sale.discount.toFixed(2)}</span>
                              </div>
                            )}
                            
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>${sale.total.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Payment ({sale.paymentMethod}):
                              </span>
                              <span>${sale.paymentAmount.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Change:</span>
                              <span>${sale.change.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <DollarSign className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No sales found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              Receipt for sale #{selectedSale?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSale && (
            <div id="receipt-content" className="py-4">
              <div className="text-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold">Nimble POS</h2>
                <p className="text-sm text-muted-foreground">123 Main Street, City</p>
                <p className="text-sm text-muted-foreground">Tel: (123) 456-7890</p>
              </div>
              
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <p>Receipt #: <span className="font-mono">{selectedSale.id.slice(0, 8)}</span></p>
                  <p>Date: {format(new Date(selectedSale.date), 'MM/dd/yyyy')}</p>
                  <p>Time: {format(new Date(selectedSale.date), 'hh:mm a')}</p>
                </div>
                <div className="text-right">
                  <p>Cashier: {selectedSale.cashierName}</p>
                  {selectedSale.customerName && (
                    <p>Customer: {selectedSale.customerName}</p>
                  )}
                </div>
              </div>
              
              <table className="w-full mb-4">
                <thead className="border-b text-sm">
                  <tr>
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Price</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {selectedSale.items.map((item, index) => (
                    <tr key={index} className="border-b border-dashed">
                      <td className="py-1">{item.product.name}</td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">${item.product.price.toFixed(2)}</td>
                      <td className="text-right py-1">${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="space-y-1 border-t pt-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${selectedSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>${selectedSale.tax.toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-${selectedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${selectedSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment ({selectedSale.paymentMethod}):</span>
                  <span>${selectedSale.paymentAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>${selectedSale.change.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="text-center mt-6 text-sm">
                <p>Thank you for your purchase!</p>
                <p className="text-muted-foreground mt-1">Please keep this receipt for any returns or exchanges</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReceiptDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handlePrintReceipt}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SalesHistory;
