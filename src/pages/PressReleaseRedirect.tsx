// ABOUTME: Redirect component for /press-release route to PDF file
// ABOUTME: Handles redirect to the press release PDF

import { useEffect } from 'react';

export function PressReleaseRedirect() {
  useEffect(() => {
    // Redirect to the PDF file - use actual filename, browser will encode it
    window.location.href = '/diVine launch press release 11.13.25.pdf';
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to press release...</p>
      </div>
    </div>
  );
}

