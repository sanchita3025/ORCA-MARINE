import { useEffect, useMemo, useState, type ReactNode } from "react";
import "./App.css";
import MarineMap from "./components/MarineMap";
import { analyzeOrca, getWhatIf, getWatcher, getRouteAnalysis, getFishingIntelligence, getOfficialAlerts, type RouteAnalysisResponse, type FishingIntelligenceResponse, type OfficialAlertsResponse } from "./services/api";
import { LANGUAGES, saveLanguage, useOrcaLanguage, ui, type LanguageCode } from "./i18n";

type RoleId = "fisherman" | "researcher" | "boat-operator" | "traveler" | "environmentalist" | "authority";
type View = "dashboard" | "ask" | "map" | "evidence" | "history" | "alerts" | "whatif" | "profile" | "language";

type Role = { id: RoleId; icon: string; title: string; description: string };
type Vessel = { type: string; size: "small" | "medium" | "large"; fuelCapacity: number; currentFuel: number; consumption: number; speed: number; reserve: number };
type Result = any;
type HistoryItem = { id: string; question: string; location: string; date: string; time: string; role: string; decision: string; risk: number | null };

const ROLES: Role[] = [
  { id: "fisherman", icon: "🎣", title: "Fisherman", description: "Fishing windows, marine risk, PFZ and vessel safety" },
  { id: "researcher", icon: "🔬", title: "Researcher", description: "Marine observations, SST, currents and evidence" },
  { id: "boat-operator", icon: "🚤", title: "Boat Operator", description: "Operating conditions, route awareness and range" },
  { id: "traveler", icon: "🧳", title: "Traveler / Public", description: "Coastal weather, waves and public awareness" },
  { id: "environmentalist", icon: "🌱", title: "Environmentalist", description: "Ocean health and environmental indicators" },
  { id: "authority", icon: "🏛️", title: "Coastal Authority", description: "Risk areas, GIS zones and proactive monitoring" },
];

const COASTAL_PRESETS = [
  { name: "Paradip Offshore", latitude: 20.15, longitude: 86.75 },
  { name: "Puri Offshore", latitude: 19.75, longitude: 86.05 },
  { name: "Digha Offshore", latitude: 21.55, longitude: 87.10 },
  { name: "Visakhapatnam Offshore", latitude: 17.55, longitude: 83.45 },
  { name: "Kakinada Offshore", latitude: 16.90, longitude: 82.45 },
  { name: "Chennai Offshore", latitude: 13.00, longitude: 80.40 },
  { name: "Tuticorin Offshore", latitude: 8.65, longitude: 78.20 },
  { name: "Rameswaram Offshore", latitude: 9.20, longitude: 79.35 },
  { name: "Kochi Offshore", latitude: 9.90, longitude: 76.00 },
  { name: "Mangalore Offshore", latitude: 12.80, longitude: 74.65 },
  { name: "Goa Offshore", latitude: 15.30, longitude: 73.90 },
  { name: "Mumbai Offshore", latitude: 18.85, longitude: 72.75 },
  { name: "Kandla Offshore", latitude: 22.95, longitude: 68.80 },
  { name: "Port Blair Offshore", latitude: 11.55, longitude: 92.70 },
];

const defaultVessel: Vessel = { type: "Fishing Boat", size: "small", fuelCapacity: 100, currentFuel: 80, consumption: 8, speed: 18, reserve: 20 };
const defaultDeparture = { name: "Current location", latitude: 20.27, longitude: 86.69 };
const emptyDestination = { name: "", latitude: null as number | null, longitude: null as number | null };

function todayString() {
  return new Date().toISOString().slice(0, 10);
}
function currentTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function prettyTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}
function roleNeedsVessel(role: RoleId | null) { return role === "fisherman" || role === "boat-operator"; }
function riskTone(level: string) {
  const l = level.toLowerCase();
  if (l.includes("high") || l.includes("severe") || l === "avoid") return "danger";
  if (l.includes("medium") || l.includes("moderate") || l === "caution" || l === "watch") return "warning";
  return "safe";
}

function displayValue(value: unknown, fallback = "Not available"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(v => displayValue(v, "")).filter(Boolean).join(" · ") || fallback;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const preferred = obj.text ?? obj.message ?? obj.label ?? obj.name ?? obj.status ?? obj.decision ?? obj.recommendation;
    if (preferred !== undefined && preferred !== null && typeof preferred !== "object") return String(preferred);
    const parts = Object.entries(obj).map(([k,v]) => {
      const text = displayValue(v, "");
      return text ? `${k.replaceAll("_", " ")}: ${text}` : "";
    }).filter(Boolean);
    return parts.join(" · ") || fallback;
  }
  return fallback;
}

function displayDecision(value: unknown): string {
  return displayValue(value, "INSUFFICIENT DATA")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}


function OrcaDolphinLogo({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "orca-dolphin-logo small" : "orca-dolphin-logo"}
      viewBox="0 0 160 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ORCA dolphin logo"
    >
      <defs>
        <linearGradient id="orcaDolphinGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#69efff" />
          <stop offset="55%" stopColor="#29cde9" />
          <stop offset="100%" stopColor="#1688c6" />
        </linearGradient>
      </defs>
      <path
        d="M18 70c18-31 53-47 91-34 15 5 26 15 33 27-18-8-34-8-48-2 10 8 17 18 19 31-17-9-31-10-45-5-13 5-27 5-42-2 8-5 13-10 17-15-10 1-18 1-25 0z"
        fill="url(#orcaDolphinGradient)"
      />
      <path
        d="M108 34c9-13 21-20 36-23-5 12-5 22 1 32-14-4-26-7-37-9z"
        fill="url(#orcaDolphinGradient)"
      />
      <path
        d="M51 78c10 12 23 18 39 17-12 9-27 12-42 8-10-3-19-9-26-17 11 2 20 0 29-8z"
        fill="none"
        stroke="#83f3ff"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".9"
      />
      <circle cx="113" cy="48" r="3" fill="#06111f" />
    </svg>
  );
}

