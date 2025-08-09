'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface ArweaveStatusCheckerProps {
  groupId: string;
  transactionId: string;
  userAddress: string;
  initialStatus?: 'pending' | 'confirmed' | 'failed';
  onStatusUpdate?: (status: 'pending' | 'confirmed' | 'failed') => void;
}

const ArweaveStatusChecker: React.FC<ArweaveStatusCheckerProps> = ({
  groupId,
  transactionId,
  userAddress,
  initialStatus = 'pending',
  onStatusUpdate
}) => {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>(initialStatus);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Auto-check status on mount if pending
  useEffect(() => {
    if (status === 'pending' && transactionId) {
      checkStatus();
    }
  }, []);

  const checkStatus = async () => {
    if (!transactionId || !userAddress) return;
    
    setIsChecking(true);
    
    try {
      const response = await api.checkArweaveStatus(transactionId, userAddress);
      
      if (response.success) {
        setStatus(response.status || 'pending');
        setLastChecked(new Date().toISOString());
        
        if (onStatusUpdate && response.status) {
          onStatusUpdate(response.status);
        }
        
        if (response.status === 'confirmed') {
          toast({
            title: '✅ Arweave Confirmation',
            description: 'Your data is now permanently stored on Arweave!',
            duration: 5000,
          });
        }
      } else {
        toast({
          title: '⚠️ Status Check Failed',
          description: response.error || 'Could not check Arweave status',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error checking Arweave status:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to check Arweave transaction status',
        duration: 3000,
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="text-xs text-muted-foreground">
        {status === 'pending' && 'Waiting for Arweave confirmation...'}
        {status === 'confirmed' && 'Permanently stored on Arweave'}
        {status === 'failed' && 'Arweave storage failed'}
      </div>
      
      {status === 'pending' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 px-2 text-xs" 
          onClick={checkStatus}
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Checking
            </>
          ) : (
            'Check Status'
          )}
        </Button>
      )}
    </div>
  );
};

export default ArweaveStatusChecker;