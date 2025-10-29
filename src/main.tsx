import { createRoot } from 'react-dom/client';

// Import polyfills first
import './lib/polyfills.ts';

// Apply Nostr monkeypatch for relay-native sorting BEFORE any Nostr operations
import { patchNostrifyForCustomParams } from './lib/nostrifyPatch';
patchNostrifyForCustomParams();

// Initialize Firebase Analytics
import { initializeAnalytics } from './lib/analytics';
initializeAnalytics();

import { ErrorBoundary } from '@/components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Import custom fonts
import '@fontsource-variable/inter';
import '@fontsource/pacifico';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
