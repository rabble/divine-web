import { ReactNode, useEffect, useState } from 'react';
import { z } from 'zod';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AppContext, type AppConfig, type AppContextType, type Theme } from '@/contexts/AppContext';
import { LoginDialogProvider } from '@/contexts/LoginDialogContext';

interface AppProviderProps {
  children: ReactNode;
  /** Application storage key */
  storageKey: string;
  /** Default app configuration */
  defaultConfig: AppConfig;
  /** Optional list of preset relays to display in the RelaySelector */
  presetRelays?: { name: string; url: string }[];
}

// Zod schema for AppConfig validation
const AppConfigSchema: z.ZodType<AppConfig, z.ZodTypeDef, unknown> = z.object({
  theme: z.enum(['dark', 'light', 'system']),
  relayUrl: z.string().url(),
  showDeletedVideos: z.boolean().optional(),
});

export function AppProvider(props: AppProviderProps) {
  const {
    children,
    storageKey,
    defaultConfig,
    presetRelays,
  } = props;

  // App configuration state with localStorage persistence
  const [config, setConfig] = useLocalStorage<AppConfig>(
    storageKey,
    defaultConfig,
    {
      serialize: JSON.stringify,
      deserialize: (value: string) => {
        const parsed = JSON.parse(value);
        const validated = AppConfigSchema.parse(parsed);
        // Always use relayUrls from defaultConfig, don't persist in localStorage
        return {
          ...validated,
          relayUrls: defaultConfig.relayUrls,
        };
      }
    }
  );

  // Recording state (not persisted)
  const [isRecording, setIsRecording] = useState(false);

  // Generic config updater with callback pattern
  const updateConfig = (updater: (currentConfig: AppConfig) => AppConfig) => {
    setConfig(updater);
  };

  const appContextValue: AppContextType = {
    config,
    updateConfig,
    presetRelays,
    isRecording,
    setIsRecording,
  };

  // Apply theme effects to document
  useApplyTheme(config.theme);

  return (
    <AppContext.Provider value={appContextValue}>
      <LoginDialogProvider>
        {children}
      </LoginDialogProvider>
    </AppContext.Provider>
  );
}

/**
 * Hook to apply theme changes to the document root
 * Note: This app always uses light theme, ignoring system preferences
 */
function useApplyTheme(theme: Theme) {
  useEffect(() => {
    const root = window.document.documentElement;

    // Always force light theme - remove any dark class
    root.classList.remove('dark');
    root.classList.add('light');
  }, [theme]);
}