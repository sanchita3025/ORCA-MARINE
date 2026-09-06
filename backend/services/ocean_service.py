# backend/services/ocean_service.py

from __future__ import annotations

from datetime import datetime
from typing import Any

import requests


MARINE_API_URL = "https://marine-api.open-meteo.com/v1/marine"


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

    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d",
    ):
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

        request_time = requested_datetime

        if parsed.tzinfo is not None and request_time.tzinfo is None:
            request_time = request_time.replace(tzinfo=parsed.tzinfo)

        if parsed.tzinfo is None and request_time.tzinfo is not None:
            parsed = parsed.replace(tzinfo=request_time.tzinfo)

        difference = abs(
            (parsed - request_time).total_seconds()
        )

        if best_difference is None or difference < best_difference:
            best_difference = difference
            best_index = index

    if best_difference is None:
        return None

    if best_difference > tolerance_minutes * 60:
        return None

    return best_index


def _unavailable(
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
        "wave_height": None,
        "wave_period": None,
        "current_speed": None,
        "sst": None,
        "message": message,
        "source": "Open-Meteo Marine",
    }


def _request_marine_data(
    latitude: float,
    longitude: float,
) -> dict | None:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": (
            "wave_height,"
            "wave_period,"
            "ocean_current_velocity,"
            "sea_surface_temperature"
        ),
        "timezone": "auto",
        "forecast_days": 16,
        "past_days": 92,
    }

    try:
        response = requests.get(
            MARINE_API_URL,
            params=params,
            timeout=15,
        )

        response.raise_for_status()

        payload = response.json()

        if not isinstance(payload, dict):
            return None

        return payload

    except (requests.RequestException, ValueError):
        return None


