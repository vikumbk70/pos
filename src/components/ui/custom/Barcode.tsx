
import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '@/contexts/PosContext';
import { Button } from '@/components/ui/button';
import { BarcodeIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BarcodeProps {
  onScan?: (barcode: string) => void;
  showButton?: boolean;
}

const Barcode: React.FC<BarcodeProps> = ({ 
  onScan,
  showButton = true 
}) => {
  const { isScanning, startScanning, stopScanning, scanBarcode } = usePos();
  const [input, setInput] = useState('');
  const [lastScan, setLastScan] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      stopScanning();
    };
  }, [stopScanning]);

  const handleScan = (barcode: string) => {
    setLastScan(barcode);
    
    // Pass the barcode to parent if provided
    if (onScan) {
      onScan(barcode);
    } else {
      // Default behavior: lookup in product database
      scanBarcode(barcode);
    }
    
    // Clear input after scan
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter is pressed, trigger scan
    if (e.key === 'Enter' && input.trim()) {
      handleScan(input.trim());
      e.preventDefault();
    }
  };

  const toggleScanner = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
      // Focus the input when starting scanning
      if (inputRef.current) {
        inputRef.current.focus();
      }
      toast.info('Barcode scanner activated');
    }
  };

  // Effect to focus input when scanning is active
  useEffect(() => {
    if (isScanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isScanning]);

  return (
    <div className={cn(
      "relative rounded-lg border border-border p-4 transition-all", 
      isScanning && "scan-animation"
    )}>
      <div className="flex items-center space-x-2">
        {showButton && (
          <Button
            variant={isScanning ? "destructive" : "default"}
            size="sm"
            onClick={toggleScanner}
            className="shrink-0"
          >
            {isScanning ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Stop Scanner
              </>
            ) : (
              <>
                <BarcodeIcon className="h-4 w-4 mr-2" />
                Start Scanner
              </>
            )}
          </Button>
        )}
        
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={isScanning ? "Scan a barcode..." : "Enter barcode manually..."}
            className={cn(
              "w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              isScanning && "border-primary"
            )}
            disabled={!isScanning && !showButton}
            autoFocus={isScanning}
          />
          <BarcodeIcon 
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
              isScanning && "text-primary"
            )} 
          />
        </div>
      </div>
      
      {lastScan && (
        <div className="mt-2 text-sm text-muted-foreground">
          Last scan: <span className="font-mono">{lastScan}</span>
        </div>
      )}
    </div>
  );
};

export default Barcode;
