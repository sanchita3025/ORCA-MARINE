# backend/services/reasoning_service.py

from __future__ import annotations

from typing import Any


def _number(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _available(data: Any) -> bool:
    if not isinstance(data, dict):
        return False

    status = str(data.get("status", "")).lower()

    return status in {
        "available",
        "success",
        "ok",
        "live",
    }


def _get(data: dict, *keys: str) -> Any:
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return None


def build_reasoning(
    weather: dict | None = None,
    ocean: dict | None = None,
    satellite: dict | None = None,
    gis: dict | None = None,
    question: str = "",
    role: str = "",
) -> dict:
    """
    Build a transparent explanation from available agent outputs.

    This service does not invent missing observations and does not generate
    numerical risk scores. Numerical risk remains the responsibility of the
    deterministic risk engine.
    """

    weather = weather or {}
    ocean = ocean or {}
    satellite = satellite or {}
    gis = gis or {}

    available_sources = []
    unavailable_sources = []

    source_status = {
        "weather": _available(weather),
        "ocean": _available(ocean),
        "satellite": _available(satellite),
        "gis": _available(gis),
    }

    for name, available in source_status.items():
        if available:
            available_sources.append(name)
        else:
            unavailable_sources.append(name)

    observations: dict[str, Any] = {}

    wind = _get(weather, "wind_speed", "wind_speed_kmh")
    precipitation = _get(weather, "precipitation", "precipitation_mm")
    condition = _get(weather, "condition", "weather_condition")

    wave_height = _get(ocean, "wave_height", "wave_height_m")
    wave_period = _get(ocean, "wave_period", "wave_period_s")
    current_speed = _get(ocean, "current_speed", "current_speed_ms")
    sst = _get(ocean, "sst", "sea_surface_temperature")

    if wind is not None:
        observations["wind_speed"] = wind

    if precipitation is not None:
        observations["precipitation"] = precipitation

    if condition is not None:
        observations["condition"] = condition

    if wave_height is not None:
        observations["wave_height"] = wave_height

    if wave_period is not None:
        observations["wave_period"] = wave_period

    if current_speed is not None:
        observations["current_speed"] = current_speed

    if sst is not None:
        observations["sst"] = sst

    factors: list[str] = []

    wind_value = _number(wind)
    wave_value = _number(wave_height)
    current_value = _number(current_speed)
    precipitation_value = _number(precipitation)

    if wind_value is not None:
        if wind_value > 25:
            factors.append("High wind conditions are present.")
        elif wind_value > 15:
            factors.append("Wind conditions are moderately elevated.")
        else:
            factors.append("Wind conditions are within the configured lower-risk range.")

    if wave_value is not None:
        if wave_value > 2.5:
            factors.append("Wave height is elevated.")
        elif wave_value > 1.5:
            factors.append("Wave height is moderately elevated.")
        else:
            factors.append("Wave height is within the configured lower-risk range.")

    if current_value is not None:
        if current_value > 2:
            factors.append("Ocean current is strong.")
        elif current_value > 1:
            factors.append("Ocean current is moderate.")
        else:
            factors.append("Ocean current is relatively low.")

    if precipitation_value is not None:
        if precipitation_value > 8:
            factors.append("Precipitation is elevated.")
        elif precipitation_value > 2:
            factors.append("Some precipitation is present.")

    condition_text = str(condition or "").lower()

    if "thunder" in condition_text or "storm" in condition_text:
        factors.append("Storm-related weather information is present.")

    if not factors:
        factors.append(
            "There is not enough available marine observation data to describe "
            "specific environmental factors."
        )

    satellite_message = None

    if _available(satellite):
        satellite_message = (
            "Satellite/PFZ information is available and can be considered "
            "alongside the marine observations."
        )
    else:
        satellite_message = (
            "Satellite/PFZ information is not currently available for this analysis."
        )

    gis_message = None

    if _available(gis):
        gis_message = (
            "GIS information is available for spatial and zone-related context."
        )
    else:
        gis_message = (
            "GIS zone information is not currently confirmed for this analysis."
        )

    evidence_quality = "LIMITED"

    if len(available_sources) >= 3:
        evidence_quality = "GOOD"
    elif len(available_sources) >= 2:
        evidence_quality = "PARTIAL"
    elif len(available_sources) == 1:
        evidence_quality = "LIMITED"
    else:
        evidence_quality = "UNAVAILABLE"

    return {
        "question": question,
        "role": role,
        "observations": observations,
        "factors": factors,
        "source_status": source_status,
        "available_sources": available_sources,
        "unavailable_sources": unavailable_sources,
        "satellite_message": satellite_message,
        "gis_message": gis_message,
        "evidence_quality": evidence_quality,
        "method": (
            "ORCA combines available Weather, Ocean, Satellite/PFZ and GIS "
            "evidence. Numerical risk is calculated separately by the "
            "deterministic risk engine."
        ),
        "limitations": [
            "Unavailable data is not replaced with fabricated observations.",
            "The result is decision support, not official maritime navigation or safety guidance.",
        ],
    }


def build_human_summary(reasoning: dict) -> str:
    """
    Create a short UI-friendly explanation from the structured reasoning.
    """

    if not reasoning:
        return "No reasoning information is available."

    quality = reasoning.get("evidence_quality", "UNAVAILABLE")

    factors = reasoning.get("factors") or []

    if quality == "UNAVAILABLE":
        return (
            "Live marine evidence is currently unavailable, so ORCA cannot "
            "make a reliable environmental assessment."
        )

    if not factors:
        return (
            "ORCA has limited environmental evidence and cannot describe "
            "specific marine factors."
        )

    return " ".join(str(factor) for factor in factors[:3])


def get_source_summary(reasoning: dict) -> list[dict]:
    """
    Return source information in a format suitable for the Evidence UI.
    """

    source_status = reasoning.get("source_status", {})

    return [
        {
            "agent": "Weather Agent",
            "source": "Open-Meteo Weather",
            "status": (
                "Available"
                if source_status.get("weather")
                else "Unavailable"
            ),
        },
        {
            "agent": "Ocean Agent",
            "source": "Open-Meteo Marine",
            "status": (
                "Available"
                if source_status.get("ocean")
                else "Unavailable"
            ),
        },
        {
            "agent": "Satellite / PFZ Agent",
            "source": "PFZ / satellite dataset",
            "status": (
                "Available"
                if source_status.get("satellite")
                else "Unavailable"
            ),
        },
        {
            "agent": "GIS Agent",
            "source": "ORCA spatial analysis",
            "status": (
                "Available"
                if source_status.get("gis")
                else "Unavailable"
            ),
        },
        {
            "agent": "Risk Engine",
            "source": "Deterministic ORCA risk model",
            "status": "Used separately",
        },
    ]