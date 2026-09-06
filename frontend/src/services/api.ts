const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

export interface LocationResult {
  name: string;
  display_name: string;
  latitude: number;
  longitude: number;
  type?: string;
  importance?: number;
}

export interface WeatherData {
  available: boolean;
  temperature?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  precipitation?: number | null;
  weather_code?: number | null;
  condition?: string | null;
  timestamp?: string | null;
  source?: string;
  error?: string | null;
}

export interface OceanData {
  available: boolean;
  wave_height?: number | null;
  wave_period?: number | null;
  current_speed?: number | null;
  current_direction?: number | null;
  sst?: number | null;
  timestamp?: string | null;
  source?: string;
  error?: string | null;
}

export interface RiskFactor {
  name: string;
  value?: number | string | null;
  contribution?: number | null;
  status?: string;
  explanation?: string;
}

export interface EvidenceItem {
  agent: string;
  source: string;
  status: string;
  available?: boolean;
  details?: string;
}

export interface OrcaAnalysis {
  success?: boolean;
  query_understanding?: {
    intent?: string;
    intents?: string[];
    requested_information?: string[];
    method?: string;
  };
  question_answer?: {
    intent?: string;
    direct_answer?: string;
    answer_summary?: string;
    priority?: string[];
    best_window?: any;
  };
  available?: boolean;

  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
    is_marine?: boolean;
    distance_to_coast_km?: number | null;
  };

  weather?: WeatherData;
  ocean?: OceanData;

  satellite?: {
    available?: boolean;
    suitability?: string | number | null;
    source?: string;
    details?: string;
    status?: string;
    message?: string;
    satellite_observations?: {
      status?: string;
      available?: boolean;
      source?: string;
      message?: string;
      sst?: { value?: number | null; unit?: string; status?: string; available?: boolean; observation_time?: string; age_days?: number; };
      chlorophyll?: { value?: number | null; unit?: string; status?: string; available?: boolean; observation_time?: string; age_days?: number; };
    };
  };

  pfz?: {
    available?: boolean;
    suitability?: string | number | null;
    source?: string;
    details?: string;
  };

  gis?: {
    available?: boolean;
    restricted?: boolean;
    distance_to_coast_km?: number | null;
    details?: string;
  };

  risk_score?: number | null;
  normalized_risk?: number | null;
  risk_level?: string;
  recommendation?: string;
  final_decision?: string;
  decision?: string;
  orca_recommendation?: {
    decision?: string;
    recommendation?: string;
    marine_risk_score?: number | null;
    marine_risk?: string;
  };

  factors?: RiskFactor[];
  evidence?: EvidenceItem[];

  reasoning?: string;
  explanation?: string;
  disclaimer?: string;

  timestamp?: string;
  error?: string;
}

export interface OutlookRow {
  time: string;
  hour?: number;
  wind_speed?: number | null;
  precipitation?: number | null;
  weather_code?: number | null;
  condition?: string | null;
  wave_height?: number | null;
  wave_period?: number | null;
  current_speed?: number | null;
  risk_score?: number | null;
  normalized_risk?: number | null;
  status?: "BETTER" | "CAUTION" | "AVOID" | string;
}

export interface OutlookResponse {
  available: boolean;
  rows: OutlookRow[];
  best_window?: {
    start?: string;
    end?: string;
    score?: number;
  } | null;
  avoid_window?: {
    start?: string;
    end?: string;
    score?: number;
  } | null;
  source?: string;
  error?: string | null;
}


export interface OfficialAlertSource { name: string; status: string; alert?: string | null; source_url?: string; details?: string; }
export interface OfficialAlertsResponse { status: string; latitude?: number | null; longitude?: number | null; sources: OfficialAlertSource[]; message?: string; }

export interface FishingIntelligenceResponse {
  status: string;
  available: boolean;
  signal?: string;
  explanation?: string;
  current?: { sst?: number|null; chlorophyll?: number|null; pfz_available?: boolean; pfz_coordinate_available?: boolean; observation_time?: string|null };
  pfz_coordinate_available?: boolean;
  fishing_areas?: any[];
  hourly?: Array<{ hour: number; wind_speed?: number|null; wave_height?: number|null; current_speed?: number|null; score?: number|null; status?: string }>;
  seasonal?: { status: string; message: string };
  source?: string;
}
export interface VesselProfile {
  vesselType: string;
  boatSize: number;
  fuelCapacity: number;
  currentFuel: number;
  consumption: number;
  cruisingSpeed: number;
  reserve: number;
}

