import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  messages,
  supportedLocales,
  type SupportedLocale,
} from "@/i18n/messages";

const LOCALE_STORAGE_KEY = "imobiliaria.locale";

type TranslationParams = Record<string, string | number>;

type LanguageContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: TranslationParams) => string;
  message: <T = unknown>(key: string) => T;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolveInitialLocale(): SupportedLocale {
  const storedLocale = window.localStorage.getItem(
    LOCALE_STORAGE_KEY,
  ) as SupportedLocale | null;

  if (storedLocale && supportedLocales.includes(storedLocale)) {
    return storedLocale;
  }

  return "PT_BR";
}

function readMessage(locale: SupportedLocale, key: string) {
  const segments = key.split(".");
  let current: unknown = messages[locale];

  for (const segment of segments) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [locale, setLocale] = useState<SupportedLocale>(resolveInitialLocale);

  useEffect(() => {
    if (user?.preferredLocale && supportedLocales.includes(user.preferredLocale)) {
      setLocale(user.preferredLocale as SupportedLocale);
    }
  }, [user?.preferredLocale]);

  useEffect(() => {
    document.documentElement.lang =
      locale === "PT_BR" ? "pt-BR" : locale.toLowerCase();
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) =>
        interpolate(
          String(readMessage(locale, key) ?? readMessage("PT_BR", key) ?? key),
          params,
        ),
      message: <T,>(key: string) =>
        ((readMessage(locale, key) ?? readMessage("PT_BR", key) ?? key) as T),
    }),
    [locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useI18n precisa ser usado dentro de LanguageProvider.");
  }

  return context;
}
