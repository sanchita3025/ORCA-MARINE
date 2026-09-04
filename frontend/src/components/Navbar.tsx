import { useState } from "react";

const LANGUAGES = [
  { code: "en", native: "English", name: "English" },
  { code: "hi", native: "हिन्दी", name: "Hindi" },
  { code: "bn", native: "বাংলা", name: "Bengali" },
  { code: "te", native: "తెలుగు", name: "Telugu" },
  { code: "mr", native: "मराठी", name: "Marathi" },
  { code: "ta", native: "தமிழ்", name: "Tamil" },
  { code: "gu", native: "ગુજરાતી", name: "Gujarati" },
  { code: "kn", native: "ಕನ್ನಡ", name: "Kannada" },
  { code: "ml", native: "മലയാളം", name: "Malayalam" },
  { code: "pa", native: "ਪੰਜਾਬੀ", name: "Punjabi" },
  { code: "or", native: "ଓଡ଼ିଆ", name: "Odia" },
  { code: "as", native: "অসমীয়া", name: "Assamese" },
  { code: "ur", native: "اردو", name: "Urdu" },
  { code: "ne", native: "नेपाली", name: "Nepali" },
  { code: "es", native: "Español", name: "Spanish" },
  { code: "fr", native: "Français", name: "French" },
  { code: "de", native: "Deutsch", name: "German" },
  { code: "pt", native: "Português", name: "Portuguese" },
  { code: "it", native: "Italiano", name: "Italian" },
  { code: "ru", native: "Русский", name: "Russian" },
  { code: "ja", native: "日本語", name: "Japanese" },
  { code: "ko", native: "한국어", name: "Korean" },
  { code: "ar", native: "العربية", name: "Arabic" },
];

function Navbar() {
  const [languageOpen, setLanguageOpen] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      return localStorage.getItem("orca-language") || "en";
    } catch {
      return "en";
    }
  });

  const currentLanguage =
    LANGUAGES.find(
      (language) => language.code === selectedLanguage
    ) || LANGUAGES[0];

  function handleLanguageSelect(code: string) {
    setSelectedLanguage(code);

    try {
      localStorage.setItem("orca-language", code);
    } catch {
      // Ignore localStorage errors
    }

    setLanguageOpen(false);

    window.dispatchEvent(
      new CustomEvent("orca-language-change", {
        detail: {
          language: code,
        },
      })
    );
  }

  return (
    <nav className="navbar">
      {/* LEFT */}
      <div className="navbar-brand">
        <div className="orca-logo">🐋</div>

        <div>
          <h2>ORCA</h2>

          <span>Marine Ecosystem Intelligence</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">
        {/* LANGUAGE SELECTOR */}
        <div className="language-selector">
          <button
            type="button"
            className="language-button"
            onClick={() =>
              setLanguageOpen((previous) => !previous)
            }
            aria-haspopup="true"
            aria-expanded={languageOpen}
          >
            <span className="language-icon">🌐</span>

            <span>{currentLanguage.native}</span>

            <span className="language-arrow">
              {languageOpen ? "▲" : "▼"}
            </span>
          </button>

          {languageOpen && (
            <div className="language-menu">
              <div className="language-menu-title">
                SELECT LANGUAGE · 23 LANGUAGES
              </div>

              <div className="language-list">
                {LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    className={`language-option ${
                      selectedLanguage === language.code
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleLanguageSelect(language.code)
                    }
                  >
                    <span className="language-native">
                      {language.native}
                    </span>

                    <span className="language-name">
                      {language.name}
                    </span>

                    {selectedLanguage === language.code && (
                      <span className="language-check">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SYSTEM STATUS */}
        <div className="navbar-status">
          <span className="status-dot" />
          System Online
        </div>
      </div>
    </nav>
  );
}

export default Navbar;