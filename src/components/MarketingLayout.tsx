// ABOUTME: Layout wrapper for marketing and informational pages
// ABOUTME: Includes MarketingHeader and provides consistent spacing

import { MarketingHeader } from "./MarketingHeader";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
}
