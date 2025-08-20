// ABOUTME: Hashtag discovery page showing trending and popular hashtags
// ABOUTME: Includes search functionality and hashtag statistics with enhanced explorer

import { HashtagExplorer } from '@/components/HashtagExplorer';

export function HashtagDiscoveryPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <HashtagExplorer />
      </div>
    </div>
  );
}

export default HashtagDiscoveryPage;