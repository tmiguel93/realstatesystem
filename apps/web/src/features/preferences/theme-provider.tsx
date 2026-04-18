import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useAuth } from "@/features/auth/auth-context";

type ThemePreference = "SYSTEM" | "LIGHT" | "DARK";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "imobiliaria.theme";

type ThemeContextValue = {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveInitialThemePreference(): ThemePreference {
  const storedPreference = window.localStorage.getItem(
    THEME_STORAGE_KEY,
  ) as ThemePreference | null;

  if (storedPreference === "LIGHT" || storedPreference === "DARK") {
    return storedPreference;
  }

  return "SYSTEM";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    resolveInitialThemePreference,
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(
    resolveSystemTheme,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (
      user?.preferredTheme &&
      ["SYSTEM", "LIGHT", "DARK"].includes(user.preferredTheme)
    ) {
      setThemePreference(user.preferredTheme as ThemePreference);
    }
  }, [user?.preferredTheme]);

  const resolvedTheme: ResolvedTheme =
    themePreference === "SYSTEM"
      ? systemTheme
      : themePreference === "DARK"
        ? "dark"
        : "light";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [resolvedTheme, themePreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference,
    }),
    [themePreference, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme precisa ser usado dentro de ThemeProvider.");
  }

  return context;
}