export interface VesselEstimate {
  usableFuel: number;
  enduranceHours: number;
  maxRangeKm: number;
  oneWayRangeKm: number;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof (data as { detail?: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

/* ---------------- LOCATION ---------------- */

export async function searchLocation(
  query: string
): Promise<LocationResult[]> {
  if (!query.trim()) return [];

  try {
    const data = await request<unknown>(
      `/location/search?q=${encodeURIComponent(query.trim())}`
    );

    if (Array.isArray(data)) {
      return data as LocationResult[];
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "results" in data &&
      Array.isArray((data as { results: unknown }).results)
    ) {
      return (data as { results: LocationResult[] }).results;
    }

    return [];
  } catch {
    return [];
  }
}

export async function reverseLocation(
  latitude: number,
  longitude: number
): Promise<LocationResult | null> {
  try {
    return await request<LocationResult>(
      `/location?latitude=${latitude}&longitude=${longitude}`
    );
  } catch {
    return null;
  }
}

/* ---------------- WEATHER ---------------- */

export async function getWeather(
  latitude: number,
  longitude: number,
  date?: string,
  hour?: number
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  if (date) params.set("date", date);
  if (hour !== undefined) params.set("hour", String(hour));

  try {
    return await request<WeatherData>(`/weather?${params.toString()}`);
  } catch (error) {
    return {
      available: false,
      source: "Open-Meteo Weather",
      error: error instanceof Error ? error.message : "Weather unavailable",
    };
  }
}

/* ---------------- OCEAN ---------------- */

export async function getOcean(
  latitude: number,
  longitude: number,
  date?: string,
  hour?: number
): Promise<OceanData> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  if (date) params.set("date", date);
  if (hour !== undefined) params.set("hour", String(hour));

  try {
    return await request<OceanData>(`/ocean?${params.toString()}`);
  } catch (error) {
    return {
      available: false,
      source: "Open-Meteo Marine",
      error: error instanceof Error ? error.message : "Ocean data unavailable",
    };
  }
}

/* ---------------- ORCA ANALYSIS ---------------- */

export async function runOrcaAnalysis(params: {
  question: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  date: string;
  time: string;
  stakeholder?: string;
  verified?: boolean;
  language?: string;
  vessel?: VesselProfile | null;
}): Promise<OrcaAnalysis> {
  const payload = {
    question: params.question,
    latitude: params.latitude,
    longitude: params.longitude,
    location_name: params.locationName || "Selected Location",
    date: params.date,
    time: params.time,
    stakeholder: params.stakeholder || "fisherman",
    verified: params.verified ?? false,
    language: params.language || "en",
    vessel: params.vessel || null,
  };

  return request<OrcaAnalysis>("/api/orca/query", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* Compatibility alias */
export const analyzeOrca = runOrcaAnalysis;


export interface WhatIfResponse {
  status: string;
  available: boolean;
  requested_datetime?: string;
  risk_score?: number | null;
  risk_level?: string;
  recommendation?: string;
  weather?: Record<string, unknown>;
  ocean?: Record<string, unknown>;
  factors?: Array<{ name: string; value: number; unit: string; contribution: number }>;
  source?: { weather?: string; ocean?: string };
  message?: string;
}

export async function getWhatIf(params: { latitude: number; longitude: number; date: string; time: string }): Promise<WhatIfResponse> {
  const query = new URLSearchParams({
    latitude: String(params.latitude), longitude: String(params.longitude),
    date: params.date, time: params.time,
  });
  return request<WhatIfResponse>(`/what-if?${query.toString()}`);
}


export interface WatcherResponse {
  status: string;
  watcher?: string;
  risk_score?: number | null;
  risk_level?: string;
  message?: string;
  sources?: Array<{ agent: string; source: string; status: string; available?: boolean }>;
}

export async function getWatcher(params: { latitude: number; longitude: number; date: string; time: string }): Promise<WatcherResponse> {
  const query = new URLSearchParams({ latitude: String(params.latitude), longitude: String(params.longitude), date: params.date, time: params.time });
  return request<WatcherResponse>(`/watcher?${query.toString()}`);
}

/* ---------------- OUTLOOK ---------------- */

export async function getFishingOutlook(params: {
  latitude: number;
  longitude: number;
  date: string;
  startHour?: number;
  endHour?: number;
}): Promise<OutlookResponse> {
  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    date: params.date,
    start_hour: String(params.startHour ?? 6),
    end_hour: String(params.endHour ?? 18),
  });

  try {
    return await request<OutlookResponse>(`/outlook?${query.toString()}`);
  } catch (error) {
    return {
      available: false,
      rows: [],
      error:
        error instanceof Error ? error.message : "Outlook unavailable",
    };
  }
}

/* Compatibility alias */
export const getOutlook = getFishingOutlook;

/* ---------------- PFZ ---------------- */

export async function getPFZ(
  latitude: number,
  longitude: number,
  date?: string
) {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  if (date) query.set("date", date);

  try {
    return await request<{
      available: boolean;
      suitability?: string | number | null;
      source?: string;
      details?: string;
      error?: string | null;
    }>(`/pfz?${query.toString()}`);
  } catch (error) {
    return {
      available: false,
      source: "Satellite/PFZ",
      error: error instanceof Error ? error.message : "PFZ unavailable",
    };
  }
}

/* ---------------- WATCHER ---------------- */

export async function getWatcherStatusFromApi(params?: {
  latitude?: number;
  longitude?: number;
  date?: string;
  time?: string;
}) {
  const query = new URLSearchParams();

  if (params?.latitude !== undefined) {
    query.set("latitude", String(params.latitude));
  }

  if (params?.longitude !== undefined) {
    query.set("longitude", String(params.longitude));
  }

  if (params?.date) query.set("date", params.date);
  if (params?.time) query.set("time", params.time);

  try {
    return await request<{
      available: boolean;
      status: "SAFE" | "WATCH" | "ALERT" | "UNKNOWN" | string;
      monitoring?: boolean;
      weather_available?: boolean;
      ocean_available?: boolean;
      risk_level?: string;
      message?: string;
    }>(`/watcher${query.toString() ? `?${query.toString()}` : ""}`);
  } catch (error) {
    return {
      available: false,
      status: "UNKNOWN",
      monitoring: false,
      message:
        error instanceof Error ? error.message : "Watcher unavailable",
    };
  }
}

/* ---------------- VESSEL CALCULATOR ---------------- */

export function calculateVesselEstimate(
  vessel: VesselProfile
): VesselEstimate {
  const currentFuel = Math.max(0, Number(vessel.currentFuel) || 0);
  const reserve = Math.min(
    100,
    Math.max(0, Number(vessel.reserve) || 0)
  );

  const consumption = Math.max(
    0.01,
    Number(vessel.consumption) || 0.01
  );

  const speed = Math.max(
    0,
    Number(vessel.cruisingSpeed) || 0
  );

  const usableFuel = currentFuel * (1 - reserve / 100);
  const enduranceHours = usableFuel / consumption;
  const maxRangeKm = enduranceHours * speed;
  const oneWayRangeKm = maxRangeKm / 2;

  return {
    usableFuel: Number(usableFuel.toFixed(2)),
    enduranceHours: Number(enduranceHours.toFixed(2)),
    maxRangeKm: Number(maxRangeKm.toFixed(2)),
    oneWayRangeKm: Number(oneWayRangeKm.toFixed(2)),
  };
}

/* ---------------- RISK HELPERS ---------------- */

export function normalizeRiskScore(
  score: number | null | undefined
): number | null {
  if (score === null || score === undefined) {
    return null;
  }

  const value = Number(score);

  if (!Number.isFinite(value)) {
    return null;
  }

  // ORCA backend's original deterministic score is 0–12.
  // Convert it to the UI's 0–100 scale.
  if (value <= 12) {
    return Math.round((value / 12) * 100);
  }

  return Math.round(Math.min(100, Math.max(0, value)));
}

export function getRiskLabel(
  score: number | null | undefined
): string {
  const normalized = normalizeRiskScore(score);

  if (normalized === null) return "UNAVAILABLE";
  if (normalized <= 25) return "LOW";
  if (normalized <= 50) return "MODERATE";
  if (normalized <= 70) return "HIGH";
  return "SEVERE";
}

export function getRiskClass(
  score: number | null | undefined
): "low" | "moderate" | "high" | "severe" | "unavailable" {
  const normalized = normalizeRiskScore(score);

  if (normalized === null) return "unavailable";
  if (normalized <= 25) return "low";
  if (normalized <= 50) return "moderate";
  if (normalized <= 70) return "high";
  return "severe";
}

/* ---------------- HEALTH ---------------- */

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);

