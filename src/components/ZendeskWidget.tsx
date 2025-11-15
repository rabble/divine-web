// ABOUTME: Zendesk support widget component
// ABOUTME: Loads the Zendesk messenger widget for customer support

import { useEffect } from 'react';

export function ZendeskWidget() {
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.getElementById('ze-snippet');
    
    if (!existingScript) {
      // Load Zendesk widget script
      const script = document.createElement('script');
      script.id = 'ze-snippet';
      script.src = 'https://static.zdassets.com/ekr/snippet.js?key=52ae352e-c83b-4f62-a06a-6784c80d28b1';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Script already loaded, just show the messenger
      if (window.zE) {
        window.zE('messenger', 'show');
      }
    }

    // Cleanup: don't remove the script, just ensure it stays visible
    return () => {
      // Keep the widget available for navigation
    };
  }, []);

  return null; // This component doesn't render anything visible
}
