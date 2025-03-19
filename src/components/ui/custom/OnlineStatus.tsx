
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const OnlineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const { toast } = useToast();
  
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "You're back online",
        description: "Your changes will now sync with the server.",
        variant: "default",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "The app will continue to work. Changes will sync when you're back online.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3.5 w-3.5" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OnlineStatus;
