// ABOUTME: Component that tracks page views automatically as user navigates
// ABOUTME: Uses React Router location changes to log analytics page_view events

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

export function AnalyticsPageTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view whenever location changes
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null; // This component doesn't render anything
}
