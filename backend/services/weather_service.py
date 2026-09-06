# backend/services/weather_service.py

from __future__ import annotations

from datetime import datetime
from typing import Any

import requests


WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"

WEATHER_CODE_MAP = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value

    if not value:
        return None

    text = str(value).strip()

    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        pass

    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue

    return None


def _nearest_hour_index(
    timestamps: list[str],
    requested_datetime: datetime | None,
    tolerance_minutes: int = 30,
) -> int | None:
    if not timestamps:
        return None

    if requested_datetime is None:
        return 0

    best_index = None
    best_difference = None

    for index, timestamp in enumerate(timestamps):
        parsed = _parse_datetime(timestamp)

        if parsed is None:
            continue

        if parsed.tzinfo is not None and requested_datetime.tzinfo is None:
            requested_datetime = requested_datetime.replace(
                tzinfo=parsed.tzinfo
            )

        if parsed.tzinfo is None and requested_datetime.tzinfo is not None:
            parsed = parsed.replace(
                tzinfo=requested_datetime.tzinfo
            )

        difference = abs(
            (parsed - requested_datetime).total_seconds()
        )

        if best_difference is None or difference < best_difference:
            best_difference = difference
            best_index = index

    if best_difference is None:
        return None

    if best_difference > tolerance_minutes * 60:
        return None

    return best_index


def _condition_from_code(code: Any) -> str:
    try:
        numeric_code = int(code)
    except (TypeError, ValueError):
        return "Unknown"

    return WEATHER_CODE_MAP.get(
        numeric_code,
        f"Weather code {numeric_code}",
    )


def _build_unavailable(
    latitude: float,
    longitude: float,
    requested_datetime: Any,
    message: str,
) -> dict:
    return {
        "status": "unavailable",
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": str(requested_datetime),
        "temperature": None,
        "wind_speed": None,
        "wind_direction": None,
        "precipitation": None,
        "weather_code": None,
        "condition": None,
        "message": message,
        "source": "Open-Meteo Weather",
    }


