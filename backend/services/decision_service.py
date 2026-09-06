# backend/services/decision_service.py

from __future__ import annotations

from typing import Any

from services.marine_service import (
    calculate_risk,
    normalize_risk_score,
    risk_label_from_score,
)


def _number(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _is_available(data: Any) -> bool:
    if not isinstance(data, dict):
        return False

    return str(data.get("status", "")).lower() in {
        "available",
        "success",
        "ok",
        "live",
    }


def _value(data: dict, *keys: str) -> Any:
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return None


def _recommendation_from_risk(
    risk_level: str,
    marine_available: bool,
    is_marine: bool | None,
) -> str:
    if not marine_available:
        return "LIVE MARINE DATA UNAVAILABLE"

    if is_marine is False:
        return "SELECT A MARINE LOCATION"

    if risk_level == "LOW":
        return "CONDITIONS LOOK FAVOURABLE"

    if risk_level == "MEDIUM":
        return "PROCEED WITH CAUTION"

    return "HIGH-RISK CONDITIONS"


def build_decision(
    weather: dict | None = None,
    ocean: dict | None = None,
    satellite: dict | None = None,
    gis: dict | None = None,
    marine_context: dict | None = None,
    role: str = "",
    verified: bool = False,
    vessel: dict | None = None,
) -> dict:
    """
    Build the ORCA decision from real agent observations.

    The LLM is not used to calculate the numerical risk score.
    """

    weather = weather or {}
    ocean = ocean or {}
    satellite = satellite or {}
    gis = gis or {}
    marine_context = marine_context or {}
    vessel = vessel or {}

    weather_available = _is_available(weather)
    ocean_available = _is_available(ocean)

    marine_available = (
        weather_available
        or ocean_available
    )

    is_marine = marine_context.get("is_marine")

    if is_marine is None:
        is_marine = marine_context.get("is_near_indian_coast")

    wind_speed = _number(
        _value(
            weather,
            "wind_speed",
            "wind_speed_kmh",
        )
    )

    wave_height = _number(
        _value(
            ocean,
            "wave_height",
            "wave_height_m",
        )
    )

    precipitation = _number(
        _value(
            weather,
            "precipitation",
            "precipitation_mm",
        )
    )

    current_speed = _number(
        _value(
            ocean,
            "current_speed",
            "current_speed_ms",
        )
    )

    wave_period = _number(
        _value(
            ocean,
            "wave_period",
            "wave_period_s",
        )
    )

    condition = _value(
        weather,
        "condition",
        "weather_condition",
    )

    risk = None

    if marine_available:
        risk = calculate_risk(
            wind_speed=wind_speed,
            wave_height=wave_height,
            precipitation=precipitation,
            current_speed=current_speed,
            wave_period=wave_period,
            condition=condition,
        )

    raw_score = (
        risk.get("score")
        if isinstance(risk, dict)
        else None
    )

    normalized_score = normalize_risk_score(
        raw_score
    )

    risk_level = risk_label_from_score(
        raw_score
    )

    recommendation = _recommendation_from_risk(
        risk_level=risk_level,
        marine_available=marine_available,
        is_marine=is_marine,
    )

    factors = []

    if isinstance(risk, dict):
        factors = list(
            risk.get("factors") or []
        )

    if is_marine is False:
        factors.insert(
            0,
            "The selected coordinate is not confirmed as a marine location.",
        )

    if not weather_available:
        factors.append(
            "Live weather data is unavailable."
        )

    if not ocean_available:
        factors.append(
            "Live ocean data is unavailable."
        )

    if not factors and marine_available:
        factors.append(
            "No elevated risk factor was identified by the configured model."
        )

    evidence = {
        "weather": {
            "agent": "Weather Agent",
            "source": weather.get(
                "source",
                "Open-Meteo Weather",
            ),
            "status": (
                "AVAILABLE"
                if weather_available
                else "UNAVAILABLE"
            ),
        },
        "ocean": {
            "agent": "Ocean Agent",
            "source": ocean.get(
                "source",
                "Open-Meteo Marine",
            ),
            "status": (
                "AVAILABLE"
                if ocean_available
                else "UNAVAILABLE"
            ),
        },
        "satellite": {
            "agent": "Satellite / PFZ Agent",
            "source": satellite.get(
                "source",
                "PFZ satellite dataset",
            ),
            "status": (
                "AVAILABLE"
                if _is_available(satellite)
                else "UNAVAILABLE"
            ),
        },
        "gis": {
            "agent": "GIS Agent",
            "source": gis.get(
                "source",
                "ORCA spatial analysis",
            ),
            "status": (
                "AVAILABLE"
                if _is_available(gis)
                else "UNAVAILABLE"
            ),
        },
        "risk_engine": {
            "agent": "Risk Engine",
            "source": "Deterministic ORCA risk model",
            "status": "USED",
        },
    }

    vessel_estimate = None

    if vessel:
        vessel_estimate = {
            "status": vessel.get(
                "status",
                "available",
            ),
            "endurance_hours": vessel.get(
                "endurance_hours"
            ),
            "maximum_range_km": vessel.get(
                "maximum_range_km"
            ),
            "one_way_range_km": vessel.get(
                "one_way_range_km"
            ),
            "estimate_only": True,
        }

    return {
        "status": (
            "available"
            if marine_available
            else "unavailable"
        ),
        "risk": risk,
        "risk_score": normalized_score,
        "raw_risk_score": raw_score,
        "risk_max_score": 100,
        "risk_level": risk_level,
        "recommendation": recommendation,
        "factors": factors,
        "marine_location": is_marine,
        "weather_available": weather_available,
        "ocean_available": ocean_available,
        "satellite_available": _is_available(
            satellite
        ),
        "gis_available": _is_available(gis),
        "verified_user": verified,
        "role": role,
        "evidence": evidence,
        "vessel": vessel_estimate,
        "observations": {
            "wind_speed": wind_speed,
            "wave_height": wave_height,
            "precipitation": precipitation,
            "current_speed": current_speed,
            "wave_period": wave_period,
            "condition": condition,
        },
        "disclaimer": (
            "ORCA is a decision-support prototype. "
            "It is not an official maritime navigation, "
            "weather-warning, or safety system."
        ),
    }


def build_unavailable_decision(
    message: str = "Live marine data is unavailable.",
    role: str = "",
) -> dict:
    """
    Standard response when a reliable marine decision cannot be produced.
    """

    return {
        "status": "unavailable",
        "risk": None,
        "risk_score": None,
        "raw_risk_score": None,
        "risk_max_score": 100,
        "risk_level": "UNAVAILABLE",
        "recommendation": "LIVE MARINE DATA UNAVAILABLE",
        "factors": [
            message,
        ],
        "marine_location": None,
        "weather_available": False,
        "ocean_available": False,
        "satellite_available": False,
        "gis_available": False,
        "verified_user": False,
        "role": role,
        "evidence": {},
        "vessel": None,
        "observations": {},
        "disclaimer": (
            "ORCA is a decision-support prototype. "
            "It is not an official maritime navigation, "
            "weather-warning, or safety system."
        ),
    }