    if (!response.ok) return false;

    const data = await response.json();

    return data?.status === "ok" || data?.healthy === true;
  } catch {
    return false;
  }
}

export { API_BASE };
/* ---------------- ROUTE + VESSEL SAFETY ANALYSIS ---------------- */

export interface RouteConditionPoint {
  latitude: number;
  longitude: number;
  wind_speed?: number | null;
  wave_height?: number | null;
  wave_period?: number | null;
  current_speed?: number | null;
  sst?: number | null;
  precipitation?: number | null;
  weather_code?: number | null;
  risk_score?: number | null;
  risk_level?: string;
  risk_factors?: Array<{ name: string; value: number; contribution: number }>;
  hazards?: string[];
}

export interface RouteOption {
  name: string;
  distance_km: number;
  travel_time_hours: number | null;
  round_trip_time_hours?: number | null;
  fuel_needed_l: number | null;
  round_trip_fuel_needed_l?: number | null;
  usable_fuel_l: number;
  fuel_feasible: boolean;
  max_risk: number | null;
  average_risk: number | null;
  risk_level: string;
  recommendation: string;
  hazards: string[];
  points: RouteConditionPoint[];
}

export interface RouteAnalysisResponse {
  status: string;
  source?: string;
  requested_datetime?: string;
  origin?: { latitude: number; longitude: number };
  target?: { latitude: number; longitude: number };
  vessel?: { cruising_speed_kmh: number; consumption_lph: number; usable_fuel_l: number };
  routes: RouteOption[];
  preferred_route?: string | null;
  agents?: string[];
  unavailable_hazards?: string[];
  message?: string;
}

