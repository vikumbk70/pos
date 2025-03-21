import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus, Search, AlertCircle, Loader2 } from "lucide-react";
import { Product } from "@/types/pos";
import { productsApi } from "@/services/api";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";

type ProductFormData = Omit<Product, "id">;

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, control: controlAdd, formState: { errors: errorsAdd } } = useForm<ProductFormData>();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, control: controlEdit, formState: { errors: errorsEdit } } = useForm<Product>();

  // Load products
  useEffect(() => {
    fetchProducts();

    // Subscribe to real-time updates
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products' 
      }, () => {
        // Refresh the products data when changes occur
        fetchProducts();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onAddProduct = async (data: ProductFormData) => {
    try {
      setIsSubmitting(true);
      await productsApi.create(data);
      toast.success(`Product "${data.name}" added successfully`);
      setIsAddDialogOpen(false);
      resetAdd();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditProduct = async (data: Product) => {
    try {
      setIsSubmitting(true);
      await productsApi.update(data);
      toast.success(`Product "${data.name}" updated successfully`);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setIsSubmitting(true);
      await productsApi.delete(productToDelete.id);
      toast.success(`Product "${productToDelete.name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      if (error.message?.includes("used in sales")) {
        toast.info("Product could not be deleted as it appears in sales. Its stock has been set to 0 instead.");
      } else {
        toast.error("Failed to delete product");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    resetEdit(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Products</h1>
          <Button onClick={() => {
            resetAdd({
              name: "",
              barcode: "",
              price: 0,
              stock: 0,
              category: "",
              image: ""
            });
            setIsAddDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>

        <div className="flex mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`${product.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Product Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAdd(onAddProduct)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" {...registerAdd('name', { required: "Name is required" })} />
                  {errorsAdd.name && <p className="text-red-500 text-sm">{errorsAdd.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" {...registerAdd('barcode', { required: "Barcode is required" })} />
                  {errorsAdd.barcode && <p className="text-red-500 text-sm">{errorsAdd.barcode.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01" 
                    {...registerAdd('price', { 
                      required: "Price is required",
                      valueAsNumber: true,
                      min: { value: 0.01, message: "Price must be greater than 0" } 
                    })} 
                  />
                  {errorsAdd.price && <p className="text-red-500 text-sm">{errorsAdd.price.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input 
                    id="stock" 
                    type="number" 
                    {...registerAdd('stock', { 
                      required: "Stock is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Stock cannot be negative" } 
                    })} 
                  />
                  {errorsAdd.stock && <p className="text-red-500 text-sm">{errorsAdd.stock.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...registerAdd('category', { required: "Category is required" })} />
                {errorsAdd.category && <p className="text-red-500 text-sm">{errorsAdd.category.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image URL (Optional)</Label>
                <Input id="image" {...registerAdd('image')} />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            {editProduct && (
              <form onSubmit={handleSubmitEdit(onEditProduct)} className="space-y-4">
                <input type="hidden" {...registerEdit('id')} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Product Name</Label>
                    <Input id="edit-name" {...registerEdit('name', { required: "Name is required" })} />
                    {errorsEdit.name && <p className="text-red-500 text-sm">{errorsEdit.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-barcode">Barcode</Label>
                    <Input id="edit-barcode" {...registerEdit('barcode', { required: "Barcode is required" })} />
                    {errorsEdit.barcode && <p className="text-red-500 text-sm">{errorsEdit.barcode.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price</Label>
                    <Input 
                      id="edit-price" 
                      type="number" 
                      step="0.01" 
                      {...registerEdit('price', { 
                        required: "Price is required",
                        valueAsNumber: true,
                        min: { value: 0.01, message: "Price must be greater than 0" } 
                      })} 
                    />
                    {errorsEdit.price && <p className="text-red-500 text-sm">{errorsEdit.price.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-stock">Stock</Label>
                    <Input 
                      id="edit-stock" 
                      type="number" 
                      {...registerEdit('stock', { 
                        required: "Stock is required",
                        valueAsNumber: true,
                        min: { value: 0, message: "Stock cannot be negative" } 
                      })} 
                    />
                    {errorsEdit.stock && <p className="text-red-500 text-sm">{errorsEdit.stock.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input id="edit-category" {...registerEdit('category', { required: "Category is required" })} />
                  {errorsEdit.category && <p className="text-red-500 text-sm">{errorsEdit.category.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-image">Image URL (Optional)</Label>
                  <Input id="edit-image" {...registerEdit('image')} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Product
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Product Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p>Are you sure you want to delete this product?</p>
            </div>
            {productToDelete && (
              <div className="bg-muted p-3 rounded">
                <p><strong>{productToDelete.name}</strong></p>
                <p>Barcode: {productToDelete.barcode}</p>
                <p>Price: ${productToDelete.price.toFixed(2)}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              If this product has been used in any sales, it will not be deleted, but its stock will be set to 0.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={onDeleteProduct} 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Products;
