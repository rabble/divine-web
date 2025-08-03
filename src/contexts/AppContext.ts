import { createContext } from "react";

export type Theme = "dark" | "light" | "system";

export interface AppConfig {
  /** Current theme */
  theme: Theme;
  /** Selected relay URL */
  relayUrl: string;
}

export interface AppContextType {
  /** Current application configuration */
  config: AppConfig;
  /** Update configuration using a callback that receives current config and returns new config */
  updateConfig: (updater: (currentConfig: AppConfig) => AppConfig) => void;
  /** Optional list of preset relays to display in the RelaySelector */
  presetRelays?: { name: string; url: string }[];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
