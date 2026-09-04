import en from "./en";
import hi from "./hi";
import od from "./od";

export type LanguageCode =
  | "en"
  | "as"
  | "bn"
  | "brx"
  | "doi"
  | "gu"
  | "hi"
  | "kn"
  | "ks"
  | "kok"
  | "mai"
  | "ml"
  | "mni"
  | "mr"
  | "ne"
  | "or"
  | "pa"
  | "sa"
  | "sat"
  | "sd"
  | "ta"
  | "te"
  | "ur";

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  speechCode: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", speechCode: "en-IN" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", speechCode: "as-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speechCode: "bn-IN" },
  { code: "brx", name: "Bodo", nativeName: "बड़ो", speechCode: "brx-IN" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी", speechCode: "doi-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speechCode: "gu-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechCode: "kn-IN" },
  { code: "ks", name: "Kashmiri", nativeName: "کٲشُر", speechCode: "ks-IN" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी", speechCode: "kok-IN" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली", speechCode: "mai-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechCode: "ml-IN" },
  { code: "mni", name: "Manipuri", nativeName: "মৈতৈলোন্", speechCode: "mni-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", speechCode: "mr-IN" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", speechCode: "ne-IN" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", speechCode: "or-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speechCode: "pa-IN" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", speechCode: "sa-IN" },
  { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", speechCode: "sat-IN" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي", speechCode: "sd-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechCode: "ta-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechCode: "te-IN" },
  { code: "ur", name: "Urdu", nativeName: "اردو", speechCode: "ur-IN" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export function getLanguage(code: LanguageCode): Language {
  return (
    LANGUAGES.find((language) => language.code === code) ??
    LANGUAGES[0]
  );
}

export function getSpeechLanguage(code: LanguageCode): string {
  return getLanguage(code).speechCode;
}

export function saveLanguage(code: LanguageCode): void {
  localStorage.setItem("orca-language", code);
}

export function loadLanguage(): LanguageCode {
  const saved = localStorage.getItem("orca-language");

  if (
    saved &&
    LANGUAGES.some((language) => language.code === saved)
  ) {
    return saved as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

/*
 * Translation type
 *
 * This is based on your existing en.ts / hi.ts / od.ts
 * structure.
 */
export type Translation = typeof en;

/*
 * Currently available complete translations.
 *
 * English, Hindi and Odia are already fully translated
 * in your project.
 */
export const translations: Record<
  LanguageCode,
  Translation
> = {
  en,
  hi,
  or: od,

  /*
   * These languages are registered in the selector,
   * but their complete translation files have not yet
   * been created.
   *
   * Until we create them, they fall back to English.
   */
  as: en,
  bn: en,
  brx: en,
  doi: en,
  gu: en,
  kn: en,
  ks: en,
  kok: en,
  mai: en,
  ml: en,
  mni: en,
  mr: en,
  ne: en,
  pa: en,
  sa: en,
  sat: en,
  sd: en,
  ta: en,
  te: en,
  ur: en,
};

export function getTranslation(
  code: LanguageCode
): Translation {
  return translations[code] ?? translations.en;
}