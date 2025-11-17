import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    };

    checkIOS();

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show immediately - wait a bit for better UX
      setTimeout(() => {
        // Check if user hasn't dismissed this before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for this session
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // Show iOS-specific instructions
  if (isIOS && !isStandalone) {
    // Only show on iOS Safari, not in other browsers
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (!isSafari || !showPrompt) {
      return null;
    }

    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-white border-2 border-primary rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Download className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              Install diVine Web
            </h3>
            <p className="text-xs text-gray-600">
              Tap the Share button <span className="inline-block mx-1">
                <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                </svg>
              </span> then "Add to Home Screen"
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show Android/Desktop install prompt
  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white border-2 border-primary rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4 text-gray-600" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Download className="h-5 w-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">
            Install diVine Web
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Install our app for a better experience with offline support
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
