
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Settings as SettingsIcon,
  Save,
  User,
  Building,
  Receipt,
  FileText,
  Shield,
  Printer,
  Database,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const Settings = () => {
  const { isAdmin } = useAuth();
  
  // Admin access check
  if (!isAdmin()) {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/" />;
  }
  
  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Nimble POS',
    storeAddress: '123 Main Street, City, Country',
    storePhone: '(123) 456-7890',
    storeEmail: 'info@nimblepos.com',
    defaultTaxRate: '10',
  });
  
  // Receipt Settings State
  const [receiptSettings, setReceiptSettings] = useState({
    showLogo: true,
    showTaxDetails: true,
    footerText: 'Thank you for your purchase!',
    printAutomatically: true,
    emailReceipt: false,
  });
  
  // User Settings State
  const [userSettings, setUserSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Database Settings State
  const [databaseSettings, setDatabaseSettings] = useState({
    backupAutomatically: true,
    backupFrequency: 'daily',
    backupLocation: '/Users/admin/Documents/POS-Backups',
    lastBackup: 'Never',
  });
  
  // Handle form changes
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralSettings((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReceiptSettings((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleReceiptToggle = (name: string, checked: boolean) => {
    setReceiptSettings((prev) => ({ ...prev, [name]: checked }));
  };
  
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserSettings((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleDatabaseToggle = (name: string, checked: boolean) => {
    setDatabaseSettings((prev) => ({ ...prev, [name]: checked }));
  };
  
  // Save settings
  const saveGeneralSettings = () => {
    // In a real app, this would save to local storage or database
    toast.success('General settings saved successfully');
  };
  
  const saveReceiptSettings = () => {
    toast.success('Receipt settings saved successfully');
  };
  
  const saveUserSettings = () => {
    if (!userSettings.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    if (userSettings.newPassword !== userSettings.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    
    // In a real app, this would validate the current password and update it
    toast.success('Password changed successfully');
    setUserSettings({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };
  
  const backupDatabase = () => {
    toast.success('Database backup started');
    
    // Simulate backup process
    setTimeout(() => {
      setDatabaseSettings(prev => ({
        ...prev,
        lastBackup: new Date().toLocaleString()
      }));
      toast.success('Database backup completed successfully');
    }, 2000);
  };
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Customize your POS system preferences
          </p>
        </div>
        
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 max-w-lg">
            <TabsTrigger value="general" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex items-center">
              <Receipt className="h-4 w-4 mr-2" />
              <span>Receipts</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>User</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              <span>Database</span>
            </TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Store Information
                </CardTitle>
                <CardDescription>
                  Configure your business details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    value={generalSettings.storeName}
                    onChange={handleGeneralChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Input
                    id="storeAddress"
                    name="storeAddress"
                    value={generalSettings.storeAddress}
                    onChange={handleGeneralChange}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Store Phone</Label>
                    <Input
                      id="storePhone"
                      name="storePhone"
                      value={generalSettings.storePhone}
                      onChange={handleGeneralChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Store Email</Label>
                    <Input
                      id="storeEmail"
                      name="storeEmail"
                      type="email"
                      value={generalSettings.storeEmail}
                      onChange={handleGeneralChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="defaultTaxRate"
                    name="defaultTaxRate"
                    type="number"
                    min="0"
                    max="100"
                    value={generalSettings.defaultTaxRate}
                    onChange={handleGeneralChange}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveGeneralSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Receipt Settings */}
          <TabsContent value="receipts">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Receipt Preferences
                </CardTitle>
                <CardDescription>
                  Customize how receipts are generated and displayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showLogo">Display Store Logo</Label>
                    <p className="text-sm text-muted-foreground">
                      Show your store logo at the top of receipts
                    </p>
                  </div>
                  <Switch
                    id="showLogo"
                    checked={receiptSettings.showLogo}
                    onCheckedChange={(checked) => handleReceiptToggle('showLogo', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showTaxDetails">Show Tax Details</Label>
                    <p className="text-sm text-muted-foreground">
                      Display itemized tax information on receipts
                    </p>
                  </div>
                  <Switch
                    id="showTaxDetails"
                    checked={receiptSettings.showTaxDetails}
                    onCheckedChange={(checked) => handleReceiptToggle('showTaxDetails', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footerText">Receipt Footer Text</Label>
                  <Input
                    id="footerText"
                    name="footerText"
                    value={receiptSettings.footerText}
                    onChange={handleReceiptChange}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="printAutomatically">Print Automatically</Label>
                    <p className="text-sm text-muted-foreground">
                      Print receipt automatically after sale
                    </p>
                  </div>
                  <Switch
                    id="printAutomatically"
                    checked={receiptSettings.printAutomatically}
                    onCheckedChange={(checked) => handleReceiptToggle('printAutomatically', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailReceipt">Email Receipt Option</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow sending receipts by email
                    </p>
                  </div>
                  <Switch
                    id="emailReceipt"
                    checked={receiptSettings.emailReceipt}
                    onCheckedChange={(checked) => handleReceiptToggle('emailReceipt', checked)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveReceiptSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* User Settings */}
          <TabsContent value="users">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={userSettings.currentPassword}
                    onChange={handleUserChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={userSettings.newPassword}
                    onChange={handleUserChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={userSettings.confirmPassword}
                    onChange={handleUserChange}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveUserSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Database Settings */}
          <TabsContent value="database">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Manage local database and backup settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="backupAutomatically">Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Create database backups automatically
                    </p>
                  </div>
                  <Switch
                    id="backupAutomatically"
                    checked={databaseSettings.backupAutomatically}
                    onCheckedChange={(checked) => handleDatabaseToggle('backupAutomatically', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Database Storage</Label>
                  <div className="flex items-center space-x-4 rounded-md border p-4">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Local Storage</p>
                      <p className="text-sm text-muted-foreground">
                        SQLite database stored locally on this device
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Backup Status</Label>
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Last Backup</p>
                        <p className="text-sm text-muted-foreground">
                          {databaseSettings.lastBackup}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={backupDatabase}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Backup Now
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Database Statistics</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Products</p>
                      <p className="text-lg font-medium">215</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Customers</p>
                      <p className="text-lg font-medium">87</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Transactions</p>
                      <p className="text-lg font-medium">1,342</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Database Size</p>
                      <p className="text-lg font-medium">4.2 MB</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  Export Database
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
