import { useEffect, useState } from "react";

export function useSystemTheme() {
  const getSystemTheme = (): "dark" | "light" =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const [theme, setTheme] = useState<"dark" | "light">(getSystemTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (event: MediaQueryListEvent): void => {
      setTheme(event.matches ? "dark" : "light");
    };

    // Attach listener
    mediaQuery.addEventListener("change", handler);

    // Cleanup
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return theme;
}

