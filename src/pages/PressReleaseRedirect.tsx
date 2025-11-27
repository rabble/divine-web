// ABOUTME: Redirect component for /press-release route to PDF file
// ABOUTME: Handles redirect to the press release PDF

import { useEffect } from 'react';

export function PressReleaseRedirect() {
  useEffect(() => {
    // Redirect immediately using window.location.replace
    // This ensures the redirect happens before any rendering
    const pdfPath = encodeURI('/diVine launch press release 11.13.25.pdf');
    window.location.replace(pdfPath);
  }, []);

  // Return null since we're redirecting immediately
  return null;
}