def get_ocean_data(
    lat: float | None = None,
    lon: float | None = None,
    requested_datetime: Any = None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    """
    Fetch live ocean data from Open-Meteo Marine.

    The function first queries the requested coordinate. If the marine API
    cannot provide hourly marine data there, a small nearby sea-grid search
    is attempted. Returned observations always come from the API; values are
    never fabricated.
    """

    if latitude is not None:
        lat = latitude

    if longitude is not None:
        lon = longitude

    try:
        latitude_value = float(lat)
        longitude_value = float(lon)
    except (TypeError, ValueError):
        return _unavailable(
            lat,
            lon,
            requested_datetime,
            "Invalid latitude or longitude.",
        )

    if not (-90 <= latitude_value <= 90):
        return _unavailable(
            latitude_value,
            longitude_value,
            requested_datetime,
            "Latitude is outside the valid range.",
        )

    if not (-180 <= longitude_value <= 180):
        return _unavailable(
            latitude_value,
            longitude_value,
            requested_datetime,
            "Longitude is outside the valid range.",
        )

    requested = _parse_datetime(requested_datetime)

    # Try the exact coordinate first.
    candidates = [
        (latitude_value, longitude_value, 0.0),
    ]

    # Small surrounding grid. This is only used to find an actual marine
    # API point when the selected coordinate falls just inland.
    offsets = [
        (0.10, 0.00),
        (-0.10, 0.00),
        (0.00, 0.10),
        (0.00, -0.10),
        (0.20, 0.00),
        (-0.20, 0.00),
        (0.00, 0.20),
        (0.00, -0.20),
        (0.15, 0.15),
        (0.15, -0.15),
        (-0.15, 0.15),
        (-0.15, -0.15),
    ]

    for lat_offset, lon_offset in offsets:
        candidate_lat = latitude_value + lat_offset
        candidate_lon = longitude_value + lon_offset

        if -90 <= candidate_lat <= 90 and -180 <= candidate_lon <= 180:
            candidates.append(
                (
                    candidate_lat,
                    candidate_lon,
                    (lat_offset ** 2 + lon_offset ** 2) ** 0.5,
                )
            )

    for candidate_lat, candidate_lon, distance in candidates:
        payload = _request_marine_data(
            candidate_lat,
            candidate_lon,
        )

        if not payload:
            continue

        hourly = payload.get("hourly")

        if not isinstance(hourly, dict):
            continue

        timestamps = hourly.get("time") or []

        if not timestamps:
            continue

        index = _nearest_hour_index(
            timestamps,
            requested,
            tolerance_minutes=30,
        )

        if index is None:
            continue

        def value(name: str):
            values = hourly.get(name) or []

            if index >= len(values):
                return None

            return values[index]

        wave_height = value("wave_height")
        wave_period = value("wave_period")
        current_speed = value("ocean_current_velocity")
        sst = value("sea_surface_temperature")

        # Require at least one actual marine observation.
        if all(
            value is None
            for value in (
                wave_height,
                wave_period,
                current_speed,
                sst,
            )
        ):
            continue

        return {
            "status": "available",
            "latitude": candidate_lat,
            "longitude": candidate_lon,
            "requested_latitude": latitude_value,
            "requested_longitude": longitude_value,
            "offset_from_requested_point": round(distance, 4),
            "timestamp": timestamps[index],
            "wave_height": wave_height,
            "wave_period": wave_period,
            "current_speed": current_speed,
            "sst": sst,
            "source": "Open-Meteo Marine",
            "source_url": MARINE_API_URL,
            "timezone": payload.get("timezone"),
        }

    return _unavailable(
        latitude_value,
        longitude_value,
        requested_datetime,
        (
            "No live marine observation is available near the selected "
            "coordinate and requested time."
        ),
    )


def get_ocean_outlook(
    lat: float | None = None,
    lon: float | None = None,
    date: str | None = None,
    start_hour: int = 6,
    end_hour: int = 18,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    """
    Fetch live hourly marine data for a selected date and time range.
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
            "source": "Open-Meteo Marine",
        }

    if not (-90 <= latitude_value <= 90):
        return {
            "status": "unavailable",
            "rows": [],
            "message": "Latitude is outside the valid range.",
            "source": "Open-Meteo Marine",
        }

    if not (-180 <= longitude_value <= 180):
        return {
            "status": "unavailable",
            "rows": [],
            "message": "Longitude is outside the valid range.",
            "source": "Open-Meteo Marine",
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
            "source": "Open-Meteo Marine",
        }

    try:
        start_hour = max(0, min(23, int(start_hour)))
        end_hour = max(0, min(23, int(end_hour)))
    except (TypeError, ValueError):
        start_hour = 6
        end_hour = 18

    if start_hour > end_hour:
        start_hour, end_hour = end_hour, start_hour

    # Try the requested coordinate first, then nearby marine points.
    candidates = [
        (latitude_value, longitude_value, 0.0),
    ]

    offsets = [
        (0.10, 0.00),
        (-0.10, 0.00),
        (0.00, 0.10),
        (0.00, -0.10),
        (0.20, 0.00),
        (-0.20, 0.00),
        (0.00, 0.20),
        (0.00, -0.20),
        (0.15, 0.15),
        (0.15, -0.15),
        (-0.15, 0.15),
        (-0.15, -0.15),
    ]

    for lat_offset, lon_offset in offsets:
        candidate_lat = latitude_value + lat_offset
        candidate_lon = longitude_value + lon_offset

        if -90 <= candidate_lat <= 90 and -180 <= candidate_lon <= 180:
            candidates.append(
                (
                    candidate_lat,
                    candidate_lon,
                    (lat_offset ** 2 + lon_offset ** 2) ** 0.5,
                )
            )

    for candidate_lat, candidate_lon, distance in candidates:
        payload = _request_marine_data(
            candidate_lat,
            candidate_lon,
        )

        if not payload:
            continue

        hourly = payload.get("hourly")

        if not isinstance(hourly, dict):
            continue

        timestamps = hourly.get("time") or []

        if not timestamps:
            continue

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

            row = {
                "timestamp": timestamp,
                "hour": parsed.hour,
                "wave_height": value("wave_height"),
                "wave_period": value("wave_period"),
                "current_speed": value(
                    "ocean_current_velocity"
                ),
                "sst": value(
                    "sea_surface_temperature"
                ),
            }

            if any(
                row[key] is not None
                for key in (
                    "wave_height",
                    "wave_period",
                    "current_speed",
                    "sst",
                )
            ):
                rows.append(row)

        if rows:
            return {
                "status": "available",
                "latitude": candidate_lat,
                "longitude": candidate_lon,
                "requested_latitude": latitude_value,
                "requested_longitude": longitude_value,
                "offset_from_requested_point": round(distance, 4),
                "date": str(selected_date),
                "start_hour": start_hour,
                "end_hour": end_hour,
                "rows": rows,
                "source": "Open-Meteo Marine",
                "source_url": MARINE_API_URL,
                "timezone": payload.get("timezone"),
            }

    return {
        "status": "unavailable",
        "rows": [],
        "latitude": latitude_value,
        "longitude": longitude_value,
        "date": str(selected_date),
        "message": (
            "No live marine data is available for the requested "
            "date and time range."
        ),
        "source": "Open-Meteo Marine",
    }