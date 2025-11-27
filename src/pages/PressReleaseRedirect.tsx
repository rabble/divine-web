// ABOUTME: Redirect component for /press-release route to PDF file
// ABOUTME: Handles redirect to the press release PDF

import { useEffect } from 'react';

export function PressReleaseRedirect() {
  useEffect(() => {
    // Redirect to the PDF file
    window.location.href = '/diVine%20launch%20press%20release%2011.13.25.pdf';
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to press release...</p>
      </div>
    </div>
  );
}

