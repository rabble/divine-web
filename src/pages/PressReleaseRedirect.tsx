// ABOUTME: Redirect component for /press-release route to PDF file
// ABOUTME: Handles redirect to the press release PDF

import { useEffect } from 'react';

export function PressReleaseRedirect() {
  useEffect(() => {
    console.log('[PressReleaseRedirect] Component mounted, redirecting to PDF');
    // Redirect immediately using window.location.replace
    // This ensures the redirect happens before any rendering
    const pdfPath = encodeURI('/diVine launch press release 11.13.25.pdf');
    console.log('[PressReleaseRedirect] Redirecting to:', pdfPath);
    window.location.replace(pdfPath);
  }, []);

  // Return null since we're redirecting immediately
  return null;
}

