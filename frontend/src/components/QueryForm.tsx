import { useEffect, useMemo, useRef, useState } from "react";
import {
  getSpeechLanguage,
  useOrcaLanguage,
} from "../i18n";

type BoatSize = "small" | "medium" | "large";

type BoatInfo = {
  size: BoatSize;
};

type QueryFormProps = {
  onAsk: (
    question: string,
    location: string,
    date: string,
    time: string,
    latitude: number,
    longitude: number,
    boatInfo?: BoatInfo | null
  ) => void;
  loading?: boolean;
  roleId?: string;
};

type LocationResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export default function QueryForm({
  onAsk,
  loading = false,
  roleId = "",
}: QueryFormProps) {
  const { language, languageInfo, speechLanguage, t } =
    useOrcaLanguage();

  const [question, setQuestion] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationResult[]
  >([]);
  const [showLocationSuggestions, setShowLocationSuggestions] =
    useState(false);

  const [boatSize, setBoatSize] = useState<BoatSize | "">("");

  const recognitionRef = useRef<any>(null);
  const locationTimerRef = useRef<number | null>(null);

  const isFisherman =
    roleId === "fisherman" ||
    roleId === "fishermen" ||
    roleId === "authorized-fisherman";

  const isBoatOperator =
    roleId === "boat-operator" ||
    roleId === "boat_operator" ||
    roleId === "boatOperator";

  const needsBoatInfo = isFisherman || isBoatOperator;

  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    if (!date) {
      setDate(today);
    }

    if (!time) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }
  }, [date, time, today]);

  useEffect(() => {
    return () => {
      if (locationTimerRef.current) {
        window.clearTimeout(locationTimerRef.current);
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors.
        }
      }
    };
  }, []);

  const suggestions = useMemo(() => {
    const role = roleId.toLowerCase();

    if (
      role.includes("fisher") ||
      role.includes("boat")
    ) {
      return [
        t(
          "query.suggestions.fishing",
          "Is it safe to go fishing today?"
        ),
        t(
          "query.suggestions.weather",
          "What are the weather and ocean conditions?"
        ),
        t(
          "query.suggestions.risk",
          "What is the marine risk level?"
        ),
        t(
          "query.suggestions.pfz",
          "Where are the nearby potential fishing zones?"
        ),
      ];
    }

    if (role.includes("research")) {
      return [
        t(
          "query.suggestions.research",
          "What are the current marine conditions?"
        ),
        t(
          "query.suggestions.ocean",
          "What does the ocean data show?"
        ),
        t(
          "query.suggestions.pfz",
          "What does the satellite data indicate?"
        ),
        t(
          "query.suggestions.risk",
          "What are the current environmental risks?"
        ),
      ];
    }

    if (
      role.includes("environment") ||
      role.includes("authority")
    ) {
      return [
        t(
          "query.suggestions.risk",
          "What are the current marine risks?"
        ),
        t(
          "query.suggestions.ocean",
          "What are the current ocean conditions?"
        ),
        t(
          "query.suggestions.weather",
          "What weather conditions should we monitor?"
        ),
        t(
          "query.suggestions.pfz",
          "What does the satellite data indicate?"
        ),
      ];
    }

    return [
      t(
        "query.suggestions.weather",
        "What is the weather like here?"
      ),
      t(
        "query.suggestions.ocean",
        "What are the current ocean conditions?"
      ),
      t(
        "query.suggestions.risk",
        "Is this area safe right now?"
      ),
      t(
        "query.suggestions.marine",
        "What is happening in the marine environment?"
      ),
    ];
  }, [roleId, t]);

  const getCurrentLocation = () => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        t(
          "query.locationNotSupported",
          "Location services are not supported by this browser."
        )
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lon);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
          );

          if (!response.ok) {
            throw new Error("Reverse geocoding failed");
          }

          const data = await response.json();

          const address = data?.address || {};

          const readableLocation =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            data?.display_name ||
            `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

          setLocation(readableLocation);
        } catch {
          setLocation(
            `${lat.toFixed(4)}, ${lon.toFixed(4)}`
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);

        if (error.code === 1) {
          setLocationError(
            t(
              "query.locationPermission",
              "Location permission was denied."
            )
          );
        } else if (error.code === 2) {
          setLocationError(
            t(
              "query.locationUnavailable",
              "Your location could not be determined."
            )
          );
        } else {
          setLocationError(
            t(
              "query.locationTimeout",
              "Location request timed out."
            )
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const searchLocation = async (value: string) => {
    if (!value.trim() || value.trim().length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(
          value
        )}`
      );

      if (!response.ok) {
        return;
      }

      const data: LocationResult[] = await response.json();

      setLocationSuggestions(data);
      setShowLocationSuggestions(data.length > 0);
    } catch {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  };

  const handleLocationChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    setLocation(value);
    setLatitude(null);
    setLongitude(null);

    if (locationTimerRef.current) {
      window.clearTimeout(locationTimerRef.current);
    }

    locationTimerRef.current = window.setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const selectLocation = (item: LocationResult) => {
    setLocation(item.display_name);
    setLatitude(Number(item.lat));
    setLongitude(Number(item.lon));
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  const startVoiceInput = () => {
    setVoiceError("");

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        t(
          "query.voiceNotSupported",
          "Voice input is not supported in this browser."
        )
      );
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore.
      }

      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
      getSpeechLanguage(language) ||
      speechLanguage ||
      languageInfo?.speechCode ||
      "en-IN";

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError("");
    };

    recognition.onresult = (event: any) => {
      let finalText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i]?.[0]?.transcript || "";

        if (event.results[i].isFinal) {
          finalText += transcript;
        }
      }

      if (finalText.trim()) {
        setQuestion((previous) =>
          previous
            ? `${previous.trim()} ${finalText.trim()}`
            : finalText.trim()
        );
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);

      if (event?.error === "not-allowed") {
        setVoiceError(
          t(
            "query.microphonePermission",
            "Microphone permission was denied."
          )
        );
      } else if (event?.error === "no-speech") {
        setVoiceError(
          t(
            "query.noSpeech",
            "No speech was detected. Please try again."
          )
        );
      } else {
        setVoiceError(
          t(
            "query.voiceError",
            "Voice input could not be started."
          )
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError(
        t(
          "query.voiceError",
          "Voice input could not be started."
        )
      );
    }
  };

  const handleSuggestion = (value: string) => {
    setQuestion(value);
  };

  const handleAnalyze = () => {
    const trimmedQuestion = question.trim();
    const trimmedLocation = location.trim();

    if (!trimmedQuestion) {
      setVoiceError(
        t(
          "query.questionRequired",
          "Please enter a question for ORCA."
        )
      );
      return;
    }

    if (!trimmedLocation) {
      setLocationError(
        t(
          "query.locationRequired",
          "Please enter or select a location."
        )
      );
      return;
    }

    if (!date) {
      setVoiceError(
        t(
          "query.dateRequired",
          "Please select a date."
        )
      );
      return;
    }

    if (!time) {
      setVoiceError(
        t(
          "query.timeRequired",
          "Please select a time."
        )
      );
      return;
    }

    if (
      needsBoatInfo &&
      !boatSize
    ) {
      setVoiceError(
        t(
          "query.boatSizeRequired",
          "Please select your boat size before analysis."
        )
      );
      return;
    }

    let finalLatitude = latitude;
    let finalLongitude = longitude;

    /*
     * If the user typed a location but did not select a
     * search result, geocode it before sending the analysis.
     */
    if (
      finalLatitude === null ||
      finalLongitude === null
    ) {
      setLocationLoading(true);

      fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
          trimmedLocation
        )}`
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Location search failed");
          }

          return response.json();
        })
        .then((data: LocationResult[]) => {
          if (!data?.length) {
            throw new Error("Location not found");
          }

          finalLatitude = Number(data[0].lat);
          finalLongitude = Number(data[0].lon);

          setLatitude(finalLatitude);
          setLongitude(finalLongitude);

          onAsk(
            trimmedQuestion,
            trimmedLocation,
            date,
            time,
            finalLatitude,
            finalLongitude,
            needsBoatInfo && boatSize
              ? {
                  size: boatSize,
                }
              : null
          );
        })
        .catch(() => {
          setLocationError(
            t(
              "query.locationNotFound",
              "Could not determine this location. Please select a location from the suggestions or use your current location."
            )
          );
        })
        .finally(() => {
          setLocationLoading(false);
        });

      return;
    }

    onAsk(
      trimmedQuestion,
      trimmedLocation,
      date,
      time,
      finalLatitude,
      finalLongitude,
      needsBoatInfo && boatSize
        ? {
            size: boatSize,
          }
        : null
    );
  };

  return (
    <section className="query-form">
      <div className="query-header">
        <div>
          <div className="query-eyebrow">
            ORCA INTELLIGENCE
          </div>

          <h2>
            {t(
              "query.title",
              "Ask ORCA"
            )}
          </h2>

          <p>
            {t(
              "query.subtitle",
              "Ask a marine question in your preferred language. ORCA combines weather, ocean, satellite and GIS evidence before giving a decision."
            )}
          </p>
        </div>

        <div className="query-language-badge">
          <span>{languageInfo.native}</span>
          <small>
            {languageInfo.name}
          </small>
        </div>
      </div>

      <div className="query-main">
        <div className="query-question-section">
          <label className="query-label">
            {t(
              "query.questionLabel",
              "What would you like to know?"
            )}
          </label>

          <div className="query-input-wrapper">
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder={t(
                "query.placeholder",
                "Ask ORCA anything about marine safety, weather, ocean conditions, fishing, risks or the environment..."
              )}
              rows={5}
              disabled={loading}
            />

            <button
              type="button"
              className={
                isListening
                  ? "voice-button listening"
                  : "voice-button"
              }
              onClick={startVoiceInput}
              disabled={loading}
              title={
                isListening
                  ? t(
                      "query.stopVoice",
                      "Stop voice input"
                    )
                  : t(
                      "query.voice",
                      "Speak your question"
                    )
              }
            >
              {isListening ? "■" : "🎙"}
            </button>
          </div>

          <div className="voice-language-info">
            {t(
              "query.voiceLanguage",
              "Voice language"
            )}
            :{" "}
            <strong>
              {languageInfo.native}
            </strong>
            {" • "}
            {speechLanguage}
          </div>

          {voiceError && (
            <div className="query-error">
              {voiceError}
            </div>
          )}

          <div className="query-suggestions">
            <div className="suggestions-label">
              {t(
                "query.suggestionsTitle",
                "Try asking"
              )}
            </div>

            <div className="suggestions-list">
              {suggestions.map(
                (suggestion, index) => (
                  <button
                    type="button"
                    key={`${suggestion}-${index}`}
                    onClick={() =>
                      handleSuggestion(
                        suggestion
                      )
                    }
                    disabled={loading}
                    className="suggestion-button"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="query-details">
          <div className="query-field">
            <label className="query-label">
              {t(
                "query.locationLabel",
                "Location"
              )}
            </label>

            <div className="location-input-wrapper">
              <input
                type="text"
                value={location}
                onChange={handleLocationChange}
                onFocus={() => {
                  if (
                    locationSuggestions.length
                  ) {
                    setShowLocationSuggestions(
                      true
                    );
                  }
                }}
                placeholder={t(
                  "query.locationPlaceholder",
                  "Enter a coastal location"
                )}
                disabled={loading}
              />

              <button
                type="button"
                className="location-button"
                onClick={getCurrentLocation}
                disabled={
                  loading ||
                  locationLoading
                }
              >
                {locationLoading
                  ? "..."
                  : "⌖"}
              </button>

              {showLocationSuggestions &&
                locationSuggestions.length >
                  0 && (
                  <div className="location-suggestions">
                    {locationSuggestions.map(
                      (item, index) => (
                        <button
                          type="button"
                          key={`${item.lat}-${item.lon}-${index}`}
                          onClick={() =>
                            selectLocation(
                              item
                            )
                          }
                        >
                          {item.display_name}
                        </button>
                      )
                    )}
                  </div>
                )}
            </div>

            {latitude !== null &&
              longitude !== null && (
                <div className="coordinates-info">
                  {latitude.toFixed(5)}
                  {" , "}
                  {longitude.toFixed(5)}
                </div>
              )}

            {locationError && (
              <div className="query-error">
                {locationError}
              </div>
            )}
          </div>

          <div className="query-date-time">
            <div className="query-field">
              <label className="query-label">
                {t(
                  "query.dateLabel",
                  "Date"
                )}
              </label>

              <input
                type="date"
                value={date}
                min={today}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                disabled={loading}
              />
            </div>

            <div className="query-field">
              <label className="query-label">
                {t(
                  "query.timeLabel",
                  "Time"
                )}
              </label>

              <input
                type="time"
                value={time}
                onChange={(event) =>
                  setTime(event.target.value)
                }
                disabled={loading}
              />
            </div>
          </div>

          {needsBoatInfo && (
            <div className="boat-profile-section">
              <div className="boat-profile-header">
                <div>
                  <label className="query-label">
                    {t(
                      "query.boatSizeLabel",
                      "Boat size"
                    )}
                  </label>

                  <p>
                    {t(
                      "query.boatSizeDescription",
                      "Tell ORCA the approximate size of your boat so the analysis can include the correct operational context."
                    )}
                  </p>
                </div>

                <span className="boat-profile-badge">
                  {t(
                    "query.required",
                    "Required"
                  )}
                </span>
              </div>

              <div className="boat-size-options">
                <button
                  type="button"
                  className={
                    boatSize === "small"
                      ? "boat-size-option selected"
                      : "boat-size-option"
                  }
                  onClick={() =>
                    setBoatSize("small")
                  }
                  disabled={loading}
                >
                  <strong>
                    {t(
                      "query.boatSmall",
                      "Small"
                    )}
                  </strong>
                  <span>
                    {t(
                      "query.boatSmallDescription",
                      "Small fishing / local boat"
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    boatSize === "medium"
                      ? "boat-size-option selected"
                      : "boat-size-option"
                  }
                  onClick={() =>
                    setBoatSize("medium")
                  }
                  disabled={loading}
                >
                  <strong>
                    {t(
                      "query.boatMedium",
                      "Medium"
                    )}
                  </strong>
                  <span>
                    {t(
                      "query.boatMediumDescription",
                      "Medium operational boat"
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    boatSize === "large"
                      ? "boat-size-option selected"
                      : "boat-size-option"
                  }
                  onClick={() =>
                    setBoatSize("large")
                  }
                  disabled={loading}
                >
                  <strong>
                    {t(
                      "query.boatLarge",
                      "Large"
                    )}
                  </strong>
                  <span>
                    {t(
                      "query.boatLargeDescription",
                      "Large vessel"
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="query-footer">
        <div className="query-data-note">
          <span className="status-dot" />
          <span>
            {t(
              "query.dataNote",
              "ORCA uses location-specific weather, ocean and available satellite evidence."
            )}
          </span>
        </div>

        <button
          type="button"
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={
            loading ||
            locationLoading ||
            !question.trim() ||
            !location.trim() ||
            !date ||
            !time ||
            (needsBoatInfo && !boatSize)
          }
        >
          {loading
            ? t(
                "query.analyzing",
                "Analyzing..."
              )
            : t(
                "query.analyze",
                "Analyze with ORCA"
              )}
        </button>
      </div>
    </section>
  );
}