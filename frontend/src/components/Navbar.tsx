import { useEffect, useState } from "react";

import {
  LANGUAGES,
  saveLanguage,
  useOrcaLanguage,
  type LanguageCode,
} from "../i18n";

export default function Navbar() {
  const {
    language,
    languageInfo,
    t,
  } = useOrcaLanguage();

  const [open, setOpen] =
    useState(false);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target =
        event.target as HTMLElement;

      if (
        !target.closest(
          ".orca-language-selector"
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "click",
      close
    );

    return () => {
      document.removeEventListener(
        "click",
        close
      );
    };
  }, []);

  const handleLanguageChange = (
    code: LanguageCode
  ) => {
    saveLanguage(code);

    setOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="orca-logo">
          ORCA
        </div>

        <div className="navbar-links">
          <button type="button">
            {t("nav.home")}
          </button>

          <button type="button">
            {t("nav.askOrca")}
          </button>

          <button type="button">
            {t("nav.marineMap")}
          </button>

          <button type="button">
            {t("nav.about")}
          </button>
        </div>
      </div>

      <div className="navbar-right">
        <div className="system-status">
          <span className="status-dot" />

          <span>
            {t("nav.systemReady")}
          </span>
        </div>

        <div
          className="orca-language-selector"
          style={{
            position: "relative",
          }}
        >
          <button
            type="button"
            className="language-button"
            onClick={(event) => {
              event.stopPropagation();

              setOpen((value) => !value);
            }}
          >
            <span>
              {languageInfo.native}
            </span>

            <span>
              {open ? "▲" : "▼"}
            </span>
          </button>

          {open && (
            <div
              className="language-dropdown"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                zIndex: 9999,
                minWidth: "230px",
                maxHeight: "420px",
                overflowY: "auto",
              }}
            >
              <div className="language-dropdown-title">
                {t("language.select")}
              </div>

              {LANGUAGES.map(
                (item) => (
                  <button
                    type="button"
                    key={item.code}
                    onClick={() =>
                      handleLanguageChange(
                        item.code
                      )
                    }
                    className={
                      item.code === language
                        ? "language-option selected"
                        : "language-option"
                    }
                  >
                    <span>
                      {item.native}
                    </span>

                    {item.code === language && (
                      <span>✓</span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}