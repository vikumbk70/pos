
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

// API URL
const API_URL = "http://localhost:3000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    try {
      if (isOnline) {
        // Try to authenticate with the backend
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          // If the server rejects the login, try the local fallback
          return loginWithLocalFallback(username, password);
        }

        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('posUser', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.username}!`);
        return true;
      } else {
        // Offline mode - use local fallback
        return loginWithLocalFallback(username, password);
      }
    } catch (error) {
      console.error('Login error:', error);
      // If the API call fails, use the local fallback
      return loginWithLocalFallback(username, password);
    }
  };

  // Local login fallback for offline mode or API failures
  const loginWithLocalFallback = (username: string, password: string): boolean => {
    // Sample users (in a real app, these would come from a database)
    const USERS = [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin' as const },
      { id: 2, username: 'cashier', password: 'cashier123', role: 'cashier' as const },
    ];
    
    const foundUser = USERS.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('posUser', JSON.stringify(userWithoutPassword));
      toast.success(`Welcome back, ${userWithoutPassword.username}! (offline mode)`);
      return true;
    }
    
    toast.error('Invalid username or password');
    return false;
  };
  
  const logout = () => {
    if (isOnline) {
      // Optional: Call logout endpoint if needed
      // fetch(`${API_URL}/logout`, { method: 'POST' }).catch(console.error);
    }
    
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
