import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import Barcode from '@/components/ui/custom/Barcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePos } from '@/contexts/PosContext';
import { CartItem, Customer } from '@/types/pos';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  Smartphone,
  DollarSign,
  User,
  X,
  Check,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';

const Pos = () => {
  const { user } = useAuth();
  const { 
    products, 
    cart, 
    customers,
    selectedCustomer, 
    addToCart, 
    removeFromCart, 
    updateCartItemQuantity,
    clearCart,
    calculateSubtotal,
    calculateTax,
    calculateTotal,
    selectCustomer,
    completeSale
  } = usePos();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital'>('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [currentSale, setCurrentSale] = useState<any>(null);
  
  const isMobile = useIsMobile();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Filter products based on search term
  useEffect(() => {
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm)
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);
  
  // Filter customers based on search term
  useEffect(() => {
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.phone.includes(customerSearchTerm) ||
      customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [customers, customerSearchTerm]);

  // Handle payment submission
  const handlePaymentSubmit = () => {
    const paymentAmountFloat = parseFloat(paymentAmount);
    const discountFloat = parseFloat(discount);
    
    if (isNaN(paymentAmountFloat) || paymentAmountFloat <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    const total = calculateTotal(discountFloat);
    
    if (paymentAmountFloat < total) {
      toast.error('Payment amount is less than the total amount');
      return;
    }
    
    try {
      const sale = completeSale(paymentMethod, paymentAmountFloat, discountFloat);
      setCurrentSale(sale);
      setIsPaymentOpen(false);
      setIsReceiptOpen(true);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred while processing the sale');
      }
    }
  };

  // Handle printing receipt
  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const printContents = receiptRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      
      // Reload the page after printing to reset state
      window.location.reload();
    }
  };

  const handleStartNewSale = () => {
    setIsReceiptOpen(false);
    setCurrentSale(null);
    setPaymentAmount('');
    setDiscount('0');
    clearCart();
  };

  // Calculate totals
  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const discountAmount = parseFloat(discount) || 0;
  const total = calculateTotal(discountAmount);
  
  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          {/* Products Section */}
          <div className="w-full md:w-3/5 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Point of Sale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Barcode />
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search products by name or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => addToCart(product)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-md p-2">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
                              <span className="text-sm font-bold">${product.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Cart Section */}
          <div className="w-full md:w-2/5 space-y-4">
            <Card className="sticky top-4">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Current Sale</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCustomerSelectOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {selectedCustomer ? selectedCustomer.name : 'Add Customer'}
                  </Button>
                  {cart.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {cart.length > 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-md border overflow-hidden">
                      <div className="grid grid-cols-6 px-3 py-2 bg-muted/50 text-xs font-medium">
                        <div className="col-span-2">Item</div>
                        <div className="text-center">Price</div>
                        <div className="text-center">Qty</div>
                        <div className="text-right">Total</div>
                        <div></div>
                      </div>
                      <div className="divide-y max-h-[320px] overflow-auto">
                        {cart.map((item) => (
                          <div key={item.product.id} className="grid grid-cols-6 px-3 py-2 text-sm items-center">
                            <div className="col-span-2 truncate">{item.product.name}</div>
                            <div className="text-center text-muted-foreground">
                              ${item.product.price.toFixed(2)}
                            </div>
                            <div className="flex items-center justify-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right font-medium">
                              ${item.subtotal.toFixed(2)}
                            </div>
                            <div className="text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (10%)</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed rounded-lg">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No items in cart</p>
                    <p className="text-xs text-muted-foreground mt-1">Scan a barcode or click on a product to add</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={cart.length === 0}
                  onClick={() => setIsPaymentOpen(true)}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
            <DialogDescription>
              Enter payment details to finalize the transaction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: any) => setPaymentMethod(value)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="digital">
                    <div className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Digital Payment
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Amount ($)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount ($)</Label>
              <Input
                id="paymentAmount"
                type="number"
                min={total}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="text-right"
              />
            </div>
            
            <div className="rounded-md bg-muted p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>${discountAmount.toFixed(2)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {paymentAmount && (
                <>
                  <div className="flex justify-between text-sm pt-1">
                    <span>Payment:</span>
                    <span>${parseFloat(paymentAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Change:</span>
                    <span>${Math.max(0, parseFloat(paymentAmount) - total).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit}>
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              Transaction completed successfully
            </DialogDescription>
          </DialogHeader>
          
          {currentSale && (
            <div className="py-4" ref={receiptRef}>
              <div className="text-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold">Nimble POS</h2>
                <p className="text-sm text-muted-foreground">123 Main Street, City</p>
                <p className="text-sm text-muted-foreground">Tel: (123) 456-7890</p>
              </div>
              
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <p>Receipt #: <span className="font-mono">{currentSale.id.slice(0, 8)}</span></p>
                  <p>Date: {new Date(currentSale.date).toLocaleDateString()}</p>
                  <p>Time: {new Date(currentSale.date).toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <p>Cashier: {currentSale.cashierName}</p>
                  {currentSale.customerName && (
                    <p>Customer: {currentSale.customerName}</p>
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
                  {currentSale.items.map((item: CartItem, index: number) => (
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
                  <span>${currentSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>${currentSale.tax.toFixed(2)}</span>
                </div>
                {currentSale.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-${currentSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${currentSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment ({currentSale.paymentMethod}):</span>
                  <span>${currentSale.paymentAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>${currentSale.change.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="text-center mt-6 text-sm">
                <p>Thank you for your purchase!</p>
                <p className="text-muted-foreground mt-1">Please keep this receipt for any returns or exchanges</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="sm:w-1/2"
              onClick={handlePrintReceipt}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              className="sm:w-1/2"
              onClick={handleStartNewSale}
            >
              <Check className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Customer Selection Dialog */}
      <Dialog open={isCustomerSelectOpen} onOpenChange={setIsCustomerSelectOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              Choose a customer for this sale
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search customers by name, phone or email..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="border rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 grid grid-cols-4 px-3 py-2 bg-muted/80 text-xs font-medium">
                <div className="col-span-2">Customer Name</div>
                <div>Phone</div>
                <div>Email</div>
              </div>
              
              {filteredCustomers.length > 0 ? (
                <div className="divide-y">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="grid grid-cols-4 px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                      onClick={() => {
                        selectCustomer(customer);
                        setIsCustomerSelectOpen(false);
                      }}
                    >
                      <div className="col-span-2 font-medium">{customer.name}</div>
                      <div className="truncate">{customer.phone}</div>
                      <div className="truncate">{customer.email}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No customers found</p>
                </div>
              )}
            </div>
            
            {selectedCustomer && (
              <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                <div>
                  <p className="text-sm font-medium">Selected: {selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectCustomer(null)}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCustomerSelectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsCustomerSelectOpen(false)}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Pos;
