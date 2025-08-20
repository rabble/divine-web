import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomePage";
import DiscoveryPage from "./pages/DiscoveryPage";
import TrendingPage from "./pages/TrendingPage";
import HashtagPage from "./pages/HashtagPage";
import HashtagDiscoveryPage from "./pages/HashtagDiscoveryPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import { TagPage } from "./pages/TagPage";
import ListsPage from "./pages/ListsPage";
import ListDetailPage from "./pages/ListDetailPage";
import { NIP05ProfilePage } from "./pages/NIP05ProfilePage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import OpenSourcePage from "./pages/OpenSourcePage";
import { AppLayout } from "@/components/AppLayout";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/hashtags" element={<HashtagDiscoveryPage />} />
          <Route path="/hashtag/:tag" element={<HashtagPage />} />
          <Route path="/t/:tag" element={<TagPage />} />
          <Route path="/profile/:npub" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/list/:pubkey/:listId" element={<ListDetailPage />} />
          {/* Info pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/open-source" element={<OpenSourcePage />} />
          {/* NIP-05 route for user@domain.com format */}
          <Route path="/u/:nip05" element={<NIP05ProfilePage />} />
          {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
          <Route path="/:nip19" element={<NIP19Page />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
