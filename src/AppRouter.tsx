import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AnalyticsPageTracker } from "./components/AnalyticsPageTracker";
import { AnalyticsUserTracker } from "./components/AnalyticsUserTracker";
import { useNostrLogin } from "@nostrify/react/login";
import { LandingPage } from "@/components/LandingPage";

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
import VideoPage from "./pages/VideoPage";
import { TagPage } from "./pages/TagPage";
import ListsPage from "./pages/ListsPage";
import ListDetailPage from "./pages/ListDetailPage";
// import { NIP05ProfilePage } from "./pages/NIP05ProfilePage";
import { UniversalUserPage } from "./pages/UniversalUserPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import OpenSourcePage from "./pages/OpenSourcePage";
import ProofModePage from "./pages/ProofModePage";
import AuthenticityPage from "./pages/AuthenticityPage";
import DMCAPage from "./pages/DMCAPage";
import HumanCreatedPage from "./pages/HumanCreatedPage";
import { SafetyPage } from "./pages/SafetyPage";
import { Support } from "./pages/Support";
import { FAQPage } from "./pages/FAQPage";
import { TermsPage } from "./pages/TermsPage";
import { AppLayout } from "@/components/AppLayout";
import { DebugVideoPage } from "./pages/DebugVideoPage";
import { KeycastAutoConnect } from "@/components/KeycastAutoConnect";

export function AppRouter() {
  // Auto-connect Keycast bunker if user has a session
  KeycastAutoConnect();
  const { logins } = useNostrLogin();

  // Check if there's a Keycast session in localStorage
  const hasKeycastSession = localStorage.getItem('keycast_jwt_token') !== null;

  // Check if user is logged in
  const isLoggedIn = logins.length > 0 || hasKeycastSession;

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsPageTracker />
      <AnalyticsUserTracker />
      <Routes>
        <Route element={<AppLayout />}>
          {/* Public routes - accessible without login */}
          <Route path="/" element={isLoggedIn ? <Index /> : <LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/authenticity" element={<AuthenticityPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/open-source" element={<OpenSourcePage />} />
          <Route path="/proofmode" element={<ProofModePage />} />
          <Route path="/human-created" element={<HumanCreatedPage />} />
          <Route path="/dmca" element={<DMCAPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/support" element={<Support />} />
          <Route path="/faq" element={<FAQPage />} />

          {/* Protected routes - require login */}
          {isLoggedIn && (
            <>
              <Route path="/home" element={<HomePage />} />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/trending" element={<TrendingPage />} />
              <Route path="/hashtags" element={<HashtagDiscoveryPage />} />
              <Route path="/hashtag/:tag" element={<HashtagPage />} />
              <Route path="/t/:tag" element={<TagPage />} />
              <Route path="/profile/:npub" element={<ProfilePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/video/:id" element={<VideoPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/list/:pubkey/:listId" element={<ListDetailPage />} />
              {/* Test pages for debugging */}
              <Route path="/debug-video" element={<DebugVideoPage />} />
              {/* Universal user route for both Vine user IDs and NIP-05 identifiers */}
              <Route path="/u/:userId" element={<UniversalUserPage />} />
              {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
              <Route path="/:nip19" element={<NIP19Page />} />
            </>
          )}

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