def get_weather_data(
    lat: float | None = None,
    lon: float | None = None,
    requested_datetime: Any = None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    """
    Fetch live hourly weather data from Open-Meteo.

    Coordinates are accepted both as lat/lon and latitude/longitude so the
    service can be called safely from different parts of the ORCA backend.

    Missing live data is reported as unavailable. No weather values are
    fabricated here.
    """

    if latitude is not None:
        lat = latitude

    if longitude is not None:
        lon = longitude

    try:
        latitude_value = float(lat)
        longitude_value = float(lon)
    except (TypeError, ValueError):
        return _build_unavailable(
            lat,
            lon,
            requested_datetime,
            "Invalid latitude or longitude.",
        )

    if not (-90 <= latitude_value <= 90):
        return _build_unavailable(
            latitude_value,
            longitude_value,
            requested_datetime,
            "Latitude is outside the valid range.",
        )

    if not (-180 <= longitude_value <= 180):
        return _build_unavailable(
            latitude_value,
            longitude_value,
            requested_datetime,
            "Longitude is outside the valid range.",
        )

    requested = _parse_datetime(requested_datetime)

    params = {
        "latitude": latitude_value,
        "longitude": longitude_value,
        "hourly": (
            "temperature_2m,"
            "wind_speed_10m,"
            "wind_direction_10m,"
            "precipitation,"
            "weather_code"
        ),
        "timezone": "auto",
        "forecast_days": 16,
        "past_days": 92,
    }

    try:
        response = requests.get(
            WEATHER_API_URL,
            params=params,
            timeout=15,
        )

        response.raise_for_status()

        payload = response.json()

    except requests.RequestException as error:
        return _build_unavailable(
            latitude_value,
            longitude_value,
            requested_datetime,
            f"Open-Meteo Weather request failed: {error}",
        )

    except ValueError:
        return _build_unavailable(
            latitude_value,
            longitude_value,
            requested_datetime,
            "Open-Meteo returned an invalid response.",
        )

    hourly = payload.get("hourly")

    if not isinstance(hourly, dict):
        return _build_unavailable(
            latitude_value,
            longitude_value,
            requested_datetime,
            "Hourly weather data is unavailable.",
        )

    timestamps = hourly.get("time") or []

    if not timestamps:
        return _build_unavailable(
            latitude_value,
            longitude_value,
            requested_datetime,
            "No weather timestamps were returned.",
        )

    index = _nearest_hour_index(
        timestamps,
        requested,
        tolerance_minutes=30,
    )

    if index is None:
        return _build_unavailable(
            latitude_value,
            longitude_value,
            requested_datetime,
            "No weather observation is available near the requested time.",
        )

    def value(name: str):
        values = hourly.get(name) or []

        if index >= len(values):
            return None

        return values[index]

    temperature = value("temperature_2m")
    wind_speed = value("wind_speed_10m")
    wind_direction = value("wind_direction_10m")
    precipitation = value("precipitation")
    weather_code = value("weather_code")

    timestamp = timestamps[index]

    return {
        "status": "available",
        "latitude": latitude_value,
        "longitude": longitude_value,
        "timestamp": timestamp,
        "temperature": temperature,
        "wind_speed": wind_speed,
        "wind_direction": wind_direction,
        "precipitation": precipitation,
        "weather_code": weather_code,
        "condition": _condition_from_code(weather_code),
        "source": "Open-Meteo Weather",
        "source_url": WEATHER_API_URL,
        "timezone": payload.get("timezone"),
    }


def get_weather_outlook(
    lat: float | None = None,
    lon: float | None = None,
    date: str | None = None,
    start_hour: int = 6,
    end_hour: int = 18,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    """
    Fetch the complete hourly weather outlook for a selected date/time range.
    """

    if latitude is not None:
        lat = latitude

    if longitude is not None:
        lon = longitude

    try:
        latitude_value = float(lat)
        longitude_value = float(lon)
    except (TypeError, ValueError):
        return {
            "status": "unavailable",
            "rows": [],
            "message": "Invalid latitude or longitude.",
            "source": "Open-Meteo Weather",
        }

    if not (-90 <= latitude_value <= 90):
        return {
            "status": "unavailable",
            "rows": [],
            "message": "Latitude is outside the valid range.",
            "source": "Open-Meteo Weather",
        }

    if not (-180 <= longitude_value <= 180):
        return {
            "status": "unavailable",
            "rows": [],
            "message": "Longitude is outside the valid range.",
            "source": "Open-Meteo Weather",
        }

    try:
        selected_date = datetime.strptime(
            str(date),
            "%Y-%m-%d",
        ).date()
    except (TypeError, ValueError):
        return {
            "status": "unavailable",
            "rows": [],
            "message": "Date must use YYYY-MM-DD format.",
            "source": "Open-Meteo Weather",
        }

    try:
        start_hour = max(0, min(23, int(start_hour)))
        end_hour = max(0, min(23, int(end_hour)))
    except (TypeError, ValueError):
        start_hour = 6
        end_hour = 18

    if start_hour > end_hour:
        start_hour, end_hour = end_hour, start_hour

    params = {
        "latitude": latitude_value,
        "longitude": longitude_value,
        "hourly": (
            "temperature_2m,"
            "wind_speed_10m,"
            "wind_direction_10m,"
            "precipitation,"
            "weather_code"
        ),
        "timezone": "auto",
        "forecast_days": 16,
        "past_days": 92,
    }

    try:
        response = requests.get(
            WEATHER_API_URL,
            params=params,
            timeout=15,
        )

        response.raise_for_status()
        payload = response.json()

    except requests.RequestException as error:
        return {
            "status": "unavailable",
            "rows": [],
            "message": f"Open-Meteo Weather request failed: {error}",
            "source": "Open-Meteo Weather",
        }

    except ValueError:
        return {
            "status": "unavailable",
            "rows": [],
            "message": "Open-Meteo returned an invalid response.",
            "source": "Open-Meteo Weather",
        }

    hourly = payload.get("hourly")

    if not isinstance(hourly, dict):
        return {
            "status": "unavailable",
            "rows": [],
            "message": "Hourly weather data is unavailable.",
            "source": "Open-Meteo Weather",
        }

    timestamps = hourly.get("time") or []

    if not timestamps:
        return {
            "status": "unavailable",
            "rows": [],
            "message": "No weather timestamps were returned.",
            "source": "Open-Meteo Weather",
        }

    rows = []

    for index, timestamp in enumerate(timestamps):
        parsed = _parse_datetime(timestamp)

        if parsed is None:
            continue

        if parsed.date() != selected_date:
            continue

        if not start_hour <= parsed.hour <= end_hour:
            continue

        def value(name: str):
            values = hourly.get(name) or []

            if index >= len(values):
                return None

            return values[index]

        weather_code = value("weather_code")

        rows.append(
            {
                "timestamp": timestamp,
                "hour": parsed.hour,
                "temperature": value("temperature_2m"),
                "wind_speed": value("wind_speed_10m"),
                "wind_direction": value("wind_direction_10m"),
                "precipitation": value("precipitation"),
                "weather_code": weather_code,
                "condition": _condition_from_code(weather_code),
            }
        )

    if not rows:
        return {
            "status": "unavailable",
            "rows": [],
            "message": (
                "No weather data is available for the requested date "
                "and time range."
            ),
            "source": "Open-Meteo Weather",
        }

    return {
        "status": "available",
        "latitude": latitude_value,
        "longitude": longitude_value,
        "date": str(selected_date),
        "start_hour": start_hour,
        "end_hour": end_hour,
        "rows": rows,
        "source": "Open-Meteo Weather",
        "source_url": WEATHER_API_URL,
        "timezone": payload.get("timezone"),
    }