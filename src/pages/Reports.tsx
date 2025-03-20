
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { usePos } from '@/contexts/PosContext';
import { Sale } from '@/types/pos';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
} from 'recharts';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart2,
  Package,
  Users,
} from 'lucide-react';
import { startOfWeek, endOfWeek, format, subMonths, startOfMonth, endOfMonth, isSameDay, differenceInDays, addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

// Chart colors
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = () => {
  const { isAdmin } = useAuth();
  const { sales, products, customers } = usePos();
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const isMobile = useIsMobile();

  // Admin access check
  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  // Filter sales based on date range
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateRange) {
      case 'today':
        return isSameDay(saleDate, today);
      case 'week': {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        return saleDate >= weekStart && saleDate <= weekEnd;
      }
      case 'month': {
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        return saleDate >= monthStart && saleDate <= monthEnd;
      }
      case 'year': {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return saleDate >= yearStart && saleDate <= today;
      }
      default:
        return true;
    }
  });

  // Calculate summary metrics
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageOrderValue = totalTransactions > 0 
    ? totalSales / totalTransactions 
    : 0;

  // Generate sales by day data
  const getSalesByDayData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date, endDate: Date;
    let dateFormat = 'MMM d';
    
    switch (dateRange) {
      case 'today':
        startDate = today;
        endDate = today;
        dateFormat = 'h a';
        break;
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        dateFormat = 'EEE';
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        dateFormat = 'MMM d';
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = today;
        dateFormat = 'MMM';
        break;
      default:
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
    }
    
    const days = differenceInDays(endDate, startDate) + 1;
    
    // If showing a single day, break it down by hours
    if (dateRange === 'today') {
      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(today);
        hour.setHours(i, 0, 0, 0);
        
        const hourSales = filteredSales.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate.getHours() === i;
        });
        
        return {
          date: format(hour, dateFormat),
          sales: hourSales.reduce((sum, sale) => sum + sale.total, 0),
          transactions: hourSales.length,
        };
      });
      
      // Only return hours from the earliest sale to the latest (plus padding)
      const salesHours = hourlyData.filter(h => h.transactions > 0);
      if (salesHours.length > 0) {
        const earliestHourIndex = hourlyData.findIndex(h => h.transactions > 0);
        const latestHourIndex = hourlyData.length - 1 - [...hourlyData].reverse().findIndex(h => h.transactions > 0);
        return hourlyData.slice(Math.max(0, earliestHourIndex - 1), Math.min(24, latestHourIndex + 2));
      }
      
      // If no sales today, return just a few hours
      return hourlyData.slice(8, 18); // 8am to 6pm
    }
    
    return Array.from({ length: days }, (_, i) => {
      const date = addDays(startDate, i);
      
      const daySales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.date);
        return isSameDay(saleDate, date);
      });
      
      return {
        date: format(date, dateFormat),
        sales: daySales.reduce((sum, sale) => sum + sale.total, 0),
        transactions: daySales.length,
      };
    });
  };

  // Generate payment method data
  const getPaymentMethodData = () => {
    const methodCounts = filteredSales.reduce((acc, sale) => {
      const method = sale.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count += 1;
      acc[method].total += sale.total;
      return acc;
    }, {} as Record<string, { count: number, total: number }>);
    
    return Object.entries(methodCounts).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: data.count,
      amount: data.total,
    }));
  };

  // Generate top products data
  const getTopProductsData = () => {
    const productSales = {} as Record<number, { name: string, quantity: number, revenue: number }>;
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const { product, quantity, subtotal } = item;
        if (!productSales[product.id]) {
          productSales[product.id] = { 
            name: product.name, 
            quantity: 0, 
            revenue: 0 
          };
        }
        productSales[product.id].quantity += quantity;
        productSales[product.id].revenue += subtotal;
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Export CSV
  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      return;
    }
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,Date,Cashier,Customer,Items,Subtotal,Tax,Discount,Total,Payment Method\n';
    
    filteredSales.forEach(sale => {
      const items = sale.items.map(item => `${item.quantity}x ${item.product.name}`).join('; ');
      const row = [
        sale.id,
        new Date(sale.date).toLocaleString(),
        sale.cashierName,
        sale.customerName || 'Walk-in Customer',
        `"${items}"`,
        sale.subtotal,
        sale.tax,
        sale.discount,
        sale.total,
        sale.paymentMethod
      ];
      csvContent += row.join(',') + '\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Track your business performance and analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-1">
              <Button
                variant={dateRange === 'today' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange('today')}
              >
                Today
              </Button>
              <Button
                variant={dateRange === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange('week')}
              >
                Week
              </Button>
              <Button
                variant={dateRange === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange('month')}
              >
                Month
              </Button>
              <Button
                variant={dateRange === 'year' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange('year')}
              >
                Year
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={exportToCSV}
              disabled={filteredSales.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {dateRange === 'today' && 'Today'}
                {dateRange === 'week' && 'This Week'}
                {dateRange === 'month' && 'This Month'}
                {dateRange === 'year' && 'This Year'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg. ${averageOrderValue.toFixed(2)} per transaction
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {products.filter(p => p.stock === 0).length} out of stock
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
                {filteredSales.filter(s => s.customerId).length} customer sales
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 max-w-md mb-4">
            <TabsTrigger value="sales" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span>Sales</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center">
              <PieChartIcon className="h-4 w-4 mr-2" />
              <span>Payments</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Sales Trends</CardTitle>
                <CardDescription>
                  Sales and transaction volume over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getSalesByDayData()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'sales') return [`$${value}`, 'Sales'];
                          return [value, 'Transactions'];
                        }}
                        contentStyle={{ 
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="sales" 
                        name="Sales" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        yAxisId="right" 
                        dataKey="transactions" 
                        name="Transactions" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="products">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>
                  Best performing products by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {getTopProductsData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getTopProductsData()}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 50,
                        }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis 
                          type="number"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <YAxis 
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          width={150}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'revenue') return [`$${value}`, 'Revenue'];
                            return [value, 'Quantity Sold'];
                          }}
                          contentStyle={{ 
                            borderRadius: '8px',
                            border: '1px solid hsl(var(--border))',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                        <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="quantity" name="Quantity Sold" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No product sales data for this period</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Distribution of payment methods used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {getPaymentMethodData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPaymentMethodData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getPaymentMethodData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const data = props.payload;
                            return [`${value} transactions ($${data.amount.toFixed(2)})`, data.name];
                          }}
                          contentStyle={{ 
                            borderRadius: '8px',
                            border: '1px solid hsl(var(--border))',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No payment data for this period</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;
