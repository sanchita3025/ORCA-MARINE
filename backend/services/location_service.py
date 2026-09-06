# backend/services/location_service.py

from __future__ import annotations

import requests


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

HEADERS = {
    "User-Agent": "ORCA-Marine-Ecosystem/1.0",
    "Accept": "application/json",
}


def search_location(query: str, limit: int = 5) -> list[dict]:
    """
    Search for a real-world location using OpenStreetMap Nominatim.

    No coordinates are invented. If the service is unavailable, an empty
    list is returned.
    """

    query = str(query or "").strip()

    if not query:
        return []

    try:
        response = requests.get(
            NOMINATIM_URL,
            params={
                "q": query,
                "format": "jsonv2",
                "limit": max(1, min(limit, 10)),
                "addressdetails": 1,
            },
            headers=HEADERS,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        if not isinstance(data, list):
            return []

        results = []

        for item in data:
            try:
                latitude = float(item["lat"])
                longitude = float(item["lon"])
            except (KeyError, TypeError, ValueError):
                continue

            results.append(
                {
                    "display_name": item.get(
                        "display_name",
                        f"{latitude:.4f}, {longitude:.4f}",
                    ),
                    "latitude": latitude,
                    "longitude": longitude,
                    "type": item.get("type"),
                    "category": item.get("category"),
                    "osm_type": item.get("osm_type"),
                    "osm_id": item.get("osm_id"),
                    "address": item.get("address", {}),
                }
            )

        return results

    except requests.RequestException:
        return []
    except ValueError:
        return []
    except Exception:
        return []


def get_location(query: str) -> dict | None:
    """
    Return the first real geocoded result for a location query.
    """

    results = search_location(query, limit=1)

    if not results:
        return None

    return results[0]


def is_valid_coordinates(latitude, longitude) -> bool:
    """
    Basic coordinate validation.
    """

    try:
        lat = float(latitude)
        lon = float(longitude)
    except (TypeError, ValueError):
        return False

    return -90 <= lat <= 90 and -180 <= lon <= 180


def format_location_name(
    latitude: float,
    longitude: float,
    fallback: str = "Selected location",
) -> str:
    """
    Reverse-geocode a coordinate when possible.

    Falls back to a coordinate label instead of inventing a place name.
    """

    try:
        lat = float(latitude)
        lon = float(longitude)
    except (TypeError, ValueError):
        return fallback

    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={
                "lat": lat,
                "lon": lon,
                "format": "jsonv2",
                "zoom": 14,
                "addressdetails": 1,
            },
            headers=HEADERS,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        display_name = data.get("display_name")

        if display_name:
            return str(display_name)

    except Exception:
        pass

    return f"{lat:.4f}, {lon:.4f}"