export async function getRouteAnalysis(params: {
  originLatitude: number;
  originLongitude: number;
  targetLatitude: number;
  targetLongitude: number;
  date: string;
  time: string;
  cruisingSpeed: number;
  consumptionLph: number;
  usableFuelL: number;
}): Promise<RouteAnalysisResponse> {
  const query = new URLSearchParams({
    origin_latitude: String(params.originLatitude),
    origin_longitude: String(params.originLongitude),
    target_latitude: String(params.targetLatitude),
    target_longitude: String(params.targetLongitude),
    date: params.date,
    time: params.time,
    cruising_speed: String(params.cruisingSpeed),
    consumption_lph: String(params.consumptionLph),
    usable_fuel_l: String(params.usableFuelL),
  });
  return request<RouteAnalysisResponse>(`/route-analysis?${query.toString()}`);
}


export async function getFishingIntelligence(params: { latitude: number; longitude: number; date: string }): Promise<FishingIntelligenceResponse> {
  const q = new URLSearchParams({ latitude: String(params.latitude), longitude: String(params.longitude), date: params.date });
  return request<FishingIntelligenceResponse>(`/fishing-intelligence?${q.toString()}`);
}


export async function getOfficialAlerts(params: { latitude?: number; longitude?: number }): Promise<OfficialAlertsResponse> {
  const q = new URLSearchParams();
  if (params.latitude != null) q.set("latitude", String(params.latitude));
  if (params.longitude != null) q.set("longitude", String(params.longitude));
  return request<OfficialAlertsResponse>(`/official-alerts?${q.toString()}`);
}

export async function getHistoricalFishing(params: { latitude: number; longitude: number }) {
  const q = new URLSearchParams({ latitude: String(params.latitude), longitude: String(params.longitude) });
  return request<any>(`/historical-fishing?${q.toString()}`);
}
