import { type Theme } from "@/contexts/AppContext";
import { useAppContext } from "@/hooks/useAppContext";
import { useSystemTheme } from "./useSystemTheme";

/**
 * Hook to get and set the active theme
 * @returns Theme context with theme, systemTheme, displayTheme, and setTheme
 */
export function useTheme(): {
  theme: Theme;
  systemTheme: "light" | "dark";
  displayTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
} {
  const { config, updateConfig } = useAppContext();

  const systemTheme = useSystemTheme();
  const displayTheme = config.theme === 'system' ? systemTheme : config.theme;

  return {
    theme: config.theme,
    systemTheme,
    displayTheme,
    setTheme: (theme: Theme) => {
      updateConfig((currentConfig) => ({
        ...currentConfig,
        theme,
      }));
    }
  };
}

