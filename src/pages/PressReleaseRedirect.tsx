// ABOUTME: Redirect component for /press-release route to PDF file
// ABOUTME: Handles redirect to the press release PDF

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function PressReleaseRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Use replace to avoid adding to history, and redirect immediately
    window.location.replace('/diVine launch press release 11.13.25.pdf');
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to press release...</p>
      </div>
    </div>
  );
}

