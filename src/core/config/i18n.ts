export const I18N_CONFIG = {
  locales: ["en", "nl"] as const,
  defaultLocale: "nl" as const,
  localePrefix: "always" as const,
} as const;

export type SupportedLocale = (typeof I18N_CONFIG.locales)[number];

export const isValidLocale = (locale: unknown): locale is SupportedLocale => {
  return typeof locale === "string" && I18N_CONFIG.locales.includes(locale as SupportedLocale);
};

export const getDefaultLocale = (): SupportedLocale => {
  return I18N_CONFIG.defaultLocale;
};

export const getLocaleFromHeader = (acceptLanguage: string | null): SupportedLocale => {
  if (!acceptLanguage) {
    return getDefaultLocale();
  }

  const parts = acceptLanguage.split(",")[0].split("-")[0].toLowerCase();

  if (parts === "nl") {
    return "nl";
  }

  if (parts === "en") {
    return "en";
  }

  return getDefaultLocale();
};
