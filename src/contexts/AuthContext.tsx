
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

// Define types for our authentication
type User = {
  id: number;
  username: string;
  role: 'admin' | 'cashier';
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  isAdmin: () => false,
});

// Sample users (in a real app, these would come from a database)
const USERS = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' as const },
  { id: 2, username: 'cashier', password: 'cashier123', role: 'cashier' as const },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('posUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('posUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = USERS.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('posUser', JSON.stringify(userWithoutPassword));
      toast.success(`Welcome back, ${userWithoutPassword.username}!`);
      return true;
    }
    
    toast.error('Invalid username or password');
    return false;
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('posUser');
    toast.success('Logged out successfully');
  };
  
  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
