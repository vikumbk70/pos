
import { useState, useEffect } from 'react';
import { PendingOperation } from '@/types/pos';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);

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

  // Process pending operations when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      const processPendingOperations = async () => {
        for (const operation of pendingOperations) {
          try {
            await operation.execute();
          } catch (error) {
            console.error("Failed to process pending operation:", error);
          }
        }
        setPendingOperations([]);
      };

      processPendingOperations();
    }
  }, [isOnline, pendingOperations]);

  return { isOnline, pendingOperations, setPendingOperations };
};
