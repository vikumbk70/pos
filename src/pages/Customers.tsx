
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { usePos, Customer } from '@/contexts/PosContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Mail,
  Phone,
  ArrowUpDown,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

const Customers = () => {
  const { customers } = usePos();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'email'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Form state
  const [customerForm, setCustomerForm] = useState<{
    id: number;
    name: string;
    phone: string;
    email: string;
  }>({
    id: 0,
    name: '',
    phone: '',
    email: '',
  });
  
  // Filter and sort customers
  useEffect(() => {
    let filtered = [...customers];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else { // email
        return sortOrder === 'asc' 
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      }
    });
    
    setFilteredCustomers(filtered);
  }, [customers, searchTerm, sortBy, sortOrder]);
  
  // Reset customer form
  const resetCustomerForm = () => {
    setCustomerForm({
      id: 0,
      name: '',
      phone: '',
      email: '',
    });
  };
  
  // Open add customer dialog
  const handleAddCustomer = () => {
    resetCustomerForm();
    setSelectedCustomer(null);
    setIsAddEditDialogOpen(true);
  };
  
  // Open edit customer dialog
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    });
    setIsAddEditDialogOpen(true);
  };
  
  // Open delete customer dialog
  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerForm({
      ...customerForm,
      [name]: value,
    });
  };
  
  // Toggle sort order
  const toggleSort = (field: 'name' | 'email') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Mock functions for CRUD operations (would connect to local DB in a real app)
  const saveCustomer = () => {
    // Validate form
    if (!customerForm.name) {
      toast.error('Customer name is required');
      return;
    }
    
    if (!customerForm.phone) {
      toast.error('Phone number is required');
      return;
    }
    
    // Basic email validation
    if (customerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // In a real app, this would update the local database
    // For now, we'll just show a toast
    if (selectedCustomer) {
      toast.success(`Customer "${customerForm.name}" updated successfully`);
    } else {
      toast.success(`Customer "${customerForm.name}" added successfully`);
    }
    
    setIsAddEditDialogOpen(false);
  };
  
  const deleteCustomer = () => {
    if (!selectedCustomer) return;
    
    // In a real app, this would delete from the local database
    // For now, we'll just show a toast
    toast.success(`Customer "${selectedCustomer.name}" deleted successfully`);
    
    setIsDeleteDialogOpen(false);
  };
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customer database
            </p>
          </div>
          <Button onClick={handleAddCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Customer Database</CardTitle>
            <CardDescription>
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} in database
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search customers by name, phone or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Customers Table */}
            {filteredCustomers.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-5 px-4 py-3 bg-muted/50 text-sm font-medium">
                  <div 
                    className="col-span-2 flex items-center cursor-pointer"
                    onClick={() => toggleSort('name')}
                  >
                    Customer
                    {sortBy === 'name' && (
                      <ArrowUpDown 
                        className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </div>
                  <div>Phone</div>
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleSort('email')}
                  >
                    Email
                    {sortBy === 'email' && (
                      <ArrowUpDown 
                        className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </div>
                  <div className="text-right">Actions</div>
                </div>
                
                <div className="divide-y">
                  {filteredCustomers.map((customer) => (
                    <div key={customer.id} className="grid grid-cols-5 px-4 py-3 text-sm items-center">
                      <div className="col-span-2">
                        <div className="font-medium">{customer.name}</div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="truncate flex items-center">
                        <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteClick(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed rounded-lg">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No customers found</p>
                <Button variant="outline" className="mt-4" onClick={handleAddCustomer}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Add/Edit Customer Dialog */}
        <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription>
                {selectedCustomer 
                  ? 'Update the customer details'
                  : 'Enter the details for the new customer'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={customerForm.name}
                  onChange={handleFormChange}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    value={customerForm.phone}
                    onChange={handleFormChange}
                    placeholder="Enter phone number"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={customerForm.email}
                    onChange={handleFormChange}
                    placeholder="Enter email address"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveCustomer}>
                {selectedCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this customer? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="py-4 border rounded-md p-3 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-full p-2">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.phone} • {selectedCustomer.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteCustomer}
              >
                Delete Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Customers;