export default function App() {
  const { language, languageInfo } = useOrcaLanguage();
  const L = (key: Parameters<typeof ui>[1]) => ui(language, key);
  const [screen, setScreen] = useState<"welcome" | "roles" | "verify" | "vessel" | "ask" | "loading" | "dashboard">("welcome");
  const [enteredOrca, setEnteredOrca] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [verified, setVerified] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [vessel, setVessel] = useState<Vessel>(defaultVessel);
  const [question, setQuestion] = useState("");
  const [location, setLocation] = useState(COASTAL_PRESETS[0].name);
  const [locationSource, setLocationSource] = useState("preset");
  const [locationLoading, setLocationLoading] = useState(false);
  const [coords, setCoords] = useState({ latitude: COASTAL_PRESETS[0].latitude, longitude: COASTAL_PRESETS[0].longitude });
  const [departure, setDeparture] = useState(defaultDeparture);
  const [destination, setDestination] = useState(emptyDestination);
  const [departureLoading, setDepartureLoading] = useState(false);
  const [date, setDate] = useState(todayString());
  const [time, setTime] = useState(currentTimeString());
  const [result, setResult] = useState<Result | null>(null);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [watcherOn, setWatcherOn] = useState(true);
  const [watcherData, setWatcherData] = useState<any>(null);
  const [watcherLoading, setWatcherLoading] = useState(false);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState<Result | null>(null);
  const [fishingIntel, setFishingIntel] = useState<FishingIntelligenceResponse | null>(null);
  const [fishingIntelLoading, setFishingIntelLoading] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysisResponse | null>(null);
  const [officialAlerts, setOfficialAlerts] = useState<OfficialAlertsResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("orca-query-history") || "[]"); } catch { return []; }
  });

  // Start every fresh app session at the Welcome page.
  useEffect(() => {
    setScreen("welcome");
    const timer = window.setTimeout(() => setShowSplash(false), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  const roleId = role?.id ?? null;
  const effectiveRole = roleId === "fisherman" && !verified ? "fisherman-public" : roleId || "fisherman-public";
  const vesselRequired = roleNeedsVessel(roleId) && (roleId !== "fisherman" || verified);

  const roleInfo = useMemo(() => {
    const map: Record<string, { title: string; subtitle: string; action: string }> = {
      fisherman: { title: "Fisherman Decision Support", subtitle: "Know when to go, when to wait and what conditions ORCA is seeing.", action: "Fishing decision" },
      "fisherman-public": { title: "Public Marine Information", subtitle: "Public weather, ocean and coastal safety information.", action: "Marine condition" },
      researcher: { title: "Marine Research Intelligence", subtitle: "Explore observations, ocean state and evidence sources.", action: "Research insight" },
      "boat-operator": { title: "Vessel Operations Intelligence", subtitle: "Assess operating conditions, range and marine risk.", action: "Operating assessment" },
      traveler: { title: "Coastal Conditions", subtitle: "Understand waves, wind and weather before visiting the coast.", action: "Coastal condition" },
      environmentalist: { title: "Ocean Health Intelligence", subtitle: "Review SST, currents and satellite-linked marine evidence.", action: "Environmental insight" },
      authority: { title: "Coastal Authority Intelligence", subtitle: "Monitor risk, restricted zones and marine conditions.", action: "Risk assessment" },
    };
    return map[effectiveRole] || map["fisherman-public"];
  }, [effectiveRole]);

  const weather = result?.weather || result?.marine_conditions?.weather || {};
  const ocean = result?.ocean || result?.marine_conditions?.ocean || {};
  const rawRiskScore = Number(result?.risk_score ?? result?.orca_recommendation?.marine_risk_score ?? result?.marine_conditions?.risk_assessment?.risk_score);
  const riskScore = Number.isFinite(rawRiskScore)
    ? (rawRiskScore <= 12 ? Math.round((rawRiskScore / 12) * 100) : Math.round(Math.min(100, rawRiskScore)))
    : null;
  const riskLevel = String(result?.risk_level ?? result?.orca_recommendation?.marine_risk ?? result?.marine_conditions?.risk_assessment?.risk_level ?? "Unknown");
  const decision = displayDecision(result?.final_decision ?? result?.decision ?? result?.orca_recommendation?.decision);
  const restricted = Boolean(result?.restricted_zone?.restricted || result?.gis?.restricted);
  const marineAvailable = result?.marine_context?.is_marine === true && ocean?.status === "available";
  const dataQuality = result?.marine_conditions?.data_quality?.overall || "unknown";

  const usableFuel = Math.max(0, vessel.currentFuel * (1 - vessel.reserve / 100));
  const endurance = vessel.consumption > 0 ? usableFuel / vessel.consumption : 0;
  const maxRange = endurance * vessel.speed;
  const oneWayRange = maxRange / 2;

  useEffect(() => {
    if (activeView !== "alerts" || !watcherOn || !result) return;
    setWatcherLoading(true);
    getWatcher({ latitude: coords.latitude, longitude: coords.longitude, date, time })
      .then(setWatcherData)
      .catch(() => setWatcherData({ status: "unavailable", watcher: "NO_DATA", message: "Live monitoring data is unavailable." }))
      .finally(() => setWatcherLoading(false));
  }, [activeView, watcherOn, result, date, time, coords.latitude, coords.longitude]);

  function resetForRole(next: Role) {
    setRole(next); setVerified(false); setVerificationId(""); setVerificationError(""); setResult(null); setFishingIntel(null); setError(""); setQuestion(""); setVessel(defaultVessel); setDeparture(defaultDeparture); setDestination(emptyDestination); setDepartureLoading(false); setRouteAnalysis(null);
    setScreen(next.id === "fisherman" ? "verify" : roleNeedsVessel(next.id) ? "vessel" : "ask");
  }

  function verifyFisherman() {
    const id = verificationId.trim().toUpperCase();
    if (id === "DEMO-FISH-001") { setVerified(true); setVerificationError(""); setScreen("vessel"); }
    else { setVerified(false); setVerificationError("Demo verification requires DEMO-FISH-001. This is a demonstration credential, not an official identity check."); }
  }

  async function reverseGeocode(latitude: number, longitude: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("reverse geocode failed");
      const data = await res.json();
      const a = data?.address || {};
      return a.city || a.town || a.village || a.municipality || a.suburb || a.county || data?.display_name?.split(",")?.[0] || "Current location";
    } catch { return "Current location"; }
  }

  async function useCurrentLocation() {
    if (!("geolocation" in navigator)) { setError("This browser does not provide location access."); return; }
    setLocationLoading(true); setError("");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const latitude = Number(pos.coords.latitude.toFixed(5));
      const longitude = Number(pos.coords.longitude.toFixed(5));
      const name = await reverseGeocode(latitude, longitude);
      setCoords({ latitude, longitude });
      setLocation(`${name} · Current location`);
      setLocationSource("gps");
      if (!vesselRequired) setDestination({ name: `${name} · Current location`, latitude, longitude });
      setLocationLoading(false);
    }, (err) => {
      setLocationLoading(false);
      setError(err.code === 1 ? "Location permission was denied. Allow location access in the browser." : "Could not read your current location.");
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
  }

  async function useCurrentDepartureLocation() {
    if (!("geolocation" in navigator)) { setError("This browser does not provide location access."); return; }
    setDepartureLoading(true); setError("");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const latitude = Number(pos.coords.latitude.toFixed(5));
      const longitude = Number(pos.coords.longitude.toFixed(5));
      const name = await reverseGeocode(latitude, longitude);
      setDeparture({ name: `${name} · Current location`, latitude, longitude });
      setDepartureLoading(false);
    }, (err) => {
      setDepartureLoading(false);
      setError(err.code === 1 ? "Location permission was denied. Allow location access for the departure point." : "Could not read your current departure location.");
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
  }

  useEffect(() => {
    if (screen === "vessel" && vesselRequired && departure.name === "Current location") useCurrentDepartureLocation();
    if (screen === "ask" && !vesselRequired && locationSource !== "gps") useCurrentLocation();
  }, [screen, vesselRequired]);

  const routeTarget = useMemo(() => {
    if (vesselRequired && destination.latitude != null && destination.longitude != null) {
      return { latitude: destination.latitude, longitude: destination.longitude, label: destination.name || "Selected offshore target" };
    }
    return { latitude: coords.latitude, longitude: coords.longitude, label: location };
  }, [vesselRequired, destination, coords.latitude, coords.longitude, location]);

  useEffect(() => {
    if (activeView !== "map" || !result || !vesselRequired) return;
    setRouteLoading(true);
    getRouteAnalysis({
      originLatitude: departure.latitude,
      originLongitude: departure.longitude,
      targetLatitude: routeTarget.latitude,
      targetLongitude: routeTarget.longitude,
      date,
      time,
      cruisingSpeed: vessel.speed,
      consumptionLph: vessel.consumption,
      usableFuelL: usableFuel,
    })
      .then(setRouteAnalysis)
      .catch(() => setRouteAnalysis({ status: "unavailable", routes: [], message: "Live route analysis is unavailable." }))
      .finally(() => setRouteLoading(false));
  }, [activeView, result, vesselRequired, departure.latitude, departure.longitude, routeTarget.latitude, routeTarget.longitude, date, time, vessel.speed, vessel.consumption, usableFuel]);

  useEffect(() => {
    if (activeView !== "alerts" || !result) return;
    getOfficialAlerts({ latitude: routeTarget.latitude, longitude: routeTarget.longitude })
      .then(setOfficialAlerts)
      .catch(() => setOfficialAlerts(null));
  }, [activeView, result, routeTarget.latitude, routeTarget.longitude]);

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is unavailable in this browser. Open ORCA in the latest Chrome or Edge and allow microphone access.");
      return;
    }
    if (listening) return;
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = languageInfo?.speechCode || "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { setListening(true); setError(""); };
      recognition.onend = () => setListening(false);
      recognition.onnomatch = () => { setListening(false); setError("ORCA could not understand the voice. Please speak again or type your question."); };
      recognition.onerror = (event: any) => {
        setListening(false);
        const code = String(event?.error || "");
        const message = code === "not-allowed" || code === "service-not-allowed"
          ? "Microphone access was blocked. Allow microphone permission for ORCA, then try again."
          : code === "no-speech"
            ? "No speech was detected. Tap the microphone and speak your question."
            : "Voice input could not start. Open ORCA in Chrome/Edge and allow microphone access.";
        setError(message);
      };
      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript;
        if (transcript) setQuestion(transcript);
      };
      recognition.start();
    } catch {
      setListening(false);
      setError("Voice input could not start. Please allow microphone access and try again.");
    }
  }

  function localizedSpeechText(text: string) {
    const key = text.trim().toLowerCase();
    const translations: Record<string, Partial<Record<LanguageCode, string>>> = {
      "conditions appear relatively favorable for the selected hour based on the available live marine data.": {
        hi: "चयनित समय के लिए उपलब्ध लाइव समुद्री डेटा के आधार पर परिस्थितियाँ अपेक्षाकृत अनुकूल दिखाई देती हैं।",
        or: "ଚୟନିତ ସମୟ ପାଇଁ ଉପଲବ୍ଧ ଲାଇଭ୍ ସାମୁଦ୍ରିକ ତଥ୍ୟ ଆଧାରରେ ପରିସ୍ଥିତି ତୁଳନାମୂଳକ ଭାବେ ଅନୁକୂଳ ଦେଖାଯାଉଛି।",
        bn: "নির্বাচিত সময়ের জন্য উপলব্ধ লাইভ সামুদ্রিক তথ্যের ভিত্তিতে পরিস্থিতি তুলনামূলকভাবে অনুকূল বলে মনে হচ্ছে।",
        as: "নিৰ্বাচিত সময়ৰ বাবে উপলব্ধ লাইভ সামুদ্ৰিক তথ্যৰ ভিত্তিত পৰিস্থিতি তুলনামূলকভাৱে অনুকূল যেন লাগে।",
        gu: "પસંદ કરેલા સમય માટે ઉપલબ્ધ લાઇવ દરિયાઈ ડેટાના આધારે પરિસ્થિતિઓ તુલનાત્મક રીતે અનુકૂળ દેખાય છે.",
        mr: "निवडलेल्या वेळेसाठी उपलब्ध थेट सागरी डेटाच्या आधारे परिस्थिती तुलनेने अनुकूल दिसत आहे.",
        pa: "ਚੁਣੇ ਗਏ ਸਮੇਂ ਲਈ ਉਪਲਬਧ ਲਾਈਵ ਸਮੁੰਦਰੀ ਡੇਟਾ ਦੇ ਆਧਾਰ 'ਤੇ ਹਾਲਾਤ ਕਾਫ਼ੀ ਅਨੁਕੂਲ ਦਿਖਾਈ ਦਿੰਦੇ ਹਨ।",
        ta: "தேர்ந்தெடுக்கப்பட்ட நேரத்திற்கான நேரடி கடல் தரவின் அடிப்படையில் நிலைமைகள் ஒப்பீட்டளவில் சாதகமாகத் தெரிகின்றன.",
        te: "ఎంచుకున్న సమయానికి అందుబాటులో ఉన్న ప్రత్యక్ష సముద్ర డేటా ఆధారంగా పరిస్థితులు సాపేక్షంగా అనుకూలంగా కనిపిస్తున్నాయి.",
        kn: "ಆಯ್ಕೆ ಮಾಡಿದ ಸಮಯಕ್ಕೆ ಲಭ್ಯವಿರುವ ನೇರ ಸಮುದ್ರ ದತ್ತಾಂಶದ ಆಧಾರದ ಮೇಲೆ ಪರಿಸ್ಥಿತಿಗಳು ತುಲನಾತ್ಮಕವಾಗಿ ಅನುಕೂಲಕರವಾಗಿವೆ.",
        ml: "തിരഞ്ഞെടുത്ത സമയത്തേക്കുള്ള ലഭ്യമായ തത്സമയ സമുദ്ര ഡാറ്റയുടെ അടിസ്ഥാനത്തിൽ സാഹചര്യങ്ങൾ താരതമ്യേന അനുകൂലമാണ്.",
        ur: "منتخب وقت کے لیے دستیاب لائیو سمندری ڈیٹا کی بنیاد پر حالات نسبتاً سازگار نظر آتے ہیں۔",
        ne: "छानिएको समयका लागि उपलब्ध प्रत्यक्ष समुद्री तथ्याङ्कका आधारमा अवस्था तुलनात्मक रूपमा अनुकूल देखिन्छ।",
        sd: "چونڊيل وقت لاءِ موجود لائيو سامونڊي ڊيٽا جي بنياد تي حالتون نسبتاً سازگار نظر اچن ٿيون۔"
      },
      "conditions require caution for the selected hour. review the live wind, wave, rain and current values before departure.": {
        hi: "चयनित समय के लिए सावधानी आवश्यक है। प्रस्थान से पहले लाइव हवा, लहर, बारिश और समुद्री धारा के मान देखें।",
        or: "ଚୟନିତ ସମୟ ପାଇଁ ସତର୍କତା ଆବଶ୍ୟକ। ଯିବା ପୂର୍ବରୁ ଲାଇଭ୍ ପବନ, ତରଙ୍ଗ, ବର୍ଷା ଏବଂ ସ୍ରୋତ ତଥ୍ୟ ଯାଞ୍ଚ କରନ୍ତୁ।",
        bn: "নির্বাচিত সময়ে সতর্কতা প্রয়োজন। রওনা হওয়ার আগে লাইভ বাতাস, ঢেউ, বৃষ্টি ও স্রোতের তথ্য দেখুন।",
        gu: "પસંદ કરેલા સમય માટે સાવચેતી જરૂરી છે. રવાના થવા પહેલાં લાઇવ પવન, મોજાં, વરસાદ અને પ્રવાહના ડેટા તપાસો.",
        mr: "निवडलेल्या वेळेसाठी सावधगिरी आवश्यक आहे. निघण्यापूर्वी थेट वारा, लाटा, पाऊस आणि प्रवाहाचे डेटा तपासा.",
        pa: "ਚੁਣੇ ਗਏ ਸਮੇਂ ਲਈ ਸਾਵਧਾਨੀ ਲਾਜ਼ਮੀ ਹੈ। ਰਵਾਨਗੀ ਤੋਂ ਪਹਿਲਾਂ ਲਾਈਵ ਹਵਾ, ਲਹਿਰਾਂ, ਮੀਂਹ ਅਤੇ ਧਾਰਾ ਦੇ ਅੰਕੜੇ ਵੇਖੋ।",
        ta: "தேர்ந்தெடுக்கப்பட்ட நேரத்தில் எச்சரிக்கை தேவை. புறப்படும் முன் நேரடி காற்று, அலை, மழை மற்றும் நீரோட்டத் தரவை சரிபார்க்கவும்.",
        te: "ఎంచుకున్న సమయానికి జాగ్రత్త అవసరం. బయలుదేరే ముందు ప్రత్యక్ష గాలి, అలలు, వర్షం మరియు ప్రవాహ డేటాను పరిశీలించండి.",
        kn: "ಆಯ್ಕೆ ಮಾಡಿದ ಸಮಯದಲ್ಲಿ ಎಚ್ಚರಿಕೆ ಅಗತ್ಯ. ಹೊರಡುವ ಮೊದಲು ನೇರ ಗಾಳಿ, ಅಲೆ, ಮಳೆ ಮತ್ತು ಪ್ರವಾಹದ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
        ml: "തിരഞ്ഞെടുത്ത സമയത്ത് ജാഗ്രത ആവശ്യമാണ്. പുറപ്പെടുന്നതിന് മുമ്പ് തത്സമയ കാറ്റ്, തിരമാല, മഴ, ഒഴുക്ക് ഡാറ്റ പരിശോധിക്കുക.",
        ur: "منتخب وقت کے لیے احتیاط ضروری ہے۔ روانگی سے پہلے لائیو ہوا، لہروں، بارش اور سمندری دھارے کے اعداد و شمار دیکھیں۔"
      },
      "conditions show elevated marine stress for the selected hour. consider delaying departure and review the evidence.": {
        hi: "चयनित समय में समुद्री जोखिम बढ़ा हुआ है। प्रस्थान टालने और उपलब्ध साक्ष्य की समीक्षा करने पर विचार करें।",
        or: "ଚୟନିତ ସମୟରେ ସାମୁଦ୍ରିକ ଚାପ ବଢ଼ିଛି। ଯାତ୍ରା ବିଳମ୍ବ କରିବା ଏବଂ ପ୍ରମାଣ ଯାଞ୍ଚ କରିବା ବିଚାର କରନ୍ତୁ।",
        bn: "নির্বাচিত সময়ে সামুদ্রিক ঝুঁকি বেড়েছে। যাত্রা বিলম্বিত করা এবং প্রমাণ পর্যালোচনা করার কথা বিবেচনা করুন।",
        gu: "પસંદ કરેલા સમય માટે દરિયાઈ જોખમ વધારે છે. પ્રસ્થાન મુલતવી રાખવા અને પુરાવા તપાસવા પર વિચાર કરો.",
        mr: "निवडलेल्या वेळेत सागरी जोखीम वाढलेली आहे. प्रस्थान पुढे ढकलण्याचा आणि पुराव्याचा आढावा घेण्याचा विचार करा.",
        pa: "ਚੁਣੇ ਗਏ ਸਮੇਂ ਲਈ ਸਮੁੰਦਰੀ ਜੋਖਮ ਵਧਿਆ ਹੋਇਆ ਹੈ। ਰਵਾਨਗੀ ਦੇਰੀ ਨਾਲ ਕਰਨ ਅਤੇ ਸਬੂਤ ਦੀ ਸਮੀਖਿਆ ਕਰਨ ਬਾਰੇ ਸੋਚੋ.",
        ta: "தேர்ந்தெடுக்கப்பட்ட நேரத்தில் கடல் அழுத்தம் அதிகமாக உள்ளது. புறப்பாட்டை தாமதப்படுத்தி ஆதாரங்களை மதிப்பாய்வு செய்யவும்.",
        te: "ఎంచుకున్న సమయానికి సముద్ర ఒత్తిడి ఎక్కువగా ఉంది. బయలుదేరడాన్ని ఆలస్యం చేసి ఆధారాలను పరిశీలించండి.",
        kn: "ಆಯ್ಕೆ ಮಾಡಿದ ಸಮಯದಲ್ಲಿ ಸಮುದ್ರದ ಒತ್ತಡ ಹೆಚ್ಚಾಗಿದೆ. ಹೊರಡುವುದನ್ನು ವಿಳಂಬಿಸಿ ಸಾಕ್ಷ್ಯವನ್ನು ಪರಿಶೀಲಿಸುವುದನ್ನು ಪರಿಗಣಿಸಿ.",
        ml: "തിരഞ്ഞെടുത്ത സമയത്ത് സമുദ്ര സമ്മർദ്ദം ഉയർന്നതാണ്. പുറപ്പെടൽ വൈകിപ്പിച്ച് തെളിവുകൾ പരിശോധിക്കുന്നത് പരിഗണിക്കുക.",
        ur: "منتخب وقت میں سمندری دباؤ زیادہ ہے۔ روانگی میں تاخیر کرنے اور شواہد کا جائزہ لینے پر غور کریں۔"
      },
      "conditions show severe marine stress for the selected hour. seek official warnings before departure.": {
        hi: "चयनित समय में समुद्री जोखिम गंभीर है। प्रस्थान से पहले आधिकारिक चेतावनियाँ देखें।",
        or: "ଚୟନିତ ସମୟରେ ସାମୁଦ୍ରିକ ଝୁମ୍ପ ଗୁରୁତର। ଯିବା ପୂର୍ବରୁ ସରକାରୀ ସତର୍କତା ଯାଞ୍ଚ କରନ୍ତୁ।",
        bn: "নির্বাচিত সময়ে সামুদ্রিক ঝুঁকি গুরুতর। রওনা হওয়ার আগে সরকারি সতর্কতা দেখুন।",
        gu: "પસંદ કરેલા સમય માટે દરિયાઈ જોખમ ગંભીર છે. રવાના થવા પહેલાં સત્તાવાર ચેતવણીઓ તપાસો.",
        mr: "निवडलेल्या वेळेत सागरी जोखीम गंभीर आहे. निघण्यापूर्वी अधिकृत इशारे तपासा.",
        pa: "ਚੁਣੇ ਗਏ ਸਮੇਂ ਲਈ ਸਮੁੰਦਰੀ ਜੋਖਮ ਗੰਭੀਰ ਹੈ। ਰਵਾਨਗੀ ਤੋਂ ਪਹਿਲਾਂ ਅਧਿਕਾਰਤ ਚੇਤਾਵਨੀਆਂ ਵੇਖੋ.",
        ta: "தேர்ந்தெடுக்கப்பட்ட நேரத்தில் கடல் ஆபத்து கடுமையாக உள்ளது. புறப்படும் முன் அதிகாரப்பூர்வ எச்சரிக்கைகளைப் பார்க்கவும்.",
        te: "ఎంచుకున్న సమయానికి సముద్ర ప్రమాదం తీవ్రంగా ఉంది. బయలుదేరే ముందు అధికారిక హెచ్చరికలను పరిశీలించండి.",
        kn: "ಆಯ್ಕೆ ಮಾಡಿದ ಸಮಯದಲ್ಲಿ ಸಮುದ್ರದ ಅಪಾಯ ತೀವ್ರವಾಗಿದೆ. ಹೊರಡುವ ಮೊದಲು ಅಧಿಕೃತ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
        ml: "തിരഞ്ഞെടുത്ത സമയത്ത് സമുദ്ര അപകടസാധ്യത ഗുരുതരമാണ്. പുറപ്പെടുന്നതിന് മുമ്പ് ഔദ്യോഗിക മുന്നറിയിപ്പുകൾ പരിശോധിക്കുക.",
        ur: "منتخب وقت میں سمندری خطرہ سنگین ہے۔ روانگی سے پہلے سرکاری انتباہات دیکھیں۔"
      }
    };
    return translations[key]?.[language] || text;
  }

  function speakOrca() {
    if (!("speechSynthesis" in window)) { setError("Voice output is not supported by this browser."); return; }
    const original = displayValue(result?.recommendation ?? result?.orca_recommendation?.recommendation, "No recommendation available.");
    const text = localizedSpeechText(original);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const locale = languageInfo?.speechCode || "en-IN";
    const voices = window.speechSynthesis.getVoices();
    const exactVoice = voices.find(v => v.lang.toLowerCase() === locale.toLowerCase());
    const baseVoice = voices.find(v => v.lang.toLowerCase().startsWith(locale.split("-")[0].toLowerCase()));
    if (exactVoice || baseVoice) utterance.voice = exactVoice || baseVoice || null;
    utterance.lang = locale;
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function runAnalysis(nextTime = time) {
    if (!roleId) return;
    if (!question.trim()) { setError("Please enter a question first."); return; }
    if (vesselRequired && (destination.latitude == null || destination.longitude == null)) { setError("Choose the offshore / operating destination before asking ORCA."); return; }
    const requested = new Date(`${date}T${nextTime}:00`);
    if (!Number.isNaN(requested.getTime()) && requested.getTime() < Date.now() - 60_000) {
      setError("Past date/time selected. ORCA only provides present or future decision support for fishing and marine operations.");
      return;
    }
    setError(""); setScreen("loading");
    try {
      const response = await analyzeOrca({
        question,
        locationName: vesselRequired ? destination.name : location,
        date,
        time: nextTime,
        latitude: vesselRequired ? Number(destination.latitude) : coords.latitude,
        longitude: vesselRequired ? Number(destination.longitude) : coords.longitude,
        stakeholder: effectiveRole,
        verified,
        language,
        vessel: {
          vesselType: vessel.type,
          boatSize: vessel.size === "small" ? 1 : vessel.size === "medium" ? 2 : 3,
          fuelCapacity: vessel.fuelCapacity,
          currentFuel: vessel.currentFuel,
          consumption: vessel.consumption,
          cruisingSpeed: vessel.speed,
          reserve: vessel.reserve,
        },
      });
      setResult(response);
      const historyItem: HistoryItem = {
        id: `${Date.now()}-${nextTime}`, question: question.trim(), location, date, time: nextTime,
        role: effectiveRole, decision: displayDecision(response?.final_decision ?? response?.decision ?? response?.orca_recommendation?.decision),
        risk: Number.isFinite(Number(response?.risk_score)) ? (Number(response.risk_score) <= 12 ? Math.round(Number(response.risk_score) / 12 * 100) : Math.round(Math.min(100, Number(response.risk_score)))) : null
      };
      setHistory(prev => { const next = [historyItem, ...prev.filter(h => h.question !== historyItem.question || h.date !== historyItem.date || h.time !== historyItem.time)].slice(0, 20); localStorage.setItem("orca-query-history", JSON.stringify(next)); return next; });
      setTime(nextTime);
      setWhatIfResult(null);
      setRouteAnalysis(null);
      setActiveView("dashboard");
      setScreen("dashboard");
    } catch (e: any) {
      setError(e?.message || "ORCA could not complete the analysis.");
      setScreen("ask");
    }
  }

  async function runWhatIf(nextTime: string) {
    const requested = new Date(`${date}T${nextTime}:00`);
    if (!Number.isNaN(requested.getTime()) && requested.getTime() < Date.now() - 60_000) {
      setError("Past date/time selected. What-If only checks present or future hours.");
      return;
    }
    setWhatIfLoading(true); setError("");
    try {
      const response = await getWhatIf({
        date, time: nextTime, latitude: coords.latitude, longitude: coords.longitude
      });
      setWhatIfResult(response as any);
    } catch (e: any) { setError(e?.message || "What-if analysis failed."); }
    finally { setWhatIfLoading(false); }
  }

  function selectDestination(p: typeof COASTAL_PRESETS[number]) {
    setDestination({ name: p.name, latitude: p.latitude, longitude: p.longitude });
    setError("");
  }

  function selectAssessmentLocation(p: typeof COASTAL_PRESETS[number]) {
    setLocation(p.name); setCoords({ latitude: p.latitude, longitude: p.longitude }); setLocationSource("preset"); setError("");
  }

  function goBack() {
    if (screen === "ask") setScreen(vesselRequired ? "vessel" : "roles");
    else if (screen === "vessel") setScreen(role?.id === "fisherman" ? "verify" : "roles");
    else if (screen === "verify") setScreen("roles");
    else if (screen === "dashboard") setActiveView("ask");
  }

  function nav(view: View) { setActiveView(view); setMobileNavOpen(false); }

  if (showSplash) return (
    <div className="orca-splash" aria-label="Loading ORCA">
      <div className="splash-glow splash-glow-one" />
      <div className="splash-glow splash-glow-two" />
      <div className="splash-content">
        <div className="dolphin-logo large" aria-hidden="true"><OrcaDolphinLogo /></div>
        <div className="splash-wordmark">ORCA</div>
        <div className="splash-subtitle">MARINE ECOSYSTEM INTELLIGENCE</div>
        <div className="splash-loader"><span /><span /><span /></div>
      </div>
    </div>
  );

  if (!enteredOrca || screen === "welcome") return (
    <div className="fullscreen intro-screen welcome-language-screen redesigned-welcome v2-welcome">
      <div className="welcome-ocean-glow glow-one" /><div className="welcome-ocean-glow glow-two" />
      <div className="welcome-topline"><span className="dolphin-mini"><OrcaDolphinLogo small /></span> ORCA <b>MARINE ECOSYSTEM INTELLIGENCE</b></div>
      <div className="v2-welcome-shell">
        <section className="v2-welcome-copy">
          <div className="welcome-brand-row"><span className="dolphin-logo large"><svg viewBox="0 0 160 120"><path d="M18 70c18-31 53-47 91-34 15 5 26 15 33 27-18-8-34-8-48-2 10 8 17 18 19 31-17-9-31-10-45-5-13 5-27 5-42-2 8-5 13-10 17-15-10 1-18 1-25 0z"/><path d="M108 34c9-13 21-20 36-23-5 12-5 22 1 32-14-4-26-7-37-9z"/><circle cx="113" cy="48" r="3"/></svg></span><div><div className="v2-brand">ORCA</div><div className="v2-brand-sub">MARINE ECOSYSTEM INTELLIGENCE</div></div></div>
          <div className="eyebrow">FROM OCEAN DATA TO CLEARER DECISIONS</div>
          <h1>Ask the ocean.<br /><span>Understand the risk.</span></h1>
          <p className="welcome-lead">ORCA brings weather, ocean, satellite, PFZ and GIS evidence together to help you understand marine conditions before you decide.</p>
          <div className="v2-feature-pills"><span>🌊 Weather + Ocean</span><span>🛰️ Satellite + PFZ</span><span>🗺️ GIS + Risk</span></div>
        </section>
        <section className="v2-welcome-panel">
          <div className="v2-panel-label">START YOUR ORCA SESSION</div>
          <h2>One ocean.<br /><span>Many decisions.</span></h2>
          <p>Select your language, then ORCA will adapt the experience to your stakeholder role.</p>
          <div className="welcome-language v2-language">
            <label><span>CHOOSE YOUR LANGUAGE</span><select value={language} onChange={e => saveLanguage(e.target.value as LanguageCode)}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native} · {l.name}</option>)}</select></label>
            <small>Voice availability depends on your browser.</small>
          </div>
          <button className="primary-btn big welcome-enter-btn v2-enter" onClick={() => { setEnteredOrca(true); setScreen("roles"); }}>ENTER ORCA <span>→</span></button>
          <div className="v2-trust-row"><span>✓ Evidence-first</span><span>✓ Deterministic risk</span><span>✓ Transparent sources</span></div>
          <small className="welcome-disclaimer">Decision-support prototype • Not an official navigation or safety system</small>
        </section>
      </div>
    </div>
  );

  if (screen === "roles") return (
    <div className="fullscreen setup-screen">
      <SetupHeader step="01" title="Choose your role" onBack={() => setScreen("welcome")} />
      <div className="setup-content">
        <div className="eyebrow">MULTI-STAKEHOLDER PLATFORM</div>
        <h1>How will you use <span>ORCA?</span></h1>
        <p className="muted">The same marine evidence is adapted to the decision you need to make.</p>
        <div className="role-grid-new">{ROLES.map(r => (
          <button className="role-card-new" key={r.id} onClick={() => resetForRole(r)}>
            <span className="role-icon-new">{r.icon}</span><span><strong>{r.title}</strong><small>{r.description}</small></span><b>→</b>
          </button>
        ))}</div>
      </div>
    </div>
  );

  if (screen === "verify") return (
    <div className="fullscreen setup-screen">
      <SetupHeader step="02" title="Fisherman access" onBack={goBack} />
      <div className="center-card narrow">
        <div className="step-icon">🛡️</div>
        <div className="eyebrow">FISHER ACCESS</div>
        <h1>Choose your access level</h1>
        <p className="muted">ORCA keeps public marine information available to everyone. Extended fisherman features require an authorization check.</p>
        <div className="choice-row">
          <button className="choice-card" onClick={() => { setVerified(false); setVerificationError(""); setScreen("ask"); }}>
            <b>Continue as public fisherman</b>
            <small>Live weather, ocean, marine risk, map and public evidence</small>
          </button>
          <div className="choice-card">
            <b>Demo verified fisherman</b>
            <small>For SIH workflow demonstration only — not government verified</small>
            <input
              className="setup-input"
              value={verificationId}
              onChange={e => { setVerificationId(e.target.value); setVerificationError(""); }}
              placeholder="Enter DEMO-FISH-001"
              autoComplete="off"
            />
            <button className="primary-btn" onClick={verifyFisherman}>VERIFY DEMO ACCOUNT →</button>
          </div>
        </div>
        {verificationError && <div className="error-box">{verificationError}</div>}
        <button className="text-btn" onClick={goBack}>← Back</button>
      </div>
    </div>
  );


  if (screen === "vessel") return (
    <div className="fullscreen setup-screen">
      <SetupHeader step="03" title="Vessel profile" onBack={goBack} />
      <div className="setup-content vessel-setup">
        <div className="eyebrow">VESSEL CONTEXT</div>
        <h1>Tell ORCA about your <span>vessel.</span></h1>
        <p className="muted">This is used for range and operating estimates. It does not replace a professional vessel assessment.</p>
        <div className="form-grid">
          <Field label="Vessel / boat type"><input value={vessel.type} onChange={e => setVessel({ ...vessel, type: e.target.value })} /></Field>
          <Field label="Boat size"><select value={vessel.size} onChange={e => setVessel({ ...vessel, size: e.target.value as Vessel["size"] })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></Field>
          <Field label="Fuel capacity (L)"><input type="number" min="1" value={vessel.fuelCapacity} onChange={e => setVessel({ ...vessel, fuelCapacity: Number(e.target.value) })} /></Field>
          <Field label="Current fuel (L)"><input type="number" min="0" max={vessel.fuelCapacity} value={vessel.currentFuel} onChange={e => setVessel({ ...vessel, currentFuel: Number(e.target.value) })} /></Field>
          <Field label="Consumption (L/hour)"><input type="number" min="0.1" value={vessel.consumption} onChange={e => setVessel({ ...vessel, consumption: Number(e.target.value) })} /></Field>
          <Field label="Cruising speed (km/h)"><input type="number" min="1" value={vessel.speed} onChange={e => setVessel({ ...vessel, speed: Number(e.target.value) })} /></Field>
          <Field label="Fuel reserve (%)"><input type="number" min="0" max="80" value={vessel.reserve} onChange={e => setVessel({ ...vessel, reserve: Number(e.target.value) })} /></Field>
          {vesselRequired && <div className="departure-block"><div className="departure-head"><div><span className="eyebrow">DEPARTURE POINT</span><b>Where will the vessel leave from?</b><small>{departure.name}</small></div><button type="button" className="location-btn" onClick={useCurrentDepartureLocation} disabled={departureLoading}>{departureLoading ? "LOCATING…" : "USE MY CURRENT LOCATION"}</button></div><div className="coord-grid"><Field label="Departure place / address"><input value={departure.name} onChange={e => setDeparture({ ...departure, name: e.target.value })} /></Field><Field label="Latitude"><input type="number" step="0.0001" value={departure.latitude} onChange={e => setDeparture({ ...departure, latitude: Number(e.target.value) })} /></Field><Field label="Longitude"><input type="number" step="0.0001" value={departure.longitude} onChange={e => setDeparture({ ...departure, longitude: Number(e.target.value) })} /></Field></div><p className="muted tiny">ORCA uses this point as the vessel's departure reference. It is separate from the offshore destination you choose next.</p></div>}
        </div>
        <div className="range-preview"><div><span>Usable fuel</span><strong>{usableFuel.toFixed(1)} L</strong></div><div><span>Endurance</span><strong>{endurance.toFixed(1)} h</strong></div><div><span>Estimated one-way range</span><strong>{oneWayRange.toFixed(1)} km</strong></div></div><div className="route-purpose"><b>Why ORCA asks for fuel + speed</b><span>After you choose the fishing/assessment target, ORCA compares the trip distance, travel time and fuel required against your usable fuel, then checks live weather and ocean conditions along alternative planning corridors.</span></div>
        <div className="setup-actions"><button className="text-btn" onClick={goBack}>← Back</button><button className="primary-btn" onClick={() => setScreen("ask")}>NEXT: ASK ORCA →</button></div>
      </div>
    </div>
  );

  if (screen === "ask") return (
    <div className="fullscreen setup-screen">
      <SetupHeader step={vesselRequired ? "04" : "03"} title="Ask ORCA" onBack={goBack} />
      <div className="setup-content ask-setup">
        <div className="eyebrow">{roleInfo.action.toUpperCase()}</div>
        <h1>What do you want to <span>know?</span></h1>
        <p className="muted">Ask naturally. ORCA will collect the evidence it can verify for the selected place and time.</p>
        <div className="question-box"><textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder={suggestionFor(roleId)} /><button className={listening ? "voice-btn active" : "voice-btn"} onClick={startVoice}>{listening ? "■" : "🎙"}</button></div>
        <div className="suggestions">{suggestionsFor(roleId).map(s => <button key={s} onClick={() => setQuestion(s)}>{s}</button>)}</div>
        {vesselRequired ? <div className="location-panel destination-panel">
          <div className="panel-title"><span>🎯 WHERE DO YOU WANT TO GO?</span><div className="location-actions"><small>{destination.latitude != null ? "Offshore destination selected" : "Choose the offshore / operating target"}</small></div></div>
          <p className="muted tiny">Your departure point is already set from your current location. Now choose the marine destination you want ORCA to assess.</p>
          <div className="preset-row">{COASTAL_PRESETS.map(p => <button key={p.name} className={destination.name === p.name ? "preset active" : "preset"} onClick={() => selectDestination(p)}>{p.name}</button>)}</div>
          <div className="coord-grid"><Field label="Destination name"><input value={destination.name} placeholder="e.g. Paradip Offshore" onChange={e => setDestination({ ...destination, name: e.target.value })} /></Field><Field label="Destination latitude"><input type="number" step="0.0001" value={destination.latitude ?? ""} onChange={e => setDestination({ ...destination, latitude: e.target.value === "" ? null : Number(e.target.value) })} /></Field><Field label="Destination longitude"><input type="number" step="0.0001" value={destination.longitude ?? ""} onChange={e => setDestination({ ...destination, longitude: e.target.value === "" ? null : Number(e.target.value) })} /></Field></div>
        </div> : <div className="location-panel">
          <div className="panel-title"><span>📍 CURRENT LOCATION</span><div className="location-actions"><small>{locationSource === "gps" ? location : "Detecting your current location…"}</small><button type="button" className="location-btn" onClick={useCurrentLocation} disabled={locationLoading}>{locationLoading ? "LOCATING…" : L("useCurrentLocation")}</button></div></div>
          <div className="current-location-card"><b>{location}</b><small>ORCA will assess the marine/coastal conditions at your current location. No offshore preset is required for public access.</small></div>
        </div>}
        <div className="datetime-row"><Field label="Date"><input type="date" min={todayString()} value={date} onChange={e => setDate(e.target.value)} /></Field><Field label="Time"><input type="time" value={time} onChange={e => setTime(e.target.value)} /></Field></div>
        {error && <div className="error-box">{error}</div>}
        <div className="setup-actions"><button className="text-btn" onClick={goBack}>← Back</button><button className="primary-btn" onClick={() => runAnalysis()}>{L("analyze")} →</button></div>
      </div>
    </div>
  );

  if (screen === "loading") return <LoadingOrca role={roleInfo.title} />;

  return (
    <div className="app-shell">
      <aside className={mobileNavOpen ? "sidebar mobile-open" : "sidebar"}>
        <div className="side-brand"><div className="side-logo dolphin-side-logo"><OrcaDolphinLogo small /></div><div><b>ORCA</b><small>MARINE INTELLIGENCE</small></div></div>
        <div className="side-role"><span>{role?.icon}</span><div><b>{role?.title}</b><small>{verified ? "Verified access" : "Public access"}</small></div></div>
        <nav>
          <NavItem icon="⌂" label={L("dashboard")} active={activeView === "dashboard"} onClick={() => nav("dashboard")} />
          <NavItem icon="✦" label={L("askOrca")} active={activeView === "ask"} onClick={() => { setError(""); setScreen("ask"); }} />
          <NavItem icon="⌖" label={L("marineMap")} active={activeView === "map"} onClick={() => nav("map")} />
          <NavItem icon="◈" label={L("evidence")} active={activeView === "evidence"} onClick={() => nav("evidence")} />
          <NavItem icon="◷" label={L("history")} active={activeView === "history"} onClick={() => nav("history")} />
          {(effectiveRole === "fisherman" || effectiveRole === "boat-operator" || effectiveRole === "authority") && <NavItem icon="⚠" label={L("alerts")} active={activeView === "alerts"} onClick={() => nav("alerts")} />}
          {(effectiveRole === "fisherman" || effectiveRole === "boat-operator") && <NavItem icon="◇" label={L("whatIf")} active={activeView === "whatif"} onClick={() => nav("whatif")} />}
          <NavItem icon="◎" label={L("profile")} active={activeView === "profile"} onClick={() => nav("profile")} />
          <NavItem icon="文" label={L("language")} active={activeView === "language"} onClick={() => nav("language")} />
        </nav>
        <div className="side-bottom">
          <label>{L("language").toUpperCase()}</label>
          <select value={language} onChange={e => saveLanguage(e.target.value as LanguageCode)}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native} · {l.name}</option>)}</select>
          <button className="change-role" onClick={() => { setScreen("roles"); setResult(null); }}>↺ {L("changeStakeholder")}</button>
          <small>LIVE SOURCES WHEN AVAILABLE<br />Open-Meteo Weather + Marine</small>
        </div>
      </aside>
      {mobileNavOpen && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-shell">
        <header className="topbar"><div><span className="status-live" /> {L("systemReady")}</div><div className="top-location">{location} · {date} · {prettyTime(time)}</div><button className="mobile-menu" onClick={() => setMobileNavOpen(v => !v)}>☰</button></header>
        <div className="page-body">
          {activeView === "dashboard" && <Dashboard />}
          {activeView === "map" && <MapView />}
          {activeView === "evidence" && <EvidenceView />}
          {activeView === "alerts" && <AlertsView />}
          {activeView === "whatif" && <WhatIfView />}
          {activeView === "profile" && <ProfileView />}
          {activeView === "language" && <LanguageView />}
          {activeView === "history" && <HistoryView />}
        </div>
      </main>
    </div>
  );

  function Dashboard() {
    const tone = riskTone(riskLevel);
    const decisionLabel = decision.replaceAll("_", " ");
    function QuestionAnswerCard() {
      const qa = result?.question_answer || {};
      const intent = String(qa.intent || result?.query_understanding?.intent || "GENERAL");
      const priorities = Array.isArray(qa.priority) ? qa.priority : [];
      const direct = displayValue(qa.direct_answer, displayDecision(result?.recommendation));
      const summary = displayValue(qa.answer_summary, "ORCA matched your question to the available evidence.");
      const answerTone = /^(YES|PREFERRED)/i.test(direct) ? "answer-yes" : /^(NO|AVOID)/i.test(direct) ? "answer-no" : /^(CAUTION|MODERATE)/i.test(direct) ? "answer-caution" : "answer-neutral";
      return <section className={`question-answer-card ${answerTone}`}>
        <div className="question-answer-head">
          <div className="question-answer-main">
            <span className="section-label">ANSWER TO YOUR QUESTION</span>
            <h2>{direct}</h2>
          </div>
          <span className="intent-badge">{intent.replaceAll("_", " ")}</span>
        </div>
        <p className="question-answer-summary">{summary}</p>
        <div className="question-answer-meta">
          <span className="qa-label">YOUR QUESTION</span>
          <b>{question || "General marine assessment"}</b>
        </div>
        {priorities.length > 0 && <div className="priority-row">{priorities.map((x: string) => <span key={x}>{x.replaceAll("_", " ")}</span>)}</div>}
      </section>;
    }

    const shared = result ? (
      <>
        <QuestionAnswerCard />
        <div className={`decision-hero ${tone}`}><div><span className="decision-kicker">ORCA DECISION</span><h2>{decisionLabel}</h2><p>{localizedSpeechText(displayValue(result?.recommendation ?? result?.orca_recommendation?.recommendation, "No recommendation available."))}</p><small>{location} · {date} {prettyTime(time)} · {marineAvailable ? "Marine data available" : "Marine data not confirmed"}</small><button className="listen-btn" onClick={speakOrca}>{speaking ? "■ Speaking…" : `🔊 ${L("listen")}`}</button></div><div className="risk-circle"><strong>{riskScore !== null ? riskScore : "—"}</strong><span>RISK / 100</span></div></div>
        <div className="query-understanding">
          <div><span className="section-label">ORCA UNDERSTOOD</span><strong>{displayValue(result?.query_understanding?.requested_information, "General marine conditions and evidence")}</strong></div>
          <small>Your question is routed to the relevant marine evidence. Risk is calculated separately by the deterministic model.</small>
        </div>
        <div className="metric-grid">
          <Metric icon="🌬" label="Wind" value={weather?.wind_speed != null ? `${weather.wind_speed} km/h` : "—"} sub={weather?.condition || "No valid weather data"} />
          <Metric icon="🌊" label="Wave height" value={ocean?.wave_height != null ? `${ocean.wave_height} m` : "—"} sub={ocean?.wave_period != null ? `Period ${ocean.wave_period}s` : "No valid wave data"} />
          <Metric icon="🌀" label="Ocean current" value={ocean?.current_speed != null ? `${ocean.current_speed} m/s` : "—"} sub={ocean?.sst != null ? `Marine SST ${ocean.sst}°C` : "No current data"} />
          <Metric icon="🌧" label="Rain" value={weather?.precipitation != null ? `${weather.precipitation} mm` : "—"} sub={weather?.weather_code != null ? `Weather code ${weather.weather_code}` : "Selected-hour data"} />
          <Metric icon="🛰" label="Satellite SST" value={result?.satellite?.satellite_observations?.sst?.available ? `${result.satellite.satellite_observations.sst.value} °C` : "—"} sub={result?.satellite?.satellite_observations?.sst?.observation_time ? `Observed ${result.satellite.satellite_observations.sst.observation_time}` : "No recent satellite pixel"} />
          {vesselRequired && <Metric icon="⛽" label="Range estimate" value={`${oneWayRange.toFixed(1)} km`} sub={`${endurance.toFixed(1)} h endurance`} />}
        </div>
        <section className="decision-explain">
          <div className="section-title"><span>DECISION PATH</span><small>Deterministic assessment from available evidence</small></div>
          <div className="decision-flow">
            <FlowNode icon="🌦" title="Weather" status={weather?.status === "available" ? "LIVE" : "—"} />
            <i>→</i><FlowNode icon="🌊" title="Ocean" status={ocean?.status === "available" ? "LIVE" : "—"} />
            <i>→</i><FlowNode icon="🛰" title="Satellite / PFZ" status={result?.satellite?.satellite_observations?.status === "available" ? "LIVE" : result?.fishing_zone?.status || "—"} />
            <i>→</i><FlowNode icon="🗺" title="GIS" status={result?.gis?.restriction_layer_connected ? "CHECKED" : "LIMITED"} />
            <i>→</i><FlowNode icon="⚙" title="Risk Engine" status={riskScore !== null ? "CALCULATED" : "—"} />
          </div>
          <div className="decision-note"><b>ORCA is a decision-support prototype.</b><span>Risk is calculated from the evidence returned for the selected place and time. It is not an official maritime safety clearance.</span></div>
        </section>
        <section className="source-strip">
          <div><span>WEATHER</span><b>{weather?.source || "Open-Meteo"}</b></div>
          <div><span>OCEAN</span><b>{ocean?.source || "Open-Meteo Marine"}</b></div>
          <div><span>SATELLITE</span><b>{result?.satellite?.satellite_observations?.source || "NOAA CoastWatch"}</b></div>
          <div><span>PFZ</span><b>{result?.fishing_zone?.source || "INCOIS"}</b></div>
        </section>
      </>
    ) : null;

    function renderRoleWorkspace() {
      if (!result) return null;
      const rec = localizedSpeechText(displayValue(result?.recommendation ?? result?.orca_recommendation?.recommendation, "No recommendation available."));
      const envSat = result?.satellite?.satellite_observations || result?.satellite_observations || {};
      const chlor = envSat?.chlorophyll;
      const satSst = envSat?.sst;
      const guidance = roleId === "fisherman" && !verified
        ? "Public marine guidance only. ORCA does not claim fisherman verification or expose protected/private fishing intelligence."
        : roleId === "researcher"
          ? "Observation-first view: measurements and provenance are shown before recommendations."
          : roleId === "boat-operator"
            ? "Operational view: route feasibility, travel conditions and vessel range are the priority."
            : roleId === "traveler"
              ? "Public coastal awareness view: weather, waves and general marine conditions."
              : roleId === "environmentalist"
                ? "Environmental view: satellite and ocean indicators are emphasized over fishing decisions."
                : "Regional situational-awareness view: risk, spatial context, alerts and evidence are prioritized.";

      if (roleId === "researcher") return <section className="role-output researcher-output">
        <div className="role-output-hero"><div><span className="decision-kicker">RESEARCH OBSERVATION</span><h2>Marine observations around {location}</h2><p>{guidance}</p></div><div className="observation-badge">EVIDENCE FIRST</div></div>
        <div className="metric-grid role-metric-grid"><Metric icon="🛰" label="Satellite SST" value={satSst?.available ? `${satSst.value} °C` : "—"} sub={satSst?.observation_time ? `Observed ${satSst.observation_time}` : "Recent pixel unavailable"}/><Metric icon="🟢" label="Chlorophyll" value={chlor?.available ? `${chlor.value}` : "—"} sub={chlor?.observation_time ? `Observed ${chlor.observation_time}` : "Recent pixel unavailable"}/><Metric icon="🌀" label="Ocean current" value={ocean?.current_speed != null ? `${ocean.current_speed} m/s` : "—"} sub="Open-Meteo Marine"/><Metric icon="🌊" label="Wave height" value={ocean?.wave_height != null ? `${ocean.wave_height} m` : "—"} sub={ocean?.wave_period != null ? `Period ${ocean.wave_period}s` : "Period unavailable"}/></div>
        <div className="role-callout"><b>Source provenance</b><span>Weather: {weather?.source || "—"} · Ocean: {ocean?.source || "—"} · Satellite: {satSst?.source || "—"} · PFZ: {result?.fishing_zone?.source || "—"}</span></div>
      </section>;

      if (roleId === "environmentalist") return <section className="role-output environment-output">
        <div className="role-output-hero"><div><span className="decision-kicker">ENVIRONMENTAL OBSERVATION</span><h2>Ocean health signals</h2><p>{guidance}</p></div><div className="observation-badge">SATELLITE + OCEAN</div></div>
        <div className="metric-grid role-metric-grid"><Metric icon="🌡" label="Sea surface temperature" value={satSst?.available ? `${satSst.value} °C` : ocean?.sst != null ? `${ocean.sst} °C` : "—"} sub="Satellite / marine observation"/><Metric icon="🟢" label="Chlorophyll" value={chlor?.available ? `${chlor.value}` : "—"} sub="Satellite observation when available"/><Metric icon="🌀" label="Current" value={ocean?.current_speed != null ? `${ocean.current_speed} m/s` : "—"} sub="Marine model"/><Metric icon="🌊" label="Wave state" value={ocean?.wave_height != null ? `${ocean.wave_height} m` : "—"} sub={ocean?.wave_period != null ? `Period ${ocean.wave_period}s` : "—"}/></div>
        <div className="role-callout"><b>Environmental evidence</b><span>{satSst?.observation_time || chlor?.observation_time ? "Recent satellite observations are shown with their observation time." : "No recent satellite pixel was available; ORCA does not invent environmental values."}</span></div>
      </section>;

      if (roleId === "traveler") return <section className="role-output traveler-output">
        <div className={`role-output-hero ${tone}`}><div><span className="decision-kicker">COASTAL AWARENESS</span><h2>{decision.replaceAll("_", " ")}</h2><p>{rec}</p><small>{guidance}</small></div><div className="risk-circle"><strong>{riskScore !== null ? riskScore : "—"}</strong><span>RISK / 100</span></div></div>
        <div className="metric-grid role-metric-grid"><Metric icon="🌦" label="Weather" value={weather?.condition || "—"} sub={weather?.wind_speed != null ? `Wind ${weather.wind_speed} km/h` : "Wind unavailable"}/><Metric icon="🌊" label="Coastal waves" value={ocean?.wave_height != null ? `${ocean.wave_height} m` : "—"} sub="Marine data when available"/><Metric icon="🌧" label="Rain" value={weather?.precipitation != null ? `${weather.precipitation} mm` : "—"} sub="Selected hour"/><Metric icon="⚠" label="Public risk" value={riskScore !== null ? `${riskScore}/100` : "—"} sub="Model estimate, not a clearance"/></div>
      </section>;

      if (roleId === "fisherman" && !verified) return <section className="role-output public-fisher-output">
        <div className={`role-output-hero ${tone}`}><div><span className="decision-kicker">PUBLIC FISHERMAN · STANDARD ACCESS</span><h2>{decision.replaceAll("_", " ")}</h2><p>{rec}</p><small>{guidance}</small></div><div className="risk-circle"><strong>{riskScore !== null ? riskScore : "—"}</strong><span>RISK / 100</span></div></div>
        <div className="metric-grid role-metric-grid"><Metric icon="🌬" label="Wind" value={weather?.wind_speed != null ? `${weather.wind_speed} km/h` : "—"} sub={weather?.condition || "Weather unavailable"}/><Metric icon="🌊" label="Wave height" value={ocean?.wave_height != null ? `${ocean.wave_height} m` : "—"} sub="General marine condition"/><Metric icon="🌀" label="Current" value={ocean?.current_speed != null ? `${ocean.current_speed} m/s` : "—"} sub="General marine condition"/><Metric icon="⚠" label="Marine risk" value={riskScore !== null ? `${riskScore}/100` : "—"} sub={riskLevel}/></div>
        <div className="access-note"><b>Public access limits</b><span>✓ General marine conditions · ✓ Basic safety information · ✓ Map · ✕ No verified fisherman status · ✕ No protected/private fishing information · ✕ No claim of registration verification</span></div>
      </section>;

      if (roleId === "boat-operator") return <section className="role-output boat-output">
        <div className={`role-output-hero ${tone}`}><div><span className="decision-kicker">VESSEL OPERATIONS</span><h2>Route & operating assessment</h2><p>{guidance}</p><small>{rec}</small></div><div className="risk-circle"><strong>{riskScore !== null ? riskScore : "—"}</strong><span>RISK / 100</span></div></div>
        <div className="metric-grid role-metric-grid"><Metric icon="⛽" label="One-way range" value={`${oneWayRange.toFixed(1)} km`} sub={`${endurance.toFixed(1)} h endurance`}/><Metric icon="🌊" label="Wave" value={ocean?.wave_height != null ? `${ocean.wave_height} m` : "—"} sub="Operating condition"/><Metric icon="🌀" label="Current" value={ocean?.current_speed != null ? `${ocean.current_speed} m/s` : "—"} sub="Operating condition"/><Metric icon="🌬" label="Wind" value={weather?.wind_speed != null ? `${weather.wind_speed} km/h` : "—"} sub="Operating condition"/></div>
        <div className="role-callout"><b>Vessel feasibility</b><span>Open Marine Map to compare live-condition planning corridors and round-trip fuel feasibility. ORCA does not certify navigation safety.</span></div>
      </section>;

      if (roleId === "authority") return <section className="role-output authority-output">
        <div className={`role-output-hero ${tone}`}><div><span className="decision-kicker">COASTAL AUTHORITY</span><h2>Regional situational awareness</h2><p>{guidance}</p><small>{rec}</small></div><div className="risk-circle"><strong>{riskScore !== null ? riskScore : "—"}</strong><span>RISK / 100</span></div></div>
        <div className="authority-grid"><div><b>Risk area</b><strong>{riskScore !== null ? `${riskScore}/100` : "No data"}</strong><small>Selected region / hour</small></div><div><b>GIS restriction</b><strong>{restricted ? "HIT" : "NOT CLAIMED"}</strong><small>Authoritative layer required</small></div><div><b>Watcher</b><strong>{watcherOn ? "MONITORING" : "OFF"}</strong><small>Open Alerts for live status</small></div><div><b>Weather alert context</b><strong>{weather?.weather_code != null && Number(weather.weather_code) >= 95 ? "THUNDERSTORM" : "NO EVENT DETECTED"}</strong><small>Based on returned weather code</small></div></div>
        <div className="role-callout"><b>Evidence-led monitoring</b><span>ORCA only claims hazards supported by connected data. Official tsunami/cyclone warnings and government restriction clearance remain unavailable until authoritative feeds are connected.</span></div>
      </section>;

      return <>{shared}</>;
    }

    const focus = {
      fisherman: { kicker: "FISHING INTELLIGENCE", title: verified ? "Verified fisherman workspace" : "Public fisherman workspace", text: verified ? "Extended fishing decision-support using live marine, satellite/PFZ and vessel context." : "Useful public marine conditions without claiming fisherman identity verification.", cards: verified ? [["🎣","Fishing decision","Best/avoid windows and marine risk"],["🛰","PFZ & satellite","Official PFZ source and real satellite observations when available"],["⛽","Vessel readiness","Fuel, endurance and range estimates"]] : [["🌦","Marine conditions","Live weather, wind, waves and currents"],["⚠","Public risk","Deterministic marine risk from available observations"],["⌖","Marine map","Location and spatial context"]] },
      researcher: { kicker: "RESEARCH INTELLIGENCE", title: "Observation workspace", text: "Focus on marine observations, satellite measurements and evidence provenance.", cards: [["🛰","Satellite observations","SST and chlorophyll when a valid recent pixel exists"],["🌀","Ocean observations","Currents, waves, period and marine SST"],["◈","Evidence","Source, observation time and availability"]] },
      "boat-operator": { kicker: "VESSEL OPERATIONS", title: "Operating conditions workspace", text: "Focus on vessel range, route awareness and operating conditions.", cards: [["⛽","Vessel range","Fuel, endurance and estimated one-way range"],["🌊","Operating conditions","Wind, waves and currents"],["⚠","Operational risk","Time-specific marine risk from available data"]] },
      traveler: { kicker: "COASTAL AWARENESS", title: "Public coastal workspace", text: "Simple coastal conditions and public marine awareness.", cards: [["🌦","Coastal weather","Current and forecast weather"],["🌊","Coastal waves","Wave conditions when available"],["⚠","Public awareness","Clear risk context without specialist fishing data"]] },
      environmentalist: { kicker: "ENVIRONMENTAL INTELLIGENCE", title: "Marine environment workspace", text: "Focus on satellite and ocean indicators for environmental awareness.", cards: [["🛰","SST & chlorophyll","Real satellite observations when available"],["🌀","Currents","Marine current conditions"],["◈","Evidence","Traceable source information"]] },
      authority: { kicker: "COASTAL AUTHORITY INTELLIGENCE", title: "Regional monitoring workspace", text: "Focus on risk, GIS context, monitoring and evidence.", cards: [["⚠","Risk areas","Marine risk based on available observations"],["🗺","Spatial context","GIS and mapped-zone information"],["✓","Watcher","Monitoring status and source readiness"]] }
    }[roleId || "fisherman"];

    return <div className="dashboard-view">
      <div className="page-heading"><div><div className="eyebrow">{(focus?.kicker || roleInfo.title).toUpperCase()}</div><h1>{focus?.title || roleInfo.title}</h1><p>{focus?.text || roleInfo.subtitle}</p></div><button className="primary-btn" onClick={() => { setWhatIfResult(null); setError(""); setQuestion(""); setScreen("ask"); }}>＋ NEW QUERY</button></div>
      {!result ? <div className="empty-dashboard"><div className="empty-icon">✦</div><h2>Ask ORCA to start an assessment</h2><p>{focus?.text || "Your next marine assessment will appear here."}</p><div className="role-focus-grid">{(focus?.cards || []).map(([icon,title,desc]) => <div className="role-focus-card" key={title}><span>{icon}</span><b>{title}</b><small>{desc}</small></div>)}</div><button className="primary-btn" onClick={() => { setQuestion(suggestionFor(roleId)); setScreen("ask"); }}>ASK ORCA →</button></div> : <>
        {renderRoleWorkspace()}
        <div className="role-focus-grid compact">{(focus?.cards || []).map(([icon,title,desc]) => <div className="role-focus-card" key={title}><span>{icon}</span><b>{title}</b><small>{desc}</small></div>)}</div>
        {roleId === "fisherman" && verified && <FishingIntelligence />}
        <div className="quick-grid quick-actions-grid">
          <button className="quick-action evidence-action" onClick={() => nav("evidence")}><span>◈</span><b>Evidence</b><small>{roleId === "researcher" ? "Source provenance and observations" : "See exactly what ORCA used"}</small><em>OPEN →</em></button>
          <button className="quick-action map-action" onClick={() => nav("map")}><span>⌖</span><b>Marine Map</b><small>{roleId === "authority" ? "Regional risk and spatial context" : roleId === "boat-operator" ? "Routes and operating conditions" : "Location and spatial context"}</small><em>OPEN →</em></button>
          {vesselRequired && <button className="quick-action whatif-action" onClick={() => nav("whatif")}><span>◇</span><b>What-If</b><small>Try another time or condition</small><em>TRY →</em></button>}
          {(effectiveRole === "fisherman" || effectiveRole === "boat-operator" || effectiveRole === "authority") && <button className="quick-action alerts-action" onClick={() => nav("alerts")}><span>⚠</span><b>Alerts</b><small>{watcherOn ? "Monitoring active" : "Monitoring off"}</small><em>VIEW →</em></button>}
        </div>
        <div className="trust-strip"><b>DATA QUALITY</b><span className={dataQuality === "live" ? "good" : "warn"}>{dataQuality.toUpperCase()}</span><span>Weather: {weather?.source || "—"}</span><span>Ocean: {ocean?.source || "—"}</span><span>PFZ: {result?.fishing_zone?.status || "not checked"}</span></div>
      </>}
    </div>;
  }

  function FishingIntelligence() {
    if (fishingIntelLoading) return <section className="panel-section"><PanelHeader kicker="FISHING OPPORTUNITY INTELLIGENCE" title="Analysing live PFZ + satellite + marine evidence…" /><div className="loading-line">ORCA is checking operational PFZ evidence, satellite indicators and hourly sea conditions.</div></section>;
    if (!fishingIntel) return null;
    const current = fishingIntel.current || {};
    const best = fishingIntel.hourly?.filter(r => r.score != null).sort((a,b) => Number(a.score) - Number(b.score))[0];
    return <section className="panel-section fishing-intel-panel">
      <PanelHeader kicker="FISHING OPPORTUNITY INTELLIGENCE" title="Where and when does the evidence look more promising?" />
      <p className="muted">ORCA uses the operational PFZ signal when available, plus live satellite SST/chlorophyll and hourly marine conditions. It does <b>not</b> claim a fish count or guarantee a catch from satellite data alone.</p>
      <div className="metric-grid role-metric-grid"><Metric icon="🟣" label="PFZ signal" value={current.pfz_available ? "AVAILABLE" : "NOT AVAILABLE"} sub="INCOIS operational advisory when returned"/><Metric icon="🌡" label="Satellite SST" value={current.sst != null ? `${current.sst} °C` : "—"} sub="Recent satellite observation"/><Metric icon="🟢" label="Chlorophyll" value={current.chlorophyll != null ? `${current.chlorophyll}` : "—"} sub="Recent satellite observation"/><Metric icon="⏱" label="Best marine window" value={best ? prettyTime(`${String(best.hour).padStart(2,"0")}:00`) : "—"} sub={best ? `Lowest live stress score: ${best.score}/100` : "No valid hourly window"}/></div>
      <div className="fishing-signal-card"><div><b>🎯 Fishing-area evidence</b><small>{(fishingIntel as any).pfz_coordinate_available ? "An authoritative PFZ location was returned and can be plotted." : "No authoritative PFZ coordinate was returned by the current machine-readable connector. ORCA will not invent a fish hotspot."}</small></div><div><b>📅 Season / historical intelligence</b><small>{fishingIntel.seasonal?.message || "CMFRI historical fisheries source is connected; species/zone seasonality must come from the published series."}</small></div><div><b>🗺 Official PFZ WebGIS</b><small><a href="https://www.incois.gov.in/MarineFisheries/PfzWebGis" target="_blank" rel="noreferrer">Open INCOIS PFZ WebGIS</a></small></div></div>
    </section>;
  }

  function MapView() {
    const nearest = result?.fishing_zone?.nearest_pfz;
    const pfz = nearest && Number.isFinite(Number(nearest.latitude)) && Number.isFinite(Number(nearest.longitude))
      ? { latitude: Number(nearest.latitude), longitude: Number(nearest.longitude), label: nearest.name || nearest.label }
      : null;
    const routes = routeAnalysis?.routes || [];
    const preferred = routeAnalysis?.preferred_route;
    return <div className="panel-page">
      <PanelHeader kicker="GIS / ROUTE INTELLIGENCE" title="Marine risk & route map" />
      <p className="muted">ORCA checks the trip from your departure point to the selected target (or a real PFZ coordinate when one is returned). Route colours represent modelled live-condition risk; fuel checks show whether the trip fits your supplied usable fuel.</p>
      <div className="map-wrap"><MarineMap latitude={routeTarget.latitude} longitude={routeTarget.longitude} locationName={routeTarget.label} risk={riskScore} isMarine={marineAvailable} rangeKm={vesselRequired ? oneWayRange : null} pfz={pfz} restricted={restricted} origin={vesselRequired ? departure : null} routes={routes} preferredRoute={preferred} /></div>
      {vesselRequired && <div className="route-panel">
        <div className="route-panel-head"><div><span className="eyebrow">ROUTE AGENT</span><h3>Can this vessel complete the trip?</h3><p>{routeLoading ? "Sampling live weather and marine conditions along alternative corridors…" : routeAnalysis?.message || "Live route analysis will appear here."}</p>{routeAnalysis?.agents?.length ? <small className="route-agents">Agents: {routeAnalysis.agents.join(" → ")}</small> : null}</div><div className="route-target"><span>DESTINATION</span><b>{routeTarget.label}</b><small>{routeTarget.latitude.toFixed(4)}, {routeTarget.longitude.toFixed(4)}</small></div></div>
        <div className="route-options">{routes.map((r: any) => <div className={`route-option ${String(r.recommendation).toLowerCase()}`} key={r.name}><div><b>{r.name}</b><small>{r.recommendation === "PREFERRED" ? "ORCA preferred planning corridor" : r.recommendation.replaceAll("_", " ")}</small></div><div className="route-stat"><span>{r.distance_km?.toFixed?.(1) ?? "—"} km</span><small>distance</small></div><div className="route-stat"><span>{r.travel_time_hours?.toFixed?.(1) ?? "—"} h</span><small>travel</small></div><div className="route-stat"><span>{r.round_trip_fuel_needed_l?.toFixed?.(1) ?? "—"} L</span><small>round-trip fuel</small></div><div className="route-stat"><span>{r.round_trip_time_hours?.toFixed?.(1) ?? "—"} h</span><small>round-trip time</small></div><div className="route-stat"><span>{r.max_risk != null ? `${r.max_risk}/100` : "—"}</span><small>max risk</small></div><div className="route-badge">{r.fuel_feasible ? "FUEL OK" : "OUT OF RANGE"}</div></div>)}</div>
        <div className="route-legend"><span><i className="route-dot low" />LOW</span><span><i className="route-dot moderate" />MODERATE</span><span><i className="route-dot high" />HIGH</span><span><i className="route-dot severe" />SEVERE</span><span><i className="route-dot unavailable" />DATA UNAVAILABLE</span></div>
        {routeAnalysis?.unavailable_hazards?.length ? <div className="route-note"><b>Official-source limits:</b> {routeAnalysis.unavailable_hazards.join(", ")}.</div> : null}
      </div>}
      <div className="map-facts map-facts-extended">
        <Metric icon="🚤" label="Departure" value={vesselRequired ? `${departure.latitude.toFixed(4)}, ${departure.longitude.toFixed(4)}` : "Not applicable"} sub={vesselRequired ? departure.name : "No vessel route requested"} />
        <Metric icon="🎯" label="Target" value={`${routeTarget.latitude.toFixed(4)}, ${routeTarget.longitude.toFixed(4)}`} sub={routeTarget.label} />
        <Metric icon="🎯" label="Fishing-area evidence" value={pfz ? "PFZ AVAILABLE" : "NO COORDINATE"} sub={pfz ? (pfz.label || "Authoritative PFZ location") : "Open official INCOIS PFZ WebGIS for current mapped advisory"} />
        <Metric icon="⚠" label="Risk" value={riskScore != null ? `${riskScore}/100` : "—"} sub={riskLevel} />
        <Metric icon="🛑" label="Restricted zone" value={restricted ? "HIT" : "NOT CLAIMED"} sub={restricted ? result?.restricted_zone?.zone || "Connected GIS reported a hit" : "No authoritative restriction hit is claimed"} />
      </div>
    </div>;
  }

  function EvidenceView() {
    const sat = result?.satellite?.satellite_observations || result?.satellite_observations || result?.fishing_zone?.satellite_observations || {};
    const pfz = result?.fishing_zone || result?.pfz || {};
    const gis = result?.gis || {};
    const riskAssessment = result?.marine_conditions?.risk_assessment || {};
    const overallQuality = result?.marine_conditions?.data_quality?.overall || dataQuality;

    const fmtTime = (value: unknown) => {
      if (!value) return "Time unavailable";
      const text = String(value);
      return text.length >= 16 ? text.replace("T", " ").slice(0, 16) : text;
    };
    const availability = (status: unknown, fallback = "unavailable") => String(status || fallback).toLowerCase();
    const statusClass = (status: string) => ["available", "clear", "low", "medium", "high"].includes(status) ? "ok" : "neutral";

    const weatherTime = weather?.observation_time || weather?.timestamp || weather?.time;
    const oceanTime = ocean?.observation_time || ocean?.timestamp || ocean?.time;
    const sst = sat?.sst || {};
    const chl = sat?.chlorophyll || {};
    const satelliteStatus = availability(sat?.status, sat?.available ? "available" : "unavailable");
    const pfzStatus = availability(pfz?.status, pfz?.available ? "available" : "unavailable");
    const gisStatus = availability(gis?.status, restricted ? "restricted" : "available");
    const riskStatus = availability(riskAssessment?.risk_level || result?.risk_level, "unavailable");

    const rows = [
      {
        icon: "🌦", name: "Weather Agent", source: weather?.source || "Open-Meteo Weather",
        status: availability(weather?.status, weather?.available ? "available" : "unavailable"),
        time: fmtTime(weatherTime),
        detail: `Wind ${weather?.wind_speed ?? "—"} ${weather?.wind_speed != null ? "km/h" : ""} · Rain ${weather?.precipitation ?? "—"} mm · ${displayValue(weather?.condition, "Condition unavailable")}`,
      },
      {
        icon: "🌊", name: "Ocean Agent", source: ocean?.source || "Open-Meteo Marine",
        status: availability(ocean?.status, ocean?.available ? "available" : "unavailable"),
        time: fmtTime(oceanTime),
        detail: `Wave ${ocean?.wave_height ?? "—"} m · Period ${ocean?.wave_period ?? "—"} s · Current ${ocean?.current_speed ?? "—"} m/s · SST ${ocean?.sst ?? "—"} °C`,
      },
      {
        icon: "🛰", name: "Satellite SST", source: sst?.source || sat?.source || "NOAA CoastWatch",
        status: availability(sst?.status, sst?.available ? "available" : satelliteStatus),
        time: fmtTime(sst?.observation_time),
        detail: sst?.value != null ? `${sst.value} ${sst.unit || "°C"} · Observation age ${sst.age_days ?? "—"} day(s)` : "No valid recent satellite pixel returned for this location.",
      },
      {
        icon: "🟢", name: "Satellite Chlorophyll", source: chl?.source || sat?.source || "NOAA CoastWatch",
        status: availability(chl?.status, chl?.available ? "available" : satelliteStatus),
        time: fmtTime(chl?.observation_time),
        detail: chl?.value != null ? `${chl.value} ${chl.unit || "mg/m³"} · Observation age ${chl.age_days ?? "—"} day(s)` : "No valid recent chlorophyll pixel returned for this location.",
      },
      {
        icon: "🎣", name: "PFZ Advisory", source: pfz?.source || "INCOIS PFZ WebGIS / Advisory",
        status: pfzStatus,
        time: fmtTime(pfz?.observation_time || pfz?.timestamp),
        detail: pfz?.available ? displayValue(pfz?.message || pfz?.status, "PFZ information available") : "No authoritative PFZ coordinate is claimed without a matching operational advisory.",
      },
      {
        icon: "🗺", name: "GIS Agent", source: gis?.source || "Bhuvan / NRSC spatial context",
        status: gisStatus,
        time: fmtTime(gis?.observation_time || gis?.timestamp),
        detail: restricted ? displayValue(result?.restricted_zone?.reason, "Restricted area detected") : "Official spatial-source status is shown; ORCA never invents a restriction polygon.",
      },
      {
        icon: "⚙", name: "Deterministic Risk Engine", source: "ORCA model — derived from returned evidence",
        status: riskStatus,
        time: "Selected assessment time",
        detail: `Risk ${riskScore ?? "—"}% · Level ${riskLevel} · Data quality ${overallQuality}`,
      },
    ];

    return <div className="panel-page">
      <PanelHeader kicker="TRACEABLE INTELLIGENCE" title="Evidence used by ORCA" />
      <p className="muted">Every card separates the data source from ORCA's derived decision. Missing live observations stay unavailable — they are never replaced with demo numbers.</p>
      <div className="evidence-chain"><span>Weather</span><b>→</b><span>Ocean</span><b>→</b><span>Satellite / PFZ</span><b>→</b><span>GIS</span><b>→</b><strong>Risk Engine</strong></div>
      <div className="evidence-meta"><span>📍 {location}</span><span>🕐 {date} · {prettyTime(time)}</span><span>Data quality: <b>{overallQuality}</b></span></div>
      <div className="evidence-list">{rows.map(i => <div className="evidence-row evidence-row-rich" key={i.name}>
        <span className="evidence-icon">{i.icon}</span>
        <div><b>{i.name}</b><small>{i.source}</small><p>{i.detail}</p><em>Observation / source time: {i.time}</em></div>
        <span className={`source-status ${statusClass(i.status)}`}>{i.status}</span>
      </div>)}</div>
      <div className="evidence-footnote"><b>Important:</b> ORCA's risk percentage is a deterministic model output based on available marine conditions. It is not an official maritime safety clearance or government warning.</div>
    </div>;
  }

  function AlertsView() {
    const liveRisk = watcherData?.risk_score != null ? Number(watcherData.risk_score) : riskScore;
    const watchStatus = watcherData?.watcher || (liveRisk == null ? "DATA NEEDED" : liveRisk > 70 ? "ALERT" : liveRisk > 50 ? "WATCH" : "SAFE");
    const sourceReady = watcherData?.status === "available";
    const alert = watchStatus === "ALERT";
    return <div className="panel-page">
      <PanelHeader kicker="ORCA MONITOR" title="Live trip monitoring + official alerts" />
      <div className={`watcher-main ${alert ? "alert" : ""}`}>
        <div><span className="watcher-dot" /><b>{watcherOn ? "Trip monitoring is ON" : "Trip monitoring is PAUSED"}</b>
          <p>{watcherLoading ? "Checking the selected location and time against live weather and marine sources…" : watcherOn ? (watcherData?.message || "ORCA is checking the same evidence used by the assessment.") : "Monitoring is paused."}</p>
        </div><div className="watch-status"><span>CURRENT STATUS</span><strong>{watcherOn ? watchStatus : "PAUSED"}</strong></div>
      </div>
      <div className="watch-grid">
        <WatchItem ok={sourceReady && watcherData?.sources?.[0]?.available === true} text="Live weather source available" />
        <WatchItem ok={sourceReady && watcherData?.sources?.[1]?.available === true} text="Live ocean source available" />
        <WatchItem ok={sourceReady && watcherData?.risk_score != null} text="Current-hour risk calculated" />
        <WatchItem ok={officialAlerts?.status === "available"} text="Official INCOIS / IMD alert sources connected" />
      </div>
      <section className="panel-section">
        <PanelHeader kicker="OFFICIAL SOURCES" title="Government alert evidence" />
        <p className="muted">ORCA reads official alert portals and reports their status. It never turns a reachable webpage into a fake warning.</p>
        <div className="evidence-list">{(officialAlerts?.sources || []).map((a: any) => <div className="evidence-row evidence-row-rich" key={a.name}><span className="evidence-icon">⚠</span><div><b>{a.name}</b><small>{a.source_url || "Official source"}</small><p>{a.details || "Official source connected."}</p></div><span className={`source-status ${a.status === "clear" || a.status === "source_reachable" ? "ok" : "neutral"}`}>{String(a.status || "UNAVAILABLE").toUpperCase()}</span></div>)}</div>
      </section>
      <div className="watch-actions"><button className="secondary-btn" onClick={() => setWatcherOn(v => !v)}>{watcherOn ? "PAUSE MONITORING" : "TURN ON MONITORING"}</button><button className="secondary-btn" onClick={() => { setActiveView("whatif"); }}>WHAT-IF →</button></div>
    </div>;
  }

  function WhatIfView() {
    const rawRecommendation = whatIfResult?.recommendation ?? whatIfResult?.orca_recommendation?.recommendation;
    const recommendation = displayValue(rawRecommendation, "");
    const rawDecision = whatIfResult?.final_decision ?? whatIfResult?.decision ?? whatIfResult?.orca_recommendation?.decision;
    const hasAnswer = Boolean(recommendation && !/no recommendation available|insufficient data|data unavailable/i.test(recommendation));
    const baseDecision = hasAnswer ? displayDecision(rawDecision) : "available";
    const rawRisk = whatIfResult?.risk_score ?? whatIfResult?.orca_recommendation?.marine_risk_score;
    const wfRisk = rawRisk != null && Number.isFinite(Number(rawRisk)) ? Number(rawRisk) : null;
    const weather = (whatIfResult?.weather || {}) as Record<string, any>;
    const ocean = (whatIfResult?.ocean || {}) as Record<string, any>;
    const factors = Array.isArray(whatIfResult?.factors) ? whatIfResult.factors : [];
    return <div className="panel-page"><PanelHeader kicker="DIGITAL TWIN / WHAT-IF" title="Change the departure time" /><p className="muted">Each selection checks the exact requested hour using live Open-Meteo weather and marine forecast data. The percentage is a deterministic ORCA model estimate, not an official safety clearance.</p><div className="whatif-times">{["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"].map(t => <button key={t} disabled={whatIfLoading} className={time === t ? "selected" : ""} onClick={() => { setTime(t); runWhatIf(t); }}>{prettyTime(t)}</button>)}</div>{whatIfLoading && <div className="loading-line">Checking the exact selected hour…</div>}{whatIfResult && <><div className={`whatif-result ${hasAnswer ? riskTone(String(whatIfResult.risk_level || "")) : "safe"}`}><div><span>SELECTED HOUR · {prettyTime(time)}</span><strong>{baseDecision}</strong><p>{hasAnswer ? recommendation : "No recommendation available."}</p></div><div className="mini-risk">{hasAnswer && wfRisk !== null ? Math.round(wfRisk) : "—"}<small>MODEL RISK / 100</small></div></div><div className="whatif-data-grid"><div className="whatif-data-card"><span>WIND</span><strong>{weather.wind_speed ?? "—"}</strong><small>km/h · exact hour</small></div><div className="whatif-data-card"><span>WAVE HEIGHT</span><strong>{ocean.wave_height ?? "—"}</strong><small>m · exact hour</small></div><div className="whatif-data-card"><span>WAVE PERIOD</span><strong>{ocean.wave_period ?? "—"}</strong><small>s · exact hour</small></div><div className="whatif-data-card"><span>OCEAN CURRENT</span><strong>{ocean.ocean_current_velocity ?? "—"}</strong><small>km/h · exact hour</small></div><div className="whatif-data-card"><span>RAIN</span><strong>{weather.precipitation ?? "—"}</strong><small>mm · exact hour</small></div><div className="whatif-data-card"><span>SEA SURFACE TEMP.</span><strong>{ocean.sea_surface_temperature ?? "—"}</strong><small>°C · exact hour</small></div></div>{factors.length > 0 && <div className="whatif-factor-card"><b>Risk factors used</b><div>{factors.map((f: any) => <span key={f.name}>{f.name}: {f.value} {f.unit} · +{f.contribution}</span>)}</div></div>}{whatIfResult.message && <div className="source-note">{whatIfResult.message}</div>}</>}</div>; }

  function HistoryView() {
    return <div className="panel-page"><PanelHeader kicker="QUERY HISTORY" title="Your recent ORCA assessments" /><p className="muted">Saved locally in this browser. History contains your submitted questions and the results returned by ORCA; it does not create official records.</p>{history.length === 0 ? <div className="empty-dashboard"><div className="empty-icon">◷</div><h2>No assessments yet</h2><p>Your completed ORCA queries will appear here.</p><button className="primary-btn" onClick={() => { setScreen("ask"); setActiveView("dashboard"); }}>ASK ORCA →</button></div> : <div className="history-list">{history.map(item => <button className="history-row" key={item.id} onClick={() => { setQuestion(item.question); setLocation(item.location); setDate(item.date); setTime(item.time); setActiveView("dashboard"); }}><div><b>{item.question}</b><small>{item.location} · {item.date} · {prettyTime(item.time)}</small></div><span>{item.risk !== null ? `${item.risk}/100` : "—"}<small>{item.decision}</small></span></button>)}</div>}</div>; }

  function ProfileView() {
    return <div className="panel-page">
      <PanelHeader kicker="PROFILE" title="Stakeholder & vessel profile" />
      <div className="profile-grid">
        <div className="profile-card profile-main"><span className="profile-icon">{role?.icon}</span><b>{role?.title || "Stakeholder"}</b><small>{verified ? "DEMO VERIFIED — NOT GOVERNMENT VERIFIED" : "Public / standard access"}</small><div className="profile-details"><span>Language <b>{languageInfo?.native || "English"}</b></span><span>Default location <b>{location}</b></span><span>Voice output <b>{"speechSynthesis" in window ? "Available" : "Unavailable"}</b></span></div></div>
        {vesselRequired && <div className="profile-card"><span className="profile-icon">🚤</span><b>{vessel.type}</b><small>{vessel.size} vessel</small><div className="profile-details"><span>Fuel capacity <b>{vessel.fuelCapacity} L</b></span><span>Current fuel <b>{vessel.currentFuel} L</b></span><span>Consumption <b>{vessel.consumption} L/h</b></span><span>Cruising speed <b>{vessel.speed} km/h</b></span><span>Reserve <b>{vessel.reserve}%</b></span></div></div>}
      </div>
      {vesselRequired && <><div className="range-preview"><div><span>Usable fuel</span><strong>{usableFuel.toFixed(1)} L</strong></div><div><span>Endurance</span><strong>{endurance.toFixed(1)} h</strong></div><div><span>Estimated one-way range</span><strong>{oneWayRange.toFixed(1)} km</strong></div></div><div className="route-purpose"><b>Why ORCA asks for fuel + speed</b><span>After you choose the fishing/assessment target, ORCA compares the trip distance, travel time and fuel required against your usable fuel, then checks live weather and ocean conditions along alternative planning corridors.</span></div><p className="profile-disclaimer">Planning estimate only — not a certified vessel assessment.</p></>}
      <div className="profile-actions">{vesselRequired && <button className="primary-btn" onClick={() => setScreen("vessel")}>EDIT VESSEL PROFILE</button>}<button className="secondary-btn" onClick={() => nav("language")}>CHANGE LANGUAGE</button></div>
    </div>;
  }

  function LanguageView() {
    return <div className="panel-page language-page">
      <PanelHeader kicker="LANGUAGE" title="ORCA in your language" />
      <p className="muted">Choose the interface language. Voice input and voice output follow the selected language when your browser supports it.</p>
      <div className="language-grid language-grid-fixed" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {LANGUAGES.map(l => {
          const active = language === l.code;
          return <button key={l.code} className={active ? "language-card active" : "language-card"} onClick={() => saveLanguage(l.code as LanguageCode)} style={{ minHeight: 76, display: "grid", gridTemplateColumns: "96px minmax(0,1fr) 28px", alignItems: "center", gap: 12, textAlign: "left", padding: "14px 16px", overflow: "hidden" }}>
            <span className="language-native-fixed" style={{ fontSize: 27, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.native}</span>
            <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              <b style={{ fontSize: 15, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</b>
              <small style={{ fontSize: 10, lineHeight: 1.2, opacity: .65 }}>Interface + voice locale</small>
            </span>
            <strong style={{ color: "#39e7c4", fontSize: 22, textAlign: "center" }}>{active ? "✓" : ""}</strong>
          </button>;
        })}
      </div>
    </div>;
  }

}

function SetupHeader({ step, title, onBack }: { step: string; title: string; onBack: () => void }) { return <header className="setup-header"><button className="text-btn" onClick={onBack}>← Back</button><div><span>STEP {step}</span><b>{title}</b></div><div className="setup-brand"><OrcaDolphinLogo small /><span>ORCA</span></div></header>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) { return <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}><span>{icon}</span>{label}</button>; }
function Metric({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) { return <div className="metric-card"><span className="metric-icon">{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{sub || ""}</small></div></div>; }
function FlowNode({ icon, title, status }: { icon: string; title: string; status: string }) { return <div className="flow-node"><span>{icon}</span><b>{title}</b><small>{status}</small></div>; }
function PanelHeader({ kicker, title }: { kicker: string; title: string }) { return <div className="panel-header"><div><div className="eyebrow">{kicker}</div><h1>{title}</h1></div></div>; }
function WatchItem({ ok, text }: { ok: boolean; text: string }) { return <div className={ok ? "watch-ok" : "watch-review"}><span>{ok ? "✓" : "!"}</span><b>{text}</b></div>; }
function LoadingOrca({ role }: { role: string }) { return <div className="fullscreen loading-screen"><div className="loader-orb dolphin-loader-orb"><OrcaDolphinLogo /></div><div className="eyebrow">ORCA INTELLIGENCE</div><h1>Building your <span>{role.toLowerCase()}</span> assessment…</h1><div className="agent-steps"><span>✓ Weather</span><span>✓ Ocean</span><span>✓ Satellite / PFZ</span><span>✓ GIS</span><span>✓ Risk Engine</span></div><small>Using live sources when available. ORCA does not invent unavailable marine data.</small></div>; }
function suggestionsFor(role: RoleId | null) {
  if (role === "fisherman") return [
    "Can I go fishing near Paradip tomorrow at 6 AM?",
    "Where is the nearest PFZ?",
    "What is the best fishing time tomorrow?",
    "Which season is historically better for fishing here?",
    "Can my boat reach that fishing area and return?",
    "What are the marine conditions right now?",
  ];
  if (role === "researcher") return [
    "What are the SST and current conditions?",
    "Show the satellite evidence for this location.",
    "How do the ocean conditions compare by time?",
    "What marine observations are available?",
    "What environmental change is visible here?",
    "Show the provenance of the observations.",
  ];
  if (role === "boat-operator") return [
    "Can my vessel complete this trip and return?",
    "Which route corridor has lower operating risk?",
    "What are the wave and wind conditions?",
    "What time is better for this trip?",
    "How much usable range does my boat have?",
    "Are there official marine warnings?",
  ];
  if (role === "traveler") return [
    "Is it safe to visit this coast today?",
    "What will the sea conditions be when I visit?",
    "Is tomorrow a good time for a coastal trip?",
    "Will strong waves or rain affect my trip?",
    "What time would be better for visiting?",
    "Are there any current coastal hazards?",
  ];
  if (role === "environmentalist") return [
    "What is the current SST here?",
    "Where are the areas with higher chlorophyll?",
    "How are ocean conditions changing?",
    "Are there environmental anomalies here?",
    "What satellite evidence is available?",
    "How do current conditions compare with recent observations?",
  ];
  if (role === "authority") return [
    "Which coastal areas are currently high risk?",
    "Are there any authoritative restricted-zone concerns?",
    "What conditions should be monitored today?",
    "Which areas need attention based on current evidence?",
    "Are official tsunami, cyclone or high-wave alerts active?",
    "Show the evidence behind this risk assessment.",
  ];
  return ["What are the marine conditions?", "Is the weather safe?", "Are there any public marine warnings?"];
}
function suggestionFor(role: RoleId | null) { return suggestionsFor(role)[0]; }
