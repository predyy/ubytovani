const rawLocales = (process.env.SUPPORTED_LOCALES ?? "en,cs")
  .split(",")
  .map((locale) => locale.trim())
  .filter(Boolean);

export const supportedLocales = rawLocales.length ? rawLocales : ["en"];
export const fallbackLocale = supportedLocales[0] ?? "en";

export function isSupportedLocale(locale: string) {
  return supportedLocales.includes(locale);
}
