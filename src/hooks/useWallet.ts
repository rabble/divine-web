import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNWC } from '@/hooks/useNWCContext';
import type { WebLNProvider } from 'webln';
import { requestProvider } from 'webln';

export interface WalletStatus {
  hasWebLN: boolean;
  hasNWC: boolean;
  webln: WebLNProvider | null;
  activeNWC: ReturnType<typeof useNWC>['getActiveConnection'] extends () => infer T ? T : null;
  isDetecting: boolean;
  preferredMethod: 'nwc' | 'webln' | 'manual';
}

export function useWallet() {
  const [webln, setWebln] = useState<WebLNProvider | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasAttemptedDetection, setHasAttemptedDetection] = useState(false);
  const { connections, getActiveConnection } = useNWC();

  // Get the active connection directly - no memoization to avoid stale state
  const activeNWC = getActiveConnection();

  // Detect WebLN
  const detectWebLN = useCallback(async () => {
    if (webln || isDetecting) return webln;

    setIsDetecting(true);
    try {
      const provider = await requestProvider();
      setWebln(provider);
      setHasAttemptedDetection(true);
      return provider;
    } catch (error) {
      // Only log the error if it's not the common "no provider" error
      if (error instanceof Error && !error.message.includes('no WebLN provider')) {
        console.warn('WebLN detection error:', error);
      }
      setWebln(null);
      setHasAttemptedDetection(true);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, [webln, isDetecting]);

  // Only auto-detect once on mount
  useEffect(() => {
    if (!hasAttemptedDetection) {
      detectWebLN();
    }
  }, [detectWebLN, hasAttemptedDetection]);

  // Test WebLN connection
  const testWebLN = useCallback(async (): Promise<boolean> => {
    if (!webln) return false;

    try {
      await webln.enable();
      return true;
    } catch (error) {
      console.error('WebLN test failed:', error);
      return false;
    }
  }, [webln]);

  // Calculate status values reactively
  const hasNWC = useMemo(() => {
    return connections.length > 0 && connections.some(c => c.isConnected);
  }, [connections]);

  // Determine preferred payment method
  const preferredMethod: WalletStatus['preferredMethod'] = activeNWC
    ? 'nwc'
    : webln
    ? 'webln'
    : 'manual';

  const status: WalletStatus = {
    hasWebLN: !!webln,
    hasNWC,
    webln,
    activeNWC,
    isDetecting,
    preferredMethod,
  };

  return {
    ...status,
    hasAttemptedDetection,
    detectWebLN,
    testWebLN,
  };
}