import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePos } from '@/contexts/PosContext';
import { Sale, Product } from '@/types/pos';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const { user } = useAuth();
  const { products, sales, customers } = usePos();
  const isMobile = useIsMobile();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  // Calculate dashboard metrics
  useEffect(() => {
    // Filter today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySalesData = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getTime() >= today.getTime();
    });
    
    setTodaySales(todaySalesData);
    
    // Get low stock products (less than 10 items)
    const lowStock = products.filter(product => product.stock < 10);
    setLowStockProducts(lowStock);
    
    // Prepare chart data - last 7 days of sales
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();
    
    const chartData = last7Days.map(date => {
      const dateStr = format(date, 'MMM dd');
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= date && saleDate < nextDate;
      });
      
      const total = daySales.reduce((sum, sale) => sum + sale.total, 0);
      
      return {
        day: dateStr,
        sales: parseFloat(total.toFixed(2))
      };
    });
    
    setSalesData(chartData);
  }, [products, sales]);

  // Calculate totals
  const todaySalesTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayTransactions = todaySales.length;
  
  // Calculate comparison with previous day
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const dayBefore = new Date();
  dayBefore.setDate(dayBefore.getDate() - 2);
  dayBefore.setHours(0, 0, 0, 0);
  
  const yesterdaySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= yesterday && saleDate < new Date();
  });
  
  const yesterdaySalesTotal = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0);
  
  // Calculate percentage change
  const salesPercentChange = yesterdaySalesTotal === 0 
    ? 100 
    : Math.round(((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal) * 100);
  
  const isSalesIncrease = salesPercentChange >= 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.username}! Here's what's happening today.
            </p>
          </div>
          <Link to="/pos">
            <Button>
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${todaySalesTotal.toFixed(2)}</div>
              <div className="flex items-center mt-1 text-xs">
                {isSalesIncrease ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={isSalesIncrease ? "text-green-500" : "text-red-500"}>
                  {Math.abs(salesPercentChange)}% {isSalesIncrease ? 'increase' : 'decrease'}
                </span>
                <span className="text-muted-foreground ml-1">vs yesterday</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTransactions}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {lowStockProducts.length} items low in stock
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total registered customers
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts and Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden card-hover">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                Daily sales for the past 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="h-[300px] w-full px-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{
                      top: 5,
                      right: 5,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Sales']}
                      contentStyle={{ 
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>
                Products that need restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm truncate">{product.name}</span>
                        <span className={`text-xs ${product.stock < 5 ? 'text-destructive' : 'text-amber-500'}`}>
                          {product.stock} left
                        </span>
                      </div>
                      <Progress 
                        value={(product.stock / 10) * 100} 
                        className={`h-1.5 ${product.stock < 5 ? 'bg-destructive/20' : 'bg-amber-500/20'}`}
                      />
                    </div>
                  ))}
                  
                  {lowStockProducts.length > 5 && (
                    <div className="text-sm text-muted-foreground text-center mt-2">
                      +{lowStockProducts.length - 5} more items
                    </div>
                  )}
                  
                  <Link to="/products">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Manage Inventory
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">All products are well stocked</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Sales */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              Latest transactions processed today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaySales.length > 0 ? (
              <div className="rounded-md border">
                <div className="grid grid-cols-1 md:grid-cols-5 px-4 py-3 bg-muted/50 text-sm font-medium">
                  <div>Time</div>
                  <div className="md:col-span-2">Items</div>
                  <div className="hidden md:block">Customer</div>
                  <div className="text-right">Total</div>
                </div>
                <div className="divide-y">
                  {todaySales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="grid grid-cols-1 md:grid-cols-5 px-4 py-3 text-sm">
                      <div className="text-muted-foreground">
                        {format(new Date(sale.date), 'h:mm a')}
                      </div>
                      <div className="md:col-span-2">
                        {sale.items.map((item, i) => (
                          <span key={i}>
                            {item.quantity} × {item.product.name}
                            {i < sale.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                      <div className="hidden md:block text-muted-foreground">
                        {sale.customerName || 'Walk-in Customer'}
                      </div>
                      <div className="text-right font-medium">
                        ${sale.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No sales recorded today</p>
                <Link to="/pos">
                  <Button variant="outline" className="mt-4">
                    Create Sale
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
