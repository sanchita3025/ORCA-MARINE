export type OrcaQuery = {
  question: string;
  latitude: number;
  longitude: number;
  datetime: string;
  locationName: string;
};

export type OrcaResponse = {
  status: string;
  message?: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  requested_datetime: string;
  marine_conditions: {
    status?: string;
    weather?: {
      temperature?: number;
      wind_speed?: number;
      wind_direction?: number;
      precipitation?: number;
      condition?: string;
    };
    ocean?: {
      wave_height?: number;
      wave_period?: number;
      current_speed?: number;
      sst?: number;
    };
    data_quality?: unknown;
    summary?: unknown;
    risk_assessment?: {
      risk_level?: string;
      risk_score?: number;
      risk_factors?: string[];
      recommendation?: string;
      message?: string;
    };
    marine_advice?: unknown;
    final_decision?: unknown;
  };
  fishing_zone?: {
    status?: string;
    message?: string;
    nearest_pfz?: {
      date?: string;
      latitude?: number;
      longitude?: number;
      suitability?: number;
      suitability_level?: string;
      distance_km?: number;
    } | null;
    nearest_known_hotspot_distance_km?: number;
  };
  restricted_zone?: {
    restricted?: boolean;
    zone_name?: string;
    zone?: string;
    status?: string;
    reason?: string | null;
  };
  orca_recommendation?: {
    decision?: string;
    severity?: string;
    marine_risk?: string;
    marine_risk_score?: number;
    fishing_zone_status?: string;
    pfz_suitability?: number | null;
    pfz_suitability_level?: string;
    pfz_distance_km?: number | null;
    restricted_zone_status?: string;
    recommendation?: string;
  };
};

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

function convert24HourTo12Hour(time24: string): string {
  const [hourText, minute] = time24.split(":");
  const hour24 = Number(hourText);

  if (
    !Number.isInteger(hour24) ||
    hour24 < 0 ||
    hour24 > 23 ||
    !/^\d{2}$/.test(minute ?? "")
  ) {
    throw new Error("Invalid time. Expected HH:MM in 24-hour format.");
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${minute} ${period}`;
}

export async function askOrca(data: OrcaQuery): Promise<OrcaResponse> {
  const [date, time24] = data.datetime.split("T");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !time24) {
    throw new Error(
      "Invalid datetime. Expected YYYY-MM-DDTHH:MM."
    );
  }

  const time = convert24HourTo12Hour(time24);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/orca-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: data.locationName,
        date,
        time,
        latitude: data.latitude,
        longitude: data.longitude,
      }),
      signal: controller.signal,
    });

    let result: unknown = null;
    try {
      result = await response.json();
    } catch {
      // Backend did not return JSON.
    }

    if (!response.ok) {
      const message =
        typeof result === "object" &&
        result !== null &&
        "message" in result
          ? String((result as { message?: unknown }).message ?? `Backend returned ${response.status}`)
          : `Backend returned ${response.status}`;

      throw new Error(message);
    }

    if (typeof result !== "object" || result === null) {
      throw new Error("Backend returned an invalid response.");
    }

    return result as OrcaResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("ORCA backend request timed out after 30 seconds.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
