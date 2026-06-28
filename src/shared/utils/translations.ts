import enTranslations from "@/i18n/en.json";
import nlTranslations from "@/i18n/nl.json";

export type Locale = "en" | "nl";

export type TranslationKey = string;

interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Locale, Translations> = {
  en: enTranslations,
  nl: nlTranslations,
};

function getNestedValue(obj: Translations, path: string): string | undefined {
  const keys = path.split(".");
  let current: Translations | string | undefined = obj;

  for (const key of keys) {
    if (typeof current === "object" && current !== null && key in current) {
      const next: Translations | string | undefined = (current as Translations)[key];
      current = next;
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

export function getTranslation(locale: Locale, key: TranslationKey, fallback?: string): string {
  const value = getNestedValue(translations[locale], key);

  if (value) {
    return value;
  }

  if (fallback) {
    return fallback;
  }

  // Try to fall back to English
  if (locale !== "en") {
    const enValue = getNestedValue(translations.en, key);
    if (enValue) {
      return enValue;
    }
  }

  // Return the key itself as a last resort
  return key;
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.en;
}
