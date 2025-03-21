
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { usePos } from '@/contexts/PosContext';
import { Product } from '@/types/pos';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  BarcodeIcon,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import Barcode from '@/components/ui/custom/Barcode';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Products = () => {
  const { isAdmin } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = usePos();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [productForm, setProductForm] = useState<{
    id: number;
    name: string;
    barcode: string;
    price: string;
    stock: string;
    category: string;
  }>({
    id: 0,
    name: '',
    barcode: '',
    price: '',
    stock: '',
    category: '',
  });
  
  // Admin access check
  if (!isAdmin()) {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/" />;
  }
  
  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));
  
  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      } else { // stock
        return sortOrder === 'asc' ? a.stock - b.stock : b.stock - a.stock;
      }
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy, sortOrder, categoryFilter]);
  
  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    setProductForm({
      ...productForm,
      barcode
    });
  };
  
  // Reset product form
  const resetProductForm = () => {
    setProductForm({
      id: 0,
      name: '',
      barcode: '',
      price: '',
      stock: '',
      category: '',
    });
  };
  
  // Open add product dialog
  const handleAddProduct = () => {
    resetProductForm();
    setSelectedProduct(null);
    setIsAddEditDialogOpen(true);
  };
  
  // Open edit product dialog
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
    });
    setIsAddEditDialogOpen(true);
  };
  
  // Open delete product dialog
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value,
    });
  };
  
  // Toggle sort order
  const toggleSort = (field: 'name' | 'price' | 'stock') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Save product to Supabase
  const saveProduct = async () => {
    // Validate form
    if (!productForm.name) {
      toast.error('Product name is required');
      return;
    }
    
    if (!productForm.barcode) {
      toast.error('Product barcode is required');
      return;
    }
    
    const price = parseFloat(productForm.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Price must be a positive number');
      return;
    }
    
    const stock = parseInt(productForm.stock);
    if (isNaN(stock) || stock < 0) {
      toast.error('Stock must be a non-negative number');
      return;
    }
    
    // Check if barcode already exists for a different product
    if (!selectedProduct && products.some(p => p.barcode === productForm.barcode)) {
      toast.error('A product with this barcode already exists');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const productData = {
        name: productForm.name,
        barcode: productForm.barcode,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category,
      };
      
      if (selectedProduct) {
        // Update existing product
        await updateProduct({
          ...productData,
          id: selectedProduct.id
        });
        toast.success(`Product "${productForm.name}" updated successfully`);
      } else {
        // Create new product
        await addProduct(productData);
        toast.success(`Product "${productForm.name}" added successfully`);
      }
      
      setIsAddEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete product from Supabase
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteProduct(selectedProduct.id);
      toast.success(`Product "${selectedProduct.name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your inventory and product catalog
            </p>
          </div>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} in catalog
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select 
                  value={categoryFilter} 
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Products Table */}
            {filteredProducts.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-6 md:grid-cols-8 px-4 py-3 bg-muted/50 text-sm font-medium">
                  <div 
                    className="col-span-2 md:col-span-3 flex items-center cursor-pointer"
                    onClick={() => toggleSort('name')}
                  >
                    Product
                    {sortBy === 'name' && (
                      <ArrowUpDown 
                        className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </div>
                  <div className="hidden md:block">Category</div>
                  <div 
                    className="text-right cursor-pointer"
                    onClick={() => toggleSort('price')}
                  >
                    Price
                    {sortBy === 'price' && (
                      <ArrowUpDown 
                        className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </div>
                  <div 
                    className="text-right cursor-pointer"
                    onClick={() => toggleSort('stock')}
                  >
                    Stock
                    {sortBy === 'stock' && (
                      <ArrowUpDown 
                        className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </div>
                  <div className="text-center">Status</div>
                  <div className="text-right">Actions</div>
                </div>
                
                <div className="divide-y">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="grid grid-cols-6 md:grid-cols-8 px-4 py-3 text-sm items-center">
                      <div className="col-span-2 md:col-span-3">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <BarcodeIcon className="h-3 w-3 mr-1" />
                          {product.barcode}
                        </div>
                      </div>
                      <div className="hidden md:block text-muted-foreground">
                        {product.category}
                      </div>
                      <div className="text-right font-medium">
                        ${product.price.toFixed(2)}
                      </div>
                      <div className="text-right">
                        {product.stock} units
                      </div>
                      <div className="text-center">
                        {product.stock > 0 ? (
                          product.stock < 10 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteClick(product)}
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
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No products found</p>
                <Button variant="outline" className="mt-4" onClick={handleAddProduct}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Add/Edit Product Dialog */}
        <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {selectedProduct 
                  ? 'Update the product details'
                  : 'Enter the details for the new product'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={productForm.name}
                    onChange={handleFormChange}
                    placeholder="Enter product name"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label>Barcode</Label>
                  <Barcode onScan={handleBarcodeScan} />
                  <Input
                    id="barcode"
                    name="barcode"
                    value={productForm.barcode}
                    onChange={handleFormChange}
                    placeholder="Enter barcode"
                    className="mt-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={productForm.price}
                    onChange={handleFormChange}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.stock}
                    onChange={handleFormChange}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={productForm.category}
                    onChange={handleFormChange}
                    placeholder="Enter category"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={saveProduct}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : selectedProduct ? 'Update Product' : 'Add Product'}
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
                Are you sure you want to delete this product? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="py-4 border rounded-md p-3 bg-muted/50">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Barcode: {selectedProduct.barcode} • 
                  Price: ${selectedProduct.price.toFixed(2)} • 
                  Stock: {selectedProduct.stock}
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProduct}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Products;
