# backend/services/marine_service.py

from datetime import datetime


def calculate_risk(
    wind_speed=None,
    wave_height=None,
    precipitation=None,
    current_speed=None,
    wave_period=None,
    condition=None,
):
    """
    Deterministic ORCA marine risk engine.

    Raw prototype score: 0–12
    Frontend can normalize this to 0–100 for display.
    """

    score = 0
    factors = []

    if wind_speed is not None:
        if wind_speed > 25:
            score += 3
            factors.append("High wind")
        elif wind_speed > 15:
            score += 2
            factors.append("Moderate wind")
        elif wind_speed > 8:
            score += 1
            factors.append("Light wind")

    if wave_height is not None:
        if wave_height > 2.5:
            score += 3
            factors.append("High waves")
        elif wave_height > 1.5:
            score += 2
            factors.append("Moderate waves")
        elif wave_height > 1:
            score += 1
            factors.append("Slightly elevated waves")

    if precipitation is not None:
        if precipitation > 8:
            score += 1
            factors.append("Heavy precipitation")

    if current_speed is not None:
        if current_speed > 2:
            score += 2
            factors.append("Strong ocean current")
        elif current_speed > 1:
            score += 1
            factors.append("Moderate ocean current")

    if wave_period is not None and wave_period < 5:
        score += 1
        factors.append("Short wave period")

    condition_text = str(condition or "").lower()

    if (
        "thunder" in condition_text
        or "storm" in condition_text
    ):
        score += 1
        factors.append("Thunderstorm/storm condition")

    score = min(score, 12)

    if score <= 3:
        level = "LOW"
    elif score <= 6:
        level = "MEDIUM"
    else:
        level = "HIGH"

    return {
        "score": score,
        "max_score": 12,
        "level": level,
        "factors": factors,
    }


def get_marine_summary(
    weather_data,
    ocean_data,
):
    """
    Combine weather + ocean observations into one
    deterministic marine assessment.

    No values are fabricated here.
    """

    weather_status = str(
        weather_data.get("status", "")
    ).lower()

    ocean_status = str(
        ocean_data.get("status", "")
    ).lower()

    weather_available = weather_status in {
        "available",
        "success",
        "ok",
    }

    ocean_available = ocean_status in {
        "available",
        "success",
        "ok",
    }

    if not weather_available and not ocean_available:
        return {
            "status": "unavailable",
            "risk": None,
            "message": (
                "Live weather and ocean observations "
                "are unavailable."
            ),
        }

    wind_speed = weather_data.get(
        "wind_speed"
    )

    precipitation = weather_data.get(
        "precipitation"
    )

    condition = weather_data.get(
        "condition"
    )

    wave_height = ocean_data.get(
        "wave_height"
    )

    wave_period = ocean_data.get(
        "wave_period"
    )

    current_speed = ocean_data.get(
        "current_speed"
    )

    risk = calculate_risk(
        wind_speed=wind_speed,
        wave_height=wave_height,
        precipitation=precipitation,
        current_speed=current_speed,
        wave_period=wave_period,
        condition=condition,
    )

    return {
        "status": "available",
        "risk": risk,
        "weather_available": weather_available,
        "ocean_available": ocean_available,
        "observations": {
            "wind_speed": wind_speed,
            "precipitation": precipitation,
            "condition": condition,
            "wave_height": wave_height,
            "wave_period": wave_period,
            "current_speed": current_speed,
        },
    }


def get_marine_data(
    latitude,
    longitude,
    requested_datetime,
):
    """
    Compatibility wrapper used by older ORCA code.

    The actual live weather/ocean retrieval is handled by
    weather_service.py and ocean_service.py.

    This function intentionally does not generate fake data.
    """

    try:
        from services.weather_service import (
            get_weather_data,
        )
        from services.ocean_service import (
            get_ocean_data,
        )

        weather = get_weather_data(
            latitude,
            longitude,
            requested_datetime,
        )

        ocean = get_ocean_data(
            latitude,
            longitude,
            requested_datetime,
        )

        summary = get_marine_summary(
            weather,
            ocean,
        )

        return {
            "status": summary["status"],
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": requested_datetime,
            "weather": weather,
            "ocean": ocean,
            "risk": summary.get("risk"),
            "observations": summary.get(
                "observations",
                {},
            ),
        }

    except Exception as error:
        return {
            "status": "unavailable",
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": requested_datetime,
            "risk": None,
            "message": (
                "Marine assessment could not be completed."
            ),
            "error": str(error),
        }


def normalize_risk_score(score):
    """
    Convert ORCA's deterministic 0–12 score to 0–100.
    """

    if score is None:
        return None

    try:
        value = float(score)
    except (
        TypeError,
        ValueError,
    ):
        return None

    if value <= 12:
        return round(
            (value / 12) * 100
        )

    return round(
        min(100, value)
    )


def risk_label_from_score(score):
    if score is None:
        return "UNAVAILABLE"

    normalized = normalize_risk_score(
        score
    )

    if normalized is None:
        return "UNAVAILABLE"

    if normalized <= 25:
        return "LOW"

    if normalized <= 50:
        return "MODERATE"

    if normalized <= 70:
        return "HIGH"

    return "SEVERE"


if __name__ == "__main__":
    print(
        calculate_risk(
            wind_speed=18,
            wave_height=1.4,
            precipitation=2,
            current_speed=0.8,
            wave_period=7,
            condition="Partly cloudy",
        )
    )