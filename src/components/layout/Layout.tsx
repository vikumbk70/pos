
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart2, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items with access control
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home className="h-5 w-5" />, access: ['admin', 'cashier'] },
    { path: '/pos', label: 'Point of Sale', icon: <ShoppingCart className="h-5 w-5" />, access: ['admin', 'cashier'] },
    { path: '/products', label: 'Products', icon: <Package className="h-5 w-5" />, access: ['admin'] },
    { path: '/customers', label: 'Customers', icon: <Users className="h-5 w-5" />, access: ['admin', 'cashier'] },
    { path: '/reports', label: 'Reports', icon: <BarChart2 className="h-5 w-5" />, access: ['admin'] },
    { path: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, access: ['admin'] },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => 
    item.access.includes(user?.role || '')
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Toggle */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSidebar}
          className="bg-background border-border shadow-sm"
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out bg-background border-r border-border lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center space-x-2">
              <div className="rounded-md bg-primary/10 p-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-semibold">Nimble POS</span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                      location.pathname === item.path
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User info and logout */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      
      {/* Mobile Sidebar Backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default Layout;
