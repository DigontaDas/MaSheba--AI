import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BN_STRINGS, EN_STRINGS } from "@/data/translations";

export type Language = "bn" | "en";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string) => string;
};

const STORAGE_KEY = "app_language";

const LanguageContext = createContext<LanguageContextType>({
  language: "bn",
  setLanguage: async () => undefined,
  t: (key) => BN_STRINGS[key] ?? key
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("bn");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "bn" || stored === "en") {
          setLanguageState(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<LanguageContextType>(() => {
    const setLanguage = async (nextLanguage: Language) => {
      setLanguageState(nextLanguage);
      await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
    };

    const t = (key: string) => {
      const strings = language === "en" ? EN_STRINGS : BN_STRINGS;
      return strings[key] ?? key;
    };

    return { language, setLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
